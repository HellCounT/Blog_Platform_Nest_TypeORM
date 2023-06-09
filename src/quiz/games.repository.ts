import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus } from '../base/application-helpers/statuses';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) protected gamesRepo: Repository<Game>) {}
  async saveGame(game: Game): Promise<Game> {
    return await this.gamesRepo.save(game);
  }
  async getGameById(gameId: string): Promise<Game> {
    return await this.gamesRepo.findOne({
      where: { id: gameId },
      relations: {
        firstPlayer: {
          user: true,
        },
        secondPlayer: {
          user: true,
        },
      },
    });
  }
  async findRandomOpenedGame(playerId: string): Promise<Game> {
    return await this.gamesRepo
      .createQueryBuilder('g')
      .select()
      .where(`g.status = 'PendingSecondPlayer'`)
      .andWhere(`g."firstPlayerUserId" != :playerId`, { playerId: playerId })
      .orderBy('RANDOM()')
      .getOne();
  }
  async getCurrentActiveGame(playerId: string): Promise<Game> {
    return await this.gamesRepo.findOneBy([
      {
        firstPlayerUserId: playerId,
        status: GameStatus.active,
      },
      {
        secondPlayerUserId: playerId,
        status: GameStatus.active,
      },
    ]);
  }
  async getAlreadyCreatedPendingGame(playerId: string): Promise<Game> {
    return await this.gamesRepo.findOneBy({
      firstPlayerUserId: playerId,
      status: GameStatus.pending,
    });
  }
  async createGame(firstPlayerId: string): Promise<Game> {
    try {
      const newGameId = uuidv4();
      const newGame = Game.instantiate(newGameId, firstPlayerId);
      await this.gamesRepo.save(newGame);
      return await this.getGameById(newGameId);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async joinGame(gameId: string, secondPlayerId: string): Promise<boolean> {
    try {
      const result = await this.gamesRepo.update(
        { id: gameId },
        {
          secondPlayerUserId: secondPlayerId,
          secondPlayerScore: 0,
          status: GameStatus.active,
        },
      );
      return result.affected === 1;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async addQuestionsAndStartGame(
    gameId: string,
    questionIds: string[],
  ): Promise<Game> {
    try {
      await this.gamesRepo.update(
        { id: gameId },
        {
          questionIds: questionIds,
          startGameDate: new Date(),
        },
      );
      return await this.getGameById(gameId);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  // async finishGame(gameId: string): Promise<boolean> {
  //   try {
  //     const result = await this.gamesRepo.update(
  //       { id: gameId },
  //       {
  //         status: GameStatus.finished,
  //         finishGameDate: new Date(),
  //       },
  //     );
  //     return result.affected === 1;
  //   } catch (e) {
  //     console.log(e);
  //     return false;
  //   }
  // }

  // async incrementPlayerGameScore(
  //   gameId: string,
  //   playerOrder: PlayerOrder,
  // ): Promise<number> {
  //   try {
  //     if (playerOrder === PlayerOrder.first) {
  //       await this.gamesRepo
  //         .createQueryBuilder('g')
  //         .update(Game)
  //         .set({ firstPlayerScore: () => 'firstPlayerScore + 1' })
  //         .where({ id: gameId })
  //         .execute();
  //     } else {
  //       await this.gamesRepo
  //         .createQueryBuilder('g')
  //         .update(Game)
  //         .set({ secondPlayerScore: () => 'secondPlayerScore + 1' })
  //         .where({ id: gameId })
  //         .execute();
  //     }
  //     const game = await this.getGameById(gameId);
  //     if (playerOrder === PlayerOrder.first) return game.firstPlayerScore;
  //     else return game.secondPlayerScore;
  //   } catch (e) {
  //     console.log(e);
  //     return null;
  //   }
  // }

  // async addAnswerIdToPlayer(
  //   gameId: string,
  //   answerId: string,
  //   playerOrder: PlayerOrder,
  // ) {
  //   try {
  //     const game = await this.getGameById(gameId);
  //     let answerIds: string[];
  //     if (playerOrder === PlayerOrder.first) {
  //       answerIds = game.firstPlayerAnswersIds;
  //       answerIds.push(answerId);
  //       const result = await this.gamesRepo.update(
  //         { id: gameId },
  //         { firstPlayerAnswersIds: answerIds },
  //       );
  //       return result.affected === 1;
  //     } else {
  //       answerIds = game.secondPlayerAnswersIds;
  //       answerIds.push(answerId);
  //       const result = await this.gamesRepo.update(
  //         { id: gameId },
  //         { secondPlayerAnswersIds: answerIds },
  //       );
  //       return result.affected === 1;
  //     }
  //   } catch (e) {
  //     console.log(e);
  //     return false;
  //   }
  // }

  // async setFirstFinishedPlayer(
  //   gameId: string,
  //   playerOrder: PlayerOrder,
  // ): Promise<void> {
  //   try {
  //     await this.gamesRepo.update(
  //       { id: gameId },
  //       {
  //         playerFinishedFirst: playerOrder,
  //       },
  //     );
  //     return;
  //   } catch (e) {
  //     console.log(e);
  //     return;
  //   }
  // }
}
