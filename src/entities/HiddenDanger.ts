import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { TunnelSection } from "./TunnelSection";
import { WorkOrder } from "./WorkOrder";

@Entity("hidden_dangers")
export class HiddenDanger extends BaseEntity {
  @Column()
  problemType: string;

  @Column()
  problemCategory: string;

  @Column("text", { nullable: true })
  description: string;

  @ManyToOne(() => TunnelSection)
  tunnelSection: TunnelSection;

  @Column()
  tunnelSectionId: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 0 })
  occurrenceCount: number;

  @Column("simple-array", { nullable: true })
  workOrderIds: string[];

  @Column("text", { nullable: true })
  deepInspectionSuggestion: string;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;
}
