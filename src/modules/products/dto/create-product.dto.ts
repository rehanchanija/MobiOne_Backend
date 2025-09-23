import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  // Note: brandId is omitted for brand-scoped creation; use params
  @IsMongoId()
  categoryId: string;
}


