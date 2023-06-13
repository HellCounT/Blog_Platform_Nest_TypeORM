import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BasicAuthGuard } from '../../auth/guards/basic-auth.guard';
import {
  parseQuestionQueryPagination,
  QuestionQueryParserType,
} from '../../application-helpers/query-parser-type';
import { InputCreateQuestionDto } from './dto/input.create-question.dto';
import { OutputQuestionDto } from './dto/output.question.dto';
import { PaginatorType } from '../../application-helpers/paginator.type';
import { InputPublishedStatusDto } from './dto/input.published-status.dto';
import { CreateQuestionCommand } from './use-cases/create.question.use-case';
import { DeleteQuestionCommand } from './use-cases/delete.question.use-case';
import { UpdateQuestionCommand } from './use-cases/update.question.use-case';
import { ChangePublishedStatusCommand } from './use-cases/change.published.status.use-case';
import { SuperAdminQuestionsQueryRepository } from './super-admin.questions.query';

@UseGuards(BasicAuthGuard)
@Controller('sa/quiz/questions')
export class SuperAdminQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly superAdminQuestionsQueryRepo: SuperAdminQuestionsQueryRepository,
  ) {}
  @Get()
  @HttpCode(200)
  getAllQuestions(
    @Query() query: QuestionQueryParserType,
  ): Promise<PaginatorType<OutputQuestionDto>> {
    const queryParams: QuestionQueryParserType =
      parseQuestionQueryPagination(query);
    return this.superAdminQuestionsQueryRepo.viewAllQuestions(queryParams);
  }
  @Post()
  @HttpCode(201)
  async createQuestion(
    @Body() createQuestionDto: InputCreateQuestionDto,
  ): Promise<OutputQuestionDto> {
    return await this.commandBus.execute(
      new CreateQuestionCommand(createQuestionDto),
    );
  }
  @Delete(':id')
  @HttpCode(204)
  async deleteQuestion(@Param('id') id: string) {
    return await this.commandBus.execute(new DeleteQuestionCommand(id));
  }
  @Put(':id')
  @HttpCode(204)
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: InputCreateQuestionDto,
  ) {
    await this.commandBus.execute(
      new UpdateQuestionCommand(updateQuestionDto, id),
    );
    return;
  }
  @Put(':id/publish')
  @HttpCode(204)
  async changePublishedStatus(
    @Param('id') id: string,
    @Body() publishedStatusDto: InputPublishedStatusDto,
  ) {
    await this.commandBus.execute(
      new ChangePublishedStatusCommand(publishedStatusDto, id),
    );
    return;
  }
}
