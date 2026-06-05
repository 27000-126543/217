import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

class NotificationController {
  async getUserNotifications(req: any, res: Response) {
    try {
      const { page, pageSize, isRead } = req.query;
      const notifications = await notificationService.getUserNotifications(
        req.user.id,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20,
        isRead !== undefined ? isRead === "true" : undefined
      );
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async markAsRead(req: any, res: Response) {
    try {
      const { notificationId } = req.params;
      await notificationService.markAsRead(notificationId, req.user.id);
      res.json({ message: "已标记为已读" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async markAllAsRead(req: any, res: Response) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ message: "全部标记为已读" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const notificationController = new NotificationController();
