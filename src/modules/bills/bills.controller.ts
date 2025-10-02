import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BillsService } from './bills.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post('customers')
  createCustomer(@Body() body: { name: string; phone?: string; address?: string }) {
    return this.billsService.createCustomer(body);
  }

  @Get('customers')
  listCustomers() {
    return this.billsService.listCustomers();
  }

  @Post()
  createBill(
    @Body()
    body: {
      customerId?: string;
      customer?: { name: string; phone?: string; address?: string };
      items: { productId: string; quantity: number }[];
      discount?: number;
      paymentMethod: 'Cash' | 'Online';
      amountPaid: number;
    }
  ) {
    return this.billsService.createBill(body);
  }

  @Get(':id')
  getBill(@Param('id') id: string) {
    return this.billsService.getBill(id);
  }

  @Get()
  listBills() {
    return this.billsService.listBills();
  }
}


