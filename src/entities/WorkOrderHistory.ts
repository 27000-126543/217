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
    type: "varchar",
    length: 50,
  })
  previousStatus: WorkOrderStatus;

  @Column({
    type: "varchar",
    length: 50,
  })
  newStatus: WorkOrderStatus;

  @Column({ nullable: true })
  operatorId: string;

  @Column()
  operationTime: Date;

  @Column("text", { nullable: true })
  remark: string;
}
