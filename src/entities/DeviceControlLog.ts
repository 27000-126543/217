import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Device } from "./Device";
import { DeviceStatus } from "./enums";

@Entity("device_control_logs")
export class DeviceControlLog extends BaseEntity {
  @ManyToOne(() => Device, (device) => device.controlLogs)
  device: Device;

  @Column()
  deviceId: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  previousStatus: DeviceStatus;

  @Column({
    type: "varchar",
    length: 50,
  })
  newStatus: DeviceStatus;

  @Column()
  triggerType: "automatic" | "manual";

  @Column({ nullable: true })
  triggerReason: string;

  @Column({ nullable: true })
  operatorId: string;

  @Column()
  operationTime: Date;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  durationMinutes: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  energyConsumed: number;
}
