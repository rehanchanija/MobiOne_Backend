import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(10)
  phone?: string;

  @IsString()
  @IsOptional()
  shopName?: string;

  @IsString()
  @IsOptional()
  shopDetails?: string;
}
