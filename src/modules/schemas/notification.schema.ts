import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Document & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type:
    | 'LOW_STOCK'
    | 'PAYMENT_PENDING'
    | 'BILL_CREATED';
  title: string;
  message: string;
  data: {
    productId?: string;
    billId?: string;
    productName?: string;
    currentStock?: number;
    minimumStock?: number;
    pendingAmount?: number;
    daysOverdue?: number;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    enum: [
      'LOW_STOCK',
      'PAYMENT_PENDING',
      'BILL_CREATED',
    ],
    required: true,
    index: true,
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({ default: Date.now, index: true })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
