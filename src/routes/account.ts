import { FastifyInstance } from "fastify";
import parse from "joi-to-json";
import Joi from "joi";
import {
  handleCreateAccount,
  handleDeleteAccount,
  handleGetAccount,
  handleGetAccounts,
  handleGetAccountSummary,
  handleUpdateAccount,
} from "../handlers/account";

type TAccountBody = {
  accountName: string;
  balance: number;
};

const accountSchema = Joi.object({
  accountName: Joi.string().required(),
  balance: Joi.number().required(),
});

export default async function AccountRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: TAccountBody }>(
    "/account",
    {
      schema: {
        tags: ["Account"],
        description: "Create a new account for the authenticated user",
        body: parse(accountSchema),
      },
      preHandler: [
        fastify.authenticate,
        async (request, reply) =>
          fastify.validateBody(request, reply, accountSchema),
      ],
    },
    handleCreateAccount
  );

  fastify.get<{ Params: { accountId: string } }>(
    "/account/:accountId",
    {
      schema: {
        tags: ["Account"],
        description: "Get account details by ID",
        params: parse(
          Joi.object({
            accountId: Joi.string().description("Account ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccount
  );

  fastify.get(
    "/account",
    {
      schema: {
        tags: ["Account"],
        description: "Get all accounts for the authenticated user",
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccounts
  );

  fastify.patch<{ Body: TAccountBody; Params: { accountId: string } }>(
    "/account/:accountId",
    {
      schema: {
        tags: ["Account"],
        description: "Update account details by ID",
        params: parse(
          Joi.object({
            accountId: Joi.string().description("Account ID"),
          })
        ),
        body: parse(accountSchema),
      },
      preHandler: [
        fastify.authenticate,
        async (request, reply) =>
          fastify.validateBody(request, reply, accountSchema),
      ],
    },
    handleUpdateAccount
  );

  fastify.delete<{ Params: { accountId: string } }>(
    "/account/:accountId",
    {
      schema: {
        tags: ["Account"],
        description: "Delete account by ID",
        params: parse(
          Joi.object({
            accountId: Joi.string().description("Account ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleDeleteAccount
  );

  fastify.get<{ Params: { accountId: string } }>(
    "/account/:accountId/summary",
    {
      schema: {
        tags: ["Account"],
        description: "Get account summary by ID",
        params: parse(
          Joi.object({
            accountId: Joi.string().description("Account ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccountSummary
  );
}
