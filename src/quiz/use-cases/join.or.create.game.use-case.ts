import { CommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../games.repository';
import { QuestionsRepository } from '../../superadmin/quiz/questions.repository';
import { OutputPairGameDto } from '../dto/output-pair-game.dto';
import { PlayersRepository } from '../players.repository';
import { Question } from '../../superadmin/quiz/entities/question.entity';
import { Game } from '../entities/game.entity';
import { ForbiddenException } from '@nestjs/common';

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
    const questions = await this.questionsRepo.pickFiveRandomQuestions();
    const questionIds = this.getQuestionIds(questions);
    let startedGame: Game;
    let player = await this.playersRepo.getPlayerByUserId(command.userId);
    if (!player)
      player = await this.playersRepo.createNewPlayer(command.userId);
    if (await this.isPlayerAlreadyParticipatingInAnotherGame(player.userId))
      throw new ForbiddenException();
    const foundGame = await this.gamesRepo.findRandomOpenedGame(player.userId);
    if (foundGame) {
      await this.gamesRepo.joinGame(foundGame.id, player.userId);
      startedGame = await this.gamesRepo.addQuestionsAndStartGame(
        foundGame.id,
        questionIds,
      );
    } else {
      const newGame = await this.gamesRepo.createGame(player.userId);
      startedGame = await this.gamesRepo.addQuestionsAndStartGame(
        newGame.id,
        questionIds,
      );
    }
    return this.mapGameToOutputModel(startedGame, questions);
  }
  private getQuestionIds(questions: Question[]): string[] {
    return questions.map((q) => q.id);
  }
  private async isPlayerAlreadyParticipatingInAnotherGame(
    playerId: string,
  ): Promise<boolean> {
    return !!(await this.gamesRepo.getCurrentActiveGame(playerId));
  }
  private async mapGameToOutputModel(
    game: Game,
    questions: Question[],
  ): Promise<OutputPairGameDto> {
    return {
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
      questions: questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate?.toISOString() || null,
      startGameDate: game.startGameDate?.toISOString() || null,
      finishGameDate: game.finishGameDate?.toISOString() || null,
    };
  }
}
