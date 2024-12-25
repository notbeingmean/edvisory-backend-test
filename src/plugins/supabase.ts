import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { supabase } from "../configs/db/supabase";

declare module "fastify" {
  interface FastifyInstance {
    supabase: typeof supabase;
  }
}

async function supabasePlugin(app: FastifyInstance) {
  app.decorate("supabase", supabase);
}

export default fp(supabasePlugin);
