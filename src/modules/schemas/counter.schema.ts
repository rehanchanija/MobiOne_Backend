import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: 0 })
  count: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

// Composite unique index on userId + year
CounterSchema.index({ userId: 1, year: 1 }, { unique: true });
