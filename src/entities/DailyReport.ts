import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { TunnelSection } from "./TunnelSection";

@Entity("daily_reports")
export class DailyReport extends BaseEntity {
  @Column({ type: "date" })
  reportDate: Date;

  @ManyToOne(() => TunnelSection, { nullable: true })
  tunnelSection: TunnelSection;

  @Column({ nullable: true })
  tunnelSectionId: string;

  @Column({ default: false })
  isSystemWide: boolean;

  @Column("int", { default: 0 })
  totalAlarms: number;

  @Column("int", { default: 0 })
  resolvedAlarms: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  averageAlarmResponseTime: number;

  @Column("int", { default: 0 })
  criticalAlarms: number;

  @Column("int", { default: 0 })
  majorAlarms: number;

  @Column("int", { default: 0 })
  minorAlarms: number;

  @Column("int", { default: 0 })
  totalWorkOrders: number;

  @Column("int", { default: 0 })
  completedWorkOrders: number;

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  workOrderCompletionRate: number;

  @Column("int", { default: 0 })
  overdueWorkOrders: number;

  @Column("int", { default: 0 })
  totalInspections: number;

  @Column("int", { default: 0 })
  completedInspections: number;

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  inspectionCompletionRate: number;

  @Column("int", { default: 0 })
  anomalyInspections: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  totalEnergyConsumed: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  estimatedEnergyCost: number;

  @Column("int", { default: 0 })
  deviceActivationCount: number;

  @Column("int", { default: 0 })
  automaticControlCount: number;

  @Column("int", { default: 0 })
  newHiddenDangers: number;

  @Column("int", { default: 0 })
  resolvedHiddenDangers: number;

  @Column("int", { default: 0 })
  newEntryApplications: number;

  @Column("int", { default: 0 })
  approvedEntryApplications: number;

  @Column("simple-json", { nullable: true })
  details: Record<string, any>;
}
