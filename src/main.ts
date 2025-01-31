import "dotenv/config";

import fastify from "fastify";
import { AppDataSource, db_opts } from "./configs/db/typeorm";

import typeormPlugin from "typeorm-fastify-plugin";
import swaggerPlugin from "./plugins/swagger";
import authenticate from "./plugins/authenticate";
import autoload from "./plugins/autoload";
import validatebody from "./plugins/validatebody";
import fastifyMultipart from "@fastify/multipart";
import supabase from "./plugins/supabase";

function builder(opts = {}) {
  const app = fastify(opts);

  app.register(swaggerPlugin);
  app.register(supabase);
  app.register(fastifyMultipart);
  app.register(authenticate); // Register authenticate plugin before autoload
  app.register(autoload);
  app.register(validatebody);
  app.register(typeormPlugin, db_opts);

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
    await app.listen({ port: Number(process.env.PORT), host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

export default main;
