import { FastifyInstance } from "fastify";
import { handleSignin, handleSignout, handleSignup } from "../handlers/auth";
import parse from "joi-to-json";
import Joi from "joi";

const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export default async function AuthRoute(fastify: FastifyInstance) {
  fastify.post(
    "/auth/signup",
    {
      schema: {
        tags: ["auth"],
        description: "Register a new user",
        body: parse(signupSchema),
      },
      preHandler: async (request, reply) =>
        fastify.validateBody(request, reply, signupSchema),
    },
    handleSignup
  );

  fastify.post(
    "/auth/signin",
    {
      schema: {
        tags: ["auth"],
        description: "Login user",
        body: parse(signinSchema),
      },
      preHandler: async (request, reply) =>
        fastify.validateBody(request, reply, signinSchema),
    },
    handleSignin
  );

  fastify.get(
    "/auth/signout",
    {
      schema: { tags: ["auth"], description: "Logout user" },
      preHandler: fastify.authenticate,
    },
    handleSignout
  );
}
