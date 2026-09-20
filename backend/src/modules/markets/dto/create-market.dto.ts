import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMarketDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  description?: string;
}
