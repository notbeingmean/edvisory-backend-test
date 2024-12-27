import { FastifyInstance } from "fastify";
import parse from "joi-to-json";
import Joi from "joi";
import {
  handleCalculateAccount,
  handleCreateAccount,
  handleDeleteAccount,
  handleGetAccount,
  handleGetAccounts,
  handleGetAccountsSummary,
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

  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
    };
  }>(
    "/account",
    {
      schema: {
        tags: ["Account"],
        description: "Get all accounts for the authenticated user",
        querystring: parse(
          Joi.object({
            page: Joi.string().description("page"),
            limit: Joi.string().description("limit"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccounts
  );

  fastify.get<{
    Querystring: {
      month?: string;
      year?: string;
      page?: string;
      limit?: string;
      tags?: string[];
    };
  }>(
    "/account/summary",
    {
      schema: {
        tags: ["Account"],
        description: "Get account summary for the authenticated user",
        querystring: parse(
          Joi.object({
            month: Joi.string().description("Month"),
            year: Joi.string().description("Year"),
            page: Joi.string().optional().description("Page"),
            limit: Joi.string().optional().description("Limit"),
            tags: Joi.array().items(Joi.string()).description("Tags"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccountsSummary
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

  fastify.get<{
    Params: {
      accountId: string;
    };
    Querystring: {
      month?: string;
      year?: string;
      tags?: string[];
    };
  }>(
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
        querystring: parse(
          Joi.object({
            month: Joi.string().description("Month"),
            year: Joi.string().description("Year"),
            tags: Joi.array().items(Joi.string()).description("Tags"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetAccountSummary
  );

  fastify.get<{
    Params: { accountId: string };
    Querystring: { budget?: string };
  }>(
    "/account/:accountId/calculate",
    {
      schema: {
        tags: ["Account"],
        description: "Get account summary by ID",
        params: parse(
          Joi.object({
            accountId: Joi.string().description("Account ID"),
          })
        ),
        querystring: parse(
          Joi.object({
            budget: Joi.string().description("Budget"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleCalculateAccount
  );
}
