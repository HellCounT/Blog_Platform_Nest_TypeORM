import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../../users/etities/user.entity';

@Entity()
export class ExpiredToken {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => User, (u) => u.expiredTokens)
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @Column('varchar')
  refreshTokenMeta: string;
}
