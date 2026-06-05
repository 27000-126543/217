import { AppDataSource } from "../data-source";
import { SensorData } from "../entities/SensorData";
import { Sensor } from "../entities/Sensor";
import { SensorThreshold } from "../entities/SensorThreshold";
import { Alarm } from "../entities/Alarm";
import { EmergencyPlan } from "../entities/EmergencyPlan";
import {
  SensorStatus,
  AlarmLevel,
  AlarmStatus,
  SensorType,
  UserRole,
  NotificationType,
} from "../entities/enums";
import { wsService } from "./websocket.service";
import { notificationService } from "./notification.service";
import { User } from "../entities/User";
import { Between } from "typeorm";

class SensorService {
  private sensorRepo = AppDataSource.getRepository(Sensor);
  private sensorDataRepo = AppDataSource.getRepository(SensorData);
  private thresholdRepo = AppDataSource.getRepository(SensorThreshold);
  private alarmRepo = AppDataSource.getRepository(Alarm);
  private emergencyPlanRepo = AppDataSource.getRepository(EmergencyPlan);
  private userRepo = AppDataSource.getRepository(User);

  async collectSensorData(
    sensorCode: string,
    value: number,
    timestamp?: Date
  ): Promise<SensorData> {
    const sensor = await this.sensorRepo.findOne({
      where: { code: sensorCode },
      relations: ["tunnelSection"],
    });

    if (!sensor) {
      throw new Error(`Sensor ${sensorCode} not found`);
    }

    const data = this.sensorDataRepo.create({
      sensorId: sensor.id,
      value,
      timestamp: timestamp || new Date(),
    });

    const savedData = await this.sensorDataRepo.save(data);

    sensor.lastHeartbeat = new Date();
    await this.sensorRepo.save(sensor);

    await this.checkThresholds(sensor, value, savedData.id);

    wsService.broadcast("sensor_data", {
      sensor: {
        id: sensor.id,
        code: sensor.code,
        name: sensor.name,
        type: sensor.type,
      },
      value,
      timestamp: savedData.timestamp,
      tunnelSectionId: sensor.tunnelSectionId,
    });

    return savedData;
  }

  private async checkThresholds(
    sensor: Sensor,
    value: number,
    sensorDataId: string
  ) {
    const thresholds = await this.thresholdRepo.find({
      where: { sensorId: sensor.id, isActive: true },
    });

    let currentStatus: SensorStatus = SensorStatus.NORMAL;

    for (const threshold of thresholds) {
      const isWarning =
        (threshold.warningMin !== null &&
          threshold.warningMin !== undefined &&
          value < threshold.warningMin) ||
        (threshold.warningMax !== null &&
          threshold.warningMax !== undefined &&
          value > threshold.warningMax);

      const isAlarm =
        (threshold.alarmMin !== null &&
          threshold.alarmMin !== undefined &&
          value < threshold.alarmMin) ||
        (threshold.alarmMax !== null &&
          threshold.alarmMax !== undefined &&
          value > threshold.alarmMax);

      if (isAlarm) {
        currentStatus = SensorStatus.ALARM;
        await this.createAlarm(
          sensor,
          value,
          threshold.alarmLevel,
          threshold.alarmMax || threshold.alarmMin || 0,
          sensorDataId
        );
        break;
      } else if (isWarning && currentStatus === SensorStatus.NORMAL) {
        currentStatus = SensorStatus.WARNING;
      }
    }

    if (sensor.status !== currentStatus) {
      sensor.status = currentStatus;
      await this.sensorRepo.save(sensor);
    }
  }

  private async createAlarm(
    sensor: Sensor,
    value: number,
    level: AlarmLevel,
    thresholdValue: number,
    sensorDataId: string
  ): Promise<Alarm> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingActiveAlarm = await this.alarmRepo.findOne({
      where: {
        sensorId: sensor.id,
        status: AlarmStatus.PENDING,
        createdAt: Between(oneHourAgo, new Date()),
      },
      order: { createdAt: "DESC" },
    });

    if (existingActiveAlarm) {
      return existingActiveAlarm;
    }

    const emergencyPlan = await this.emergencyPlanRepo.findOne({
      where: {
        eventType: sensor.type,
        severityLevel: level,
        isActive: true,
      },
      relations: ["resourceAllocations"],
    });

    const levelText = {
      [AlarmLevel.CRITICAL]: "严重",
      [AlarmLevel.MAJOR]: "重要",
      [AlarmLevel.MINOR]: "一般",
    };

    const alarm = this.alarmRepo.create({
      sensorId: sensor.id,
      sensorDataId,
      title: `${sensor.name} ${levelText[level]}告警`,
      description: `传感器 ${sensor.name} 检测到异常值: ${value}, 阈值: ${thresholdValue}`,
      level,
      status: AlarmStatus.PENDING,
      triggerValue: value,
      thresholdValue,
      emergencyPlanId: emergencyPlan?.id,
    });

    const savedAlarm = await this.alarmRepo.save(alarm);

    if (emergencyPlan) {
      savedAlarm.emergencyPlan = emergencyPlan;
    }

    await this.notifyAlarm(savedAlarm, sensor);

    wsService.broadcast("alarm_created", savedAlarm, [
      UserRole.ADMIN,
      UserRole.COMMAND_CENTER,
      UserRole.MAINTENANCE_SUPERVISOR,
    ]);

