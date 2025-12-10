import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

export interface CreateNotificationDto {
  userId: string;
  type:
    | 'LOW_STOCK'
    | 'PAYMENT_PENDING'
    | 'BILL_CREATED';
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create a notification
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data || {},
    });
    return notification;
  }

  // Get all notifications for a user
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    console.log(
      '📌 getUserNotifications called with userId:',
      userId,
      'page:',
      page,
      'limit:',
      limit,
    );

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
      }),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        read: false,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(
      '✅ Found notifications:',
      notifications.length,
      'total:',
      total,
      'unreadCount:',
      unreadCount,
    );

    return {
      notifications: notifications as NotificationDocument[],
      total,
      unreadCount,
      page,
      limit,
      totalPages,
    };
  }

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { read: true },
      { new: true },
    );
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
  }

  // Delete a notification
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationModel.deleteOne({
      _id: notificationId,
      userId: new Types.ObjectId(userId),
    });
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  // Get notifications by type
  async getNotificationsByType(
    userId: string,
    type: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({
          userId: new Types.ObjectId(userId),
          type,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        type,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notifications as NotificationDocument[],
      total,
      page,
      limit,
      totalPages,
    };
  }
}
