import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ name: 1 }, { unique: true });
