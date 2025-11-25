import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Customer } from './customer.schema';

export type BillDocument = Document & {
  _id: Types.ObjectId;
  customer: Types.ObjectId | (Customer & { _id: Types.ObjectId });
  userId: Types.ObjectId;
  billNumber: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

@Schema()
export class BillItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number; // unit price at time of sale
}

const BillItemSchema = SchemaFactory.createForClass(BillItem);

@Schema({ timestamps: true })
export class Bill {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  billNumber: string;

  @Prop({ type: [BillItemSchema], default: [] })
  items: BillItem[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  total: number;

  @Prop({ enum: ['Cash', 'Online'], required: true })
  paymentMethod: 'Cash' | 'Online';

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ enum: ['Paid', 'Pending'], required: true })
  status: 'Paid' | 'Pending';
}

export const BillSchema = SchemaFactory.createForClass(Bill);
