import * as cron from "node-cron";
import { AppDataSource } from "../data-source";
import { workOrderService } from "./work-order.service";
import { pipelineService } from "./pipeline.service";
import { reportService } from "./report.service";
import { deviceService } from "./device.service";
import { sensorService } from "./sensor.service";
import { config } from "../config";
import { TunnelSection } from "../entities/TunnelSection";

class SchedulerService {
  start() {
    console.log("启动定时任务调度器...");

    cron.schedule("*/5 * * * *", async () => {
      try {
        await workOrderService.checkOverdueWorkOrders();
      } catch (error) {
        console.error("检查逾期工单失败:", error);
      }
    });

    cron.schedule("*/30 * * * *", async () => {
      try {
        await pipelineService.checkOverdueBills();
      } catch (error) {
        console.error("检查逾期账单失败:", error);
      }
    });

    cron.schedule("*/1 * * * *", async () => {
      try {
        const tunnelSectionRepo = AppDataSource.getRepository(TunnelSection);
        const sections = await tunnelSectionRepo.find();
        for (const section of sections) {
          await deviceService.autoControlByEnvironment(section.id);
        }
      } catch (error) {
        console.error("自动设备控制失败:", error);
      }
    });

    cron.schedule("0 0 2 * * *", async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tunnelSectionRepo = AppDataSource.getRepository(TunnelSection);
        const sections = await tunnelSectionRepo.find();

        for (const section of sections) {
          await deviceService.generateDailyEnergyReport(
            section.id,
            yesterday
          );
        }

        await reportService.generateDailyReport(yesterday);
        console.log("每日报表生成完成");
      } catch (error) {
        console.error("生成每日报表失败:", error);
      }
    });

    console.log("定时任务调度器已启动");
  }
}

export const schedulerService = new SchedulerService();
