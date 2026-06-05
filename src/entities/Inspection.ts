import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { InspectionType } from "./enums";
import { User } from "./User";
import { TunnelSection } from "./TunnelSection";
import { WorkOrder } from "./WorkOrder";

@Entity("inspections")
export class Inspection extends BaseEntity {
  @Column()
  code: string;

  @Column({
    type: "varchar",
    length: 50,
    default: InspectionType.MANUAL,
  })
  type: InspectionType;

  @ManyToOne(() => User, (user) => user.inspections)
  inspector: User;

  @Column({ nullable: true })
  inspectorId: string;

  @ManyToOne(() => TunnelSection)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column("text", { nullable: true })
  route: string;

  @Column("text", { nullable: true })
  findings: string;

  @Column("simple-json", { nullable: true })
  anomalyData: Record<string, any>;

  @Column({ default: false })
  hasAnomaly: boolean;

  @Column("simple-array", { nullable: true })
  images: string[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.inspection)
  workOrders: WorkOrder[];
}
