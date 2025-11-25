import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @MinLength(3)
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;
}
