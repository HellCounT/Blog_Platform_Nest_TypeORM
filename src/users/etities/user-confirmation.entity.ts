import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { JoinColumn } from 'typeorm/browser';

@Entity()
export class UserConfirmation {
  @OneToOne(() => User, (u) => u.userConfirmation)
  @JoinColumn()
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('varchar')
  confirmationCode: string;
  @Column('varchar')
  confirmationExpirationDate: string;
  @Column('boolean')
  isConfirmed: boolean;
}
