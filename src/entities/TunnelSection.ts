import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Sensor } from "./Sensor";
import { Device } from "./Device";
import { WorkOrder } from "./WorkOrder";
import { Pipeline } from "./Pipeline";

@Entity("tunnel_sections")
export class TunnelSection extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column("decimal", { precision: 10, scale: 2 })
  length: number;

  @Column("decimal", { precision: 10, scale: 2 })
  width: number;

  @Column("decimal", { precision: 10, scale: 2 })
  height: number;

  @Column({ nullable: true })
  startMileage: string;

  @Column({ nullable: true })
  endMileage: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Sensor, (sensor) => sensor.tunnelSection)
  sensors: Sensor[];

  @OneToMany(() => Device, (device) => device.tunnelSection)
  devices: Device[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.tunnelSection)
  workOrders: WorkOrder[];

  @OneToMany(() => Pipeline, (pipeline) => pipeline.tunnelSection)
  pipelines: Pipeline[];
}
