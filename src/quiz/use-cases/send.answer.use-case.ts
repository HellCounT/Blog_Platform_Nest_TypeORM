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
    let answerStatus: AnswerStatus;
    let addedAnswer: Answer;
    let playerGameScore: number;
    if (currentQuestion.correctAnswers.includes(givenAnswer)) {
      answerStatus = AnswerStatus.correct;
      playerGameScore = await this.incrementPlayerGameScore(game, playerOrder);
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await this.addAnswerIdToPlayer(game, playerOrder, addedAnswer.id);
    } else {
      answerStatus = AnswerStatus.incorrect;
      playerGameScore = game.getPlayerScore(playerOrder);
      addedAnswer = await this.answersRepo.saveAnswer(
        givenAnswer,
        answerStatus,
        game.id,
        command.playerId,
        currentQuestion.id,
      );
      await this.addAnswerIdToPlayer(game, playerOrder, addedAnswer.id);
    }
    if (this.playerIsFinishingFirst(currentAnswersCount)) {
      await this.setFirstFinishedPlayer(playerOrder, game);
    }
    if (this.playerIsFinishing(currentAnswersCount)) {
      await this.finishGame(game);
    }
    // const updatedGame: Game = await this.gamesRepo.getGameById(game.id);
    if (
      (await this.isFirstFinishedPlayerHasAtLeastOneCorrectAnswer(game)) &&
      game.status === GameStatus.finished
    ) {
      //bonus point
      await this.incrementPlayerGameScore(game, game.playerFinishedFirst);
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

  private async incrementPlayerGameScore(
    game: Game,
    playerOrder: PlayerOrder,
  ): Promise<number> {
    if (playerOrder === PlayerOrder.first) {
      game.firstPlayerScore += 1;
      await this.gamesRepo.saveGame(game);
      return game.firstPlayerScore;
    } else {
      game.secondPlayerScore += 1;
      await this.gamesRepo.saveGame(game);
      return game.secondPlayerScore;
    }
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

  private async finishGame(game: Game): Promise<void> {
    game.status = GameStatus.finished;
    game.finishGameDate = new Date();
    try {
      await this.gamesRepo.saveGame(game);
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }

  private playerIsFinishingFirst(
    currentAnswersCount: AnswersCountersType,
  ): boolean {
    return (
      currentAnswersCount.playerAnswersCount === 5 &&
      currentAnswersCount.opponentAnswersCount !== 5
    );
  }

  private async addAnswerIdToPlayer(
    game: Game,
    playerOrder: PlayerOrder,
    answerId: string,
  ): Promise<Game> {
    if (playerOrder === PlayerOrder.first) {
      game.firstPlayerAnswersIds.push(answerId);
      return await this.gamesRepo.saveGame(game);
    } else {
      game.secondPlayerAnswersIds.push(answerId);
      return await this.gamesRepo.saveGame(game);
    }
  }

  private playerIsFinishing(currentAnswersCount: AnswersCountersType): boolean {
    return (
      currentAnswersCount.playerAnswersCount +
        currentAnswersCount.opponentAnswersCount ===
      10
    );
  }

  private async setFirstFinishedPlayer(
    playerOrder: PlayerOrder,
    game: Game,
  ): Promise<void> {
    game.playerFinishedFirst = playerOrder;
    try {
      await this.gamesRepo.saveGame(game);
      return;
    } catch (e) {
      console.log(e);
      return;
    }
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
