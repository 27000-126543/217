import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { PipelineType } from "./enums";
import { PipelineUnit } from "./PipelineUnit";
import { TunnelSection } from "./TunnelSection";
import { EntryApplication } from "./EntryApplication";

@Entity("pipelines")
export class Pipeline extends BaseEntity {
  @Column({ unique: true })
  pipelineCode: string;

  @Column({
    type: "enum",
    enum: PipelineType,
  })
  type: PipelineType;

  @Column("decimal", { precision: 10, scale: 2 })
  diameter: number;

  @Column("decimal", { precision: 10, scale: 2 })
  length: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  safetySpacing: number;

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  pressureRating: string;

  @ManyToOne(() => PipelineUnit, (unit) => unit.pipelines)
  pipelineUnit: PipelineUnit;

  @Column()
  pipelineUnitId: string;

  @ManyToOne(() => TunnelSection, (section) => section.pipelines)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @Column("text", { nullable: true })
  routeDescription: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  startMileage: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  endMileage: number;

  @ManyToOne(() => EntryApplication, (app) => app.pipelines)
  entryApplication: EntryApplication;

  @Column({ nullable: true })
  entryApplicationId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  installationDate: Date;
}
