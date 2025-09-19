import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Brand } from '../../brands/schemas/brand.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ 
    type: String, 
    required: true,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'Out of Stock'
  })
  status: string;

  @Prop()
  emoji: string;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({
    type: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      allTime: { type: Number, default: 0 },
    },
    default: {
      daily: 0,
      weekly: 0,
      monthly: 0,
      allTime: 0,
    },
  })
  sold: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);