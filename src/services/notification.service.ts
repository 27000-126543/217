import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";
import { NotificationType } from "../entities/enums";
import { wsService } from "./websocket.service";

class NotificationService {
  private notificationRepo = AppDataSource.getRepository(Notification);

  async createNotification(
    userId: string,
    title: string,
    content: string,
    type: NotificationType,
    extraData?: {
      alarmId?: string;
      workOrderId?: string;
      [key: string]: any;
    }
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      title,
      content,
      type,
      alarmId: extraData?.alarmId,
      workOrderId: extraData?.workOrderId,
      extraData,
    });

    const saved = await this.notificationRepo.save(notification);

    wsService.sendToUser(userId, "notification", saved);

    return saved;
  }

  async batchCreateNotifications(
    userIds: string[],
    title: string,
    content: string,
    type: NotificationType,
    extraData?: any
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) =>
      this.notificationRepo.create({
        userId,
        title,
        content,
        type,
        alarmId: extraData?.alarmId,
        workOrderId: extraData?.workOrderId,
        extraData,
      })
    );

    const saved = await this.notificationRepo.save(notifications);

    userIds.forEach((userId) => {
      wsService.sendToUser(userId, "notification", {
        title,
        content,
        type,
        extraData,
      });
    });

    return saved;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    isRead?: boolean
  ) {
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: notifications,
      total,
      page,
      pageSize,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepo.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() }
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }
}

export const notificationService = new NotificationService();
