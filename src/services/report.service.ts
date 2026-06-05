import { AppDataSource } from "../data-source";
import { DailyReport } from "../entities/DailyReport";
import { Alarm } from "../entities/Alarm";
import { WorkOrder } from "../entities/WorkOrder";
import { Inspection } from "../entities/Inspection";
import { EnergyReport } from "../entities/EnergyReport";
import { HiddenDanger } from "../entities/HiddenDanger";
import { EntryApplication } from "../entities/EntryApplication";
import { TunnelSection } from "../entities/TunnelSection";
import {
  AlarmStatus,
  WorkOrderStatus,
  EntryApplicationStatus,
} from "../entities/enums";
import * as ExcelJS from "exceljs";
import { Between } from "typeorm";

class ReportService {
  private dailyReportRepo = AppDataSource.getRepository(DailyReport);
  private alarmRepo = AppDataSource.getRepository(Alarm);
  private workOrderRepo = AppDataSource.getRepository(WorkOrder);
  private inspectionRepo = AppDataSource.getRepository(Inspection);
  private energyReportRepo = AppDataSource.getRepository(EnergyReport);
  private hiddenDangerRepo = AppDataSource.getRepository(HiddenDanger);
  private applicationRepo = AppDataSource.getRepository(EntryApplication);
  private tunnelSectionRepo = AppDataSource.getRepository(TunnelSection);

  async generateDailyReport(reportDate: Date): Promise<DailyReport[]> {
    const tunnelSections = await this.tunnelSectionRepo.find();
    const reports: DailyReport[] = [];

    for (const section of tunnelSections) {
      const report = await this.generateSectionDailyReport(
        section.id,
        reportDate
      );
      reports.push(report);
    }

    const systemWideReport = await this.generateSystemWideDailyReport(
      reportDate
    );
    reports.push(systemWideReport);

    return reports;
  }

