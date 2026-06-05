import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { BillStatus } from "./enums";
import { EntryApplication } from "./EntryApplication";
import { PipelineUnit } from "./PipelineUnit";

@Entity("bills")
export class Bill extends BaseEntity {
  @Column({ unique: true })
  billNo: string;

  @ManyToOne(() => EntryApplication, (app) => app.bills)
  application: EntryApplication;

  @Column()
  applicationId: string;

  @ManyToOne(() => PipelineUnit)
  pipelineUnit: PipelineUnit;

  @Column()
  pipelineUnitId: string;

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount: number;

  @Column("decimal", { precision: 10, scale: 2 })
  occupancyFee: number;

  @Column("decimal", { precision: 10, scale: 2 })
  maintenanceFee: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  lateFee: number;

  @Column({
    type: "varchar",
    length: 50,
    default: BillStatus.UNPAID,
  })
  status: BillStatus;

  @Column({ type: "date" })
  dueDate: Date;

  @Column({ type: "date", nullable: true })
  paidDate: Date;

  @Column({ type: "date" })
  billingPeriodStart: Date;

  @Column({ type: "date" })
  billingPeriodEnd: Date;

  @Column("decimal", { precision: 10, scale: 2 })
  pipelineLength: number;

  @Column({ default: 0 })
  reminderCount: number;

  @Column({ nullable: true })
  lastReminderAt: Date;

  @Column("text", { nullable: true })
  remark: string;
}
