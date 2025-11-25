import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../schemas/user.schema';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(AuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post('customers')
  createCustomer(
    @Body() body: { name: string; phone?: string; address?: string },
  ) {
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
    },
    @GetUser() user: User,
  ) {
    return this.billsService.createBill(body, user._id.toString());
  }

  @Get()
  listBills(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10') || 10));
    return this.billsService.listBillsPaginated(
      pageNum,
      limitNum,
      user._id.toString(),
    );
  }

  @Get('debug/populate-check')
  async debugPopulateCheck(@GetUser() user: User) {
    return this.billsService.debugPopulateCheck(user._id.toString());
  }

  @Get(':id')
  getBill(@Param('id') id: string) {
    return this.billsService.getBill(id);
  }

  @Patch(':id')
  updateBill(
    @Param('id') id: string,
    @Body() updateData: any,
    @GetUser() user: User,
  ) {
    return this.billsService.updateBill(id, updateData, user._id.toString());
  }

  @Delete(':id')
  deleteBill(@Param('id') id: string, @GetUser() user: User) {
    return this.billsService.deleteBill(id, user._id.toString());
  }
}
