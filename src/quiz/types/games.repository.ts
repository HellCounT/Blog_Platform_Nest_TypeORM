import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../entities/game.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) protected gamesRepo: Repository<Game>) {}
  async findRandomOpenedGame(): Promise<Game> {
    return await this.gamesRepo
      .createQueryBuilder('g')
      .select()
      .where(`g.status = "PendingSecondPlayer"`)
      .orderBy('RANDOM()')
      .getOne();
  }
}
