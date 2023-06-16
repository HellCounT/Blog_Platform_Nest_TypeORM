import { Game } from '../quiz/entities/game.entity';
import { PlayerOrder } from './statuses';

export const getPlayerOrder = (game: Game, playerId: string): PlayerOrder => {
  let playerOrder;
  if (playerId === game.firstPlayerId) playerOrder = PlayerOrder.first;
  if (playerId === game.secondPlayerId) playerOrder = PlayerOrder.second;
  return playerOrder;
};
