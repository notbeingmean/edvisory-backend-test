import { FastifyInstance } from "fastify";
import parse from "joi-to-json";
import Joi from "joi";
import {
  CreateTransactionType,
  handleCreateTransaction,
  handleDeleteSlip,
  handleDeleteTransaction,
  handleGetTransaction,
  handleGetTransactions,
  handleUpdateTransaction,
  handleUploadSlip,
} from "../handlers/transaction";

const transactionSchema = Joi.object({
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  amount: Joi.number().required(),
  note: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export default async function TransactionRoute(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      accountId?: string;
      tags?: string[];
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    };
  }>(
    "/transaction",
    {
      schema: {
        tags: ["transaction"],
        description:
          "Get all transactions for an account **if you want to filter by tags, you can pass the tags query in the URL like this: /transaction?tags=food&tags=transport in postman or insomnia instead**",
        querystring: parse(
          Joi.object({
            accountId: Joi.string().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
            startDate: Joi.string().optional(),
            endDate: Joi.string().optional(),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetTransactions
  );

  fastify.get<{
    Params: { transactionId: string };
  }>(
    "/transaction/:transactionId",
    {
      schema: {
        tags: ["transaction"],
        description: "Get a transaction by ID ",
        params: parse(
          Joi.object({
            transactionId: Joi.string().description("Transaction ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleGetTransaction
  );

  fastify.post<{
    Body: CreateTransactionType;
    Querystring: { accountId?: string };
  }>(
    "/transaction",
    {
      schema: {
        tags: ["transaction"],
        description: "Create a new transaction with the authenticated user",
        querystring: parse(Joi.object({ accountId: Joi.string().optional() })),
        body: parse(transactionSchema),
      },
      preHandler: [
        fastify.authenticate,
        async (request, reply) =>
          fastify.validateBody(request, reply, transactionSchema),
      ],
    },
    handleCreateTransaction
  );

  fastify.patch<{
    Params: { transactionId: string };
    Body: CreateTransactionType;
  }>(
    "/transaction/:transactionId",
    {
      schema: {
        tags: ["transaction"],
        description: "Update a transaction",
        params: parse(
          Joi.object({
            transactionId: Joi.string().description("Transaction ID"),
          })
        ),
        body: parse(transactionSchema),
      },
      preHandler: [
        fastify.authenticate,
        async (request, reply) =>
          fastify.validateBody(request, reply, transactionSchema),
      ],
    },
    handleUpdateTransaction
  );

  fastify.patch<{ Params: { transactionId: string } }>(
    "/transaction/:transactionId/upload-slip",
    {
      schema: {
        consumes: ["multipart/form-data", "application/json"],
        tags: ["transaction"],
        description:
          "Upload a slip for a transaction, **prefer using multipart on postman or insomnia**",
        params: parse(
          Joi.object({
            transactionId: Joi.string().description("Transaction ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleUploadSlip
  );

  fastify.delete<{ Params: { transactionId: string } }>(
    "/transaction/:transactionId/delete-slip",
    {
      schema: {
        tags: ["transaction"],
        description: "Delete a transaction",
        params: parse(
          Joi.object({
            transactionId: Joi.string().description("Transaction ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleDeleteSlip
  );

  fastify.delete<{ Params: { transactionId: string } }>(
    "/transaction/:transactionId",
    {
      schema: {
        tags: ["transaction"],
        description: "Delete a transaction",
        params: parse(
          Joi.object({
            transactionId: Joi.string().description("Transaction ID"),
          })
        ),
      },
      preHandler: fastify.authenticate,
    },
    handleDeleteTransaction
  );
}
