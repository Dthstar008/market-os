import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateDuesDto {
  @IsUUID()
  levyId: string;

  /** Free-form period label, e.g. "2026-09" for a monthly levy. One invoice is created per active membership per (levy, period). */
  @IsNotEmpty()
  period: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
