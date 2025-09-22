import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(payload: CreateProductDto): Promise<Product> {
    const created = await this.productModel.create({
      ...payload,
      brandId: new Types.ObjectId(payload.brandId),
    });
    return created.toObject();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().sort({ createdAt: -1 }).lean();
  }

  async findByBrand(brandId: string): Promise<Product[]> {
    if (!Types.ObjectId.isValid(brandId)) {
      throw new BadRequestException('Invalid brand id');
    }
    return this.productModel.find({ brandId }).sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string): Promise<Product> {
    const item = await this.productModel.findById(id).lean();
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async update(id: string, payload: UpdateProductDto): Promise<Product> {
    const update: any = { ...payload };
    if (payload.brandId) {
      if (!Types.ObjectId.isValid(payload.brandId)) {
        throw new BadRequestException('Invalid brand id');
      }
      update.brandId = new Types.ObjectId(payload.brandId);
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
    return { deleted: true };
  }
}


