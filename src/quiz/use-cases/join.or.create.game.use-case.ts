import { CommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { OutputPairGameDto } from '../dto/output.pair-game.dto';
import { PlayersRepository } from '../players.repository';
import { Question } from '../../superadmin/quiz/entities/question.entity';
import { Game } from '../entities/game.entity';
import { ForbiddenException } from '@nestjs/common';
import { GameQuestionViewType } from '../types/game-question-view.type';

export class JoinOrCreateGameCommand {
  constructor(public userId: string) {}
}

@CommandHandler(JoinOrCreateGameCommand)
export class JoinOrCreateGameUseCase {
  constructor(
    protected gamesRepo: GamesRepository,
    protected questionsRepo: QuestionsRepository,
    protected playersRepo: PlayersRepository,
  ) {}
  async execute(command: JoinOrCreateGameCommand): Promise<OutputPairGameDto> {
    let game: Game;
    let player = await this.playersRepo.getPlayerByUserId(command.userId);
    if (!player)
      player = await this.playersRepo.createNewPlayer(command.userId);
    if (await this.isPlayerAlreadyParticipatingInAnotherGame(player.userId))
      throw new ForbiddenException();
    const foundGame = await this.gamesRepo.findRandomOpenedGame(player.userId);
    if (foundGame) {
      const questions =
        await this.questionsRepo.pickFiveRandomQuestionsForGame();
      const questionIds = this.getQuestionIds(questions);
      await this.gamesRepo.joinGame(foundGame.id, player.userId);
      game = await this.gamesRepo.addQuestionsAndStartGame(
        foundGame.id,
        questionIds,
      );
      return this.mapGameToOutputModel(game, questions);
    } else {
      if (await this.isPlayerAlreadyCreatedTheGame(command.userId))
        throw new ForbiddenException();
      game = await this.gamesRepo.createGame(player.userId);
      return this.mapGameToOutputModel(game);
    }
  }
  private getQuestionIds(questions: Question[]): string[] {
    return questions.map((q) => q.id);
  }
  private async isPlayerAlreadyParticipatingInAnotherGame(
    playerId: string,
  ): Promise<boolean> {
    return !!(await this.gamesRepo.getCurrentActiveGame(playerId));
  }
  private async isPlayerAlreadyCreatedTheGame(
    playerId: string,
  ): Promise<boolean> {
    return !!(await this.gamesRepo.getAlreadyCreatedPendingGame(playerId));
  }
  private async mapGameToOutputModel(
    game: Game,
    questions?: Question[],
  ): Promise<OutputPairGameDto> {
    let questionsField: GameQuestionViewType[] | null = null;
    if (questions) questionsField = this.mapQuestionsToViewType(questions);
    const result: OutputPairGameDto = {
      id: game.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: game.firstPlayerUserId,
          login: game.firstPlayer.user.login,
        },
        score: game.firstPlayerScore,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: game.secondPlayerUserId,
          login: game.secondPlayer?.user.login || null,
        },
        score: game.secondPlayerScore,
      },
      questions: questionsField,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate?.toISOString() || null,
      startGameDate: game.startGameDate?.toISOString() || null,
      finishGameDate: game.finishGameDate?.toISOString() || null,
    };
    if (!game.secondPlayerUserId) result.secondPlayerProgress = null;
    return result;
  }
  private mapQuestionsToViewType(
    questions: Question[],
  ): GameQuestionViewType[] {
    return questions.map((q) => {
      return {
        id: q.id,
        body: q.body,
      };
    });
  }
}
