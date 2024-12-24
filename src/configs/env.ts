/* eslint-disable @typescript-eslint/no-namespace */
export const env = "development";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: string;
      POSTGRES_DB: string;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: string;
      SALT_ROUNDS: string;
      SESSION_SECRET: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    }
  }
}
