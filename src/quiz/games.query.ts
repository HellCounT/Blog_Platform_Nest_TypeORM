import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Not, Repository } from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OutputPairGameDto } from './dto/output.pair-game.dto';
import { Question } from '../superadmin/quiz/entities/question.entity';
import { GameStatus } from '../base/application-helpers/statuses';
import { isVoid } from '../base/application-helpers/void.check.helper';
import { Answer } from './entities/answer.entity';
import { OutputAnswerDto } from './dto/output.answer.dto';
import { GameQuestionViewType } from './types/game-question-view.type';
import { PlayerProgressViewType } from './types/player-progress-view.type';
import { PaginatorType } from '../base/application-helpers/paginator.type';
import { emptyPaginatorStub } from '../base/application-helpers/empty.paginator.stub';
import {
  GamesQueryParserType,
  TopPlayersQueryParserType,
} from '../base/application-helpers/query-parser-type';
import { OutputStatisticDto } from './dto/output.statistic.dto';
import { OutputTopPlayersDto } from './dto/output.top-players.dto';
import { Player } from './entities/player.entity';

@Injectable()
export class GamesQuery {
  constructor(
    @InjectRepository(Game) protected gamesRepo: Repository<Game>,
    @InjectRepository(Question) protected questionsRepo: Repository<Question>,
    @InjectRepository(Answer) protected answersRepo: Repository<Answer>,
    @InjectRepository(Player) protected playersRepo: Repository<Player>,
  ) {}

