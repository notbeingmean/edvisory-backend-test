import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { IsEnum, IsNumber, Min, IsUrl } from "class-validator";

import { Account } from "./account";
import { Category } from "./category";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({
    type: "enum",
    enum: ["INCOME", "EXPENSE"],
  })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: "INCOME" | "EXPENSE";

  @Column("decimal", { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @Column("varchar", { length: 255, nullable: true })
  @IsUrl()
  imageUrl?: string;

  @Column("varchar", { length: 255, nullable: true })
  note?: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn()
  account!: Account;

  @ManyToMany(() => Category, (cat) => cat.transactions)
  @JoinTable()
  categories?: Category[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
