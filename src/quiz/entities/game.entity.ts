import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Player } from './player.entity';
import {
  GameStatus,
  PlayerOrder,
} from '../../base/application-helpers/statuses';
import { Answer } from './answer.entity';
import { AnswersCountersType } from '../types/answers-counters.type';

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

  @Column('int', { nullable: true })
  secondPlayerScore: number | null;

  @Column('uuid', { array: true, nullable: true })
  secondPlayerAnswersIds: string[] | null;

  @Column('uuid', { array: true, nullable: true })
  questionIds: string[] | null;

  @Column('varchar', { nullable: true })
  playerFinishedFirst: PlayerOrder | null;

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

  getPlayerOrder(playerId: string): PlayerOrder {
    let playerOrder;
    if (playerId === this.firstPlayerUserId) playerOrder = PlayerOrder.first;
    if (playerId === this.secondPlayerUserId) playerOrder = PlayerOrder.second;
    return playerOrder;
  }

  getCurrentQuestionNumber(playerOder: PlayerOrder): number {
    let currentQuestionIndex: number;
    if (playerOder === PlayerOrder.first)
      currentQuestionIndex = this.firstPlayerAnswersIds.length + 1;
    else currentQuestionIndex = this.secondPlayerAnswersIds.length + 1;
    return currentQuestionIndex;
  }

  getCurrentAnswersCounters(playerOrder: PlayerOrder): AnswersCountersType {
    const currentAnswersCounters: AnswersCountersType = {
      playerAnswersCount: 0,
      opponentAnswersCount: 0,
    };
    if (playerOrder === PlayerOrder.first) {
      currentAnswersCounters.playerAnswersCount =
        this.firstPlayerAnswersIds.length + 1;
      currentAnswersCounters.opponentAnswersCount =
        this.secondPlayerAnswersIds.length;
    } else {
      currentAnswersCounters.playerAnswersCount =
        this.secondPlayerAnswersIds.length + 1;
      currentAnswersCounters.opponentAnswersCount =
        this.firstPlayerAnswersIds.length;
    }
    return currentAnswersCounters;
  }

  incrementPlayerGameScore(playerOrder: PlayerOrder): number {
    if (playerOrder === PlayerOrder.first) {
      this.firstPlayerScore += 1;
      return this.firstPlayerScore;
    } else {
      this.secondPlayerScore += 1;
      return this.secondPlayerScore;
    }
  }

  addAnswerIdToGame(playerOrder: PlayerOrder, answerId: string): void {
    if (playerOrder === PlayerOrder.first) {
      this.firstPlayerAnswersIds.push(answerId);
      return;
    } else {
      this.secondPlayerAnswersIds.push(answerId);
      return;
    }
  }

  setFirstFinishedPlayer(playerOrder: PlayerOrder): void {
    this.playerFinishedFirst = playerOrder;
    return;
  }

  finishGame(): void {
    this.status = GameStatus.finished;
    this.finishGameDate = new Date();
    return;
  }

  static instantiate(gameId: string, firstPlayerId: string) {
    const game = new Game();
    game.id = gameId;
    game.firstPlayerUserId = firstPlayerId;
    game.firstPlayerScore = 0;
    game.firstPlayerAnswersIds = [];
    game.secondPlayerUserId = null;
    game.secondPlayerScore = null;
    game.secondPlayerAnswersIds = [];
    game.questionIds = [];
    game.status = GameStatus.pending;
    game.pairCreatedDate = new Date();
    game.startGameDate = null;
    game.finishGameDate = null;
    game.playerFinishedFirst = null;
    return game;
  }
}
