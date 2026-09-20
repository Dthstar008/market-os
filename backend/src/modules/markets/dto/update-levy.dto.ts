import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateLevyDto } from './create-levy.dto';

export class UpdateLevyDto extends PartialType(CreateLevyDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