    return savedAlarm;
  }

  private async notifyAlarm(alarm: Alarm, sensor: Sensor) {
    const admins = await this.userRepo.find({
      where: [
        { role: UserRole.ADMIN },
        { role: UserRole.COMMAND_CENTER },
      ],
    });

    const supervisors = await this.userRepo.find({
      where: { role: UserRole.MAINTENANCE_SUPERVISOR },
    });

    const allUsers = [...admins, ...supervisors];
    const userIds = allUsers.map((u) => u.id);

    await notificationService.batchCreateNotifications(
      userIds,
      alarm.title,
      alarm.description || "",
      NotificationType.ALARM,
      { alarmId: alarm.id, level: alarm.level }
    );
  }

  async getSensorData(
    sensorId: string,
    startTime?: Date,
    endTime?: Date,
    page: number = 1,
    pageSize: number = 100
  ) {
    const where: any = { sensorId };
    if (startTime && endTime) {
      where.timestamp = Between(startTime, endTime);
    }

    const [data, total] = await this.sensorDataRepo.findAndCount({
      where,
      order: { timestamp: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: data, total, page, pageSize };
  }

  async getLatestSensorData(sensorId: string) {
    return await this.sensorDataRepo.findOne({
      where: { sensorId },
      order: { timestamp: "DESC" },
    });
  }

  async getSensorsByTunnelSection(tunnelSectionId: string) {
    return await this.sensorRepo.find({
      where: { tunnelSectionId, isActive: true },
    });
  }

  async updateSensorThreshold(
    sensorId: string,
    thresholdData: Partial<SensorThreshold>
  ) {
    const existingThreshold = await this.thresholdRepo.findOne({
      where: { sensorId, isActive: true },
    });

    if (existingThreshold) {
      existingThreshold.isActive = false;
      await this.thresholdRepo.save(existingThreshold);
    }

    const newThreshold = this.thresholdRepo.create({
      ...thresholdData,
      sensorId,
      isActive: true,
    });

    return await this.thresholdRepo.save(newThreshold);
  }

  async acknowledgeAlarm(alarmId: string, userId: string) {
    const alarm = await this.alarmRepo.findOne({ where: { id: alarmId } });
    if (!alarm) {
      throw new Error("Alarm not found");
    }

    alarm.status = AlarmStatus.ACKNOWLEDGED;
    alarm.acknowledgedAt = new Date();
    alarm.acknowledgedBy = userId;

    const saved = await this.alarmRepo.save(alarm);

    wsService.broadcast("alarm_updated", saved);

    return saved;
  }

  async resolveAlarm(alarmId: string, userId: string, resolution?: string) {
    const alarm = await this.alarmRepo.findOne({ where: { id: alarmId } });
    if (!alarm) {
      throw new Error("Alarm not found");
    }

    alarm.status = AlarmStatus.RESOLVED;
    alarm.resolvedAt = new Date();
    alarm.resolvedBy = userId;

    const saved = await this.alarmRepo.save(alarm);

    wsService.broadcast("alarm_updated", saved);

    return saved;
  }

  async getActiveAlarms(tunnelSectionId?: string) {
    const where: any = {
      status: { $in: [AlarmStatus.PENDING, AlarmStatus.ACKNOWLEDGED] } as any,
    };

    const qb = this.alarmRepo
      .createQueryBuilder("alarm")
      .leftJoinAndSelect("alarm.sensor", "sensor")
      .leftJoinAndSelect("alarm.emergencyPlan", "emergencyPlan")
      .where("alarm.status IN (:...statuses)", {
        statuses: [AlarmStatus.PENDING, AlarmStatus.ACKNOWLEDGED],
      });

    if (tunnelSectionId) {
      qb.andWhere("sensor.tunnelSectionId = :tunnelSectionId", {
        tunnelSectionId,
      });
    }

    qb.orderBy("alarm.createdAt", "DESC");

    return await qb.getMany();
  }

  async getAlarmHistory(
    startTime?: Date,
    endTime?: Date,
    level?: AlarmLevel,
    page: number = 1,
    pageSize: number = 20
  ) {
    const qb = this.alarmRepo
      .createQueryBuilder("alarm")
      .leftJoinAndSelect("alarm.sensor", "sensor")
      .leftJoinAndSelect("alarm.emergencyPlan", "emergencyPlan");

    if (startTime && endTime) {
      qb.andWhere("alarm.createdAt BETWEEN :start AND :end", {
        start: startTime,
        end: endTime,
      });
    }

    if (level) {
      qb.andWhere("alarm.level = :level", { level });
    }

    qb.orderBy("alarm.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [alarms, total] = await qb.getManyAndCount();

    return { items: alarms, total, page, pageSize };
  }

  async escalateAlarm(alarmId: string) {
    const alarm = await this.alarmRepo.findOne({ where: { id: alarmId } });
    if (!alarm) {
      throw new Error("Alarm not found");
    }

    alarm.escalationCount = (alarm.escalationCount || 0) + 1;
    alarm.lastEscalatedAt = new Date();
    alarm.status = AlarmStatus.ESCALATED;

    const saved = await this.alarmRepo.save(alarm);

    const managers = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
    });

    await notificationService.batchCreateNotifications(
      managers.map((u) => u.id),
      `告警升级: ${alarm.title}`,
      `告警已升级 ${alarm.escalationCount} 次，请立即处理`,
      NotificationType.ALARM,
      { alarmId: alarm.id }
    );

    wsService.broadcast("alarm_escalated", saved);

    return saved;
  }
}

export const sensorService = new SensorService();
