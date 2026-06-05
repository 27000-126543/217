import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { EmergencyPlan } from "./EmergencyPlan";

@Entity("resource_allocations")
export class ResourceAllocation extends BaseEntity {
  @ManyToOne(() => EmergencyPlan, (plan) => plan.resourceAllocations)
  emergencyPlan: EmergencyPlan;

  @Column()
  emergencyPlanId: string;

  @Column()
  resourceType: string;

  @Column()
  resourceName: string;

  @Column({ nullable: true })
  quantity: string;

  @Column({ nullable: true })
  responsibleTeam: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ default: true })
  isActive: boolean;
}
