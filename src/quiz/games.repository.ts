import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus, PlayerOrder } from '../application-helpers/statuses';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) protected gamesRepo: Repository<Game>) {}
  async getGameById(gameId: string): Promise<Game> {
    return await this.gamesRepo.findOneBy({ id: gameId });
  }
  async findRandomOpenedGame(playerId: string): Promise<Game> {
    return await this.gamesRepo
      .createQueryBuilder('g')
      .select()
      .where(`g.status = "PendingSecondPlayer"`)
      .andWhere(`g.firstPlayerId != :playerId`, { playerId: playerId })
      .orderBy('RANDOM()')
      .getOne();
  }
  async getCurrentActiveGame(playerId: string): Promise<Game> {
    return await this.gamesRepo.findOneBy([
      {
        firstPlayerId: playerId,
        status: GameStatus.active,
      },
      {
        secondPlayerId: playerId,
        status: GameStatus.active,
      },
    ]);
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
          secondPlayerId: secondPlayerId,
          secondPlayerScore: 0,
          status: GameStatus.active,
          pairCreatedDate: new Date(),
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
  async finishGame(gameId: string): Promise<boolean> {
    try {
      const result = await this.gamesRepo.update(
        { id: gameId },
        {
          status: GameStatus.finished,
        },
      );
      return result.affected === 1;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async incrementPlayerScore(
    gameId: string,
    playerOrder: PlayerOrder,
  ): Promise<boolean> {
    try {
      if (playerOrder === PlayerOrder.first) {
        const result = await this.gamesRepo
          .createQueryBuilder('g')
          .update(Game)
          .set({ firstPlayerScore: () => 'firstPlayerScore + 1' })
          .where({ id: gameId })
          .execute();
        return result.affected === 1;
      } else {
        const result = await this.gamesRepo
          .createQueryBuilder('g')
          .update(Game)
          .set({ secondPlayerScore: () => 'secondPlayerScore + 1' })
          .where({ id: gameId })
          .execute();
        return result.affected === 1;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
