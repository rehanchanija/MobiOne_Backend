import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly brandsService: BrandsService,
  ) {}

  @Get()
  async getAllBrands() {
    return this.brandsService.findAll();
  }

  @Get('total')
  async getTotalBrands() {
    return this.brandsService.count();
  }

  @Post()
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Put(':id')
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }

  @Get(':id/products')
  async getProductsByBrand(@Param('id') id: string) {
    return this.productsService.getProductsByBrand(id);
  }

  @Post(':id/products')
  async createProductUnderBrand(@Param('id') id: string, @Body() dto: CreateProductDto) {
    return this.productsService.createProductUnderBrand(id, dto);
  }
}


