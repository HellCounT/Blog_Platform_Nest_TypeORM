import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import {
  getPublishedStatusForQuery,
  QuestionQueryParserType,
} from '../../application-helpers/query-parser-type';
import { PaginatorType } from '../../application-helpers/paginator.type';
import { OutputQuestionDto } from './dto/output.question.dto';
import { emptyPaginatorStub } from '../../application-helpers/empty.paginator.stub';

@Injectable()
export class SuperAdminQuestionsQuery {
  constructor(
    @InjectRepository(Question) protected questionsRepo: Repository<Question>,
  ) {}
  async viewAllQuestions(
    q: QuestionQueryParserType,
  ): Promise<PaginatorType<OutputQuestionDto>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageQuestions, allQuestionsCount] =
      await this.questionsRepo.findAndCount({
        where: {
          body: ILike('%' + q.bodySearchTerm + '%'),
          published: getPublishedStatusForQuery(q.publishedStatus),
        },
        order: { [q.sortBy]: q.sortDirection },
        take: q.pageSize,
        skip: offsetSize,
      });
    if (reqPageQuestions.length === 0) return emptyPaginatorStub;
    const mappedQuestions = reqPageQuestions.map((q) =>
      this._mapQuestionToViewType(q),
    );
    return {
      pagesCount: Math.ceil(allQuestionsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allQuestionsCount,
      items: mappedQuestions,
    };
  }
  private _mapQuestionToViewType(question: Question): OutputQuestionDto {
    let updateInfo = null;
    if (question.updatedAt) updateInfo = question.updatedAt;
    return {
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt: updateInfo,
    };
  }
}
