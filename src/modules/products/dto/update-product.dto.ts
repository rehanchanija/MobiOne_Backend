import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsMongoId()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  details?: string;
}


