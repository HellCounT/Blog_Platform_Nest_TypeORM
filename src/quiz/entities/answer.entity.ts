import { AnswerStatus } from '../../application-helpers/statuses';
import { Column, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Player } from './player.entity';
import { Question } from '../../superadmin/quiz/entities/question.entity';

export class Answer {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Player, (p) => p.answers)
  @JoinColumn()
  player: Player;
  @Column('uuid')
  playerId: string;
  @ManyToOne(() => Question, (q) => q.playerAnswers)
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
    body: string,
    answerStatus: AnswerStatus,
  ) {
    const answer = new Answer();
    answer.id = answerId;
    answer.playerId = playerId;
    answer.questionId = questionId;
    answer.body = body;
    answer.status = answerStatus;
    return answer;
  }
}
