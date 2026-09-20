import { IsNotEmpty } from 'class-validator';

export class JoinMarketAdminDto {
  @IsNotEmpty()
  code: string;
}
