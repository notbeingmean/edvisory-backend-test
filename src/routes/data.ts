import { FastifyInstance } from "fastify";
import { importDataHandler, exportDataHandler } from "../handlers/data";

async function dataRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Querystring: { accountId: string };
  }>(
    "/data/import",
    {
      schema: {
        tags: ["Data"],
        description:
          "Import data to the system *using postman or insomnia instead of the web interface*",
      },
      preHandler: [fastify.authenticate],
    },
    importDataHandler
  );
  fastify.get<{ Querystring: { format: string } }>(
    "/data/export",
    {
      schema: {
        tags: ["Data"],
        description:
          "Export data from the system *using postman or insomnia instead of the web interface*",
      },
      preHandler: [fastify.authenticate],
    },
    exportDataHandler
  );
}

export default dataRoutes;
