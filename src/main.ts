import "dotenv/config";

import fastify from "fastify";
import { AppDataSource, db_opts } from "./configs/db/data-source";
import cookie from "@fastify/cookie";
import session from "@fastify/session";

import fastifyAutoload from "@fastify/autoload";
import typeormPlugin from "typeorm-fastify-plugin";

function builder(opts = {}) {
  const app = fastify(opts);

  app.register(cookie);
  app.register(session, {
    cookieName: "sessionId",
    secret: "a secret with minimum length of 32 characters",
    cookie: { maxAge: 1800000, secure: false },
  });
  app.register(typeormPlugin, db_opts);
  app.register(fastifyAutoload, {
    dir: `${__dirname}/routes`,
    dirNameRoutePrefix: false,
    options: { prefix: "/api" },
  });

  return app;
}

async function main() {
  const app = builder({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          ignore: "pid,hostname",
        },
      },
    },
  });

  try {
    await AppDataSource.initialize();
    app.log.info("Database connected successfully");
    await app.listen({ port: parseInt(process.env.PORT) });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

export default main;
