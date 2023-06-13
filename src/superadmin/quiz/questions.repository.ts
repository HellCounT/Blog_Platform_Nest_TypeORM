import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question) protected questionRepo: Repository<Question>,
  ) {}
  async getQuestionById(questionId: string): Promise<Question> {
    return await this.questionRepo.findOneBy({ id: questionId });
  }
  async createQuestion(
    body: string,
    correctAnswers: string[],
  ): Promise<Question> {
    try {
      const questionId = uuidv4();
      const question = Question.instantiate(questionId, body, correctAnswers);
      await this.questionRepo.save(question);
      return await this.getQuestionById(questionId);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async updateQuestion(
    body: string,
    correctAnswers: string[],
    questionId: string,
  ): Promise<boolean> {
    try {
      const result = await this.questionRepo.update(
        { id: questionId },
        {
          body: body,
          correctAnswers: correctAnswers,
        },
      );
      return result.affected === 1;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
