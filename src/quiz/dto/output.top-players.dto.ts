import { OutputStatisticDto } from './output.statistic.dto';

export type OutputTopPlayersDto = OutputStatisticDto & {
  player: { id: string; login: string };
};
