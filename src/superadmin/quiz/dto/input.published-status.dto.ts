import { IsBoolean } from 'class-validator';

export class InputPublishedStatusDto {
  @IsBoolean()
  published: boolean;
}
