import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { TunnelSection } from "./TunnelSection";

@Entity("energy_reports")
export class EnergyReport extends BaseEntity {
  @ManyToOne(() => TunnelSection)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @Column({ type: "date" })
  reportDate: Date;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  totalEnergyConsumed: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  ventilationEnergy: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  drainageEnergy: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  lightingEnergy: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  otherEnergy: number;

  @Column("int", { default: 0 })
  deviceActivationCount: number;

  @Column("int", { default: 0 })
  automaticControlCount: number;

  @Column("int", { default: 0 })
  manualControlCount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  estimatedCost: number;
}
