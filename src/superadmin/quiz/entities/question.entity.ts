import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { Answer } from '../../../quiz/entities/answer.entity';

@Entity()
export class Question {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  body: string;
  @Column('varchar', { array: true })
  correctAnswers: string[];
  @Column('boolean')
  published: boolean;
  @Column('timestamp')
  createdAt: Date;
  @Column('timestamp', { nullable: true })
  updatedAt: Date;
  @OneToMany(() => Answer, (a) => a.question)
  @JoinColumn()
  playerAnswers: Answer[];

  static instantiate(
    questionId: string,
    body: string,
    correctAnswers: string[],
  ) {
    const question = new Question();
    question.id = questionId;
    question.body = body;
    question.correctAnswers = correctAnswers;
    question.published = false;
    question.createdAt = new Date();
    question.updatedAt = null;
    return question;
  }
}
