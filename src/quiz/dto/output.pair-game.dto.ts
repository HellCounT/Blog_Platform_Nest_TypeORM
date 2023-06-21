import { GameQuestionViewType } from '../types/game-question-view.type';
import { GameStatus } from '../../application-helpers/statuses';
import { PlayerProgressViewType } from '../types/player-progress-view.type';

export type OutputPairGameDto = {
  id: string;
  firstPlayerProgress: PlayerProgressViewType;
  secondPlayerProgress: PlayerProgressViewType | null;
  questions: GameQuestionViewType[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string;
  finishGameDate: string;
};
