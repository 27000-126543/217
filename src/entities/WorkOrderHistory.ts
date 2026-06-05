import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { WorkOrder } from "./WorkOrder";
import { WorkOrderStatus } from "./enums";

@Entity("work_order_history")
export class WorkOrderHistory extends BaseEntity {
  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.history)
  workOrder: WorkOrder;

  @Column()
  workOrderId: string;

  @Column({
    type: "enum",
    enum: WorkOrderStatus,
  })
  previousStatus: WorkOrderStatus;

  @Column({
    type: "enum",
    enum: WorkOrderStatus,
  })
  newStatus: WorkOrderStatus;

  @Column({ nullable: true })
  operatorId: string;

  @Column({ type: "timestamp" })
  operationTime: Date;

  @Column("text", { nullable: true })
  remark: string;
}
