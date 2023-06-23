import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AnswerStatus } from '../application-helpers/statuses';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnswersRepository {
  constructor(
    @InjectRepository(Answer) protected answersRepo: Repository<Answer>,
  ) {}
  async findCorrectAnswersForPlayerInGame(
    gameId: string,
    playerId: string,
  ): Promise<Answer[]> {
    try {
      return await this.answersRepo.findBy({
        gameId: gameId,
        playerUserId: playerId,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async saveAnswer(
    givenAnswer: string,
    answerStatus: AnswerStatus,
    gameId: string,
    playerId: string,
    questionId: string,
  ): Promise<Answer> {
    try {
      const answerId = uuidv4();
      const newAnswer = Answer.instantiate(
        answerId,
        playerId,
        questionId,
        gameId,
        givenAnswer,
        answerStatus,
      );
      return await this.answersRepo.save(newAnswer);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
