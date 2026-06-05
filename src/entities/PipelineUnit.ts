import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { EntryApplication } from "./EntryApplication";
import { Pipeline } from "./Pipeline";

@Entity("pipeline_units")
export class PipelineUnit extends BaseEntity {
  @Column({ unique: true })
  unitCode: string;

  @Column()
  unitName: string;

  @Column({ nullable: true })
  legalPerson: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isRestricted: boolean;

  @Column({ type: "timestamp", nullable: true })
  restrictedUntil: Date;

  @OneToMany(() => EntryApplication, (app) => app.pipelineUnit)
  entryApplications: EntryApplication[];

  @OneToMany(() => Pipeline, (pipeline) => pipeline.pipelineUnit)
  pipelines: Pipeline[];
}
