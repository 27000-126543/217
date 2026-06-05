import { Request, Response } from "express";
import { sensorService } from "../services/sensor.service";
import { AlarmLevel } from "../entities/enums";

class SensorController {
  async collectSensorData(req: Request, res: Response) {
    try {
      const { sensorCode, value, timestamp } = req.body;
      const data = await sensorService.collectSensorData(
        sensorCode,
        value,
        timestamp ? new Date(timestamp) : undefined
      );
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getSensors(req: Request, res: Response) {
    try {
      const { tunnelSectionId } = req.query;
      if (tunnelSectionId) {
        const sensors = await sensorService.getSensorsByTunnelSection(
          tunnelSectionId as string
        );
        res.json(sensors);
      } else {
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getSensorData(req: Request, res: Response) {
    try {
      const { sensorId } = req.params;
      const { startTime, endTime, page, pageSize } = req.query;
      const data = await sensorService.getSensorData(
        sensorId,
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 100
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getLatestSensorData(req: Request, res: Response) {
    try {
      const { sensorId } = req.params;
      const data = await sensorService.getLatestSensorData(sensorId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateThreshold(req: Request, res: Response) {
    try {
      const { sensorId } = req.params;
      const threshold = await sensorService.updateSensorThreshold(
        sensorId,
        req.body
      );
      res.json(threshold);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getActiveAlarms(req: Request, res: Response) {
    try {
      const { tunnelSectionId } = req.query;
      const alarms = await sensorService.getActiveAlarms(
        tunnelSectionId as string
      );
      res.json(alarms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAlarmHistory(req: Request, res: Response) {
    try {
      const { startTime, endTime, level, page, pageSize } = req.query;
      const alarms = await sensorService.getAlarmHistory(
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined,
        level as AlarmLevel,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(alarms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async acknowledgeAlarm(req: any, res: Response) {
    try {
      const { alarmId } = req.params;
      const alarm = await sensorService.acknowledgeAlarm(alarmId, req.user.id);
      res.json(alarm);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async resolveAlarm(req: any, res: Response) {
    try {
      const { alarmId } = req.params;
      const { resolution } = req.body;
      const alarm = await sensorService.resolveAlarm(
        alarmId,
        req.user.id,
        resolution
      );
      res.json(alarm);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async escalateAlarm(req: any, res: Response) {
    try {
      const { alarmId } = req.params;
      const alarm = await sensorService.escalateAlarm(alarmId);
      res.json(alarm);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const sensorController = new SensorController();
