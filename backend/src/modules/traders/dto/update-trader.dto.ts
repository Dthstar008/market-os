import { IsOptional } from 'class-validator';

export class UpdateTraderDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  ownerName?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  photoUrl?: string;

  @IsOptional()
  emergencyContact?: string;
}
