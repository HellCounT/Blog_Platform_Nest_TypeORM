import { CommandHandler } from '@nestjs/cqrs';
import { InputAnswerDto } from '../dto/input.answer.dto';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { OutputAnswerDto } from '../dto/output.answer.dto';
import { AnswersRepository } from '../answers.repository';
import { Game } from '../entities/game.entity';
import {
  AnswerStatus,
  GameStatus,
  PlayerOrder,
} from '../../base/application-helpers/statuses';
import { isVoid } from '../../base/application-helpers/void.check.helper';
import { ForbiddenException } from '@nestjs/common';
import { AnswersCountersType } from '../types/answers-counters.type';
import { Answer } from '../entities/answer.entity';
import { Question } from '../../superadmin/quiz/entities/question.entity';

export class SendAnswerCommand {
  constructor(public answerDto: InputAnswerDto, public playerId: string) {}
}

// todo: wrap into transaction based on BaseTransactionUseCase

@CommandHandler(SendAnswerCommand)
export class SendAnswerUseCase {
  constructor(
    protected gamesRepo: GamesRepository,
    protected questionsRepo: QuestionsRepository,
    protected answersRepo: AnswersRepository,
  ) {}

  // todo: lower down amount of save operations for each entity

  async execute(command: SendAnswerCommand): Promise<OutputAnswerDto> {
    const game: Game = await this.gamesRepo.getCurrentActiveGame(
      command.playerId,
    );
    if (isVoid(game)) throw new ForbiddenException();
    const playerOrder = game.getPlayerOrder(command.playerId);
    const currentQuestionNumber = game.getCurrentQuestionNumber(playerOrder);
    if (currentQuestionNumber > 5) throw new ForbiddenException();
    const givenAnswer = command.answerDto.answer;
    const currentAnswersCount = await game.getCurrentAnswersCounters(
      playerOrder,
    );
    const questions = await this.questionsRepo.getQuestionsForIds(
      game.questionIds,
    );
    const currentQuestion = questions[currentQuestionNumber - 1];
    // Close game if time is up
    if (game.status === GameStatus.finished && currentQuestionNumber <= 5) {
      await this.closeAllUnansweredQuestionsWhenGameIsFinished(
        game,
        currentQuestionNumber,
        command.playerId,
        questions,
      );
      throw new ForbiddenException();
    }
    let answerStatus: AnswerStatus;
    let addedAnswer: Answer;
    // incrementing score if player gives correct answer
    if (currentQuestion.correctAnswers.includes(givenAnswer)) {
      answerStatus = AnswerStatus.correct;
      game.incrementPlayerGameScore(playerOrder);
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await game.addAnswerIdToGame(playerOrder, addedAnswer.id);
      // not incrementing score if player gives incorrect answer
    } else {
      answerStatus = AnswerStatus.incorrect;
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await game.addAnswerIdToGame(playerOrder, addedAnswer.id);
    }
    // starting 10sec timer after one player answered 5 questions
    if (this.playerIsFinishingFirst(currentAnswersCount)) {
      game.setFirstFinishedPlayer(playerOrder);
      this.finishGameInTenSeconds(game);
    }
    // finishing game when last question (10th) is answered
    if (this.playerIsFinishing(currentAnswersCount)) {
      await game.finishGame();
    }
    // bonus point logic
    if (
      (await this.isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(game)) &&
      game.status === GameStatus.finished
    ) {
      game.incrementPlayerGameScore(game.playerFinishedFirst);
    }
    await this.gamesRepo.saveGame(game);
    return {
      questionId: currentQuestion.id,
      answerStatus: answerStatus,
      addedAt: addedAnswer.addedAt.toISOString(),
    };
  }

  private finishGameInTenSeconds(game: Game): void {
    setTimeout(() => {
      game.finishGame();
    }, 10000);
    return;
  }

  private playerIsFinishingFirst(
    currentAnswersCount: AnswersCountersType,
  ): boolean {
    return (
      currentAnswersCount.playerAnswersCount === 5 &&
      currentAnswersCount.opponentAnswersCount !== 5
    );
  }

  private playerIsFinishing(currentAnswersCount: AnswersCountersType): boolean {
    return (
      currentAnswersCount.playerAnswersCount +
        currentAnswersCount.opponentAnswersCount ===
      10
    );
  }

  private async isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(
    game: Game,
  ): Promise<boolean> {
    let result: Answer[];
    if (game.playerFinishedFirst === null) return false;
    if (game.playerFinishedFirst === PlayerOrder.first)
      result = await this.answersRepo.findCorrectAnswersForPlayerInGame(
        game.id,
        game.firstPlayerUserId,
      );
    if (game.playerFinishedFirst === PlayerOrder.second)
      result = await this.answersRepo.findCorrectAnswersForPlayerInGame(
        game.id,
        game.secondPlayerUserId,
      );
    return result.length >= 1;
  }

  private async closeAllUnansweredQuestionsWhenGameIsFinished(
    game: Game,
    currentQuestionNumber: number,
    playerId: string,
    questions: Question[],
  ): Promise<void> {
    const incorrectAnswer = 'time expired';
    for (let i = currentQuestionNumber; i <= 5; i++) {
      await this.answersRepo.saveAnswer(
        incorrectAnswer,
        AnswerStatus.incorrect,
        game.id,
        playerId,
        questions[i].id,
      );
    }
    return;
  }
}
