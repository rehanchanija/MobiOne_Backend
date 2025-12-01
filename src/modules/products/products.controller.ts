import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(AuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('dashboard/count')
  async getTotalProductsCount() {
    return this.productsService.getTotalProductsCount();
  }

  @Get('dashboard/stock')
  async getTotalStock() {
    return this.productsService.getTotalStock();
  }

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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @GetUser() user: any,
  ) {
    return this.productsService.updateProduct(id, dto, user._id?.toString());
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: any) {
    return this.productsService.deleteProduct(id, user._id?.toString());
  }
}
