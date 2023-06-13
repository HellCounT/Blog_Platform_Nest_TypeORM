import { InputCreateQuestionDto } from '../dto/input.create-question.dto';
import { CommandHandler } from '@nestjs/cqrs';
import { OutputQuestionDto } from '../dto/output.question.dto';
import { QuestionsRepository } from '../questions.repository';

export class CreateQuestionCommand {
  constructor(public createQuestionDto: InputCreateQuestionDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase {
  constructor(protected questionsRepo: QuestionsRepository) {}
  async execute(command: CreateQuestionCommand): Promise<OutputQuestionDto> {
    const createdQuestion = await this.questionsRepo.createQuestion(
      command.createQuestionDto.body,
      command.createQuestionDto.correctAnswers,
    );
    return {
      id: createdQuestion.id,
      body: createdQuestion.body,
      correctAnswers: createdQuestion.correctAnswers,
      published: createdQuestion.published,
      createdAt: createdQuestion.createdAt.toISOString(),
      updatedAt: createdQuestion.updatedAt.toISOString(),
    };
  }
}
