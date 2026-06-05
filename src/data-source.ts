import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

const dbType = (process.env.DB_TYPE || "sqlite") as "sqlite" | "postgres";

const dbDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const entitiesPath = path.join(__dirname, "entities/**/*.{ts,js}");
const migrationsPath = path.join(__dirname, "migrations/**/*.{ts,js}");

const getDataSourceConfig = () => {
  if (dbType === "postgres") {
    return {
      type: "postgres" as const,
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "tunnel_monitor",
      synchronize: true,
      logging: process.env.NODE_ENV === "development",
      entities: [entitiesPath],
      migrations: [migrationsPath],
      subscribers: [path.join(__dirname, "subscribers/**/*.{ts,js}")],
    };
  }

  return {
    type: "sqlite" as const,
    database: path.resolve(process.cwd(), process.env.DB_PATH || "./data/tunnel_monitor.db"),
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    entities: [entitiesPath],
    migrations: [migrationsPath],
    subscribers: [path.join(__dirname, "subscribers/**/*.{ts,js}")],
  };
};

export const AppDataSource = new DataSource(getDataSourceConfig());

export const DB_TYPE = dbType;
