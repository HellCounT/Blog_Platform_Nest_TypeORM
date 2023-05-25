import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ExpiredToken {
  @PrimaryColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('varchar')
  refreshTokenMeta: string;
}
