import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../schemas/user.schema';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Get all notifications
  @Get()
  async getNotifications(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10') || 10));
    return this.notificationsService.getUserNotifications(user._id.toString(), pageNum, limitNum);
  }

  // Get unread count
  @Get('unread/count')
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user._id.toString());
    return { unreadCount: count };
  }

  // Get notifications by type
  @Get('type/:type')
  async getNotificationsByType(
    @GetUser() user: User,
    @Param('type') type: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10') || 10));
    return this.notificationsService.getNotificationsByType(user._id.toString(), type, pageNum, limitNum);
  }

  // Mark notification as read
  @Patch(':id/read')
  async markAsRead(@GetUser() user: User, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId, user._id.toString());
  }

  // Mark all as read
  @Patch('read-all')
  async markAllAsRead(@GetUser() user: User) {
    await this.notificationsService.markAllAsRead(user._id.toString());
    return { success: true };
  }

  // Delete notification
  @Delete(':id')
  async deleteNotification(@GetUser() user: User, @Param('id') notificationId: string) {
    await this.notificationsService.deleteNotification(notificationId, user._id.toString());
    return { success: true };
  }

  // Delete all notifications
  @Delete()
  async deleteAllNotifications(@GetUser() user: User) {
    await this.notificationsService.deleteAllNotifications(user._id.toString());
    return { success: true };
  }
}
