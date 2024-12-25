import { IsEnum } from "class-validator";
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { Transaction } from "./transaction";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  name!: string;

  @Column({
    type: "enum",
    enum: ["INCOME", "EXPENSE"],
  })
  @IsEnum(["INCOME", "EXPENSE"])
  type!: "INCOME" | "EXPENSE";

  @ManyToOne(() => User, (user) => user.categories)
  user!: User;

  @ManyToMany(() => Transaction, (transaction) => transaction.categories)
  transactions?: Transaction[];
}
