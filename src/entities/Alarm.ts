import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Sensor } from "./Sensor";
import { AlarmLevel, AlarmStatus } from "./enums";
import { EmergencyPlan } from "./EmergencyPlan";
import { WorkOrder } from "./WorkOrder";
import { Notification } from "./Notification";

@Entity("alarms")
export class Alarm extends BaseEntity {
  @ManyToOne(() => Sensor, (sensor) => sensor.sensorData)
  sensor: Sensor;

  @Column()
  sensorId: string;

  @Column({ nullable: true })
  sensorDataId: string;

  @Column()
  title: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: AlarmLevel,
  })
  level: AlarmLevel;

  @Column({
    type: "enum",
    enum: AlarmStatus,
    default: AlarmStatus.PENDING,
  })
  status: AlarmStatus;

  @Column("decimal", { precision: 10, scale: 2 })
  triggerValue: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  thresholdValue: number;

  @Column({ type: "timestamp", nullable: true })
  acknowledgedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ default: 0 })
  escalationCount: number;

  @Column({ type: "timestamp", nullable: true })
  lastEscalatedAt: Date;

  @ManyToOne(() => EmergencyPlan, (plan) => plan.alarms)
  emergencyPlan: EmergencyPlan;

  @Column({ nullable: true })
  emergencyPlanId: string;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.alarm)
  workOrders: WorkOrder[];

  @OneToMany(() => Notification, (notification) => notification.alarm)
  notifications: Notification[];
}
