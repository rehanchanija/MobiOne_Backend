import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill, BillSchema } from '../schemas/bill.schema';
import { Customer, CustomerSchema } from '../schemas/customer.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Brand, BrandSchema } from '../schemas/brand.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    TransactionsModule,
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [],
})
export class BillsModule {}
