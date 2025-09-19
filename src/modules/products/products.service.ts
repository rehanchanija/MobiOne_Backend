import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(brandId: string, createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = await this.productModel.create({
      ...createProductDto,
      brandId: new Types.ObjectId(brandId),
    });
    return createdProduct;
  }

  async findAll(brandId: string): Promise<Product[]> {
    return this.productModel.find({ brandId: new Types.ObjectId(brandId) }).exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updateData: any = { ...updateProductDto };
    
    if (updateProductDto.addStock !== undefined) {
      // Use $inc for atomic stock updates
      updateData.$inc = { stock: updateProductDto.addStock };
      delete updateData.addStock;
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Product not found');
    }
  }
}