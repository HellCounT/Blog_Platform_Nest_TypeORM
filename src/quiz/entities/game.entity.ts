import { Column, Entity, JoinColumn, ManyToMany, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity()
export class Game {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToMany(() => Player, (p) => p.games)
  @JoinColumn()
  FirstPlayer: Player;
  @Column('uuid', { nullable: true })
  FirstPlayerId: string;
  @Column('int')
  FirstPlayerScore: number;
  @Column('uuid', { array: true })
  FirstPlayerAnswersIds: string[];
  @ManyToMany(() => Player, (p) => p.games)
  @JoinColumn()
  SecondPlayer: Player;
  @Column('uuid', { nullable: true })
  SecondPlayerId: string;
  @Column('int')
  SecondPlayerScore: number;
  @Column('uuid', { array: true })
  SecondPlayerAnswersIds: string[];
  @Column('uuid', { array: true })
  questionIds: string[];
  @Column('timestamp', { nullable: true })
  pairCreatedDate: Date | null;
  @Column('timestamp', { nullable: true })
  startGameDate: Date | null;
  @Column('timestamp', { nullable: true })
  finishGameDate: Date | null;
}
