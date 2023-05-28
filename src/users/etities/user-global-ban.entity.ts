import { Column, Entity, OneToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserGlobalBan {
  @OneToOne(() => User, (u) => u.userGlobalBan, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('boolean')
  isBanned: boolean;
  @Column('varchar')
  banReason: string;
  @Column('timestamp')
  banDate: Date;
}
