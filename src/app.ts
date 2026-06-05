import "reflect-metadata";
import express = require("express");
import cors = require("cors");
import helmet = require("helmet");
import morgan = require("morgan");
import { createServer } from "http";
import { AppDataSource } from "./data-source";
import { config } from "./config";
import router from "./routes";
import { wsService } from "./services/websocket.service";
import { schedulerService } from "./services/scheduler.service";

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("数据库连接成功");

    const app = express();
    const server = createServer(app);

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan("combined"));

    app.use("/api", router);

    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error(err.stack);
        res.status(500).json({
          message: err.message || "服务器内部错误",
          error: process.env.NODE_ENV === "development" ? err : {},
        });
      }
    );

    wsService.init(server);

    schedulerService.start();

    server.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`);
      console.log(`WebSocket 端点: ws://localhost:${config.port}/ws`);
      console.log(`健康检查: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error("服务器启动失败:", error);
    process.exit(1);
  }
}

bootstrap();
