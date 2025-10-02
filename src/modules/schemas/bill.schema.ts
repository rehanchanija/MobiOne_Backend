import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BillDocument = Bill & Document;

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


