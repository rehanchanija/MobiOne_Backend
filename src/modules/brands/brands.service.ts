import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>) {}

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  async findAll() {
    return this.brandModel.find().lean();
  }

  async create(dto: CreateBrandDto) {
    const name = dto.name.trim();
    return (await this.brandModel.create({ name })).toObject();
  }

  async update(id: string, dto: UpdateBrandDto) {
    const _id = this.ensureObjectId(id);
    const updated = await this.brandModel.findByIdAndUpdate(
      _id,
      { $set: { ...(dto.name ? { name: dto.name.trim() } : {}) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Brand not found');
    return updated.toObject();
  }

  async count() {
    return { total: await this.brandModel.countDocuments({}) };
  }

  async remove(id: string) {
    const _id = this.ensureObjectId(id);
    const deleted = await this.brandModel.findByIdAndDelete(_id);
    if (!deleted) throw new NotFoundException('Brand not found');
    return { success: true };
  }
}


