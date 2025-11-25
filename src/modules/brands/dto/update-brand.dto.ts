import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { IsOptional, MinLength } from 'class-validator';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  @IsOptional()
  @MinLength(2)
  name?: string;
}
