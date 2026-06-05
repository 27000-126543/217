import { AppDataSource } from "../data-source";
import { Inspection } from "../entities/Inspection";
import { WorkOrder } from "../entities/WorkOrder";
import { WorkOrderHistory } from "../entities/WorkOrderHistory";
import { HiddenDanger } from "../entities/HiddenDanger";
import { User } from "../entities/User";
import {
  WorkOrderStatus,
  WorkOrderPriority,
  InspectionType,
  UserRole,
  NotificationType,
} from "../entities/enums";
import { wsService } from "./websocket.service";
import { notificationService } from "./notification.service";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

class WorkOrderService {
  private inspectionRepo = AppDataSource.getRepository(Inspection);
  private workOrderRepo = AppDataSource.getRepository(WorkOrder);
  private workOrderHistoryRepo = AppDataSource.getRepository(WorkOrderHistory);
  private hiddenDangerRepo = AppDataSource.getRepository(HiddenDanger);
  private userRepo = AppDataSource.getRepository(User);

  async createInspection(
    data: {
      type: InspectionType;
      inspectorId?: string;
      tunnelSectionId: string;
      route?: string;
      findings?: string;
      anomalyData?: any;
      images?: string[];
    }
  ): Promise<Inspection> {
    const inspection = this.inspectionRepo.create({
      code: `INSP-${Date.now()}`,
      type: data.type,
      inspectorId: data.inspectorId,
      tunnelSectionId: data.tunnelSectionId,
      startTime: new Date(),
      route: data.route,
      findings: data.findings,
      anomalyData: data.anomalyData,
      images: data.images,
      hasAnomaly: !!data.anomalyData,
    });

    const saved = await this.inspectionRepo.save(inspection);

    if (saved.hasAnomaly) {
      await this.generateWorkOrdersFromInspection(saved);
    }

    return saved;
  }

  private async generateWorkOrdersFromInspection(inspection: Inspection) {
    const anomalyData = inspection.anomalyData || {};
    const anomalies = anomalyData.anomalies || [
      {
        type: "通用异常",
        category: "其他",
        description: inspection.findings || "巡检发现异常",
        priority: WorkOrderPriority.MEDIUM,
      },
    ];

    for (const anomaly of anomalies) {
      const workOrder = await this.createWorkOrder({
        title: `巡检异常: ${anomaly.type}`,
        description: anomaly.description || inspection.findings || "",
        problemType: anomaly.type || "巡检异常",
        problemCategory: anomaly.category || "其他",
        priority: anomaly.priority || WorkOrderPriority.MEDIUM,
        tunnelSectionId: inspection.tunnelSectionId,
        inspectionId: inspection.id,
      });

      await this.autoAssignWorkOrder(workOrder);
    }
  }

  async createWorkOrder(data: {
    title: string;
    description?: string;
    problemType: string;
    problemCategory: string;
    priority: WorkOrderPriority;
    tunnelSectionId: string;
    location?: string;
    alarmId?: string;
    inspectionId?: string;
    creatorId?: string;
  }): Promise<WorkOrder> {
    const workOrder = this.workOrderRepo.create({
      title: data.title,
      description: data.description,
      problemType: data.problemType,
      problemCategory: data.problemCategory,
      priority: data.priority,
      status: WorkOrderStatus.CREATED,
      tunnelSectionId: data.tunnelSectionId,
      location: data.location,
      alarmId: data.alarmId,
      inspectionId: data.inspectionId,
      creatorId: data.creatorId,
      dueDate: this.calculateDueDate(data.priority),
    });

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      WorkOrderStatus.CREATED,
      WorkOrderStatus.CREATED,
      data.creatorId,
      "工单创建"
    );

    wsService.broadcast("work_order_created", saved);

