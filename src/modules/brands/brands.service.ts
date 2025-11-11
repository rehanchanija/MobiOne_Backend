import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  async findAll() {
    return this.brandModel.find().lean();
  }

  async create(dto: CreateBrandDto, userId?: string) {
    const name = dto.name.trim();
    const created = (await this.brandModel.create({ name })).toObject();

    // Create BRAND_CREATED notification
    if (userId) {
      try {
        await this.notificationsService.createNotification({
          userId,
          type: 'BRAND_CREATED',
          title: 'New Brand Created',
          message: `Brand "${created.name}" has been created`,
          data: {
            brandId: (created._id as Types.ObjectId).toString(),
            brandName: created.name,
          },
        });
      } catch (err) {
        // Log error but don't fail brand creation if notification fails
        console.error('Failed to create BRAND_CREATED notification:', err);
      }
    }

    return created;
  }

  async update(id: string, dto: UpdateBrandDto, userId?: string) {
    const _id = this.ensureObjectId(id);
    const updated = await this.brandModel.findByIdAndUpdate(
      _id,
      { $set: { ...(dto.name ? { name: dto.name.trim() } : {}) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Brand not found');

    // Create BRAND_UPDATED notification
    if (userId) {
      try {
        await this.notificationsService.createNotification({
          userId,
          type: 'BRAND_UPDATED',
          title: 'Brand Updated',
          message: `Brand "${updated.name}" has been updated`,
          data: {
            brandId: (updated._id as Types.ObjectId).toString(),
            brandName: updated.name,
          },
        });
      } catch (err) {
        // Log error but don't fail brand update if notification fails
        console.error('Failed to create BRAND_UPDATED notification:', err);
      }
    }

    return updated.toObject();
  }

  async count() {
    return { total: await this.brandModel.countDocuments({}) };
  }

  async remove(id: string, userId?: string) {
    const _id = this.ensureObjectId(id);
    const deleted = await this.brandModel.findByIdAndDelete(_id);
    if (!deleted) throw new NotFoundException('Brand not found');

    // Create BRAND_DELETED notification
    if (userId) {
      try {
        await this.notificationsService.createNotification({
          userId,
          type: 'BRAND_DELETED',
          title: 'Brand Deleted',
          message: `Brand "${deleted.name}" has been deleted`,
          data: {
            brandId: (deleted._id as Types.ObjectId).toString(),
            brandName: deleted.name,
          },
        });
      } catch (err) {
        // Log error but don't fail brand deletion if notification fails
        console.error('Failed to create BRAND_DELETED notification:', err);
      }
    }

    return { success: true };
  }
}


