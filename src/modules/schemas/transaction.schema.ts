import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  BILL_CREATED = 'BILL_CREATED',
  BILL_UPDATED = 'BILL_UPDATED',
  BILL_DELETED = 'BILL_DELETED',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Bill', required: true })
  billId: Types.ObjectId;

  @Prop({
    type: String,
    enum: TransactionType,
    required: true,
  })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);