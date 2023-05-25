import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('varchar')
  ip: string;
  @Column('varchar')
  deviceName: string;
  @Column('timestamptz')
  issuedAt: Date;
  @Column('timestamptz')
  expirationDate: Date;
  @Column('varchar')
  refreshTokenMeta: string;
}
