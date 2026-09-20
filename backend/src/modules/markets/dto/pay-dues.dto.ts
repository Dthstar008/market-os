import { IsOptional } from 'class-validator';

export class PayDuesDto {
  @IsOptional()
  note?: string;
}
