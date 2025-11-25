import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Document & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  billId: Types.ObjectId;
  transactionNumber: string;
  type: 'BILL_CREATED' | 'BILL_UPDATED';
  title: string;
  message: string;
  action?: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bill', required: true, index: true })
  billId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  transactionNumber: string;

  @Prop({ enum: ['BILL_CREATED', 'BILL_UPDATED'], required: true, index: true })
  type: 'BILL_CREATED' | 'BILL_UPDATED';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  action?: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ billId: 1, createdAt: -1 });
