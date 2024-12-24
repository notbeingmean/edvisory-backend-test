import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

const autoload = async (fastify: FastifyInstance) => {
  fastify.register(fastifyAutoload, {
    dir: `${__dirname}/../routes`,
    dirNameRoutePrefix: false,
    options: { prefix: "/api" },
  });
};

export default fp(autoload);
