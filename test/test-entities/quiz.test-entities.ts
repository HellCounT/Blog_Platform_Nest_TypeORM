import { InputAnswerDto } from '../../src/quiz/dto/input.answer.dto';
import { InputCreateQuestionDto } from '../../src/superadmin/quiz/dto/input.create-question.dto';
import { InputPublishedStatusDto } from '../../src/superadmin/quiz/dto/input.published-status.dto';

export const correctAnswer: InputAnswerDto = {
  answer: 'correct answer',
};

export const incorrectAnswer: InputAnswerDto = {
  answer: 'incorrect answer',
};

export const questionForTest: InputCreateQuestionDto = {
  body: 'question body',
  correctAnswers: ['correct answer'],
};

export const publishQuestionBody: InputPublishedStatusDto = {
  published: true,
};
