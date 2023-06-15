import { Injectable } from '@nestjs/common';
import { GamesRepository } from './types/games.repository';

@Injectable()
export class QuizGameService {
  constructor(protected gamesRepo: GamesRepository) {}
}
