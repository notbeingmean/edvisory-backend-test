import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from "typeorm";
import { User } from "./user";
import { Transaction } from "./transaction";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column("varchar", { length: 100 })
  accountName!: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance!: number;

  @ManyToOne(() => User, (user) => user.accounts)
  user!: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
