import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { MarketExpenseCategory } from '../../../entities';

export class CreateMarketExpenseDto {
  @IsEnum(MarketExpenseCategory)
  category: MarketExpenseCategory;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  description?: string;
}
