import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listAll(@Query('q') q?: string) {
    // simple search to support filtering if needed later
    return this.productsService.listAll(q);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}