    return saved;
  }

  private calculateDueDate(priority: WorkOrderPriority): Date {
    const now = new Date();
    let hours = 24;

    switch (priority) {
      case WorkOrderPriority.URGENT:
        hours = 2;
        break;
      case WorkOrderPriority.HIGH:
        hours = 8;
        break;
      case WorkOrderPriority.MEDIUM:
        hours = 24;
        break;
      case WorkOrderPriority.LOW:
        hours = 72;
        break;
    }

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  async autoAssignWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
    const workers = await this.userRepo.find({
      where: {
        role: UserRole.MAINTENANCE_WORKER,
        isActive: true,
      },
    });

    const filteredWorkers = workers.filter(
      (w) => !w.team || w.team === workOrder.problemCategory
    );

    const targetWorkers =
      filteredWorkers.length > 0 ? filteredWorkers : workers;

    if (targetWorkers.length === 0) {
      workOrder.status = WorkOrderStatus.CREATED;
      return await this.workOrderRepo.save(workOrder);
    }

    const workerWorkOrderCounts = await Promise.all(
      targetWorkers.map(async (worker) => {
        const count = await this.workOrderRepo.count({
          where: {
            assigneeId: worker.id,
            status: {
              $in: [
                WorkOrderStatus.ASSIGNED,
                WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.OVERDUE,
              ],
            },
          },
        });
        return { worker, count };
      })
    );

    workerWorkOrderCounts.sort((a, b) => a.count - b.count);
    const selectedWorker = workerWorkOrderCounts[0].worker;

    workOrder.assigneeId = selectedWorker.id;
    workOrder.assignedTeam = selectedWorker.team;
    workOrder.status = WorkOrderStatus.ASSIGNED;
    workOrder.assignedAt = new Date();

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      WorkOrderStatus.CREATED,
      WorkOrderStatus.ASSIGNED,
      null,
      `系统自动分配给 ${selectedWorker.realName}`
    );

    await notificationService.createNotification(
      selectedWorker.id,
      "新工单分配",
      `您有新的工单需要处理: ${workOrder.title}`,
      NotificationType.WORK_ORDER,
      { workOrderId: saved.id }
    );

    wsService.sendToUser(selectedWorker.id, "work_order_assigned", saved);

    return saved;
  }

  async assignWorkOrder(
    workOrderId: string,
    assigneeId: string,
    operatorId?: string
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const previousStatus = workOrder.status;
    workOrder.assigneeId = assigneeId;
    workOrder.status = WorkOrderStatus.ASSIGNED;
    workOrder.assignedAt = new Date();

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      previousStatus,
      WorkOrderStatus.ASSIGNED,
      operatorId,
      "工单已分配"
    );

    const assignee = await this.userRepo.findOne({ where: { id: assigneeId } });
    if (assignee) {
      await notificationService.createNotification(
        assigneeId,
        "工单分配",
        `您有新的工单需要处理: ${workOrder.title}`,
        NotificationType.WORK_ORDER,
        { workOrderId: saved.id }
      );

      wsService.sendToUser(assigneeId, "work_order_assigned", saved);
    }

    return saved;
  }

  async startWorkOrder(
    workOrderId: string,
    operatorId: string
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const previousStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.IN_PROGRESS;
    workOrder.startedAt = new Date();

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      previousStatus,
      WorkOrderStatus.IN_PROGRESS,
      operatorId,
      "开始处理"
    );

    wsService.broadcast("work_order_updated", saved);

    return saved;
  }

  async completeWorkOrder(
    workOrderId: string,
    resolution: string,
    resolutionImages?: string[],
    operatorId?: string
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({
      where: { id: workOrderId },
      relations: ["creator"],
    });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const previousStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.completedAt = new Date();
    workOrder.resolution = resolution;
    workOrder.resolutionImages = resolutionImages;

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      previousStatus,
      WorkOrderStatus.COMPLETED,
      operatorId,
      `完成处理: ${resolution}`
    );

    const isRecurring = await this.checkRecurringProblem(saved);
    if (isRecurring) {
      await this.markAsRecurring(saved);
    }

    if (saved.creatorId) {
      await notificationService.createNotification(
        saved.creatorId,
        "工单完成",
        `工单已完成: ${workOrder.title}`,
        NotificationType.WORK_ORDER,
        { workOrderId: saved.id }
      );
    }

    wsService.broadcast("work_order_updated", saved);

    return saved;
  }

  private async checkRecurringProblem(workOrder: WorkOrder): Promise<boolean> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const similarOrders = await this.workOrderRepo.find({
      where: {
        problemType: workOrder.problemType,
        problemCategory: workOrder.problemCategory,
        tunnelSectionId: workOrder.tunnelSectionId,
        status: WorkOrderStatus.COMPLETED,
      },
    });

    const recentOrders = similarOrders.filter(
      (o) =>
        o.completedAt &&
        o.completedAt >= threeMonthsAgo &&
        o.id !== workOrder.id
    );

    return recentOrders.length >= 2;
  }

  private async markAsRecurring(workOrder: WorkOrder) {
    workOrder.isRecurring = true;
    workOrder.recurrenceCount = workOrder.recurrenceCount + 1;
    await this.workOrderRepo.save(workOrder);

    let hiddenDanger = await this.hiddenDangerRepo.findOne({
      where: {
        problemType: workOrder.problemType,
        problemCategory: workOrder.problemCategory,
        tunnelSectionId: workOrder.tunnelSectionId,
        isResolved: false,
      },
    });

    if (!hiddenDanger) {
      hiddenDanger = this.hiddenDangerRepo.create({
        problemType: workOrder.problemType,
        problemCategory: workOrder.problemCategory,
        description: workOrder.description,
        tunnelSectionId: workOrder.tunnelSectionId,
        location: workOrder.location,
        occurrenceCount: 0,
        workOrderIds: [],
        deepInspectionSuggestion: this.generateDeepInspectionSuggestion(
          workOrder.problemType
        ),
      });
    }

    hiddenDanger.occurrenceCount = hiddenDanger.occurrenceCount + 1;
    if (!hiddenDanger.workOrderIds.includes(workOrder.id)) {
      hiddenDanger.workOrderIds.push(workOrder.id);
    }

    const savedDanger = await this.hiddenDangerRepo.save(hiddenDanger);

    const managers = await this.userRepo.find({
      where: [
        { role: UserRole.ADMIN },
        { role: UserRole.MAINTENANCE_SUPERVISOR },
      ],
    });

    await notificationService.batchCreateNotifications(
      managers.map((u) => u.id),
      "顽固隐患告警",
      `发现顽固隐患: ${workOrder.problemType}，已出现 ${savedDanger.occurrenceCount} 次`,
      NotificationType.WORK_ORDER,
      { hiddenDangerId: savedDanger.id }
    );

    wsService.broadcast("hidden_danger_detected", savedDanger, [
      UserRole.ADMIN,
      UserRole.MAINTENANCE_SUPERVISOR,
    ]);
  }

  private generateDeepInspectionSuggestion(problemType: string): string {
    const suggestions: Record<string, string> = {
      漏水: "建议进行全面的防水检测，检查管廊结构完整性，排查漏水源头",
      管道腐蚀: "建议检测管道材质和环境酸碱度，评估更换或防腐处理方案",
      设备故障: "建议检查设备运行环境，优化维护计划，考虑设备升级更换",
      传感器异常: "建议校准传感器，检查通信线路，评估传感器使用寿命",
    };

    return (
      suggestions[problemType] ||
      "建议进行深度检查，分析问题根本原因，制定长期解决方案"
    );
  }

  async closeWorkOrder(
    workOrderId: string,
    operatorId: string,
    remark?: string
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const previousStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.CLOSED;
    workOrder.closedAt = new Date();

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      previousStatus,
      WorkOrderStatus.CLOSED,
      operatorId,
      remark || "工单关闭"
    );

    wsService.broadcast("work_order_updated", saved);

    return saved;
  }

  async escalateWorkOrder(
    workOrderId: string,
    operatorId?: string
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const newLevel = workOrder.escalationLevel + 1;
    if (newLevel >= config.workOrder.escalationLevels.length) {
      throw new Error("已达到最高升级级别");
    }

    workOrder.escalationLevel = newLevel;
    workOrder.lastEscalatedAt = new Date();
    workOrder.status = WorkOrderStatus.ESCALATED;

    const saved = await this.workOrderRepo.save(workOrder);

    await this.addWorkOrderHistory(
      saved.id,
      workOrder.status,
      WorkOrderStatus.ESCALATED,
      operatorId,
      `工单升级至 ${config.workOrder.escalationLevels[newLevel]}`
    );

    const roleMap: Record<number, UserRole[]> = {
      0: [UserRole.MAINTENANCE_SUPERVISOR],
      1: [UserRole.MAINTENANCE_SUPERVISOR, UserRole.ADMIN],
      2: [UserRole.ADMIN],
    };

    const notifyRoles = roleMap[newLevel] || [UserRole.ADMIN];
    const users = await this.userRepo.find({
      where: notifyRoles.map((role) => ({ role })),
    });

    await notificationService.batchCreateNotifications(
      users.map((u) => u.id),
      "工单升级",
      `工单已升级至 ${config.workOrder.escalationLevels[newLevel]}: ${workOrder.title}`,
      NotificationType.WORK_ORDER,
      { workOrderId: saved.id }
    );

    wsService.broadcast("work_order_escalated", saved);

    return saved;
  }

  async checkOverdueWorkOrders() {
    const now = new Date();
    const overdueOrders = await this.workOrderRepo.find({
      where: {
        status: {
          $in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS],
        },
        dueDate: { $lt: now },
      },
    });

    for (const order of overdueOrders) {
      order.status = WorkOrderStatus.OVERDUE;
      await this.workOrderRepo.save(order);

      await this.escalateWorkOrder(order.id);

      if (order.assigneeId) {
        await notificationService.createNotification(
          order.assigneeId,
          "工单逾期",
          `工单已逾期，请尽快处理: ${order.title}`,
          NotificationType.WORK_ORDER,
          { workOrderId: order.id }
        );
      }
    }

    return overdueOrders;
  }

  private async addWorkOrderHistory(
    workOrderId: string,
    previousStatus: WorkOrderStatus,
    newStatus: WorkOrderStatus,
    operatorId?: string,
    remark?: string
  ) {
    const history = this.workOrderHistoryRepo.create({
      workOrderId,
      previousStatus,
      newStatus,
      operatorId,
      operationTime: new Date(),
      remark,
    });

    return await this.workOrderHistoryRepo.save(history);
  }

  async getWorkOrders(
    filters: {
      status?: WorkOrderStatus;
      priority?: WorkOrderPriority;
      assigneeId?: string;
      tunnelSectionId?: string;
      isRecurring?: boolean;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.tunnelSectionId) where.tunnelSectionId = filters.tunnelSectionId;
    if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;

    const [orders, total] = await this.workOrderRepo.findAndCount({
      where,
      relations: ["assignee", "creator", "tunnelSection"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: orders, total, page, pageSize };
  }

  async getWorkOrderHistory(workOrderId: string) {
    return await this.workOrderHistoryRepo.find({
      where: { workOrderId },
      order: { operationTime: "ASC" },
    });
  }

  async getHiddenDangers(
    filters: { tunnelSectionId?: string; isResolved?: boolean } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = {};
    if (filters.tunnelSectionId) where.tunnelSectionId = filters.tunnelSectionId;
    if (filters.isResolved !== undefined) where.isResolved = filters.isResolved;

    const [dangers, total] = await this.hiddenDangerRepo.findAndCount({
      where,
      order: { occurrenceCount: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: dangers, total, page, pageSize };
  }

  async resolveHiddenDanger(
    dangerId: string,
    userId: string,
    resolution?: string
  ) {
    const danger = await this.hiddenDangerRepo.findOne({
      where: { id: dangerId },
    });
    if (!danger) {
      throw new Error("Hidden danger not found");
    }

    danger.isResolved = true;
    danger.resolvedAt = new Date();
    danger.resolvedBy = userId;

    return await this.hiddenDangerRepo.save(danger);
  }
}

export const workOrderService = new WorkOrderService();
