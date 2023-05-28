import { Column, OneToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export class UserRecovery {
  @OneToOne(() => User, (u) => u.userRecovery)
  @JoinColumn()
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('varchar', { nullable: true })
  recoveryCode: string;
  @Column('timestamptz', { nullable: true })
  recoveryExpirationDate: Date;
}
