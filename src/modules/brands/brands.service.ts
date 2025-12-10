import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Bill, BillDocument } from '../schemas/bill.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Bill.name) private readonly billModel: Model<BillDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  async findAll() {
    return this.brandModel.find().lean();
  }

  async create(dto: CreateBrandDto, userId?: string) {
    const name = dto.name.trim();
    const created = (await this.brandModel.create({ name })).toObject();

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

    return updated.toObject();
  }

  async count() {
    return { total: await this.brandModel.countDocuments({}) };
  }

  async remove(id: string, userId?: string) {
    const _id = this.ensureObjectId(id);

    // Get the brand first to check for products and bill references
    const brand = await this.brandModel.findById(_id);
    if (!brand) throw new NotFoundException('Brand not found');

    // Check if brand has any products
    const productsInBrand = await this.productModel.countDocuments({
      brand: _id,
    });
    if (productsInBrand > 0) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}" - Brand has ${productsInBrand} product(s). Please delete all products before deleting the brand.`,
      );
    }

    // Check if any bills contain products from this brand (through product references)
    const billsWithBrandProducts = await this.billModel.countDocuments({
      'items.product': {
        $in: await this.productModel.find({ brand: _id }).select('_id'),
      },
    });

    if (billsWithBrandProducts > 0) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}" - Brand has been used in bills. Brands with bill history cannot be deleted.`,
      );
    }

    // Proceed with deletion
    const deleted = await this.brandModel.findByIdAndDelete(_id);
    if (!deleted) throw new NotFoundException('Brand not found');

    return { success: true };
  }
}
