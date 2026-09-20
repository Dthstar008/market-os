import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AddMembershipDto {
  @IsUUID()
  traderId: string;

  @IsOptional()
  @IsNotEmpty()
  section?: string;

  @IsOptional()
  @IsNotEmpty()
  stallNumber?: string;
}
