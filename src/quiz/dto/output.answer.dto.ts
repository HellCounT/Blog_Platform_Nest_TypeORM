import { AnswerStatus } from '../../application-helpers/statuses';

export type OutputAnswerDto = {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
};
