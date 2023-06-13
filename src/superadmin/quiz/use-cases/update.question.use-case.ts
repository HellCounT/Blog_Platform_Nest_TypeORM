import { CommandHandler } from '@nestjs/cqrs';
import { InputCreateQuestionDto } from '../dto/input.create-question.dto';
import { QuestionsRepository } from '../questions.repository';
import { NotFoundException } from '@nestjs/common';

export class UpdateQuestionCommand {
  constructor(
    public updateQuestionDto: InputCreateQuestionDto,
    public questionId: string,
  ) {}
}
@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase {
  constructor(protected questionsRepo: QuestionsRepository) {}
  async execute(command: UpdateQuestionCommand): Promise<boolean> {
    const question = await this.questionsRepo.getQuestionById(
      command.questionId,
    );
    if (!question) throw new NotFoundException();
    return await this.questionsRepo.updateQuestion(
      command.updateQuestionDto.body,
      command.updateQuestionDto.correctAnswers,
      command.questionId,
    );
  }
}
