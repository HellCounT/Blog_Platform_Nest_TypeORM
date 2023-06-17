import { Game } from '../quiz/entities/game.entity';
import { PlayerOrder } from './statuses';

export const getPlayerOrder = (game: Game, playerId: string): PlayerOrder => {
  let playerOrder;
  if (playerId === game.firstPlayerUserId) playerOrder = PlayerOrder.first;
  if (playerId === game.secondPlayerUserId) playerOrder = PlayerOrder.second;
  return playerOrder;
};
