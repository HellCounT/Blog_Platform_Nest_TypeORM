import { CommandHandler } from '@nestjs/cqrs';
import { InputAnswerDto } from '../dto/input.answer.dto';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { PlayersRepository } from '../players.repository';
import { OutputAnswerDto } from '../dto/output.answer.dto';
import { AnswersRepository } from '../answers.repository';
import { Game } from '../entities/game.entity';
import { AnswerStatus } from '../../application-helpers/statuses';
import { isVoid } from '../../application-helpers/void.check.helper';
import { ForbiddenException } from '@nestjs/common';
import { getPlayerOrder } from '../../application-helpers/get.player.order';

export class SendAnswerCommand {
  constructor(public answerDto: InputAnswerDto, public playerId: string) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerUseCase {
  constructor(
    protected gamesRepo: GamesRepository,
    protected questionsRepo: QuestionsRepository,
    protected playersRepo: PlayersRepository,
    protected answersRepo: AnswersRepository,
  ) {}
  async execute(command: SendAnswerCommand): Promise<OutputAnswerDto> {
    const game: Game = await this.gamesRepo.getCurrentActiveGame(
      command.playerId,
    );
    if (isVoid(game)) throw new ForbiddenException();
    const playerOrder = getPlayerOrder(game, command.playerId);
    const givenAnswer = command.answerDto.answer;
    const currentQuestionIndex = game.firstPlayerAnswersIds.length + 1;
    const questions = await this.questionsRepo.getQuestionsForIds(
      game.questionIds,
    );
    const currentQuestion = questions[currentQuestionIndex];
    if (givenAnswer in currentQuestion.correctAnswers) {
      const answerStatus = AnswerStatus.correct;
      await this.gamesRepo.incrementPlayerScore(game.id, playerOrder);
      await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
    }
    // await this.answersRepo.addAnswer(command.answerDto.answer)
  }
}
