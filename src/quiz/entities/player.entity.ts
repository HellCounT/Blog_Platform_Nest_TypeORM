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
  @Column('int')
  sumScore: number;
  @Column('int')
  gamesCount: number;
  @Column('int')
  winsCount: number;
  @Column('int')
  lossesCount: number;
  @Column('int')
  drawsCount: number;
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
    player.sumScore = 0;
    player.gamesCount = 0;
    player.winsCount = 0;
    player.lossesCount = 0;
    player.drawsCount = 0;
    player.addedAt = new Date();
    return player;
  }
}
