import { OutputStatisticDto } from '../dto/output.statistic.dto';

export type PlayerRank = OutputStatisticDto & {
  playerId: string;
  login: string;
  rank: number;
};
