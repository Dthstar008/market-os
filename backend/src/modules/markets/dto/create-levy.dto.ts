import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { LevyFrequency } from '../../../entities';

export class CreateLevyDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(LevyFrequency)
  frequency: LevyFrequency;
}
