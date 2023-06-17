import { CommandHandler } from '@nestjs/cqrs';
import { InputAnswerDto } from '../dto/input.answer.dto';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { PlayersRepository } from '../players.repository';
import { OutputAnswerDto } from '../dto/output.answer.dto';
import { AnswersRepository } from '../answers.repository';
import { Game } from '../entities/game.entity';
import { AnswerStatus, PlayerOrder } from '../../application-helpers/statuses';
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
      const playerIncrementedScoreInGame =
        await this.gamesRepo.incrementPlayerScore(game.id, playerOrder);
      const addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      if (currentQuestionIndex === 4)
        // Добавить логику на проверку, что он первым отвечает на последний вопрос
        await this.finishGameOnLastQuestionInTenSeconds(game.id, playerOrder);
      await this.playersRepo.updatePlayerScore(
        command.playerId,
        playerIncrementedScoreInGame,
      );
      return {
        questionId: currentQuestion.id,
        answerStatus: answerStatus,
        addedAt: addedAnswer.addedAt.toISOString(),
      };
    } else {
      const answerStatus = AnswerStatus.incorrect;
      const playerScore = await this.gamesRepo.getPlayerScore(
        game.id,
        playerOrder,
      );
      const addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      if (currentQuestionIndex === 4)
        // Добавить логику на проверку, что он первым отвечает на последний вопрос
        await this.finishGameOnLastQuestionInTenSeconds(game.id, playerOrder);
      await this.playersRepo.updatePlayerScore(command.playerId, playerScore);
      return {
        questionId: currentQuestion.id,
        answerStatus: answerStatus,
        addedAt: addedAnswer.addedAt.toISOString(),
      };
    }
  }

  async finishGameOnLastQuestionInTenSeconds(
    gameId: string,
    playerOrder: PlayerOrder,
  ): Promise<void> {
    await this.gamesRepo.incrementPlayerScore(gameId, playerOrder);
    await this.gamesRepo.finishGameInTenSeconds(gameId);
  }
}
