import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InputAnswerDto } from './dto/input.answer.dto';
import { OutputAnswerDto } from './dto/output.answer.dto';
import { OutputPairGameDto } from './dto/output.pair-game.dto';
import { CommandBus } from '@nestjs/cqrs';
import { JoinOrCreateGameCommand } from './use-cases/join.or.create.game.use-case';
import { GamesQuery } from './games.query';
import { SendAnswerCommand } from './use-cases/send.answer.use-case';
import { PaginatorType } from '../base/application-helpers/paginator.type';
import {
  GamesQueryParserType,
  parseGameQueryPagination,
  parseTopPlayersQueryPagination,
} from '../base/application-helpers/query-parser-type';
import { OutputStatisticDto } from './dto/output.statistic.dto';
import { OutputTopPlayersDto } from './dto/output.top-players.dto';

@Controller('pair-game-quiz')
export class QuizGameController {
  constructor(
    protected commandBus: CommandBus,
    protected gamesQueryRepo: GamesQuery,
  ) {
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/pairs/my')
  @HttpCode(200)
  async getAllGames(
    @Req() req,
    @Query() query: GamesQueryParserType,
  ): Promise<PaginatorType<OutputPairGameDto>> {
    const queryParams = parseGameQueryPagination(query);
    return await this.gamesQueryRepo.getAllGames(req.user.userId, queryParams);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/pairs/my-current')
  @HttpCode(200)
  async getCurrentGame(@Req() req): Promise<OutputPairGameDto> {
    return await this.gamesQueryRepo.getCurrentGame(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/pairs/my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() answerDto: InputAnswerDto,
    @Req() req,
  ): Promise<OutputAnswerDto> {
    return await this.commandBus.execute(
      new SendAnswerCommand(answerDto, req.user.userId),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/pairs/:id')
  @HttpCode(200)
  async getGameById(
    @Param('id', ParseUUIDPipe) gameId: string,
    @Req() req,
  ): Promise<OutputPairGameDto> {
    return await this.gamesQueryRepo.getGameById(gameId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/pairs/connection')
  @HttpCode(200)
  async joinOrCreate(@Req() req): Promise<OutputPairGameDto> {
    return await this.commandBus.execute(
      new JoinOrCreateGameCommand(req.user.userId),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/users/my-statistic')
  @HttpCode(200)
  async getPlayerStatistic(@Req() req): Promise<OutputStatisticDto> {
    return await this.gamesQueryRepo.getPlayerStatistic(req.user.userId);
  }

  @Get('/users/top')
  @HttpCode(200)
  async getTopPlayers(
    @Query() query,
  ): Promise<PaginatorType<OutputTopPlayersDto>> {
    const queryParams = parseTopPlayersQueryPagination(query);
    return await this.gamesQueryRepo.getTopPlayers(queryParams);
  }
}
