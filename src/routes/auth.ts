import { FastifyInstance } from "fastify";
import { User } from "../entities";
import { comparePassword, hashPassword } from "../libs/utils";
import {
  TRegisterBody,
  registerSchemaJson,
  registerSchema,
} from "../libs/schema/register";
import { loginSchema, loginSchemaJson, TLoginBody } from "../libs/schema/login";

export default async function AuthController(fastify: FastifyInstance) {
  fastify.post<{ Body: TRegisterBody }>(
    "/register",
    {
      schema: {
        body: registerSchemaJson,
      },
      preHandler: async (request, reply) => {
        try {
          const value = await registerSchema.validateAsync(request.body);
          request.body = value;
        } catch (err) {
          return reply.status(400).send("Invalid request body" + err);
        }
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;
      const userRepository = fastify.orm.getRepository(User);
      try {
        const existingUser = await userRepository.findOne({
          where: [{ email }, { name }],
        });

        const newUser = userRepository.create({
          name,
          email,
          password: await hashPassword(password),
        });

        if (existingUser) {
          return reply.status(400).send("User already exists");
        }
        await userRepository.save(newUser);
      } catch (err) {
        return reply.status(500).send("Failed to save user" + err);
      }

      return reply.send({ name, email });
    }
  );

  fastify.post<{ Body: TLoginBody }>(
    "/login",
    {
      schema: {
        body: loginSchemaJson,
      },
      preHandler: async (request, reply) => {
        try {
          const value = await loginSchema.validateAsync(request.body);
          request.body = value;
        } catch (err) {
          return reply.status(400).send("Invalid request body" + err);
        }
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const userRepository = fastify.orm.getRepository(User);
      try {
        const user = await userRepository.findOne({
          where: {
            email,
          },
        });
        if (!user) {
          return reply.status(404).send("User not found");
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          return reply.status(401).send("Invalid password");
        }

        if (!user.id) {
          return reply.status(500).send("Invalid user ID");
        }
        request.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      } catch (err) {
        return reply.status(500).send("Failed to login" + err);
      }

      return reply.send("Logged in");
    }
  );
}
