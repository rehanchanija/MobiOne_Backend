import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}
