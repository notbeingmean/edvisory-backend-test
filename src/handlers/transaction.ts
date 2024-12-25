import { FastifyRequest, FastifyReply } from "fastify";
import { Account, Transaction } from "../entities";

export type CreateTransactionType = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string;
  imageUrl?: string;
};

export async function handleGetTransactions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);
  const { accountId } = request.query as { accountId?: string };

  try {
    const account = accountId
      ? await accountRepository.findOne({
          where: {
            id: accountId,
            user: { id: request.session.user.id },
          },
        })
      : await accountRepository.findOne({
          where: {
            user: { id: request.session.user.id },
          },
        });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    const transactions = await transactionRepository.find({
      where: {
        account: { id: account.id },
      },
      order: { createdAt: "DESC" },
    });

    return reply.send(transactions);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch transactions: ${error}` });
  }
}

export async function handleGetTransaction(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { transactionId } = request.params as { transactionId: string };
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const { user } = request.session;

  try {
    const transaction = await transactionRepository.findOne({
      where: {
        id: transactionId,
      },
    });

    if (transaction?.account.user.id !== user.id) {
      return reply.status(403).send({ message: "Forbidden" });
    }

    if (!transaction) {
      return reply.status(404).send("Transaction not found");
    }

    return reply.send(transaction);
  } catch (error) {
    return reply.status(500).send("Failed to fetch transaction:" + error);
  }
}

export async function handleCreateTransaction(
  request: FastifyRequest<{
    Body: CreateTransactionType;
    Querystring: { accountId?: string };
  }>,
  reply: FastifyReply
) {
  const { type, amount, note, imageUrl } = request.body;
  const { accountId } = request.query;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const account = accountId
      ? await accountRepository.findOne({
          where: {
            id: accountId,
            user: { id: request.session.user.id },
          },
        })
      : await accountRepository.findOne({
          where: {
            user: { id: request.session.user.id },
          },
        });

    if (!account || !account.id) {
      return reply.status(404).send({ message: "Account not found" });
    }

    if (type === "EXPENSE" && amount > account.balance) {
      return reply.status(400).send({ message: "Insufficient balance" });
    }

    const newBalance = parseFloat(
      (type === "EXPENSE"
        ? Number(account.balance) - Number(amount)
        : Number(account.balance) + Number(amount)
      ).toFixed(2)
    );

    const queryRunner = request.server.orm.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newTransaction = transactionRepository.create({
        type,
        amount,
        note,
        imageUrl,
        account,
      });

      await queryRunner.manager.save(newTransaction);
      await queryRunner.manager.update(Account, account.id, {
        balance: newBalance,
      });

      await queryRunner.commitTransaction();
      return reply.status(201).send({
        ...newTransaction,
        info: {
          accountId: account.id,
          balance: newBalance,
          messages: "Transaction created successfully",
          status: "success",
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to create transaction: ${error}` });
  }
}

export async function handleUpdateTransaction(
  request: FastifyRequest<{ Body: CreateTransactionType }>,
  reply: FastifyReply
) {
  const { transactionId } = request.params as { transactionId: string };
  const { type, amount, note, imageUrl } = request.body;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const account = await accountRepository.findOne({
      where: {
        user: { id: request.session.user.id },
      },
    });
    if (!account) {
      return reply.status(404).send("Account not found");
    }

    const transaction = await transactionRepository.findOne({
      where: {
        id: transactionId,
        account: { id: account.id },
      },
    });

    if (transaction?.account.user.id !== request.session.user.id) {
      return reply.status(403).send("Forbidden");
    }

    if (!transaction) {
      return reply.status(404).send("Transaction not found");
    }

    const newTransaction = transactionRepository.create({
      ...transaction,
      type,
      amount,
      note,
      imageUrl,
    });

    await transactionRepository.save(newTransaction);

    return reply.send(newTransaction);
  } catch (error) {
    return reply.status(500).send("Failed to update transaction: " + error);
  }
}

export async function handleUploadSlip(
  request: FastifyRequest<{ Params: { transactionId: string } }>,
  reply: FastifyReply
) {
  const { transactionId } = request.params;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const { user } = request.session;
  const fileData = await request.file();

  try {
    const transaction = await transactionRepository.findOne({
      where: {
        id: transactionId,
        account: { user: { id: user.id } },
      },
    });

    if (!transaction) {
      return reply.status(404).send("Transaction not found");
    }
    let filetype;
    switch (fileData!.mimetype) {
      case "image/png":
        filetype = "png";
        break;
      case "image/jpeg":
        filetype = "jpeg";
        break;
      case "image/jpg":
        filetype = "jpg";
        break;
      default:
        return reply.status(400).send("Invalid image type");
    }

    const fileName = `${user.id}-${new Date().toISOString()}.${filetype}`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await request.server.supabase.storage
      .from("images")
      .upload(fileName, fileData!.file, {
        duplex: "half",
      });

    if (error) {
      return reply.status(500).send("Failed to upload slip: " + error);
    }

    transaction.imageUrl =
      process.env.SUPABASE_URL + "/storage/v1/object/public/images/" + fileName;

    await transactionRepository.save(transaction);

    return reply.send(transaction);
  } catch (error) {
    return reply.status(500).send("Failed to upload slip: " + error);
  }
}

export async function handleDeleteTransaction(
  request: FastifyRequest<{ Params: { transactionId: string } }>,
  reply: FastifyReply
) {
  const { transactionId } = request.params;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const transaction = await transactionRepository.findOne({
      where: { id: transactionId },
      relations: ["account"],
    });

    if (!transaction) {
      return reply.status(404).send({ message: "Transaction not found" });
    }

    if (transaction.account.user.id !== request.session.user.id) {
      return reply.status(403).send({ message: "Forbidden" });
    }

    const queryRunner = request.server.orm.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.remove(Transaction, transaction);
      const account = await accountRepository.findOne({
        where: { id: transaction.account.id },
      });

      if (!account) {
        return reply.status(404).send("Account not found");
      }

      const newBalance = parseFloat(
        (transaction.type === "EXPENSE"
          ? Number(account.balance) + Number(transaction.amount)
          : Number(account.balance) - Number(transaction.amount)
        ).toFixed(2)
      );

      await queryRunner.manager.update(Account, account.id, {
        balance: newBalance,
      });

      await queryRunner.commitTransaction();
      return reply.send(transaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to delete transaction: ${error}` });
  }
}
