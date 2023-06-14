import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InputAnswerDto } from './dto/input.answer.dto';
import { OutputAnswerDto } from './dto/output.answer.dto';
import { OutputPairGameDto } from './dto/output-pair-game.dto';
import { QuizGameService } from './quiz-game.service';

@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class QuizGameController {
  constructor(protected gameService: QuizGameService) {}
  @Get('my-current')
  @HttpCode(200)
  async getCurrentGame(): Promise<OutputPairGameDto> {}
  @Post('my-current/answers')
  @HttpCode(200)
  async sendAnswer(
    @Body() answerDto: InputAnswerDto,
  ): Promise<OutputAnswerDto> {}
  @Get(':id')
  @HttpCode(200)
  async getGameById(@Param('id') gameId: string): Promise<OutputPairGameDto> {}
  @Post('connection')
  @HttpCode(200)
  async connectOrCreate() {}
}
