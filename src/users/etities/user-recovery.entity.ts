import { Column, PrimaryColumn } from 'typeorm';

export class UserRecovery {
  @PrimaryColumn('uuid')
  userId: string;
  @Column('varchar', { nullable: true })
  recoveryCode: string;
  @Column('timestamptz', { nullable: true })
  recoveryExpirationDate: Date;
}
