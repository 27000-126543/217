import { Entity, Column, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { EntryApplicationStatus, PipelineType } from "./enums";
import { PipelineUnit } from "./PipelineUnit";
import { TunnelSection } from "./TunnelSection";
import { Pipeline } from "./Pipeline";
import { EntryContract } from "./EntryContract";
import { Bill } from "./Bill";

@Entity("entry_applications")
export class EntryApplication extends BaseEntity {
  @Column()
  applicationNo: string;

  @ManyToOne(() => PipelineUnit, (unit) => unit.entryApplications)
  pipelineUnit: PipelineUnit;

  @Column()
  pipelineUnitId: string;

  @Column({
    type: "enum",
    enum: PipelineType,
  })
  pipelineType: PipelineType;

  @Column("decimal", { precision: 10, scale: 2 })
  pipelineDiameter: number;

  @Column("decimal", { precision: 10, scale: 2 })
  requiredLength: number;

  @ManyToOne(() => TunnelSection)
  startTunnelSection: TunnelSection;

  @Column()
  startTunnelSectionId: string;

  @ManyToOne(() => TunnelSection)
  endTunnelSection: TunnelSection;

  @Column()
  endTunnelSectionId: string;

  @Column("text", { nullable: true })
  proposedRoute: string;

  @Column("text", { nullable: true })
  optimizedRoute: string;

  @Column("simple-json", { nullable: true })
  routeAnalysis: Record<string, any>;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  safetySpacing: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  spaceOccupancy: number;

  @Column({
    type: "enum",
    enum: EntryApplicationStatus,
    default: EntryApplicationStatus.PENDING,
  })
  status: EntryApplicationStatus;

  @Column("text", { nullable: true })
  rejectionReason: string;

  @Column({ type: "timestamp", nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: "timestamp", nullable: true })
  expectedEntryDate: Date;

  @Column({ type: "timestamp", nullable: true })
  actualEntryDate: Date;

  @OneToMany(() => Pipeline, (pipeline) => pipeline.entryApplication)
  pipelines: Pipeline[];

  @OneToOne(() => EntryContract, (contract) => contract.application)
  contract: EntryContract;

  @OneToMany(() => Bill, (bill) => bill.application)
  bills: Bill[];
}
