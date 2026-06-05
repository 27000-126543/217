import { Request, Response } from "express";
import { deviceService } from "../services/device.service";
import { DeviceStatus } from "../entities/enums";

class DeviceController {
  async getDevices(req: Request, res: Response) {
    try {
      const { tunnelSectionId } = req.query;
      if (tunnelSectionId) {
        const devices = await deviceService.getDevicesByTunnelSection(
          tunnelSectionId as string
        );
        res.json(devices);
      } else {
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async controlDevice(req: any, res: Response) {
    try {
      const { deviceId } = req.params;
      const { status, reason } = req.body;
      const log = await deviceService.controlDevice(
        deviceId,
        status as DeviceStatus,
        "manual",
        reason,
        req.user?.id
      );
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getControlLogs(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { startTime, endTime, page, pageSize } = req.query;
      const logs = await deviceService.getDeviceControlLogs(
        deviceId,
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getEnergyReports(req: Request, res: Response) {
    try {
      const { tunnelSectionId, startDate, endDate, page, pageSize } = req.query;
      const reports = await deviceService.getEnergyReports(
        tunnelSectionId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 30
      );
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const deviceController = new DeviceController();
