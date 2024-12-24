import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { IsEnum, MinLength, IsNumber, Min } from "class-validator";

import { Account } from "./account";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column("varchar", { length: 255 })
  @MinLength(3)
  note!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @Column({
    type: "enum",
    enum: ["INCOME", "EXPENSE"],
  })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: "INCOME" | "EXPENSE";

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn()
  account!: Account;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