  private async generateSectionDailyReport(
    tunnelSectionId: string,
    reportDate: Date
  ): Promise<DailyReport> {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const alarms = await this.alarmRepo
      .createQueryBuilder("alarm")
      .leftJoin("alarm.sensor", "sensor")
      .where("sensor.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("alarm.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    const resolvedAlarms = alarms.filter(
      (a) => a.status === AlarmStatus.RESOLVED
    );

    const responseTimes = resolvedAlarms
      .filter((a) => a.acknowledgedAt)
      .map(
        (a) =>
          (a.acknowledgedAt!.getTime() - a.createdAt.getTime()) / 60000
      );

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const workOrders = await this.workOrderRepo
      .createQueryBuilder("wo")
      .where("wo.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("wo.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    const completedWorkOrders = workOrders.filter(
      (w) =>
        w.status === WorkOrderStatus.COMPLETED ||
        w.status === WorkOrderStatus.CLOSED
    );

    const overdueWorkOrders = workOrders.filter(
      (w) => w.status === WorkOrderStatus.OVERDUE
    );

    const inspections = await this.inspectionRepo
      .createQueryBuilder("i")
      .where("i.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("i.startTime BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    const completedInspections = inspections.filter((i) => i.endTime);
    const anomalyInspections = inspections.filter((i) => i.hasAnomaly);

    const energyReport = await this.energyReportRepo.findOne({
      where: {
        tunnelSectionId,
        reportDate: startOfDay,
      },
    });

    const newHiddenDangers = await this.hiddenDangerRepo
      .createQueryBuilder("hd")
      .where("hd.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("hd.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getCount();

    const resolvedHiddenDangers = await this.hiddenDangerRepo
      .createQueryBuilder("hd")
      .where("hd.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("hd.resolvedAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getCount();

    const newApplications = await this.applicationRepo
      .createQueryBuilder("app")
      .where("app.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getCount();

    const approvedApplications = await this.applicationRepo
      .createQueryBuilder("app")
      .where("app.approvedAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getCount();

    const existingReport = await this.dailyReportRepo.findOne({
      where: {
        tunnelSectionId,
        reportDate: startOfDay,
      },
    });

    const reportData = {
      tunnelSectionId,
      reportDate: startOfDay,
      isSystemWide: false,
      totalAlarms: alarms.length,
      resolvedAlarms: resolvedAlarms.length,
      averageAlarmResponseTime: avgResponseTime,
      criticalAlarms: alarms.filter((a) => a.level === "critical").length,
      majorAlarms: alarms.filter((a) => a.level === "major").length,
      minorAlarms: alarms.filter((a) => a.level === "minor").length,
      totalWorkOrders: workOrders.length,
      completedWorkOrders: completedWorkOrders.length,
      workOrderCompletionRate:
        workOrders.length > 0
          ? (completedWorkOrders.length / workOrders.length) * 100
          : 0,
      overdueWorkOrders: overdueWorkOrders.length,
      totalInspections: inspections.length,
      completedInspections: completedInspections.length,
      inspectionCompletionRate:
        inspections.length > 0
          ? (completedInspections.length / inspections.length) * 100
          : 0,
      anomalyInspections: anomalyInspections.length,
      totalEnergyConsumed: energyReport?.totalEnergyConsumed || 0,
      estimatedEnergyCost: energyReport?.estimatedCost || 0,
      deviceActivationCount: energyReport?.deviceActivationCount || 0,
      automaticControlCount: energyReport?.automaticControlCount || 0,
      newHiddenDangers,
      resolvedHiddenDangers,
      newEntryApplications: newApplications,
      approvedEntryApplications: approvedApplications,
    };

    if (existingReport) {
      Object.assign(existingReport, reportData);
      return await this.dailyReportRepo.save(existingReport);
    }

    const report = this.dailyReportRepo.create(reportData);
    return await this.dailyReportRepo.save(report);
  }

  private async generateSystemWideDailyReport(
    reportDate: Date
  ): Promise<DailyReport> {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const sectionReports = await this.dailyReportRepo.find({
      where: {
        reportDate: startOfDay,
        isSystemWide: false,
      },
    });

    if (sectionReports.length === 0) {
      const report = this.dailyReportRepo.create({
        reportDate: startOfDay,
        isSystemWide: true,
      });
      return await this.dailyReportRepo.save(report);
    }

    const sum = (key: keyof DailyReport) =>
      sectionReports.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

    const avg = (key: keyof DailyReport) => {
      const values = sectionReports
        .map((r) => Number(r[key]) || 0)
        .filter((v) => v > 0);
      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    };

    const existingReport = await this.dailyReportRepo.findOne({
      where: {
        reportDate: startOfDay,
        isSystemWide: true,
      },
    });

    const reportData = {
      reportDate: startOfDay,
      isSystemWide: true,
      totalAlarms: sum("totalAlarms"),
      resolvedAlarms: sum("resolvedAlarms"),
      averageAlarmResponseTime: avg("averageAlarmResponseTime"),
      criticalAlarms: sum("criticalAlarms"),
      majorAlarms: sum("majorAlarms"),
      minorAlarms: sum("minorAlarms"),
      totalWorkOrders: sum("totalWorkOrders"),
      completedWorkOrders: sum("completedWorkOrders"),
      workOrderCompletionRate: avg("workOrderCompletionRate"),
      overdueWorkOrders: sum("overdueWorkOrders"),
      totalInspections: sum("totalInspections"),
      completedInspections: sum("completedInspections"),
      inspectionCompletionRate: avg("inspectionCompletionRate"),
      anomalyInspections: sum("anomalyInspections"),
      totalEnergyConsumed: sum("totalEnergyConsumed"),
      estimatedEnergyCost: sum("estimatedEnergyCost"),
      deviceActivationCount: sum("deviceActivationCount"),
      automaticControlCount: sum("automaticControlCount"),
      newHiddenDangers: sum("newHiddenDangers"),
      resolvedHiddenDangers: sum("resolvedHiddenDangers"),
      newEntryApplications: sum("newEntryApplications"),
      approvedEntryApplications: sum("approvedEntryApplications"),
    };

    if (existingReport) {
      Object.assign(existingReport, reportData);
      return await this.dailyReportRepo.save(existingReport);
    }

    const report = this.dailyReportRepo.create(reportData);
    return await this.dailyReportRepo.save(report);
  }

  async getDailyReports(
    tunnelSectionId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 30
  ) {
    const qb = this.dailyReportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.tunnelSection", "tunnelSection");

    if (tunnelSectionId) {
      qb.andWhere("report.tunnelSectionId = :tunnelSectionId", {
        tunnelSectionId,
      });
    } else {
      qb.andWhere("report.isSystemWide = :isSystemWide", {
        isSystemWide: true,
      });
    }

    if (startDate && endDate) {
      qb.andWhere("report.reportDate BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      });
    }

    qb.orderBy("report.reportDate", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [reports, total] = await qb.getManyAndCount();

    return { items: reports, total, page, pageSize };
  }

  async exportToExcel(
    startDate: Date,
    endDate: Date,
    tunnelSectionId?: string
  ): Promise<Buffer> {
    const { items: reports } = await this.getDailyReports(
      tunnelSectionId,
      startDate,
      endDate,
      1,
      1000
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("运维报表");

    worksheet.columns = [
      { header: "日期", key: "reportDate", width: 15 },
      { header: "管廊段", key: "tunnelSection", width: 20 },
      { header: "告警总数", key: "totalAlarms", width: 10 },
      { header: "已处理告警", key: "resolvedAlarms", width: 12 },
      { header: "平均响应时间(分钟)", key: "avgResponseTime", width: 18 },
      { header: "严重告警", key: "criticalAlarms", width: 10 },
      { header: "重要告警", key: "majorAlarms", width: 10 },
      { header: "一般告警", key: "minorAlarms", width: 10 },
      { header: "工单总数", key: "totalWorkOrders", width: 10 },
      { header: "已完成工单", key: "completedWorkOrders", width: 12 },
      { header: "工单完成率(%)", key: "completionRate", width: 14 },
      { header: "逾期工单", key: "overdueWorkOrders", width: 10 },
      { header: "巡检总数", key: "totalInspections", width: 10 },
      { header: "完成巡检", key: "completedInspections", width: 10 },
      { header: "巡检完成率(%)", key: "inspectionRate", width: 14 },
      { header: "异常巡检", key: "anomalyInspections", width: 10 },
      { header: "能耗(kWh)", key: "energyConsumed", width: 12 },
      { header: "电费(元)", key: "energyCost", width: 10 },
      { header: "设备启动次数", key: "deviceCount", width: 12 },
      { header: "自动控制次数", key: "autoCount", width: 12 },
    ];

    for (const report of reports) {
      worksheet.addRow({
        reportDate: report.reportDate.toISOString().split("T")[0],
        tunnelSection:
          (report as any).tunnelSection?.name || "全系统",
        totalAlarms: report.totalAlarms,
        resolvedAlarms: report.resolvedAlarms,
        avgResponseTime: report.averageAlarmResponseTime.toFixed(2),
        criticalAlarms: report.criticalAlarms,
        majorAlarms: report.majorAlarms,
        minorAlarms: report.minorAlarms,
        totalWorkOrders: report.totalWorkOrders,
        completedWorkOrders: report.completedWorkOrders,
        completionRate: report.workOrderCompletionRate.toFixed(2),
        overdueWorkOrders: report.overdueWorkOrders,
        totalInspections: report.totalInspections,
        completedInspections: report.completedInspections,
        inspectionRate: report.inspectionCompletionRate.toFixed(2),
        anomalyInspections: report.anomalyInspections,
        energyConsumed: report.totalEnergyConsumed.toFixed(2),
        energyCost: report.estimatedEnergyCost.toFixed(2),
        deviceCount: report.deviceActivationCount,
        autoCount: report.automaticControlCount,
      });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  async getStatistics(
    startDate: Date,
    endDate: Date,
    tunnelSectionId?: string
  ) {
    const { items: reports } = await this.getDailyReports(
      tunnelSectionId,
      startDate,
      endDate,
      1,
      1000
    );

    const sum = (key: keyof DailyReport) =>
      reports.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

    const avg = (key: keyof DailyReport) => {
      const values = reports
        .map((r) => Number(r[key]) || 0)
        .filter((v) => v > 0);
      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    };

    return {
      period: { startDate, endDate },
      alarms: {
        total: sum("totalAlarms"),
        resolved: sum("resolvedAlarms"),
        resolvedRate:
          sum("totalAlarms") > 0
            ? (sum("resolvedAlarms") / sum("totalAlarms")) * 100
            : 0,
        averageResponseTime: avg("averageAlarmResponseTime"),
        critical: sum("criticalAlarms"),
        major: sum("majorAlarms"),
        minor: sum("minorAlarms"),
      },
      workOrders: {
        total: sum("totalWorkOrders"),
        completed: sum("completedWorkOrders"),
        completionRate: avg("workOrderCompletionRate"),
        overdue: sum("overdueWorkOrders"),
      },
      inspections: {
        total: sum("totalInspections"),
        completed: sum("completedInspections"),
        completionRate: avg("inspectionCompletionRate"),
        anomalies: sum("anomalyInspections"),
      },
      energy: {
        totalConsumed: sum("totalEnergyConsumed"),
        totalCost: sum("estimatedEnergyCost"),
        deviceActivations: sum("deviceActivationCount"),
        automaticControls: sum("automaticControlCount"),
      },
      hiddenDangers: {
        new: sum("newHiddenDangers"),
        resolved: sum("resolvedHiddenDangers"),
      },
      entryApplications: {
        new: sum("newEntryApplications"),
        approved: sum("approvedEntryApplications"),
      },
    };
  }
}

export const reportService = new ReportService();
