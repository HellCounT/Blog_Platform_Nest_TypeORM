import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OutputPairGameDto } from './dto/output.pair-game.dto';
import { Question } from '../superadmin/quiz/entities/question.entity';
import { GameStatus } from '../application-helpers/statuses';
import { isVoid } from '../application-helpers/void.check.helper';
import { Answer } from './entities/answer.entity';
import { OutputAnswerDto } from './dto/output.answer.dto';

@Injectable()
export class GamesQuery {
  constructor(
    @InjectRepository(Game) protected gamesRepo: Repository<Game>,
    @InjectRepository(Question) protected questionsRepo: Repository<Question>,
    @InjectRepository(Answer) protected answersRepo: Repository<Answer>,
  ) {}

  async getCurrentGame(playerId: string): Promise<OutputPairGameDto> {
    const game = await this.gamesRepo.findOne({
      where: [
        {
          firstPlayerUserId: playerId,
          status: GameStatus.active || GameStatus.pending,
        },
        {
          secondPlayerUserId: playerId,
          status: GameStatus.active || GameStatus.pending,
        },
      ],
      relations: {
        firstPlayer: {
          user: true,
        },
        secondPlayer: {
          user: true,
        },
      },
    });
    if (isVoid(game)) throw new NotFoundException();
    const questions = await this.getQuestionsForGame(game);
    return await this.mapGameToOutputModel(game, questions);
  }

  async getGameById(
    gameId: string,
    playerId: string,
  ): Promise<OutputPairGameDto> {
    const game = await this.gamesRepo.findOne({
      where: { id: gameId },
      relations: {
        firstPlayer: {
          user: true,
        },
        secondPlayer: {
          user: true,
        },
      },
    });
    if (isVoid(game)) throw new NotFoundException();
    if (
      game.firstPlayerUserId !== playerId &&
      game.secondPlayerUserId !== playerId
    )
      throw new ForbiddenException();
    console.log('firstPlayerUserId: ', game.firstPlayerUserId);
    console.log('secondPlayerUserId: ', game.secondPlayerUserId);
    console.log('inputPlayerId: ', playerId);
    console.log(
      game.firstPlayerUserId !== playerId &&
        game.secondPlayerUserId !== playerId,
    );
    const questions = await this.getQuestionsForGame(game);
    return await this.mapGameToOutputModel(game, questions);
  }

  private async mapGameToOutputModel(
    game: Game,
    questions: Question[],
  ): Promise<OutputPairGameDto> {
    const firstPlayerAnswers = await this.answersRepo.findBy({
      playerUserId: game.firstPlayerUserId,
      gameId: game.id,
    });
    const secondPlayerAnswers = await this.answersRepo.findBy({
      playerUserId: game.secondPlayerUserId,
      gameId: game.id,
    });
    return {
      id: game.id,
      firstPlayerProgress: {
        answers: this.mapAnswersToOutputModel(firstPlayerAnswers),
        player: {
          id: game.firstPlayerUserId,
          login: game.firstPlayer.user.login,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: this.mapAnswersToOutputModel(secondPlayerAnswers),
        player: {
          id: game.secondPlayerUserId,
          login: game.secondPlayer?.user.login || null,
        },
        score: game.secondPlayerScore,
      },
      questions: questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate?.toISOString() || null,
      startGameDate: game.startGameDate?.toISOString() || null,
      finishGameDate: game.finishGameDate?.toISOString() || null,
    };
  }

  private mapAnswersToOutputModel(answers: Answer[]): OutputAnswerDto[] {
    return answers.map((a) => {
      return {
        questionId: a.questionId,
        answerStatus: a.status,
        addedAt: a.addedAt.toISOString(),
      };
    });
  }

  private async getQuestionsForGame(game: Game): Promise<Question[]> {
    const items = [];
    for await (const qId of game.questionIds) {
      const question = await this.questionsRepo.findOneBy({ id: qId });
      items.push(question);
    }
    return items;
  }
}
