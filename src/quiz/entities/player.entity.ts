import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Game } from './game.entity';
import { Answer } from './answer.entity';

@Entity()
export class Player {
  @OneToOne(() => User, (u) => u.player, { onDelete: 'CASCADE' })
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('int')
  totalScore: number;
  @Column('timestamp')
  addedAt: Date;
  @ManyToMany(() => Game)
  games: Game[];
  @OneToMany(() => Answer, (a) => a.player)
  answers: Answer[];

  static instantiate(userId: string) {
    const player = new Player();
    player.userId = userId;
    player.totalScore = 0;
    player.addedAt = new Date();
  }
}
