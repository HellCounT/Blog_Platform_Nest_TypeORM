import { Column, OneToOne, PrimaryColumn, JoinColumn, Entity } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserRecovery {
  @OneToOne(() => User, (u) => u.userRecovery, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('varchar', { nullable: true })
  recoveryCode: string;
  @Column('timestamp', { nullable: true })
  recoveryExpirationDate: Date;
}
