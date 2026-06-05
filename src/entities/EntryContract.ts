import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { EntryApplication } from "./EntryApplication";

@Entity("entry_contracts")
export class EntryContract extends BaseEntity {
  @Column({ unique: true })
  contractNo: string;

  @OneToOne(() => EntryApplication, (app) => app.contract)
  @JoinColumn()
  application: EntryApplication;

  @Column()
  applicationId: string;

  @Column("text", { nullable: true })
  terms: string;

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount: number;

  @Column("decimal", { precision: 10, scale: 2 })
  occupancyFee: number;

  @Column("decimal", { precision: 10, scale: 2 })
  maintenanceFee: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  otherFees: number;

  @Column({ type: "date" })
  contractStartDate: Date;

  @Column({ type: "date" })
  contractEndDate: Date;

  @Column({ type: "date", nullable: true })
  signedDate: Date;

  @Column({ default: false })
  isSigned: boolean;

  @Column({ default: true })
  isActive: boolean;
}
