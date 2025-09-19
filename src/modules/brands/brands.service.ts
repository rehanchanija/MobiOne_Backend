import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async findAll() {
    const brands = await this.brandModel.find().exec();
    const totalBrands = await this.brandModel.countDocuments();
    
    // Get product counts for each brand
    const brandsWithCounts = await Promise.all(
      brands.map(async (brand) => {
        const totalProducts = await this.brandModel.aggregate([
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'brandId',
              as: 'products',
            },
          },
          {
            $match: { _id: brand._id },
          },
          {
            $project: {
              totalProducts: { $size: '$products' },
            },
          },
        ]);

        return {
          ...brand.toJSON(),
          totalProducts: totalProducts[0]?.totalProducts || 0,
        };
      }),
    );

    return {
      brands: brandsWithCounts,
      totalBrands,
    };
  }

  async create(createBrandDto: CreateBrandDto) {
    const createdBrand = new this.brandModel(createBrandDto);
    return createdBrand.save();
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const updatedBrand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true })
      .exec();

    if (!updatedBrand) {
      throw new NotFoundException('Brand not found');
    }

    return updatedBrand;
  }

  async delete(id: string) {
    const deletedBrand = await this.brandModel.findByIdAndDelete(id).exec();
    
    if (!deletedBrand) {
      throw new NotFoundException('Brand not found');
    }

    return { message: 'Brand deleted successfully' };
  }
}