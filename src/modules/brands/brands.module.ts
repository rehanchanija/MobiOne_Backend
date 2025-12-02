import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsController } from './brands.controller';
import { ProductsService } from '../products/products.service';
import { BrandsService } from './brands.service';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Brand, BrandSchema } from '../schemas/brand.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Bill, BillSchema } from '../schemas/bill.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Bill.name, schema: BillSchema },
    ]),
  ],
  controllers: [BrandsController],
  providers: [ProductsService, BrandsService],
  exports: [],
})
export class BrandsModule {}
