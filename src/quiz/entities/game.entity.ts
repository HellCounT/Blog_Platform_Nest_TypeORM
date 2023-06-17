import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Player } from './player.entity';
import { GameStatus } from '../../application-helpers/statuses';
import { Answer } from './answer.entity';

@Entity()
export class Game {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => Player, (p) => p.gamesAsFirstPlayer)
  @JoinColumn()
  firstPlayer: Player;
  @Column('uuid', { nullable: true })
  firstPlayerUserId: string;

  @Column('int')
  firstPlayerScore: number;

  @Column('uuid', { array: true, nullable: true })
  firstPlayerAnswersIds: string[] | null;

  @ManyToOne(() => Player, (p) => p.gamesAsSecondPlayer)
  @JoinColumn()
  secondPlayer: Player;
  @Column('uuid', { nullable: true })
  secondPlayerUserId: string | null;

  @Column('int')
  secondPlayerScore: number | null;

  @Column('uuid', { array: true, nullable: true })
  secondPlayerAnswersIds: string[] | null;

  @Column('uuid', { array: true, nullable: true })
  questionIds: string[] | null;

  @Column('varchar', { default: GameStatus.pending })
  status: GameStatus;

  @Column('timestamp', { nullable: true })
  pairCreatedDate: Date | null;

  @Column('timestamp', { nullable: true })
  startGameDate: Date | null;

  @Column('timestamp', { nullable: true })
  finishGameDate: Date | null;

  @OneToMany(() => Answer, (a) => a.game)
  allAnswersInGame: Answer[];

  static instantiate(gameId: string, firstPlayerId: string) {
    const game = new Game();
    game.id = gameId;
    game.firstPlayerUserId = firstPlayerId;
    game.firstPlayerScore = 0;
    game.firstPlayerAnswersIds = null;
    game.secondPlayerUserId = null;
    game.secondPlayerScore = null;
    game.secondPlayerAnswersIds = null;
    game.questionIds = null;
    game.status = GameStatus.pending;
    game.pairCreatedDate = null;
    game.startGameDate = null;
    game.finishGameDate = null;
    return game;
  }
}
