import { CommandHandler } from '@nestjs/cqrs';
import { InputAnswerDto } from '../dto/input.answer.dto';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { PlayersRepository } from '../players.repository';
import { OutputAnswerDto } from '../dto/output.answer.dto';
import { AnswersRepository } from '../answers.repository';
import { Game } from '../entities/game.entity';
import {
  AnswerStatus,
  GameStatus,
  PlayerOrder,
} from '../../application-helpers/statuses';
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
    console.log({ game });
    const playerOrder = getPlayerOrder(game, command.playerId);
    console.log({ playerOrder });
    const currentQuestionNumber = this.getCurrentQuestionNumber(
      game,
      playerOrder,
    );
    console.log({ currentQuestionNumber });
    if (currentQuestionNumber > 5) throw new ForbiddenException();
    const givenAnswer = command.answerDto.answer;
    const currentAnswersCountBeforeNewAnswer =
      await this.getCurrentAnswersCounters(game, playerOrder);
    console.log({ currentAnswersCountBeforeNewAnswer });
    const questions = await this.questionsRepo.getQuestionsForIds(
      game.questionIds,
    );
    const currentQuestion = questions[currentQuestionNumber - 1];
    console.log({ currentQuestion });
    let answerStatus: AnswerStatus;
    let addedAnswer: Answer;
    let playerGameScore: number;
    if (currentQuestion.correctAnswers.includes(givenAnswer)) {
      console.log('its correct answer');
      answerStatus = AnswerStatus.correct;
      playerGameScore = await this.gamesRepo.incrementPlayerGameScore(
        game.id,
        playerOrder,
      );
      console.log(playerGameScore);
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
      console.log(
        currentQuestionNumber,
        currentAnswersCountBeforeNewAnswer.playerAnswersCount,
        currentAnswersCountBeforeNewAnswer.opponentAnswersCount,
      );
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCountBeforeNewAnswer.playerAnswersCount >
          currentAnswersCountBeforeNewAnswer.opponentAnswersCount
      ) {
        console.log('set ffp');
        await this.setFirstFinishedPlayer(playerOrder, game);
      }
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCountBeforeNewAnswer.playerAnswersCount <
          currentAnswersCountBeforeNewAnswer.opponentAnswersCount
      )
        await this.finishGame(game.id);
      // return {
      //   questionId: currentQuestion.id,
      //   answerStatus: answerStatus,
      //   addedAt: addedAnswer.addedAt.toISOString(),
      // };
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
        currentAnswersCountBeforeNewAnswer.playerAnswersCount >
          currentAnswersCountBeforeNewAnswer.opponentAnswersCount
      )
        await this.setFirstFinishedPlayer(playerOrder, game);
      if (
        currentQuestionNumber === 5 &&
        currentAnswersCountBeforeNewAnswer.playerAnswersCount <
          currentAnswersCountBeforeNewAnswer.opponentAnswersCount
      )
        await this.finishGame(game.id);
    }
    const updatedGame: Game = await this.gamesRepo.getGameById(game.id);
    console.log('updated game', updatedGame);
    if (
      (await this.isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(
        updatedGame,
      )) &&
      updatedGame.status === GameStatus.finished
    ) {
      //bonus point
      const result = await this.gamesRepo.incrementPlayerGameScore(
        updatedGame.id,
        updatedGame.playerFinishedFirst,
      );
      console.log(result);
    }
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

  private async getCurrentAnswersCounters(
    game: Game,
    playerOrder: PlayerOrder,
  ): Promise<AnswersCountersType> {
    const currentGame = await this.gamesRepo.getGameById(game.id);
    const currentAnswersCounters: AnswersCountersType = {
      playerAnswersCount: 0,
      opponentAnswersCount: 0,
    };
    if (playerOrder === PlayerOrder.first) {
      currentAnswersCounters.playerAnswersCount =
        currentGame.firstPlayerAnswersIds.length;
      currentAnswersCounters.opponentAnswersCount =
        currentGame.secondPlayerAnswersIds.length;
    } else {
      currentAnswersCounters.playerAnswersCount =
        currentGame.secondPlayerAnswersIds.length;
      currentAnswersCounters.opponentAnswersCount =
        currentGame.firstPlayerAnswersIds.length;
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
    if (game.playerFinishedFirst === PlayerOrder.second)
      result = await this.answersRepo.findCorrectAnswersForPlayerInGame(
        game.id,
        game.secondPlayerUserId,
      );
    return result.length >= 1;
  }
}
