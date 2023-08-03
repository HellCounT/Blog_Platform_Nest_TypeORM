import {
  Column,
  Entity,
  JoinColumn,
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
  @JoinColumn()
  user: User;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('timestamp')
  addedAt: Date;
  @OneToMany(() => Game, (g) => g.firstPlayer)
  gamesAsFirstPlayer: Game[];
  @OneToMany(() => Game, (g) => g.secondPlayer)
  gamesAsSecondPlayer: Game[];
  @OneToMany(() => Answer, (a) => a.player)
  currentAnswers: Answer[];

  static instantiate(userId: string) {
    const player = new Player();
    player.userId = userId;
    player.addedAt = new Date();
    return player;
  }
}
