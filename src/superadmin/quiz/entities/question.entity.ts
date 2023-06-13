import { Column, Entity, PrimaryColumn } from 'typeorm';

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
