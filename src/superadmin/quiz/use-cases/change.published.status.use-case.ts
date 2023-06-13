import { CommandHandler } from '@nestjs/cqrs';
import { InputPublishedStatusDto } from '../dto/input.published-status.dto';
import { QuestionsRepository } from '../questions.repository';
import { NotFoundException } from '@nestjs/common';

export class ChangePublishedStatusCommand {
  constructor(
    public publishedStatusDto: InputPublishedStatusDto,
    public questionId: string,
  ) {}
}
@CommandHandler(ChangePublishedStatusCommand)
export class ChangePublishedStatusUseCase {
  constructor(protected questionsRepo: QuestionsRepository) {}
  async execute(command: ChangePublishedStatusCommand): Promise<boolean> {
    const question = await this.questionsRepo.getQuestionById(
      command.questionId,
    );
    if (!question) throw new NotFoundException();
    return await this.questionsRepo.changePublishedStatus(
      command.publishedStatusDto.published,
      command.questionId,
    );
  }
}
