import { AppDataSource } from "../data-source";
import { Device } from "../entities/Device";
import { DeviceControlLog } from "../entities/DeviceControlLog";
import { EnergyReport } from "../entities/EnergyReport";
import { DeviceStatus, DeviceType, SensorType } from "../entities/enums";
import { wsService } from "./websocket.service";
import { SensorData } from "../entities/SensorData";
import { Sensor } from "../entities/Sensor";
import { Between } from "typeorm";

class DeviceService {
  private deviceRepo = AppDataSource.getRepository(Device);
  private controlLogRepo = AppDataSource.getRepository(DeviceControlLog);
  private energyReportRepo = AppDataSource.getRepository(EnergyReport);
  private sensorDataRepo = AppDataSource.getRepository(SensorData);
  private sensorRepo = AppDataSource.getRepository(Sensor);

  async controlDevice(
    deviceId: string,
    newStatus: DeviceStatus,
    triggerType: "automatic" | "manual",
    triggerReason?: string,
    operatorId?: string
  ): Promise<DeviceControlLog> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: ["tunnelSection"],
    });

    if (!device) {
      throw new Error("Device not found");
    }

    if (device.status === newStatus) {
      throw new Error("Device is already in the requested status");
    }

    const previousStatus = device.status;
    device.status = newStatus;
    await this.deviceRepo.save(device);

    const durationMinutes =
      previousStatus === DeviceStatus.ON && newStatus === DeviceStatus.OFF
        ? await this.calculateDuration(deviceId)
        : 0;

    const energyConsumed =
      durationMinutes > 0 ? this.calculateEnergy(device, durationMinutes) : 0;

    const log = this.controlLogRepo.create({
      deviceId,
      previousStatus,
      newStatus,
      triggerType,
      triggerReason,
      operatorId,
      operationTime: new Date(),
      durationMinutes,
      energyConsumed,
    });

    const savedLog = await this.controlLogRepo.save(log);

    wsService.broadcast("device_updated", {
      device: {
        id: device.id,
        code: device.code,
        name: device.name,
        type: device.type,
        status: device.status,
      },
      log: savedLog,
    });

    return savedLog;
  }

  private async calculateDuration(deviceId: string): Promise<number> {
    const lastOnLog = await this.controlLogRepo.findOne({
      where: { deviceId, newStatus: DeviceStatus.ON },
      order: { operationTime: "DESC" },
    });

    if (!lastOnLog) return 0;

    const now = new Date();
    return Math.round(
      (now.getTime() - lastOnLog.operationTime.getTime()) / 60000
    );
  }

  private calculateEnergy(device: Device, minutes: number): number {
    const hours = minutes / 60;
    return device.powerRating * hours;
  }

  async autoControlByEnvironment(tunnelSectionId: string): Promise<void> {
    const sensors = await this.sensorRepo.find({
      where: { tunnelSectionId, isActive: true },
    });

    const devices = await this.deviceRepo.find({
      where: { tunnelSectionId, isActive: true },
    });

    for (const sensor of sensors) {
      const latestData = await this.sensorDataRepo.findOne({
        where: { sensorId: sensor.id },
        order: { timestamp: "DESC" },
      });

      if (!latestData) continue;

      await this.processSensorData(sensor, latestData.value, devices);
    }
  }

  private async processSensorData(
    sensor: Sensor,
    value: number,
    devices: Device[]
  ) {
    const threshold = 50;

    switch (sensor.type) {
      case SensorType.WATER_LEVEL:
        if (value > 200) {
          const pumps = devices.filter((d) => d.type === DeviceType.PUMP);
          for (const pump of pumps) {
            if (pump.status === DeviceStatus.OFF) {
              await this.controlDevice(
                pump.id,
                DeviceStatus.ON,
                "automatic",
                `水位过高: ${value}mm，自动启动排水泵`
              ).catch(() => {});
            }
          }
        } else if (value < 50) {
          const pumps = devices.filter((d) => d.type === DeviceType.PUMP);
          for (const pump of pumps) {
            if (pump.status === DeviceStatus.ON) {
              await this.controlDevice(
                pump.id,
                DeviceStatus.OFF,
                "automatic",
                `水位恢复正常: ${value}mm，自动关闭排水泵`
              ).catch(() => {});
            }
          }
        }
        break;

      case SensorType.GAS_CH4:
      case SensorType.GAS_H2S:
      case SensorType.GAS_CO:
        if (value > threshold * 0.8) {
          const ventilations = devices.filter(
            (d) => d.type === DeviceType.VENTILATION
          );
          for (const vent of ventilations) {
            if (vent.status === DeviceStatus.OFF) {
              await this.controlDevice(
                vent.id,
                DeviceStatus.ON,
                "automatic",
                `气体浓度过高: ${sensor.type}=${value}，自动启动通风系统`
              ).catch(() => {});
            }
          }
        } else if (value < threshold * 0.3) {
          const ventilations = devices.filter(
            (d) => d.type === DeviceType.VENTILATION
          );
          for (const vent of ventilations) {
            if (vent.status === DeviceStatus.ON) {
              await this.controlDevice(
                vent.id,
                DeviceStatus.OFF,
                "automatic",
                `气体浓度恢复正常: ${sensor.type}=${value}，自动关闭通风系统`
              ).catch(() => {});
            }
          }
        }
        break;

      case SensorType.TEMPERATURE:
        if (value > 40) {
          const ventilations = devices.filter(
            (d) => d.type === DeviceType.VENTILATION
          );
          for (const vent of ventilations) {
            if (vent.status === DeviceStatus.OFF) {
              await this.controlDevice(
                vent.id,
                DeviceStatus.ON,
                "automatic",
                `温度过高: ${value}°C，自动启动通风降温`
              ).catch(() => {});
            }
          }
        } else if (value < 25) {
          const ventilations = devices.filter(
            (d) => d.type === DeviceType.VENTILATION
          );
          for (const vent of ventilations) {
            if (vent.status === DeviceStatus.ON) {
              await this.controlDevice(
                vent.id,
                DeviceStatus.OFF,
                "automatic",
                `温度恢复正常: ${value}°C，自动关闭通风系统`
              ).catch(() => {});
            }
          }
        }
        break;
    }
  }

  async getDevicesByTunnelSection(tunnelSectionId: string) {
    return await this.deviceRepo.find({
      where: { tunnelSectionId, isActive: true },
    });
  }

  async getDeviceControlLogs(
    deviceId: string,
    startTime?: Date,
    endTime?: Date,
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = { deviceId };
    if (startTime && endTime) {
      where.operationTime = Between(startTime, endTime);
    }

    const [logs, total] = await this.controlLogRepo.findAndCount({
      where,
      order: { operationTime: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: logs, total, page, pageSize };
  }

  async generateDailyEnergyReport(
    tunnelSectionId: string,
    reportDate: Date
  ): Promise<EnergyReport> {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.controlLogRepo
      .createQueryBuilder("log")
      .innerJoin("log.device", "device")
      .where("device.tunnelSectionId = :tunnelSectionId", { tunnelSectionId })
      .andWhere("log.operationTime BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    let totalEnergy = 0;
    let ventilationEnergy = 0;
    let drainageEnergy = 0;
    let lightingEnergy = 0;
    let otherEnergy = 0;
    let deviceActivationCount = 0;
    let automaticControlCount = 0;
    let manualControlCount = 0;

    const devices = await this.deviceRepo.find({
      where: { tunnelSectionId },
    });

    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    for (const log of logs) {
      if (log.newStatus === DeviceStatus.ON) {
        deviceActivationCount++;
        if (log.triggerType === "automatic") {
          automaticControlCount++;
        } else {
          manualControlCount++;
        }
      }

      const energy = log.energyConsumed || 0;
      totalEnergy += energy;

      const device = deviceMap.get(log.deviceId);
      if (device) {
        switch (device.type) {
          case DeviceType.VENTILATION:
            ventilationEnergy += energy;
            break;
          case DeviceType.DRAINAGE:
          case DeviceType.PUMP:
            drainageEnergy += energy;
            break;
          case DeviceType.LIGHTING:
            lightingEnergy += energy;
            break;
          default:
            otherEnergy += energy;
            break;
        }
      }
    }

    const existingReport = await this.energyReportRepo.findOne({
      where: {
        tunnelSectionId,
        reportDate: startOfDay,
      },
    });

    if (existingReport) {
      existingReport.totalEnergyConsumed = totalEnergy;
      existingReport.ventilationEnergy = ventilationEnergy;
      existingReport.drainageEnergy = drainageEnergy;
      existingReport.lightingEnergy = lightingEnergy;
      existingReport.otherEnergy = otherEnergy;
      existingReport.deviceActivationCount = deviceActivationCount;
      existingReport.automaticControlCount = automaticControlCount;
      existingReport.manualControlCount = manualControlCount;
      existingReport.estimatedCost = totalEnergy * 0.8;

      return await this.energyReportRepo.save(existingReport);
    }

    const report = this.energyReportRepo.create({
      tunnelSectionId,
      reportDate: startOfDay,
      totalEnergyConsumed: totalEnergy,
      ventilationEnergy,
      drainageEnergy,
      lightingEnergy,
      otherEnergy,
      deviceActivationCount,
      automaticControlCount,
      manualControlCount,
      estimatedCost: totalEnergy * 0.8,
    });

    return await this.energyReportRepo.save(report);
  }

  async getEnergyReports(
    tunnelSectionId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 30
  ) {
    const where: any = {};
    if (tunnelSectionId) {
      where.tunnelSectionId = tunnelSectionId;
    }
    if (startDate && endDate) {
      where.reportDate = Between(startDate, endDate);
    }

    const [reports, total] = await this.energyReportRepo.findAndCount({
      where,
      relations: ["tunnelSection"],
      order: { reportDate: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: reports, total, page, pageSize };
  }
}

export const deviceService = new DeviceService();
