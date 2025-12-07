import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Bill, BillDocument } from '../schemas/bill.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Bill.name) private readonly billModel: Model<BillDocument>,
    private notificationsService: NotificationsService,
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

  async listAll(q?: string) {
    const filter: any = {};
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }
    return this.productModel.find(filter).populate('brand').lean();
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
    const count = await this.productModel.countDocuments({
      brand: brandObjectId,
    });
    return { productCount: count };
  }

  async getTotalProductsCount() {
    const totalProducts = await this.productModel.countDocuments();
    return { totalProducts };
  }

  async getTotalStock() {
    const result = await this.productModel.aggregate([
      { $group: { _id: null, totalStock: { $sum: '$stock' } } },
    ]);

    const totalStock = result[0]?.totalStock ?? 0;
    return { totalStock };
  }

  async createProductUnderBrand(
    brandId: string,
    dto: CreateProductDto,
    userId?: string,
  ) {
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

    await this.brandModel.updateOne(
      { _id: brandObjectId },
      { $addToSet: { products: created._id } },
    );
    await this.categoryModel.updateOne(
      { _id: categoryObjectId },
      { $addToSet: { products: created._id } },
    );

    // Create PRODUCT_CREATED notification
    if (userId) {
      try {
        await this.notificationsService.createNotification({
          userId,
          type: 'PRODUCT_CREATED',
          title: 'New Product Created',
          message: `Product "${created.name}" has been created under brand "${brand.name}"`,
          data: {
            productId: (created._id as Types.ObjectId).toString(),
            productName: created.name,
            brandId: (brand._id as Types.ObjectId).toString(),
            brandName: brand.name,
          },
        });
      } catch (err) {
        // Log error but don't fail product creation if notification fails
        console.error('Failed to create PRODUCT_CREATED notification:', err);
      }
    }

    return created.toObject();
  }

  async getProductById(id: string) {
    const objectId = this.ensureObjectId(id, 'id');
    const product = await this.productModel
      .findById(objectId)
      .populate('brand')
      .populate('category')
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto, userId?: string) {
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
      const categoryObjectId = this.ensureObjectId(
        dto.categoryId,
        'categoryId',
      );
      const category = await this.categoryModel.findById(categoryObjectId);
      if (!category) throw new NotFoundException('Category not found');
      update.category = categoryObjectId;
      delete update.categoryId;
    }

    // Get old product to check stock change
    const oldProduct = await this.productModel.findById(objectId).lean();
    if (!oldProduct) throw new NotFoundException('Product not found');

    const product = await this.productModel.findByIdAndUpdate(
      objectId,
      update,
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');

    // Create PRODUCT_UPDATED notification
    if (userId) {
      try {
        const brand = await this.brandModel.findById(product.brand).lean();
        await this.notificationsService.createNotification({
          userId,
          type: 'PRODUCT_UPDATED',
          title: 'Product Updated',
          message: `Product "${product.name}" has been updated`,
          data: {
            productId: (product._id as Types.ObjectId).toString(),
            productName: product.name,
            brandId: brand
              ? (brand._id as Types.ObjectId).toString()
              : undefined,
            brandName: brand?.name,
          },
        });
      } catch (err) {
        // Log error but don't fail product update if notification fails
        console.error('Failed to create PRODUCT_UPDATED notification:', err);
      }
    }

    // Check if stock was updated and is now at or below 5
    if (dto.stock !== undefined && product.stock <= 5 && oldProduct.stock > 5) {
      if (userId) {
        try {
          const brand = await this.brandModel.findById(product.brand).lean();
          await this.notificationsService.createNotification({
            userId,
            type: 'LOW_STOCK',
            title: '⚠️ Low Stock Alert',
            message: `Only ${product.stock} units remaining for "${product.name}"`,
            data: {
              productId: (product._id as Types.ObjectId).toString(),
              productName: product.name,
              stock: product.stock,
              brandId: brand
                ? (brand._id as Types.ObjectId).toString()
                : undefined,
              brandName: brand?.name,
            },
          });
        } catch (err) {
          console.error('Failed to create LOW_STOCK notification:', err);
        }
      }
    }

    return product.toObject();
  }

  async deleteProduct(id: string, userId?: string) {
    const objectId = this.ensureObjectId(id, 'id');

    // Get the product first to check stock and references
    const product = await this.productModel.findById(objectId);
    if (!product) throw new NotFoundException('Product not found');

    // Check if product has stock greater than 0
    if (product.stock > 0) {
      throw new BadRequestException(
        `Cannot delete product "${product.name}" - Product still has stock (${product.stock} units). Please sell all units before deletion.`,
      );
    }

    // Check if product has been used in any bill
    const billWithProduct = await this.billModel
      .findOne({
        'items.product': objectId,
      })
      .lean();

    if (billWithProduct) {
      throw new BadRequestException(
        `Cannot delete product "${product.name}" - Product has been used in bill #${billWithProduct.billNumber}. Products with bill history cannot be deleted.`,
      );
    }

    // Proceed with deletion
    const deleted = await this.productModel.findByIdAndDelete(objectId);
    if (!deleted) throw new NotFoundException('Product not found');

    // cleanup references
    await this.brandModel.updateOne(
      { _id: deleted.brand },
      { $pull: { products: deleted._id } },
    );
    await this.categoryModel.updateOne(
      { _id: deleted.category },
      { $pull: { products: deleted._id } },
    );

    // Create PRODUCT_DELETED notification
    if (userId) {
      try {
        const brand = await this.brandModel.findById(deleted.brand).lean();
        await this.notificationsService.createNotification({
          userId,
          type: 'PRODUCT_DELETED',
          title: 'Product Deleted',
          message: `Product "${deleted.name}" has been deleted`,
          data: {
            productId: (deleted._id as Types.ObjectId).toString(),
            productName: deleted.name,
            brandId: brand
              ? (brand._id as Types.ObjectId).toString()
              : undefined,
            brandName: brand?.name,
          },
        });
      } catch (err) {
        // Log error but don't fail product deletion if notification fails
        console.error('Failed to create PRODUCT_DELETED notification:', err);
      }
    }

    return { success: true };
  }
}
