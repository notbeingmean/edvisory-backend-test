import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Account } from "./account";
import { IsEmail, MinLength } from "class-validator";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column("varchar", { length: 100, unique: true })
  @MinLength(2)
  name!: string;

  @Column("varchar", { length: 100, unique: true })
  @IsEmail()
  email!: string;

  @Column("varchar", { length: 100 })
  @MinLength(6)
  password!: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(() => Account, (account) => account.user)
  accounts?: Account[];
}
