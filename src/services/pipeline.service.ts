import { AppDataSource } from "../data-source";
import { EntryApplication } from "../entities/EntryApplication";
import { Pipeline } from "../entities/Pipeline";
import { PipelineUnit } from "../entities/PipelineUnit";
import { EntryContract } from "../entities/EntryContract";
import { Bill } from "../entities/Bill";
import { TunnelSection } from "../entities/TunnelSection";
import {
  EntryApplicationStatus,
  PipelineType,
  BillStatus,
  UserRole,
  NotificationType,
} from "../entities/enums";
import { wsService } from "./websocket.service";
import { notificationService } from "./notification.service";
import { v4 as uuidv4 } from "uuid";

class PipelineService {
  private applicationRepo = AppDataSource.getRepository(EntryApplication);
  private pipelineRepo = AppDataSource.getRepository(Pipeline);
  private pipelineUnitRepo = AppDataSource.getRepository(PipelineUnit);
  private contractRepo = AppDataSource.getRepository(EntryContract);
  private billRepo = AppDataSource.getRepository(Bill);
  private tunnelSectionRepo = AppDataSource.getRepository(TunnelSection);

  async createEntryApplication(data: {
    pipelineUnitId: string;
    pipelineType: PipelineType;
    pipelineDiameter: number;
    requiredLength: number;
    startTunnelSectionId: string;
    endTunnelSectionId: string;
    proposedRoute?: string;
    expectedEntryDate?: Date;
  }): Promise<EntryApplication> {
    const pipelineUnit = await this.pipelineUnitRepo.findOne({
      where: { id: data.pipelineUnitId },
    });

    if (!pipelineUnit) {
      throw new Error("管线单位不存在");
    }

    if (pipelineUnit.isRestricted) {
      throw new Error("该单位已被限制入廊，请先处理欠费");
    }

    const application = this.applicationRepo.create({
      applicationNo: `APP-${Date.now()}`,
      ...data,
      status: EntryApplicationStatus.PENDING,
    });

    const saved = await this.applicationRepo.save(application);

    const routeAnalysis = await this.analyzeRoute(saved);
    saved.optimizedRoute = routeAnalysis.optimizedRoute;
    saved.routeAnalysis = routeAnalysis;
    saved.safetySpacing = routeAnalysis.safetySpacing;
    saved.spaceOccupancy = routeAnalysis.spaceOccupancy;

    const finalApplication = await this.applicationRepo.save(saved);

    wsService.broadcast(
      "entry_application_created",
      finalApplication,
      [UserRole.ADMIN]
    );

    return finalApplication;
  }

  private async analyzeRoute(application: EntryApplication) {
    const startSection = await this.tunnelSectionRepo.findOne({
      where: { id: application.startTunnelSectionId },
      relations: ["pipelines"],
    });
    const endSection = await this.tunnelSectionRepo.findOne({
      where: { id: application.endTunnelSectionId },
    });

    if (!startSection || !endSection) {
      throw new Error("管廊段不存在");
    }

    const existingPipelines = startSection.pipelines || [];
    const sameTypePipelines = existingPipelines.filter(
      (p) => p.type === application.pipelineType
    );

    let safetySpacing = this.getSafetySpacing(application.pipelineType);
    let spaceOccupancy = this.calculateSpaceOccupancy(
      application.pipelineDiameter,
      application.requiredLength
    );

    const conflicts = this.checkConflicts(
      sameTypePipelines,
      application.pipelineDiameter,
      safetySpacing
    );

    const optimizedRoute = this.generateOptimizedRoute(
      startSection,
      endSection,
      application.pipelineType,
      conflicts
    );

    return {
      optimizedRoute,
      safetySpacing,
      spaceOccupancy,
      conflicts,
      recommendations: this.generateRecommendations(
        application.pipelineType,
        conflicts
      ),
      costEstimate: this.calculateCost(
        application.requiredLength,
        application.pipelineType,
        spaceOccupancy
      ),
    };
  }

  private getSafetySpacing(pipelineType: PipelineType): number {
    const spacings: Record<PipelineType, number> = {
      [PipelineType.GAS]: 1.5,
      [PipelineType.ELECTRIC]: 0.5,
      [PipelineType.WATER_SUPPLY]: 0.3,
      [PipelineType.DRAINAGE]: 0.3,
      [PipelineType.HEAT]: 0.8,
      [PipelineType.COMMUNICATION]: 0.2,
    };
    return spacings[pipelineType] || 0.5;
  }

  private calculateSpaceOccupancy(diameter: number, length: number): number {
    return Math.PI * Math.pow(diameter / 2000, 2) * length;
  }

  private checkConflicts(
    existingPipelines: Pipeline[],
    newDiameter: number,
    safetySpacing: number
  ): string[] {
    const conflicts: string[] = [];

    for (const pipeline of existingPipelines) {
      const minSpacing = (pipeline.diameter + newDiameter) / 2000 + safetySpacing;
      if (minSpacing > 2) {
        conflicts.push(
          `与现有管道 ${pipeline.pipelineCode} 间距可能不足，建议调整位置`
        );
      }
    }

    return conflicts;
  }

