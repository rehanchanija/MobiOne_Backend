import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Types } from 'mongoose';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      userId: new Types.ObjectId(userId),
      billId: new Types.ObjectId(createTransactionDto.billId),
    });
    return transaction.save();
  }

  async findAll() {
    return this.transactionModel.find().populate('billId').exec();
  }

  async findByBillId(billId: string) {
    return this.transactionModel
      .find({ billId: new Types.ObjectId(billId) })
      .populate('billId')
      .exec();
  }

  async findByUserId(userId: string) {
    return this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('billId')
      .exec();
  }
}