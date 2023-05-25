import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  login: string;
  @Column('varchar')
  email: string;
  @Column('varchar')
  createdAt: string;
  @Column('varchar')
  hash: string;
}
