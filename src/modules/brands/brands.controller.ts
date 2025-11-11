import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(AuthGuard)
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
  async createBrand(@Body() dto: CreateBrandDto, @GetUser() user: any) {
    return this.brandsService.create(dto, user._id?.toString());
  }

  @Put(':id')
  async updateBrand(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @GetUser() user: any,
  ) {
    return this.brandsService.update(id, dto, user._id?.toString());
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string, @GetUser() user: any) {
    return this.brandsService.remove(id, user._id?.toString());
  }

  @Get(':id/products')
  async getProductsByBrand(@Param('id') id: string) {
    return this.productsService.getProductsByBrand(id);
  }

  @Post(':id/products')
  async createProductUnderBrand(
    @Param('id') id: string,
    @Body() dto: CreateProductDto,
    @GetUser() user: any,
  ) {
    return this.productsService.createProductUnderBrand(id, dto, user._id?.toString());
  }

  @Get(':id/stock')
  async getBrandStockTotal(@Param('id') id: string) {
    return this.productsService.getTotalStockByBrand(id);
  }

  @Get(':id/product-count')
  async getBrandProductCount(@Param('id') id: string) {
    return this.productsService.getProductCountByBrand(id);
  }
}


