import { FastifyRequest, FastifyReply } from "fastify";
import { Account, Transaction } from "../entities";
import { Category } from "../entities/category";
import { In, Between } from "typeorm";
import { convertToDateTime, filterBadWords } from "../libs/utils";

export type CreateTransactionType = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string;
  imageUrl?: string;
  categories?: string[];
};

export async function handleGetTransactions(
  request: FastifyRequest<{
    Querystring: {
      accountId?: string;
      categories?: string[];
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
) {
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);

  const { accountId, categories, startDate, endDate } = request.query;

  const page = request.query.page || 1;
  const limit = request.query.limit || 10;
  const skip = (page - 1) * limit;

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

    const [transactions, total] = await transactionRepository.findAndCount({
      where: {
        account: { id: account.id },
        categories: {
          name: categories ? In(categories) : undefined,
        },
        createdAt:
          startDate && endDate
            ? Between(convertToDateTime(startDate), convertToDateTime(endDate))
            : undefined,
      },
      relations: ["categories"],
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return reply.send({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch transactions: ${error}` });
  }
}

export async function handleGetTransaction(
  request: FastifyRequest<{
    Params: { transactionId: string };
  }>,
  reply: FastifyReply
) {
  const { transactionId } = request.params;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const { user } = request.session;

  try {
    const transaction = await transactionRepository.findOne({
      where: {
        id: transactionId,
        account: { user: { id: user.id } },
      },
      relations: ["categories"],
    });

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
  const { type, amount, note, imageUrl, categories } = request.body;

  const { accountId } = request.query;
  const { orm } = request.server;
  const { session } = request;

  const transactionRepository = orm.getRepository(Transaction);
  const accountRepository = orm.getRepository(Account);
  const categoriesRepository = orm.getRepository(Category);

  const queryRunner = orm.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const account = await accountRepository.findOne({
      where: {
        ...(accountId ? { id: accountId } : {}),
        user: { id: session.user.id },
      },
    });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    if (type === "EXPENSE" && amount > account.balance) {
      return reply.status(400).send({ message: "Insufficient balance" });
    }

    const allCategories = [];
    if (categories && categories.length > 0) {
      for (const categoryName of categories) {
        let category = await categoriesRepository.findOne({
          where: { name: categoryName, user: { id: session.user.id } },
        });

        if (!category) {
          category = categoriesRepository.create({
            name: categoryName,
            user: { id: session.user.id },
          });
          await queryRunner.manager.save(category);
        }

        allCategories.push(category);
      }
    }

    const filterNote = filterBadWords(note);

    const newTransaction = transactionRepository.create({
      type,
      amount,
      note: filterNote,
      imageUrl,
      account,
      categories: allCategories,
    });

    await queryRunner.manager.save(newTransaction);
    await queryRunner.commitTransaction();

    const {
      account: _account,
      categories: _categories,
      ...transaction
    } = newTransaction;
    return reply.status(201).send({
      accountId: account.id,
      status: "success",
      message: "Transaction created successfully",
      categories,
      transaction,
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    request.log.error(error);
    return reply.status(500).send({
      message: "Failed to create transaction",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await queryRunner.release();
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

    const filterNote = filterBadWords(note);

    const newTransaction = transactionRepository.create({
      ...transaction,
      type,
      amount,
      note: filterNote,
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

    const { error } = await request.server.supabase.storage
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
