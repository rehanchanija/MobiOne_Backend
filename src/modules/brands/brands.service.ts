import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async create(payload: CreateBrandDto): Promise<Brand> {
    const created = await this.brandModel.create(payload);
    return created.toObject();
  }

  async findAll(): Promise<Brand[]> {
    return this.brandModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string): Promise<Brand> {
    const item = await this.brandModel.findById(id).lean();
    if (!item) throw new NotFoundException('Brand not found');
    return item;
  }

  async update(id: string, payload: UpdateBrandDto): Promise<Brand> {
    const updated = await this.brandModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Brand not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.brandModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Brand not found');
    return { deleted: true };
  }
}


