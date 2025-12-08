import { Module } from '@nestjs/common';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SchemasModule } from '../schemas/schemas.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    TransactionsModule,
    SchemasModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [],
})
export class BillsModule {}
