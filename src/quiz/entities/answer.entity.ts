import { AnswerStatus } from '../../base/application-helpers/statuses';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';
import { Question } from '../../superadmin/quiz/entities/question.entity';
import { Game } from './game.entity';

@Entity()
export class Answer {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => Player, (p) => p.currentAnswers)
  @JoinColumn()
  player: Player;
  @Column('uuid')
  playerUserId: string;

  @ManyToOne(() => Game, (g) => g.allAnswersInGame)
  @JoinColumn()
  game: Game;
  @Column('uuid')
  gameId: string;

  @ManyToOne(() => Question, (q) => q.playerAnswers)
  @JoinColumn()
  question: Question;
  @Column('uuid')
  questionId: string;

  @Column('varchar')
  body: string;

  @Column('varchar')
  status: AnswerStatus;

  @Column('timestamp')
  addedAt: Date;

  static instantiate(
    answerId: string,
    playerId: string,
    questionId: string,
    gameId: string,
    body: string,
    answerStatus: AnswerStatus,
  ) {
    const answer = new Answer();
    answer.id = answerId;
    answer.playerUserId = playerId;
    answer.questionId = questionId;
    answer.gameId = gameId;
    answer.body = body;
    answer.status = answerStatus;
    answer.addedAt = new Date();
    return answer;
  }
}
