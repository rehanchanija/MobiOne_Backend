import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  async getAll() {
    return this.categoryModel.find().lean();
  }

  async create(dto: CreateCategoryDto) {
    return (
      await this.categoryModel.create({ name: dto.name.trim() })
    ).toObject();
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
    
    // Check if category exists first
    const category = await this.categoryModel.findById(_id);
    if (!category) throw new NotFoundException('Category not found');

    // Check if any products exist under this category
    const productsInCategory = await this.productModel.countDocuments({
      category: _id,
    });

    if (productsInCategory > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" - Category has ${productsInCategory} product(s). Please delete all products before deleting the category.`,
      );
    }

    // Proceed with deletion
    const deleted = await this.categoryModel.findByIdAndDelete(_id);
    return { success: true };
  }
}
