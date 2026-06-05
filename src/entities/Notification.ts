import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { NotificationType } from "./enums";
import { User } from "./User";
import { Alarm } from "./Alarm";
import { WorkOrder } from "./WorkOrder";

@Entity("notifications")
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column("text", { nullable: true })
  content: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @ManyToOne(() => Alarm, (alarm) => alarm.notifications)
  alarm: Alarm;

  @Column({ nullable: true })
  alarmId: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.notifications)
  workOrder: WorkOrder;

  @Column({ nullable: true })
  workOrderId: string;

  @Column("simple-json", { nullable: true })
  extraData: Record<string, any>;
}
