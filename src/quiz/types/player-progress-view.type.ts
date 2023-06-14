import { OutputAnswerDto } from '../dto/output.answer.dto';
import { PlayerViewType } from './player-view.type';

export type PlayerProgressViewType = {
  answers: OutputAnswerDto[];
  player: PlayerViewType;
  score: number;
};
