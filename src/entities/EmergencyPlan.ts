import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { AlarmLevel, SensorType } from "./enums";
import { Alarm } from "./Alarm";
import { ResourceAllocation } from "./ResourceAllocation";

@Entity("emergency_plans")
export class EmergencyPlan extends BaseEntity {
  @Column()
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  eventType: SensorType;

  @Column({
    type: "varchar",
    length: 50,
  })
  severityLevel: AlarmLevel;

  @Column("text", { nullable: true })
  disposalProcedure: string;

  @Column("text", { nullable: true })
  safetyPrecautions: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Alarm, (alarm) => alarm.emergencyPlan)
  alarms: Alarm[];

  @OneToMany(() => ResourceAllocation, (resource) => resource.emergencyPlan)
  resourceAllocations: ResourceAllocation[];
}
