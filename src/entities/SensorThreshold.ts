import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Sensor } from "./Sensor";
import { AlarmLevel } from "./enums";

@Entity("sensor_thresholds")
export class SensorThreshold extends BaseEntity {
  @ManyToOne(() => Sensor, (sensor) => sensor.thresholds)
  sensor: Sensor;

  @Column()
  sensorId: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  warningMin: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  warningMax: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  alarmMin: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  alarmMax: number;

  @Column({
    type: "varchar",
    length: 50,
    default: AlarmLevel.MAJOR,
  })
  alarmLevel: AlarmLevel;

  @Column({ default: true })
  isActive: boolean;
}
