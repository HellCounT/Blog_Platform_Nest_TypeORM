import { Game } from '../entities/game.entity';
import { PlayerOrder } from '../../application-helpers/statuses';

export const getPlayerOrder = (game: Game, playerId: string): PlayerOrder => {
  let playerOrder;
  if (playerId === game.firstPlayerUserId) playerOrder = PlayerOrder.first;
  if (playerId === game.secondPlayerUserId) playerOrder = PlayerOrder.second;
  return playerOrder;
};
