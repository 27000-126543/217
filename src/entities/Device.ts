import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { DeviceType, DeviceStatus } from "./enums";
import { TunnelSection } from "./TunnelSection";
import { DeviceControlLog } from "./DeviceControlLog";

@Entity("devices")
export class Device extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: DeviceType,
  })
  type: DeviceType;

  @Column({
    type: "enum",
    enum: DeviceStatus,
    default: DeviceStatus.OFF,
  })
  status: DeviceStatus;

  @Column({ nullable: true })
  installationPosition: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  powerRating: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastMaintenanceAt: Date;

  @ManyToOne(() => TunnelSection, (tunnelSection) => tunnelSection.devices)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @OneToMany(() => DeviceControlLog, (log) => log.device)
  controlLogs: DeviceControlLog[];
}
