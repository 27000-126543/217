import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  env: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "tunnel-monitor-secret-key-2024",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
  database: {
    type: process.env.DB_TYPE || "sqlite",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "tunnel_monitor",
    sqlitePath: process.env.DB_PATH || "./data/tunnel_monitor.db",
  },
  alarm: {
    escalationMinutes: 30,
    autoRecoveryCheckInterval: 60000,
  },
  workOrder: {
    timeoutMinutes: 120,
    escalationLevels: ["班组负责人", "运维主管", "运维经理"],
  },
  report: {
    generateTime: "0 0 2 * * *",
  },
};
