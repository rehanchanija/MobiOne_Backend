import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { User } from '../schemas/user.schema';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@GetUser() user: User) {
    return this.transactionsService.findByUserId(user._id.toString());
  }

  @Get('bill/:id')
  findByBillId(@Param('id') billId: string) {
    return this.transactionsService.findByBillId(billId);
  }
}