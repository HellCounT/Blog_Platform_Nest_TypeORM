import { Column, Entity, JoinColumn, ManyToMany, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';
import { GameStatus } from '../../application-helpers/statuses';

@Entity()
export class Game {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToMany(() => Player, (p) => p.gamesAsFirstPlayer)
  @JoinColumn()
  firstPlayer: Player;
  @Column('uuid', { nullable: true })
  firstPlayerId: string;
  @Column('int')
  firstPlayerScore: number;
  @Column('uuid', { array: true, nullable: true })
  firstPlayerAnswersIds: string[] | null;
  @ManyToMany(() => Player, (p) => p.gamesAsSecondPlayer)
  @JoinColumn()
  secondPlayer: Player;
  @Column('uuid', { nullable: true })
  secondPlayerId: string | null;
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

  static instantiate(gameId: string, firstPlayerId: string) {
    const game = new Game();
    game.id = gameId;
    game.firstPlayerId = firstPlayerId;
    game.firstPlayerScore = 0;
    game.firstPlayerAnswersIds = null;
    game.secondPlayerId = null;
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
