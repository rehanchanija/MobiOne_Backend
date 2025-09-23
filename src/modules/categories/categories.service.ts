import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  async getAll() {
    return this.categoryModel.find().lean();
  }

  async create(dto: CreateCategoryDto) {
    return (await this.categoryModel.create({ name: dto.name.trim() })).toObject();
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const _id = this.ensureObjectId(id);
    const updated = await this.categoryModel.findByIdAndUpdate(
      _id,
      { $set: { ...(dto.name ? { name: dto.name.trim() } : {}) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Category not found');
    return updated.toObject();
  }

  async remove(id: string) {
    const _id = this.ensureObjectId(id);
    const deleted = await this.categoryModel.findByIdAndDelete(_id);
    if (!deleted) throw new NotFoundException('Category not found');
    return { success: true };
  }
}


