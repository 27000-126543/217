import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import {
  WorkOrderStatus,
  WorkOrderPriority,
  NotificationType,
} from "./enums";
import { User } from "./User";
import { TunnelSection } from "./TunnelSection";
import { Alarm } from "./Alarm";
import { Inspection } from "./Inspection";
import { WorkOrderHistory } from "./WorkOrderHistory";
import { Notification } from "./Notification";

@Entity("work_orders")
export class WorkOrder extends BaseEntity {
  @Column()
  title: string;

  @Column("text", { nullable: true })
  description: string;

  @Column()
  problemType: string;

  @Column()
  problemCategory: string;

  @Column({
    type: "varchar",
    length: 50,
    default: WorkOrderPriority.MEDIUM,
  })
  priority: WorkOrderPriority;

  @Column({
    type: "varchar",
    length: 50,
    default: WorkOrderStatus.CREATED,
  })
  status: WorkOrderStatus;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => TunnelSection, (tunnelSection) => tunnelSection.workOrders)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @ManyToOne(() => User, (user) => user.assignedWorkOrders)
  assignee: User;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, (user) => user.createdWorkOrders)
  creator: User;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToOne(() => Alarm, (alarm) => alarm.workOrders)
  alarm: Alarm;

  @Column({ nullable: true })
  alarmId: string;

  @ManyToOne(() => Inspection, (inspection) => inspection.workOrders)
  inspection: Inspection;

  @Column({ nullable: true })
  inspectionId: string;

  @Column({ nullable: true })
  assignedTeam: string;

  @Column({ nullable: true })
  assignedAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 0 })
  escalationLevel: number;

  @Column({ nullable: true })
  lastEscalatedAt: Date;

  @Column("text", { nullable: true })
  resolution: string;

  @Column("simple-array", { nullable: true })
  resolutionImages: string[];

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ default: 0 })
  recurrenceCount: number;

  @OneToMany(() => WorkOrderHistory, (history) => history.workOrder)
  history: WorkOrderHistory[];

  @OneToMany(() => Notification, (notification) => notification.workOrder)
  notifications: Notification[];
}
