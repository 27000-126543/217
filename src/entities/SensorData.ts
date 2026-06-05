import { Entity, Column, ManyToOne, Index } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Sensor } from "./Sensor";

@Entity("sensor_data")
@Index(["sensorId", "timestamp"])
export class SensorData extends BaseEntity {
  @ManyToOne(() => Sensor, (sensor) => sensor.sensorData)
  sensor: Sensor;

  @Column()
  sensorId: string;

  @Column("decimal", { precision: 10, scale: 2 })
  value: number;

  @Column()
  timestamp: Date;

  @Column({ default: false })
  isProcessed: boolean;
}
