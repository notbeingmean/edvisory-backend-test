import {
  Column,
  Entity,
  JoinTable,
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

  @ManyToOne(() => User, (user) => user.categories)
  user!: User;

  @ManyToMany(() => Transaction, (transaction) => transaction.categories)
  @JoinTable()
  transactions?: Transaction[];
}
