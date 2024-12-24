import { FastifyInstance } from "fastify";
import { Transaction } from "../entities";
import {
  TData,
  transactionSchemaJson,
  TTransactionBody,
} from "../schemas/transaction";
import { supabase } from "../configs/db/supabase";
import fastifyMultipart from "@fastify/multipart";

export default async function ProtectedRoutes(fastify: FastifyInstance) {
  fastify.register(fastifyMultipart, { attachFieldsToBody: "keyValues" });
  fastify.post<{ Body: TTransactionBody }>(
    "/transaction",

    async (request, reply) => {
      const { file, data } = request.body;
      const dataObj: TData = JSON.parse(data);

      console.log(dataObj.amount);
    }
  );
}
