import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsController } from './brands.controller';
import { ProductsService } from '../products/products.service';
import { BrandsService } from './brands.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchemasModule } from '../schemas/schemas.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    SchemasModule,
  ],
  controllers: [BrandsController],
  providers: [ProductsService, BrandsService],
  exports: [],
})
export class BrandsModule {}
