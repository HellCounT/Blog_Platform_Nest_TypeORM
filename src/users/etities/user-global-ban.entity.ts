import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class UserGlobalBan {
  @PrimaryColumn('uuid')
  userId: string;
  @Column('boolean')
  isBanned: boolean;
  @Column('varchar')
  banReason: string;
}
