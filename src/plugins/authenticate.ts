import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { AppDataSource } from "../configs/db/typeorm";
import { Session } from "../entities";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import { TypeormStore } from "connect-typeorm";

declare module "@fastify/session" {
  interface FastifySessionObject {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

const authenticateUser: FastifyPluginAsync = async (fastify) => {
  const sessionRepository = AppDataSource.getRepository(Session);

  fastify.register(cookie);
  fastify.register(session, {
    cookieName: "sessionId",
    secret: process.env.SESSION_SECRET!,
    cookie: { maxAge: 1800000, secure: false },
    store: new TypeormStore({
      cleanupLimit: 5,
    }).connect(sessionRepository),
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.session.user) {
        return reply.status(401).send("Access Denied");
      }
    }
  );
};

export default fp(authenticateUser);