  async getAllGames(
    playerId: string,
    q: GamesQueryParserType,
  ): Promise<PaginatorType<OutputPairGameDto>> {
    let orderObject = { [q.sortBy]: q.sortDirection };
    if (q.sortBy == 'status')
      orderObject = { status: q.sortDirection, pairCreatedDate: 'DESC' };
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [games, allGamesCount] = await this.gamesRepo.findAndCount({
      where: [
        {
          firstPlayerUserId: playerId,
        },
        {
          secondPlayerUserId: playerId,
        },
      ],
      order: { ...orderObject },
      take: q.pageSize,
      skip: offsetSize,
      relations: {
        firstPlayer: {
          user: true,
          currentAnswers: true,
        },
        secondPlayer: {
          user: true,
          currentAnswers: true,
        },
      },
    });
    if (games.length === 0) return emptyPaginatorStub;
    const gameItems = [];
    for await (const g of games) {
      const questions = await this.getQuestionsForGame(g);
      const mappedGame = await this.mapGameToOutputModel(g, questions);
      gameItems.push(mappedGame);
    }
    return {
      pagesCount: Math.ceil(allGamesCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allGamesCount,
      items: gameItems,
    };
  }

  async getCurrentGame(playerId: string): Promise<OutputPairGameDto> {
    const game = await this.gamesRepo.findOne({
      where: [
        {
          firstPlayerUserId: playerId,
          status: Not(GameStatus.finished),
        },
        {
          secondPlayerUserId: playerId,
          status: GameStatus.active,
        },
      ],
      relations: {
        firstPlayer: {
          user: true,
          currentAnswers: true,
        },
        secondPlayer: {
          user: true,
          currentAnswers: true,
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
          currentAnswers: true,
        },
        secondPlayer: {
          user: true,
          currentAnswers: true,
        },
      },
    });
    if (isVoid(game)) throw new NotFoundException();
    if (
      game.firstPlayerUserId !== playerId &&
      game.secondPlayerUserId !== playerId
    )
      throw new ForbiddenException();
    const questions = await this.getQuestionsForGame(game);
    return this.mapGameToOutputModel(game, questions);
  }

  async getPlayerStatistic(playerId: string): Promise<OutputStatisticDto> {
    let sumScore = 0;
    let gamesCount = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let drawsCount = 0;
    let averageScore;
    const games = await this.gamesRepo.find({
      where: [
        { firstPlayerUserId: playerId },
        { secondPlayerUserId: playerId },
      ],
    });
    games.forEach((g) => {
      if (g.firstPlayerUserId === playerId) {
        sumScore += g.firstPlayerScore;
        gamesCount++;
        if (g.firstPlayerScore > g.secondPlayerScore) {
          winsCount++;
        } else if (g.firstPlayerScore < g.secondPlayerScore) {
          lossesCount++;
        } else {
          drawsCount++;
        }
      }
      if (g.secondPlayerUserId === playerId) {
        sumScore += g.secondPlayerScore;
        gamesCount++;
        if (g.secondPlayerScore > g.firstPlayerScore) {
          winsCount++;
        } else if (g.secondPlayerScore < g.firstPlayerScore) {
          lossesCount++;
        } else {
          drawsCount++;
        }
      }
    });
    if (gamesCount === 0) averageScore = 0;
    else averageScore = parseFloat((sumScore / gamesCount).toFixed(2));
    return {
      sumScore: sumScore,
      avgScores: averageScore,
      gamesCount: gamesCount,
      winsCount: winsCount,
      lossesCount: lossesCount,
      drawsCount: drawsCount,
    };
  }

  private async mapGameToOutputModel(
    game: Game,
    questions?: Question[],
  ): Promise<OutputPairGameDto> {
    const firstPlayerAnswers = await this.answersRepo.find({
      where: {
        playerUserId: game.firstPlayerUserId,
        gameId: game.id,
      },
      order: { addedAt: 'ASC' },
    });
    const secondPlayerAnswers = await this.answersRepo.find({
      where: {
        playerUserId: game.secondPlayerUserId,
        gameId: game.id,
      },
      order: { addedAt: 'ASC' },
    });
    let questionsField: GameQuestionViewType[] | null = null;
    if (questions && questions.length !== 0)
      questionsField = this.mapQuestionsToViewType(questions);
    let secondPlayerProgressField: PlayerProgressViewType | null = null;
    if (game.secondPlayer)
      secondPlayerProgressField = {
        answers: this.mapAnswersToOutputModel(secondPlayerAnswers),
        player: {
          id: game.secondPlayerUserId,
          login: game.secondPlayer?.user.login || null,
        },
        score: game.secondPlayerScore,
      };
    const result: OutputPairGameDto = {
      id: game.id,
      firstPlayerProgress: {
        answers: this.mapAnswersToOutputModel(firstPlayerAnswers),
        player: {
          id: game.firstPlayerUserId,
          login: game.firstPlayer.user.login,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: secondPlayerProgressField,
      questions: questionsField,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate?.toISOString() || null,
      startGameDate: game.startGameDate?.toISOString() || null,
      finishGameDate: game.finishGameDate?.toISOString() || null,
    };
    if (!game.secondPlayerUserId) result.secondPlayerProgress = null;
    return result;
  }

  private mapQuestionsToViewType(
    questions: Question[],
  ): GameQuestionViewType[] {
    return questions.map((q) => {
      return {
        id: q.id,
        body: q.body,
      };
    });
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
  //todo: Finish request
  async getTopPlayers(
    q: TopPlayersQueryParserType,
  ): Promise<PaginatorType<OutputTopPlayersDto>> {
    const [result, count] = await this.playersRepo
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.gamesAsFirstPlayer', 'game1')
      .leftJoinAndSelect('player.gamesAsSecondPlayer', 'game2')
      .leftJoinAndSelect('player.user', 'user')
      .loadRelationCountAndMap(
        'player.winsCount',
        'player.gamesAsFirstPlayer',
        'game1',
        (qb) =>
          qb.where(
            'game1.status = :status AND game1.firstPlayerScore > game1.secondPlayerScore',
            { status: GameStatus.finished },
          ),
      )
      .loadRelationCountAndMap(
        'player.lossesCount',
        'player.gamesAsFirstPlayer',
        'game1',
        (qb) =>
          qb.where(
            'game1.status = :status AND game1.firstPlayerScore < game1.secondPlayerScore',
            { status: GameStatus.finished },
          ),
      )
      .loadRelationCountAndMap(
        'player.drawsCount',
        'player.gamesAsFirstPlayer',
        'game1',
        (qb) =>
          qb.where(
            'game1.status = :status AND game1.firstPlayerScore = game1.secondPlayerScore',
            { status: GameStatus.finished },
          ),
      )
      .loadRelationCountAndMap(
        'player.gamesCount',
        'player.gamesAsFirstPlayer',
        'game1',
      )
      .loadRelationCountAndMap(
        'player.gamesCount',
        'player.gamesAsSecondPlayer',
        'game2',
      )
      .addSelect(
        '(COALESCE(SUM(game1.firstPlayerScore), 0) + COALESCE(SUM(game2.secondPlayerScore), 0)) as sumScore',
      )
      .addSelect(
        '(COALESCE(SUM(game1.firstPlayerScore), 0) + COALESCE(SUM(game2.secondPlayerScore), 0)) / (COALESCE(COUNT(game1.id), 0) + COALESCE(COUNT(game2.id), 0)) as avgScore',
      )
      .addSelect('user.login', 'login')
      .orderBy('avgScore', 'DESC')
      .addOrderBy('sumScore', 'DESC')
      .skip((q.pageNumber - 1) * q.pageSize)
      .take(q.pageSize)
      .getManyAndCount();
    console.log(result);
    console.log(count);
    return undefined;
  }
}
