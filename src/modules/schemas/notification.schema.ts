import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Document & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED' | 'LOW_STOCK' | 'PAYMENT_PENDING' | 'BILL_CREATED' | 'BRAND_CREATED' | 'BRAND_UPDATED' | 'BRAND_DELETED';
  title: string;
  message: string;
  data: {
    productId?: string;
    brandId?: string;
    billId?: string;
    productName?: string;
    brandName?: string;
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
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_DELETED',
      'LOW_STOCK',
      'PAYMENT_PENDING',
      'BILL_CREATED',
      'BRAND_CREATED',
      'BRAND_UPDATED',
      'BRAND_DELETED',
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
