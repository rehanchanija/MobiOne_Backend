import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Product, ProductSchema } from './product.schema';
import { Brand, BrandSchema } from './brand.schema';
import { Category, CategorySchema } from './category.schema';
import { Bill, BillSchema } from './bill.schema';
import { Customer, CustomerSchema } from './customer.schema';
import { Transaction, TransactionSchema } from './transaction.schema';
import { Counter, CounterSchema } from './counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Bill.name, schema: BillSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule {}

