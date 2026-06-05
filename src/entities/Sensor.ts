import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { SensorType, SensorStatus } from "./enums";
import { TunnelSection } from "./TunnelSection";
import { SensorData } from "./SensorData";
import { SensorThreshold } from "./SensorThreshold";

@Entity("sensors")
export class Sensor extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: SensorType,
  })
  type: SensorType;

  @Column({
    type: "enum",
    enum: SensorStatus,
    default: SensorStatus.NORMAL,
  })
  status: SensorStatus;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  longitude: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  latitude: number;

  @Column({ nullable: true })
  installationPosition: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastHeartbeat: Date;

  @ManyToOne(() => TunnelSection, (tunnelSection) => tunnelSection.sensors)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @OneToMany(() => SensorData, (sensorData) => sensorData.sensor)
  sensorData: SensorData[];

  @OneToMany(() => SensorThreshold, (threshold) => threshold.sensor)
  thresholds: SensorThreshold[];
}
