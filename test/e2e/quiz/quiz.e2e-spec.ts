import { INestApplication } from '@nestjs/common';
import { setConfigNestApp } from '../../configuration.test';
import request from 'supertest';
import { usersFactory } from '../../helpers/factory';
import {
  quizGameCreateOrJoinPath,
  quizGameGiveAnswerPath,
  quizGamePath,
  superAdminQuestionsPath,
} from '../../helpers/paths';
import {
  authHeader,
  getBearerAccessToken,
  superAdminLogin,
  superAdminPassword,
} from '../../helpers/auth';
import {
  correctAnswer,
  publishQuestionBody,
  questionForTest,
} from '../../test-entities/quiz.test-entities';
import { OutputPairGameDto } from '../../../src/quiz/dto/output.pair-game.dto';
import { GameStatus } from '../../../src/base/application-helpers/statuses';

const sleep = (seconds: number) =>
  new Promise((r) => setTimeout(r, seconds * 1000));

describe('Quiz Controller (e2e)', () => {
  jest.setTimeout(30000);
  let nestApp: INestApplication;
  let app: any;

  beforeAll(async () => {
    nestApp = await setConfigNestApp();
    await nestApp.init();
    app = nestApp.getHttpServer();
  });

  afterAll(async () => {
    await nestApp.close();
  });

  beforeEach(async () => {
    // Publishing 5 questions
    await request(app).delete('/testing/all-data');
    const question1 = await request(app)
      .post(superAdminQuestionsPath)
      .auth(superAdminLogin, superAdminPassword)
      .send(questionForTest);
    await request(app)
      .post(superAdminQuestionsPath + `/${question1.body.id}/publish`)
      .send(publishQuestionBody);
    const question2 = await request(app)
      .post(superAdminQuestionsPath)
      .auth(superAdminLogin, superAdminPassword)
      .send(questionForTest);
    await request(app)
      .post(superAdminQuestionsPath + `/${question2.body.id}/publish`)
      .send(publishQuestionBody);
    const question3 = await request(app)
      .post(superAdminQuestionsPath)
      .auth(superAdminLogin, superAdminPassword)
      .send(questionForTest);
    await request(app)
      .post(superAdminQuestionsPath + `/${question3.body.id}/publish`)
      .send(publishQuestionBody);
    const question4 = await request(app)
      .post(superAdminQuestionsPath)
      .auth(superAdminLogin, superAdminPassword)
      .send(questionForTest);
    await request(app)
      .post(superAdminQuestionsPath + `/${question4.body.id}/publish`)
      .send(publishQuestionBody);
    const question5 = await request(app)
      .post(superAdminQuestionsPath)
      .auth(superAdminLogin, superAdminPassword)
      .send(questionForTest);
    await request(app)
      .post(superAdminQuestionsPath + `/${question5.body.id}/publish`)
      .send(publishQuestionBody);
  });

  describe(`1. Tests for 10 seconds game ending:`, () => {
    it(`POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs": create game by user1, connect to game by user2. Add 5 correct answers by user1. Await 10 sec. Get game by user1. Should return finished game - status: "Finished", firstPlayerProgress.score: 6, secondPlayerProgress.score: 0, finishGameDate: not to be null; status 200: `, async () => {
      const user1 = usersFactory.createUser();
      const user1Id = await usersFactory.insertUser(app, user1);
      const user2 = usersFactory.createUser();
      const user2Id = await usersFactory.insertUser(app, user2);
      const tokenPair1 = await usersFactory.loginAndGetTokenPair(app, user1);
      const tokenPair2 = await usersFactory.loginAndGetTokenPair(app, user2);

      await request(app)
        .post(quizGameCreateOrJoinPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken));
      const createGameResponse = await request(app)
        .post(quizGameCreateOrJoinPath)
        .set(authHeader, getBearerAccessToken(tokenPair2.accessToken));
      const gameId = createGameResponse.body.id;
      // 5 correct answers by user1
      await request(app)
        .post(quizGameGiveAnswerPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .send(correctAnswer);
      await request(app)
        .post(quizGameGiveAnswerPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .send(correctAnswer);
      await request(app)
        .post(quizGameGiveAnswerPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .send(correctAnswer);
      await request(app)
        .post(quizGameGiveAnswerPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .send(correctAnswer);
      await request(app)
        .post(quizGameGiveAnswerPath)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .send(correctAnswer);

      await sleep(11);

      const response = await request(app)
        .get(quizGamePath + `/${gameId}`)
        .set(authHeader, getBearerAccessToken(tokenPair1.accessToken))
        .expect(200);
      expect(response.body).toEqual<OutputPairGameDto>({
        id: gameId,
        firstPlayerProgress: {
          answers: expect.any(Array),
          player: {
            id: user1Id,
            login: user1.login,
          },
          score: 6,
        },
        secondPlayerProgress: {
          answers: expect.any(Array),
          player: {
            id: user2Id,
            login: user2.login,
          },
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatus.finished,
        pairCreatedDate: expect.any(String),
        startGameDate: expect.any(String),
        finishGameDate: expect.any(String),
      });
    });
  });
});
