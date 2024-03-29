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
  async execute(command: SendAnswerCommand): Promise<OutputAnswerDto> {
    const game: Game = await this.gamesRepo.getCurrentActiveGame(
      command.playerId,
    );
    console.log(game);
    if (isVoid(game)) throw new ForbiddenException();
    const playerOrder = game.getPlayerOrder(command.playerId);
    const currentQuestionNumber = game.getCurrentQuestionNumber(playerOrder);
    console.log({ currentQuestionNumber });
    if (currentQuestionNumber > 5) throw new ForbiddenException();
    const givenAnswer = command.answerDto.answer;
    console.log({ givenAnswer });
    const currentAnswersCount = await game.getCurrentAnswersCounters(
      playerOrder,
    );
    console.log({ currentAnswersCount });
    const questions = await this.questionsRepo.getQuestionsForIds(
      game.questionIds,
    );
    console.log({ questions });
    const currentQuestion = questions[currentQuestionNumber - 1];
    console.log({ currentQuestion });
    let answerStatus: AnswerStatus;
    let addedAnswer: Answer;
    // incrementing score if player gives correct answer
    if (currentQuestion.correctAnswers.includes(givenAnswer)) {
      answerStatus = AnswerStatus.correct;
      game.incrementPlayerGameScore(playerOrder);
      console.log(
        playerOrder,
        'Player has given the correct answer',
        'First player score: ',
        game.firstPlayerScore,
        'Second player score: ',
        game.secondPlayerScore,
      );
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
      await this.finishGameInTenSeconds(game, questions);
    }
    // finishing game when last question (10th) is answered
    if (this.playerIsFinishing(currentAnswersCount)) {
      await game.finishGame();
    }
    await this.gamesRepo.saveGame(game);
    return {
      questionId: currentQuestion.id,
      answerStatus: answerStatus,
      addedAt: addedAnswer.addedAt.toISOString(),
    };
  }

  async finishGameInTenSeconds(
    gameInProgress: Game,
    questions: Question[],
  ): Promise<void> {
    console.log('Timer has started');
    setTimeout(async () => {
      const game = await this.gamesRepo.getGameById(gameInProgress.id);
      const incorrectAnswer = 'time expired';
      let playerId: string;
      if (game.playerFinishedFirst === PlayerOrder.first)
        playerId = game.secondPlayerUserId;
      else playerId = game.firstPlayerUserId;
      // пометка неотвеченных вопросов как неверные ответы
      const unansweredQuestionsCount = 5 - game.secondPlayerAnswersIds.length;
      for (let i = 0; i < unansweredQuestionsCount; i++) {
        await this.answersRepo.saveAnswer(
          incorrectAnswer,
          AnswerStatus.incorrect,
          game.id,
          playerId,
          questions[i].id,
        );
      }
      // завершение игры
      game.finishGame();
      // bonus point logic
      if (
        (await this.isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(game)) &&
        game.status === GameStatus.finished
      ) {
        game.incrementPlayerGameScore(game.playerFinishedFirst);
      }
      console.log('Game is finished', game.status);
      await this.gamesRepo.saveGame(game);
      console.log('Game saved');
    }, 7000);
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
}
