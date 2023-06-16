import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OutputPairGameDto } from './dto/output-pair-game.dto';

@Injectable()
export class GamesQueryRepository {
  constructor(@InjectRepository(Game) protected gamesRepo: Repository<Game>) {}
  async getGameById(
    gameId: string,
    playerId: string,
  ): Promise<OutputPairGameDto> {}
}
