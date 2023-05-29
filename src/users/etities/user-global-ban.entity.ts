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
  @Column('varchar', { nullable: true })
  banReason: string;
  @Column('timestamp', { nullable: true })
  banDate: Date;
}
