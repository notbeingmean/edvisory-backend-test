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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, ...data } = newAccount;

    return reply.status(201).send(data);
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
  request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);
  const { page = "1", limit = "10" } = request.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const [accounts, total] = await accountRepository.findAndCount({
      where: { user: { id: request.session.user.id } },
      relations: ["transactions"],
      skip,
      take: pageSize,
    });

    if (!accounts.length) {
      return reply.status(404).send({ message: "No accounts found" });
    }

    return reply.send({
      data: accounts,
      meta: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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

export async function handleGetAccountsSummary(
  request: FastifyRequest<{
    Querystring: {
      month?: string;
      year?: string;
      page?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const accountRepository = request.server.orm.getRepository(Account);
  const { month, year, page = "1", limit = "10" } = request.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const [accounts, total] = await accountRepository.findAndCount({
      where: { user: { id: request.session.user.id } },
      relations: ["transactions"],
      skip,
      take: pageSize,
    });

    if (!accounts.length) {
      return reply.status(404).send({ message: "No accounts found" });
    }

    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const summary = accounts.map((account) => {
      const filteredTransactions = account.transactions.filter(
        (transaction) => {
          if (!transaction.createdAt) return false;
          const transactionDate = new Date(transaction.createdAt);
          return (
            transactionDate.getMonth() === targetMonth &&
            transactionDate.getFullYear() === targetYear
          );
        }
      );

      const { income, expense } = filteredTransactions.reduce(
        (acc, { type, amount }) => ({
          income: Number(
            (acc.income + (type === "INCOME" ? Number(amount) : 0)).toFixed(2)
          ),
          expense: Number(
            (acc.expense + (type === "EXPENSE" ? Number(amount) : 0)).toFixed(2)
          ),
        }),
        { income: 0, expense: 0 }
      );

      const remainingBalance = income + Number(account.balance) - expense;

      const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const currentDate = new Date();
      const remainingDays =
        currentDate.getFullYear() === targetYear &&
        currentDate.getMonth() === targetMonth
          ? lastDayOfMonth - currentDate.getDate()
          : 0;

      return {
        accountId: account.id,
        accountName: account.accountName,
        income,
        expense,
        transactionCount: filteredTransactions.length,
        initialBalance: account.balance,
        remainingBalance,
        dailyBudget: remainingDays > 0 ? remainingBalance / remainingDays : 0,
        remainingDays: Math.max(remainingDays, 0),
      };
    });

    return reply.send({
      data: summary,
      meta: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: `Failed to fetch accounts summary: ${error}` });
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

    const remainingBalance = income + Number(account.balance) - expense;

    return reply.send({
      income,
      expense,
      transactionCount: account.transactions.length,
      initialBalance: Number(account.balance),
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
