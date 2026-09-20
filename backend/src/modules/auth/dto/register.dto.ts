import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  /** Shop / stall name for the trader profile created alongside this account. */
  @IsNotEmpty()
  traderName: string;

  @IsOptional()
  ownerName?: string;

  @IsOptional()
  phone?: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
