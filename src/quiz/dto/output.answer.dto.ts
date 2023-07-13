import { AnswerStatus } from '../../base/application-helpers/statuses';

export type OutputAnswerDto = {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
};
