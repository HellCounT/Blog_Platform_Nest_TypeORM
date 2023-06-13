import { IsArray, IsNotEmpty, IsString, Length } from 'class-validator';
import { Trim } from '../../../auth/decorators/validation-decorators/trim.decorator';

export class InputCreateQuestionDto {
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @Trim()
  body: string;

  @IsNotEmpty()
  @IsArray()
  correctAnswers: string[];
}
