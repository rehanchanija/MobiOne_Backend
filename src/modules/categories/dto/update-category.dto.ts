import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, MinLength } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @MinLength(2)
  name?: string;
}
