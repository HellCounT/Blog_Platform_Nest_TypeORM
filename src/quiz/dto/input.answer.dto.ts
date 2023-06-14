import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../auth/decorators/validation-decorators/trim.decorator';

export class InputAnswerDto {
  @IsString({ message: 'Invalid format' })
  @IsNotEmpty({ message: 'Field is not provided' })
  @Trim()
  answer: string;
}
