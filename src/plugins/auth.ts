import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "@fastify/session" {
  interface FastifySessionObject {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }
}

export default fp(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (fastify, _opts = {}) {
    fastify.register(cookie);
    fastify.register(session, {
      secret: process.env.SESSION_SECRET || "a-very-long-secret-key",
      cookieName: "sessionId",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 86400000, // 1 day in milliseconds
      },
    });

    fastify.decorate(
      "authenticate",
      async function (request: FastifyRequest, reply: FastifyReply) {
        if (!request.session.user) {
          reply.status(401).send({ error: "Unauthorized" });
        }
      }
    );
  },
  {
    name: "auth",
    dependencies: ["env"],
  }
);
