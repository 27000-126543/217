import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { UserRole } from "./enums";
import { WorkOrder } from "./WorkOrder";
import { Notification } from "./Notification";
import { Inspection } from "./Inspection";

@Entity("users")
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  realName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: "varchar",
    length: 50,
    default: UserRole.MAINTENANCE_WORKER,
  })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  team: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.assignee)
  assignedWorkOrders: WorkOrder[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.creator)
  createdWorkOrders: WorkOrder[];

  @OneToMany(() => Inspection, (inspection) => inspection.inspector)
  inspections: Inspection[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
