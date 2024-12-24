import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("session")
export class Session {
  @PrimaryColumn("varchar", { length: 255 })
  id!: string;

  @Column("json")
  json!: string;

  @Column("timestamptz") // Use timestamptz for PostgreSQL
  expiredAt!: Date;
}
