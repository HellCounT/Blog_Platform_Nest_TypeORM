import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OutputPairGameDto } from './dto/output-pair-game.dto';
import { UsersQuery } from '../users/users.query';
import { Question } from '../superadmin/quiz/entities/question.entity';
import { GameStatus } from '../application-helpers/statuses';
import { isVoid } from '../application-helpers/void.check.helper';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) protected gamesRepo: Repository<Game>,
    @InjectRepository(Question) protected questionsRepo: Repository<Question>,
    protected readonly usersQuery: UsersQuery,
  ) {}

  async getCurrentGame(playerId: string): Promise<OutputPairGameDto> {
    const game = await this.gamesRepo.findOneBy([
      {
        firstPlayerId: playerId,
        status: GameStatus.active || GameStatus.pending,
      },
      {
        secondPlayerId: playerId,
        status: GameStatus.active || GameStatus.pending,
      },
    ]);
    if (isVoid(game)) throw new NotFoundException();
    const questions = await this.getQuestionsForGame(game);
    return await this.mapGameToOutputModel(game, questions);
  }

  async getGameById(
    gameId: string,
    playerId: string,
  ): Promise<OutputPairGameDto> {
    const game = await this.gamesRepo.findOneBy({ id: gameId });
    if (isVoid(game)) throw new NotFoundException();
    if (game.firstPlayerId !== playerId && game.secondPlayerId !== playerId)
      throw new ForbiddenException();
    const questions = await this.getQuestionsForGame(game);
    return await this.mapGameToOutputModel(game, questions);
  }

  private async mapGameToOutputModel(
    game: Game,
    questions: Question[],
  ): Promise<OutputPairGameDto> {
    const user1 = await this.usersQuery.findUserById(game.firstPlayerId);
    const user2 = await this.usersQuery.findUserById(game.secondPlayerId);
    return {
      firstPlayerProgress: {
        answers: [],
        player: {
          id: game.firstPlayerId,
          login: user1.login,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: game.secondPlayerId,
          login: user2.login,
        },
        score: game.secondPlayerScore,
      },
      questions: questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate.toISOString(),
      startGameDate: game.startGameDate.toISOString(),
      finishGameDate: game.finishGameDate.toISOString(),
    };
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
