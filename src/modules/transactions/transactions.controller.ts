import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import type { CreateTransactionDto } from './transactions.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../schemas/user.schema';

@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(@Body() body: CreateTransactionDto, @GetUser() user: User) {
    const dto = { ...body, userId: user._id.toString() };
    return this.transactionsService.create(dto);
  }

  @Get()
  async list(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10') || 10));
    return this.transactionsService.list(
      user._id.toString(),
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string, @GetUser() user: User) {
    return this.transactionsService.getById(id, user._id.toString());
  }

  @Get('bill/:billId')
  async listByBill(
    @Param('billId') billId: string,
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10') || 10));
    return this.transactionsService.listByBill(
      user._id.toString(),
      billId,
      pageNum,
      limitNum,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @GetUser() user: User) {
    await this.transactionsService.delete(id, user._id.toString());
    return { success: true };
  }

  @Delete()
  async deleteAll(@GetUser() user: User) {
    await this.transactionsService.deleteAll(user._id.toString());
    return { success: true };
  }
}
