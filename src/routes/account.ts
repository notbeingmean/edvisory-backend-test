import { FastifyInstance } from "fastify";
import {
  accountSchema,
  accountSchemaJson,
  TAccountBody,
} from "../schemas/account";
import { Account, User } from "../entities";

export default async function ProtectedRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: TAccountBody }>(
    "/account/create-account",
    {
      schema: {
        body: accountSchemaJson,
      },
      preHandler: [
        async (request, reply) => {
          await fastify.authenticate(request, reply);
        },
        async (request, reply) => {
          await fastify.validateBody(request, reply, accountSchema);
        },
      ],
    },
    async (request, reply) => {
      const userRepository = fastify.orm.getRepository(User);
      const accountRepository = fastify.orm.getRepository(Account);

      const { accountName, balance } = request.body;

      const user = await userRepository.findOne({
        where: { id: request.session.user.id },
      });

      if (!user) {
        return reply.status(404).send("User not found");
      }

      const newAccount = accountRepository.create({
        accountName,
        balance,
        user,
      });

      await accountRepository.save(newAccount);

      return reply.send(newAccount);
    }
  );

  fastify.get<{ Params: { accountId: string } }>(
    "/account/:accountId",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const accountRepository = fastify.orm.getRepository(Account);

      const account = await accountRepository.findOne({
        where: {
          id: request.params.accountId,
          user: { id: request.session.user.id },
        },
        relations: ["transactions"],
      });

      if (!account) {
        return reply.status(404).send("Account not found");
      }

      return reply.send(account);
    }
  );
  fastify.get(
    "/account",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const accountRepository = fastify.orm.getRepository(Account);

      const account = await accountRepository.findOne({
        where: {
          user: { id: request.session.user.id },
        },
        relations: ["transactions"],
      });

      if (!account) {
        return reply.status(404).send("Account not found");
      }

      return reply.send(account);
    }
  );
}
