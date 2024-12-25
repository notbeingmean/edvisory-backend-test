import { FastifyRequest, FastifyReply } from "fastify";
import { Account, User } from "../entities";

type TAccountBody = {
  accountName: string;
  balance: number;
};

export async function handleCreateAccount(
  request: FastifyRequest<{ Body: TAccountBody }>,
  reply: FastifyReply
) {
  const userRepository = request.server.orm.getRepository(User);
  const accountRepository = request.server.orm.getRepository(Account);

  const { accountName, balance } = request.body;

  try {
    const user = await userRepository.findOne({
      where: { id: request.session.user.id },
    });

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    const newAccount = accountRepository.create({
      accountName,
      balance,
      user,
    });

    await accountRepository.save(newAccount);

    return reply.status(201).send(newAccount);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to create account: ${error}` });
  }
}

export async function handleGetAccount(
  request: FastifyRequest<{ Params: { accountId: string } }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const account = await accountRepository.findOne({
      where: {
        id: request.params.accountId,
        user: { id: request.session.user.id },
      },
      relations: ["transactions"],
    });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    return reply.send(account);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch account: ${error}` });
  }
}

export async function handleGetAccounts(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const accounts = await accountRepository.find({
      where: { user: { id: request.session.user.id } },
      relations: ["transactions"],
    });

    if (!accounts.length) {
      return reply.status(404).send({ message: "No accounts found" });
    }

    return reply.send(accounts);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch accounts: ${error}` });
  }
}

export async function handleUpdateAccount(
  request: FastifyRequest<{ Params: { accountId: string } }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);

  const { accountName, balance } = request.body as {
    accountName: string;
    balance: number;
  };

  try {
    const account = await accountRepository.findOne({
      where: {
        id: request.params.accountId,
        user: { id: request.session.user.id },
      },
    });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    account.accountName = accountName;
    account.balance = balance;

    await accountRepository.save(account);

    return reply.send(account);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to update account: ${error}` });
  }
}

export async function handleDeleteAccount(
  request: FastifyRequest<{ Params: { accountId: string } }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const account = await accountRepository.findOne({
      where: {
        id: request.params.accountId,
        user: { id: request.session.user.id },
      },
    });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    await accountRepository.remove(account);

    return reply.send({ message: "Account deleted" });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to delete account: ${error}` });
  }
}

export async function handleGetAccountSummary(
  request: FastifyRequest<{ Params: { accountId: string } }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);

  try {
    const account = await accountRepository.findOne({
      where: {
        id: request.params.accountId,
        user: { id: request.session.user.id },
      },
      relations: ["transactions"],
    });

    if (!account) {
      return reply.status(404).send({ message: "Account not found" });
    }

    const { income, expense } = account.transactions.reduce(
      (acc, { type, amount }) => ({
        income: acc.income + (type === "INCOME" ? Number(amount) : 0),
        expense: acc.expense + (type === "EXPENSE" ? Number(amount) : 0),
      }),
      { income: 0, expense: 0 }
    );

    const remainingDays =
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate() - new Date().getDate();

    const remainingBalance = account.balance - expense;

    return reply.send({
      income,
      expense,
      transactionCount: account.transactions.length,
      initialBalance: account.balance,
      remainingBalance,
      dailyBudget: remainingDays > 0 ? remainingBalance / remainingDays : 0,
      remainingDays: Math.max(remainingDays, 0),
    });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch account summary: ${error}` });
  }
}
