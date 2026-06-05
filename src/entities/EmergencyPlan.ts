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
    type: "enum",
    enum: SensorType,
  })
  eventType: SensorType;

  @Column({
    type: "enum",
    enum: AlarmLevel,
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