  private generateOptimizedRoute(
    startSection: TunnelSection,
    endSection: TunnelSection,
    pipelineType: PipelineType,
    conflicts: string[]
  ): string {
    const positionMap: Record<PipelineType, string> = {
      [PipelineType.GAS]: "管廊上部右侧",
      [PipelineType.ELECTRIC]: "管廊中部",
      [PipelineType.WATER_SUPPLY]: "管廊下部左侧",
      [PipelineType.DRAINAGE]: "管廊底部",
      [PipelineType.HEAT]: "管廊上部左侧",
      [PipelineType.COMMUNICATION]: "管廊上部",
    };

    const basePosition = positionMap[pipelineType] || "管廊中部";
    const adjustment = conflicts.length > 0 ? "（建议向外侧偏移0.5米）" : "";

    return `从 ${startSection.name} 至 ${endSection.name}，沿 ${basePosition} 敷设${adjustment}`;
  }

  private generateRecommendations(
    pipelineType: PipelineType,
    conflicts: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (pipelineType === PipelineType.GAS) {
      recommendations.push("建议安装气体泄漏检测装置");
      recommendations.push("建议与其他管线保持额外安全距离");
    }
    if (pipelineType === PipelineType.ELECTRIC) {
      recommendations.push("建议做好防火隔离措施");
      recommendations.push("建议设置接地保护");
    }
    if (conflicts.length > 0) {
      recommendations.push("建议现场勘测后确认最终敷设方案");
    }

    return recommendations;
  }

  private calculateCost(
    length: number,
    pipelineType: PipelineType,
    spaceOccupancy: number
  ): { occupancyFee: number; maintenanceFee: number; total: number } {
    const rateMap: Record<PipelineType, { occupancy: number; maintenance: number }> = {
      [PipelineType.GAS]: { occupancy: 150, maintenance: 80 },
      [PipelineType.ELECTRIC]: { occupancy: 120, maintenance: 60 },
      [PipelineType.WATER_SUPPLY]: { occupancy: 80, maintenance: 40 },
      [PipelineType.DRAINAGE]: { occupancy: 60, maintenance: 30 },
      [PipelineType.HEAT]: { occupancy: 100, maintenance: 50 },
      [PipelineType.COMMUNICATION]: { occupancy: 50, maintenance: 25 },
    };

    const rates = rateMap[pipelineType] || { occupancy: 100, maintenance: 50 };
    const occupancyFee = length * rates.occupancy;
    const maintenanceFee = length * rates.maintenance;

    return {
      occupancyFee,
      maintenanceFee,
      total: occupancyFee + maintenanceFee,
    };
  }

