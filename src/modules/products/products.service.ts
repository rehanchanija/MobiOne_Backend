import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private ensureObjectId(id: string, field: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${field} is invalid`);
    }
    return new Types.ObjectId(id);
  }

  async getAllBrands() {
    return this.brandModel.find().lean();
  }

  async getProductsByBrand(brandId: string) {
    const brandObjectId = this.ensureObjectId(brandId, 'brandId');
    const brand = await this.brandModel.findById(brandObjectId).lean();
    if (!brand) throw new NotFoundException('Brand not found');
    return this.productModel.find({ brand: brandObjectId }).lean();
  }

  async getTotalStockByBrand(brandId: string) {
    const brandObjectId = this.ensureObjectId(brandId, 'brandId');
    const brand = await this.brandModel.findById(brandObjectId).lean();
    if (!brand) throw new NotFoundException('Brand not found');

    const result = await this.productModel.aggregate([
      { $match: { brand: brandObjectId } },
      { $group: { _id: null, total: { $sum: '$stock' } } },
    ]);

    const total = result[0]?.total ?? 0;
    return { stockTotal: total };
  }

  async getProductCountByBrand(brandId: string) {
    const brandObjectId = this.ensureObjectId(brandId, 'brandId');
    const brand = await this.brandModel.findById(brandObjectId).lean();
    if (!brand) throw new NotFoundException('Brand not found');
    const count = await this.productModel.countDocuments({ brand: brandObjectId });
    return { productCount: count };
  }

  async createProductUnderBrand(brandId: string, dto: CreateProductDto) {
    const brandObjectId = this.ensureObjectId(brandId, 'brandId');

    const brand = await this.brandModel.findById(brandObjectId);
    if (!brand) throw new NotFoundException('Brand not found');

    const categoryObjectId = this.ensureObjectId(dto.categoryId, 'categoryId');
    const category = await this.categoryModel.findById(categoryObjectId);
    if (!category) throw new NotFoundException('Category not found');

    const created = await this.productModel.create({
      name: dto.name,
      description: dto.description ?? '',
      barcode: dto.barcode ?? undefined,
      price: dto.price,
      stock: dto.stock,
      brand: brandObjectId,
      category: categoryObjectId,
    });

    await this.brandModel.updateOne({ _id: brandObjectId }, { $addToSet: { products: created._id } });
    await this.categoryModel.updateOne({ _id: categoryObjectId }, { $addToSet: { products: created._id } });

    return created.toObject();
  }

  async getProductById(id: string) {
    const objectId = this.ensureObjectId(id, 'id');
    const product = await this.productModel.findById(objectId).populate('brand').populate('category').lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const objectId = this.ensureObjectId(id, 'id');

    const update: any = { ...dto };

    if (dto.brandId) {
      const brandObjectId = this.ensureObjectId(dto.brandId, 'brandId');
      const brand = await this.brandModel.findById(brandObjectId);
      if (!brand) throw new NotFoundException('Brand not found');
      update.brand = brandObjectId;
      delete update.brandId;
    }

    if (dto.categoryId) {
      const categoryObjectId = this.ensureObjectId(dto.categoryId, 'categoryId');
      const category = await this.categoryModel.findById(categoryObjectId);
      if (!category) throw new NotFoundException('Category not found');
      update.category = categoryObjectId;
      delete update.categoryId;
    }

    const product = await this.productModel.findByIdAndUpdate(objectId, update, { new: true });
    if (!product) throw new NotFoundException('Product not found');
    return product.toObject();
  }

  async deleteProduct(id: string) {
    const objectId = this.ensureObjectId(id, 'id');
    const deleted = await this.productModel.findByIdAndDelete(objectId);
    if (!deleted) throw new NotFoundException('Product not found');
    // cleanup references
    await this.brandModel.updateOne({ _id: deleted.brand }, { $pull: { products: deleted._id } });
    await this.categoryModel.updateOne({ _id: deleted.category }, { $pull: { products: deleted._id } });
    return { success: true };
  }
}


