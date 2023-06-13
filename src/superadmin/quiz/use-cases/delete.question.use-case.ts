import { QuestionsRepository } from '../questions.repository';
import { CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';

export class DeleteQuestionCommand {
  constructor(public questionId: string) {}
}
@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase {
  constructor(protected questionsRepo: QuestionsRepository) {}
  async execute(command: DeleteQuestionCommand): Promise<boolean> {
    const question = await this.questionsRepo.getQuestionById(
      command.questionId,
    );
    if (!question) throw new NotFoundException();
    return await this.questionsRepo.deleteQuestion(command.questionId);
  }
}
