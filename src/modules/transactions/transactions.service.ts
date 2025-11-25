import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';

export interface CreateTransactionDto {
  userId: string;
  billId: string;
  type: 'BILL_CREATED' | 'BILL_UPDATED';
  title: string;
  message: string;
  action?: string;
  data?: Record<string, any>;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  private async generateTransactionNumber(userId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await this.transactionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const serial = String(countToday + 1).padStart(3, '0');
    return `TX-${dateStr}-${serial}`;
  }

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
    const transactionNumber = await this.generateTransactionNumber(dto.userId);
    const t = await this.transactionModel.create({
      userId: new Types.ObjectId(dto.userId),
      billId: new Types.ObjectId(dto.billId),
      transactionNumber,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      action: dto.action,
      data: dto.data || {},
    });
    return t;
  }

  async getById(
    id: string,
    userId: string,
  ): Promise<TransactionDocument | null> {
    const doc = await this.transactionModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    return doc;
  }

  async list(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments({
        userId: new Types.ObjectId(userId),
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      transactions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async listByBill(
    userId: string,
    billId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({
          userId: new Types.ObjectId(userId),
          billId: new Types.ObjectId(billId),
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments({
        userId: new Types.ObjectId(userId),
        billId: new Types.ObjectId(billId),
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      transactions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.transactionModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.transactionModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }
}
