import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { BrandsService } from './brands.service';

@Controller('brands')
// @UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async getAllBrands() {
    return this.brandsService.findAll();
  }

  @Post()
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Put(':id')
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string) {
    return this.brandsService.delete(id);
  }
}