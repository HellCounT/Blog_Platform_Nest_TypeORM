import { Column, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { JoinColumn } from 'typeorm/browser';

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
