import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlayersRepository {
  constructor(
    @InjectRepository(Player) protected playersRepo: Repository<Player>,
  ) {}
  async getPlayerByUserId(userId: string): Promise<Player> {
    return await this.playersRepo.findOneBy({ userId: userId });
  }

  async createNewPlayer(userId: string): Promise<Player> {
    try {
      const newPlayer = Player.instantiate(userId);
      await this.playersRepo.save(newPlayer);
      return await this.getPlayerByUserId(userId);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async updatePlayerScore(userId: string, score: number): Promise<boolean> {
    try {
      const result = await this.playersRepo
        .createQueryBuilder('p')
        .update(Player)
        .set({ totalScore: () => `totalScore + ${score}` })
        .execute();
      return result.affected === 1;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
