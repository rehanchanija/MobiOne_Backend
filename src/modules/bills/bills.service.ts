import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill, BillDocument } from '../schemas/bill.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Product, ProductDocument } from '../schemas/product.schema';

interface CreateCustomerDto { name: string; phone?: string; address?: string }
interface BillItemInput { productId: string; quantity: number; }
interface CreateBillDto {
  customerId?: string;
  customer?: CreateCustomerDto;
  items: BillItemInput[];
  discount?: number;
  paymentMethod: 'Cash' | 'Online';
  amountPaid: number;
}

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<BillDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async createCustomer(dto: CreateCustomerDto) {
    return this.customerModel.create(dto);
  }

  async listCustomers() {
    return this.customerModel.find().sort({ createdAt: -1 }).lean();
  }

  async createBill(dto: CreateBillDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('Items are required');

    let customerId: string;
    if (dto.customerId) {
      customerId = dto.customerId;
    } else if (dto.customer?.name) {
      const c = await this.customerModel.create(dto.customer);
      // Ensure a string id; Mongoose will cast to ObjectId in the Bill document
      customerId = c._id.toString();
    } else {
      throw new BadRequestException('Customer info is required');
    }

    // fetch products and compute totals
    const productIds = dto.items.map(i => new Types.ObjectId(i.productId));
    const products = await this.productModel.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const items = dto.items.map(i => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      const price = p.price;
      subtotal += price * i.quantity;
            return { product: new Types.ObjectId(i.productId), quantity: i.quantity, price };
    });

    const discount = Math.max(0, dto.discount || 0);
    const total = Math.max(0, subtotal - discount);
    const amountPaid = Math.max(0, dto.amountPaid || 0);
    const status: 'Paid' | 'Pending' = amountPaid >= total ? 'Paid' : 'Pending';

    const bill = await this.billModel.create({
      customer: customerId,
      userId: new Types.ObjectId(userId),
      items,
      subtotal,
      discount,
      total,
      paymentMethod: dto.paymentMethod,
      amountPaid,
      status,
    });

    // decrement stock
    await Promise.all(
      items.map(i => this.productModel.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } }))
    );

    return bill;
  }

  async getBill(id: string): Promise<BillDocument | null> {
    return this.billModel.findById(id).populate('customer').populate({ path: 'items', populate: { path: 'product' } }).lean() as Promise<BillDocument | null>;
  }

  async listBills(): Promise<BillDocument[]> {
    return this.billModel
      .find()
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean() as Promise<BillDocument[]>;
  }

  async updateBill(id: string, updateData: Partial<CreateBillDto>, userId: string) {
    const bill = await this.billModel.findById(id);
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Update bill logic here
    const updatedBill = await this.billModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).exec() as BillDocument | null;

    if (!updatedBill) {
      throw new NotFoundException('Bill not found after update');
    }

    return updatedBill;
  }

  async deleteBill(id: string, userId: string) {
    const bill = await this.billModel.findById(id);
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Increment product stock back
    await Promise.all(
      bill.items.map(item => 
        this.productModel.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        )
      )
    );

    return this.billModel.findByIdAndDelete(id);
  }
}


