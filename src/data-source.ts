import "reflect-metadata";
import { DataSource } from "typeorm";
import * as path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "tunnel_monitor",
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, "entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "migrations/**/*.{ts,js}")],
  subscribers: [path.join(__dirname, "subscribers/**/*.{ts,js}")],
});
