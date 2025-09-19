import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  emoji: string;
}

export class UpdateBrandDto {
  @IsString()
  name?: string;

  @IsString()
  emoji?: string;
}