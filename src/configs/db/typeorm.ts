import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { User, Account, Transaction, Session } from "../../entities";

export const db_opts: DataSourceOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User, Account, Transaction, Session],
};

export const AppDataSource = new DataSource(db_opts);
