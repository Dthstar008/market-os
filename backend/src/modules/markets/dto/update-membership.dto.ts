import { IsEnum, IsOptional } from 'class-validator';
import { MembershipStatus } from '../../../entities';

export class UpdateMembershipDto {
  @IsOptional()
  section?: string;

  @IsOptional()
  stallNumber?: string;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
