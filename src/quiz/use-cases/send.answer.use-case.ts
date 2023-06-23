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
import { getPlayerOrder } from '../helpers/get.player.order';
import { AnswersCountersType } from '../types/answers-counters.type';
import { Answer } from '../entities/answer.entity';

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
    const currentQuestionNumber = this.getCurrentQuestionNumber(
      game,
      playerOrder,
    );
    if (currentQuestionNumber > 5) throw new ForbiddenException();
    const givenAnswer = command.answerDto.answer;
    const currentAnswersCount = this.getCurrentAnswersCounters(
      game,
      playerOrder,
    );
    const questions = await this.questionsRepo.getQuestionsForIds(
      game.questionIds,
    );
    const currentQuestion = questions[currentQuestionNumber - 1];
    let answerStatus: AnswerStatus;
    let addedAnswer: Answer;
    let playerGameScore: number;
    if (currentQuestion.correctAnswers.includes(givenAnswer)) {
      answerStatus = AnswerStatus.correct;
      playerGameScore = await this.gamesRepo.incrementPlayerGameScore(
        game.id,
        playerOrder,
      );
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await this.gamesRepo.addAnswerIdToPlayer(
        game.id,
        addedAnswer.id,
        playerOrder,
      );
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCount.playerAnswersCount >
          currentAnswersCount.opponentAnswersCount
      ) {
        await this.setFirstFinishedPlayer(playerOrder, game);
      }
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCount.playerAnswersCount <
          currentAnswersCount.opponentAnswersCount
      )
        await this.finishGame(game.id);
      return {
        questionId: currentQuestion.id,
        answerStatus: answerStatus,
        addedAt: addedAnswer.addedAt.toISOString(),
      };
    } else {
      answerStatus = AnswerStatus.incorrect;
      playerGameScore = await this.gamesRepo.getPlayerScore(
        game.id,
        playerOrder,
      );
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await this.gamesRepo.addAnswerIdToPlayer(
        game.id,
        addedAnswer.id,
        playerOrder,
      );
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCount.playerAnswersCount >
          currentAnswersCount.opponentAnswersCount
      )
        await this.setFirstFinishedPlayer(playerOrder, game);
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCount.playerAnswersCount <
          currentAnswersCount.opponentAnswersCount
      )
        await this.finishGame(game.id);
    }
    const updatedGame: Game = await this.gamesRepo.getCurrentActiveGame(
      command.playerId,
    );
    if (await this.isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(updatedGame))
      await this.gamesRepo.incrementPlayerGameScore(
        updatedGame.id,
        updatedGame.playerFinishedFirst,
      );
    await this.playersRepo.updatePlayerTotalScore(
      command.playerId,
      playerGameScore,
    );
    return {
      questionId: currentQuestion.id,
      answerStatus: answerStatus,
      addedAt: addedAnswer.addedAt.toISOString(),
    };
  }

  // private async finishGameWithBonusInTenSeconds(
  //   gameId: string,
  //   playerOrder: PlayerOrder,
  // ): Promise<void> {
  //   setTimeout(() => {
  //     this.gamesRepo.incrementPlayerScore(gameId, playerOrder); // bonus point
  //     this.gamesRepo.finishGame(gameId);
  //   }, 10000);
  //   return;
  // }

  private async finishGame(gameId: string): Promise<void> {
    await this.gamesRepo.finishGame(gameId);
    return;
  }

  private getCurrentQuestionNumber(
    game: Game,
    playerOder: PlayerOrder,
  ): number {
    let currentQuestionIndex: number;
    if (playerOder === PlayerOrder.first)
      currentQuestionIndex = game.firstPlayerAnswersIds.length + 1;
    else currentQuestionIndex = game.secondPlayerAnswersIds.length + 1;
    return currentQuestionIndex;
  }

  private getCurrentAnswersCounters(
    game: Game,
    playerOrder: PlayerOrder,
  ): AnswersCountersType {
    const currentAnswersCounters: AnswersCountersType = {
      playerAnswersCount: 0,
      opponentAnswersCount: 0,
    };
    if (playerOrder === PlayerOrder.first) {
      currentAnswersCounters.playerAnswersCount =
        game.firstPlayerAnswersIds.length;
      currentAnswersCounters.opponentAnswersCount =
        game.secondPlayerAnswersIds.length;
    } else {
      currentAnswersCounters.playerAnswersCount =
        game.secondPlayerAnswersIds.length;
      currentAnswersCounters.opponentAnswersCount =
        game.firstPlayerAnswersIds.length;
    }
    return currentAnswersCounters;
  }

  private async setFirstFinishedPlayer(
    playerOrder: PlayerOrder,
    game: Game,
  ): Promise<void> {
    await this.gamesRepo.setFirstFinishedPlayer(game.id, playerOrder);
    return;
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
    else
      result = await this.answersRepo.findCorrectAnswersForPlayerInGame(
        game.id,
        game.secondPlayerUserId,
      );
    return result.length >= 1;
  }
}
