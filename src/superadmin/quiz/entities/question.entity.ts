import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Question {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  body: string;
  @Column('simple-array')
  correctAnswers: string[];
  @Column('boolean')
  published: boolean;
  @Column('timestamp')
  createdAt: Date;
  @Column('timestamp')
  updatedAt: Date;
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
    question.updatedAt = new Date();
    return question;
  }
}