  async approveApplication(
    applicationId: string,
    approverId: string
  ): Promise<EntryApplication> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ["pipelineUnit"],
    });

    if (!application) {
      throw new Error("申请不存在");
    }

    application.status = EntryApplicationStatus.APPROVED;
    application.approvedAt = new Date();
    application.approvedBy = approverId;

    const saved = await this.applicationRepo.save(application);

    const contract = await this.generateContract(saved);
    await this.generateBill(saved, contract);

    await notificationService.createNotification(
      application.pipelineUnitId,
      "入廊申请已批准",
      `您的入廊申请 ${application.applicationNo} 已批准，请查看合同并缴费`,
      NotificationType.ENTRY_APPLICATION,
      { applicationId: saved.id }
    );

    wsService.broadcast("entry_application_approved", saved);

    return saved;
  }

  async rejectApplication(
    applicationId: string,
    reason: string,
    approverId: string
  ): Promise<EntryApplication> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ["pipelineUnit"],
    });

    if (!application) {
      throw new Error("申请不存在");
    }

    application.status = EntryApplicationStatus.REJECTED;
    application.rejectionReason = reason;

    const saved = await this.applicationRepo.save(application);

    await notificationService.createNotification(
      application.pipelineUnitId,
      "入廊申请被拒绝",
      `您的入廊申请 ${application.applicationNo} 被拒绝: ${reason}`,
      NotificationType.ENTRY_APPLICATION,
      { applicationId: saved.id }
    );

    return saved;
  }

  private async generateContract(
    application: EntryApplication
  ): Promise<EntryContract> {
    const costEstimate = this.calculateCost(
      application.requiredLength,
      application.pipelineType,
      application.spaceOccupancy || 0
    );

    const contract = this.contractRepo.create({
      contractNo: `CT-${Date.now()}`,
      applicationId: application.id,
      terms: `根据《城市地下综合管廊管理条例》及相关规定，甲乙双方就${this.getPipelineTypeName(application.pipelineType)}入廊事宜达成如下协议...`,
      totalAmount: costEstimate.total,
      occupancyFee: costEstimate.occupancyFee,
      maintenanceFee: costEstimate.maintenanceFee,
      contractStartDate: application.expectedEntryDate || new Date(),
      contractEndDate: new Date(
        (application.expectedEntryDate || new Date()).getTime() +
          365 * 24 * 60 * 60 * 1000
      ),
    });

    return await this.contractRepo.save(contract);
  }

  private async generateBill(
    application: EntryApplication,
    contract: EntryContract
  ): Promise<Bill> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const billingPeriodStart = new Date();
    const billingPeriodEnd = new Date(
      billingPeriodStart.getTime() + 365 * 24 * 60 * 60 * 1000
    );

    const bill = this.billRepo.create({
      billNo: `BILL-${Date.now()}`,
      applicationId: application.id,
      pipelineUnitId: application.pipelineUnitId,
      totalAmount: contract.totalAmount,
      occupancyFee: contract.occupancyFee,
      maintenanceFee: contract.maintenanceFee,
      status: BillStatus.UNPAID,
      dueDate,
      billingPeriodStart,
      billingPeriodEnd,
      pipelineLength: application.requiredLength,
    });

    return await this.billRepo.save(bill);
  }

  private getPipelineTypeName(type: PipelineType): string {
    const names: Record<PipelineType, string> = {
      [PipelineType.GAS]: "燃气管道",
      [PipelineType.ELECTRIC]: "电力管线",
      [PipelineType.WATER_SUPPLY]: "给水管道",
      [PipelineType.DRAINAGE]: "排水管道",
      [PipelineType.HEAT]: "热力管道",
      [PipelineType.COMMUNICATION]: "通信管线",
    };
    return names[type] || "管线";
  }

  async payBill(billId: string): Promise<Bill> {
    const bill = await this.billRepo.findOne({
      where: { id: billId },
      relations: ["pipelineUnit"],
    });

    if (!bill) {
      throw new Error("账单不存在");
    }

    bill.status = BillStatus.PAID;
    bill.paidDate = new Date();

    const saved = await this.billRepo.save(bill);

    if (bill.pipelineUnit.isRestricted) {
      bill.pipelineUnit.isRestricted = false;
      bill.pipelineUnit.restrictedUntil = null;
      await this.pipelineUnitRepo.save(bill.pipelineUnit);
    }

    return saved;
  }

  async checkOverdueBills() {
    const now = new Date();
    const overdueBills = await this.billRepo.find({
      where: {
        status: BillStatus.UNPAID,
        dueDate: { $lt: now },
      },
      relations: ["pipelineUnit"],
    });

    for (const bill of overdueBills) {
      bill.status = BillStatus.OVERDUE;
      bill.reminderCount = (bill.reminderCount || 0) + 1;
      bill.lastReminderAt = now;
      bill.lateFee = bill.totalAmount * 0.001 * bill.reminderCount;

      await this.billRepo.save(bill);

      if (bill.reminderCount >= 3) {
        bill.pipelineUnit.isRestricted = true;
        bill.pipelineUnit.restrictedUntil = null;
        await this.pipelineUnitRepo.save(bill.pipelineUnit);

        await notificationService.createNotification(
          bill.pipelineUnitId,
          "入廊权限已限制",
          `由于账单逾期未缴，您的单位已被限制入廊，请尽快缴费`,
          NotificationType.ENTRY_APPLICATION,
          { billId: bill.id }
        );
      } else {
        await notificationService.createNotification(
          bill.pipelineUnitId,
          "账单逾期提醒",
          `您的账单 ${bill.billNo} 已逾期，请尽快缴费，逾期3次将限制入廊`,
          NotificationType.ENTRY_APPLICATION,
          { billId: bill.id }
        );
      }
    }

    return overdueBills;
  }

  async getApplications(
    filters: {
      status?: EntryApplicationStatus;
      pipelineUnitId?: string;
      pipelineType?: PipelineType;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.pipelineUnitId) where.pipelineUnitId = filters.pipelineUnitId;
    if (filters.pipelineType) where.pipelineType = filters.pipelineType;

    const [applications, total] = await this.applicationRepo.findAndCount({
      where,
      relations: ["pipelineUnit", "startTunnelSection", "endTunnelSection"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: applications, total, page, pageSize };
  }

  async getPipelines(tunnelSectionId?: string, pipelineUnitId?: string) {
    const where: any = { isActive: true };
    if (tunnelSectionId) where.tunnelSectionId = tunnelSectionId;
    if (pipelineUnitId) where.pipelineUnitId = pipelineUnitId;

    return await this.pipelineRepo.find({
      where,
      relations: ["pipelineUnit", "tunnelSection"],
    });
  }

  async getPipelineUnits() {
    return await this.pipelineUnitRepo.find({
      where: { isActive: true },
    });
  }

  async getBills(
    filters: {
      pipelineUnitId?: string;
      status?: BillStatus;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = {};
    if (filters.pipelineUnitId) where.pipelineUnitId = filters.pipelineUnitId;
    if (filters.status) where.status = filters.status;

    const [bills, total] = await this.billRepo.findAndCount({
      where,
      relations: ["pipelineUnit", "application"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items: bills, total, page, pageSize };
  }

  async getContracts(applicationId?: string) {
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;

    return await this.contractRepo.find({
      where,
      relations: ["application"],
    });
  }
}

export const pipelineService = new PipelineService();
