import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InputAnswerDto } from './dto/input.answer.dto';
import { OutputAnswerDto } from './dto/output.answer.dto';
import { OutputPairGameDto } from './dto/output-pair-game.dto';
import { CommandBus } from '@nestjs/cqrs';
import { JoinOrCreateGameCommand } from './use-cases/join.or.create.game.use-case';
import { GamesQueryRepository } from './games.query';

@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class QuizGameController {
  constructor(
    protected commandBus: CommandBus,
    protected gamesQueryRepo: GamesQueryRepository,
  ) {
    return null;
  }
  @Get('my-current')
  @HttpCode(200)
  async getCurrentGame(@Req() req): Promise<OutputPairGameDto> {
    return await this.gamesQueryRepo.getCurrentGame(req.user.userId);
  }
  @Post('my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() answerDto: InputAnswerDto,
    @Req() req,
  ): Promise<OutputAnswerDto> {
    return null;
  }
  @Get(':id')
  @HttpCode(200)
  async getGameById(
    @Param('id') gameId: string,
    @Req() req,
  ): Promise<OutputPairGameDto> {
    return await this.gamesQueryRepo.getGameById(gameId, req.user.userId);
  }
  @Post('connection')
  @HttpCode(200)
  async joinOrCreate(@Req() req): Promise<OutputPairGameDto> {
    return await this.commandBus.execute(
      new JoinOrCreateGameCommand(req.user.userId),
    );
  }
}
