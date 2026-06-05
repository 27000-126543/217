export const config = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "tunnel-monitor-secret-key-2024",
    expiresIn: "24h",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "tunnel_monitor",
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
