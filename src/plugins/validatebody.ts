/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import Joi from "joi";

declare module "fastify" {
  interface FastifyInstance {
    validateBody: (
      request: FastifyRequest,
      reply: FastifyReply,
      schema: Joi.ObjectSchema<any>
    ) => Promise<void>;
  }
}

const validateBody: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "validateBody",
    async (
      request: FastifyRequest,
      reply: FastifyReply,
      schema: Joi.ObjectSchema<any>
    ) => {
      if (!request.body) {
        return reply.status(400).send("Bad Request");
      }
      try {
        const value = await schema.validateAsync(request.body);
        request.body = value;
      } catch (err) {
        return reply.status(400).send("Invalid request body" + err);
      }
    }
  );
};

export default fp(validateBody);
