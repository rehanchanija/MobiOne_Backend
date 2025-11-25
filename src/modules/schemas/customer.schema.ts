import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Ensure _id has a concrete type instead of unknown (Mongoose v7)
export type CustomerDocument = Document<unknown, {}, Customer> &
  Customer & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
