import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: 'Brand', index: true, required: true })
  brandId: Types.ObjectId;

  @Prop()
  details?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);


