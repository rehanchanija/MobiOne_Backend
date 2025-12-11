import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill, BillDocument } from '../schemas/bill.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionsService } from '../transactions/transactions.service';

interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
}
interface BillItemInput {
  productId: string;
  quantity: number;
}
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
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private transactionsService: TransactionsService,
  ) {}

  async createCustomer(dto: CreateCustomerDto) {
    return this.customerModel.create(dto);
  }

  async listCustomers() {
    return this.customerModel.find().sort({ createdAt: -1 }).lean();
  }

  // Generate bill number: shopname-YYYYMMDD-serialnumber (e.g., raza-20251111-01)
  // Atomic bill number generation using a counter stored in user document
  private async generateBillNumber(userId: string): Promise<string> {
    // Get user to retrieve shop name
    const user = await this.userModel.findById(userId).lean();
    if (!user || !user.shopName) {
      throw new BadRequestException('User shop name not found');
    }

    // Year string e.g., 2025
    const today = new Date();
    const yearStr = String(today.getFullYear());
    const currentYear = today.getFullYear();

    // Atomic counter update: increment billNumberCounter if year matches, or reset if year changed
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      [
        {
          $set: {
            billNumberYear: {
              $cond: [
                { $eq: ['$billNumberYear', currentYear] },
                '$billNumberYear',
                currentYear,
              ],
            },
            billNumberCounter: {
              $cond: [
                { $eq: ['$billNumberYear', currentYear] },
                { $add: ['$billNumberCounter', 1] },
                1,
              ],
            },
          },
        },
      ],
      { new: true, lean: true },
    );

    if (!updatedUser) {
      throw new BadRequestException('Failed to update bill counter');
    }

    // Serial number from counter
    const serialNumber = String(updatedUser.billNumberCounter).padStart(4, '0');

    // Sanitize shop name: lowercase, replace spaces with hyphens, remove non-alphanum/hyphen
    const shopSlug = String(user.shopName)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    // Format: shopname-YYYY-serialnumber (e.g., raza-2025-0001)
    const billNumber = `${shopSlug}-${yearStr}-${serialNumber}`;

    return billNumber;
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
    const productIds = dto.items.map((i) => new Types.ObjectId(i.productId));
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const items = dto.items.map((i) => {
      const p = productMap.get(i.productId);
      if (!p) throw new NotFoundException(`Product not found: ${i.productId}`);
      const price = p.price;
      subtotal += price * i.quantity;
      return {
        product: new Types.ObjectId(i.productId),
        quantity: i.quantity,
        price,
      };
    });

    const discount = Math.max(0, dto.discount || 0);
    const total = Math.max(0, subtotal - discount);
    const amountPaid = Math.max(0, dto.amountPaid || 0);
    const status: 'Paid' | 'Pending' = amountPaid >= total ? 'Paid' : 'Pending';

    // Generate bill number
    const billNumber = await this.generateBillNumber(userId);

    const bill = await this.billModel.create({
      customer: customerId,
      userId: new Types.ObjectId(userId),
      billNumber,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: dto.paymentMethod,
      amountPaid,
      status,
    });

    // decrement stock and check for low stock
    await Promise.all(
      items.map(async (i) => {
        await this.productModel.updateOne(
          { _id: i.product },
          { $inc: { stock: -i.quantity } },
        );

        // Check if stock is now low (<=5)
        const updatedProduct = await this.productModel
          .findById(i.product)
          .lean();
        if (updatedProduct && updatedProduct.stock <= 5) {
          try {
            const brand = await this.brandModel
              .findById(updatedProduct.brand)
              .lean();
            await this.notificationsService.createNotification({
              userId,
              type: 'LOW_STOCK',
              title: 'Low Stock Alert',
              message: `Only ${updatedProduct.stock} units remaining for "${updatedProduct.name}"`,
              data: {
                productId: updatedProduct._id.toString(),
                productName: updatedProduct.name,
                stock: updatedProduct.stock,
                brandId: updatedProduct.brand.toString(),
                brandName: brand?.name || 'Unknown Brand',
              },
            });
          } catch (err) {
            // Log error but don't fail bill creation
            console.error('Failed to create LOW_STOCK notification:', err);
          }
        }
      }),
    );

    try {
      const customer = await this.customerModel.findById(customerId).lean();
      const remainingAmount = Math.max(0, total - amountPaid);

      await this.transactionsService.create({
        userId,
        billId: bill._id.toString(),
        type: 'BILL_CREATED',
        title: 'Bill Created',
        message: `Bill ${billNumber} created`,
        action: 'BILL_CREATED',
        data: {
          billId: bill._id.toString(),
          billNumber,
          customerName: customer?.name || 'Unknown',
          customerPhone: customer?.phone || '',
          subtotal,
          discount,
          total,
          amountPaid,
          remainingAmount,
          paymentStatus: status,
          paymentMethod: dto.paymentMethod,
          itemCount: items.length,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (e) {}

    // Create BILL_CREATED notification with complete bill data
    try {
      const customer = await this.customerModel.findById(customerId).lean();

      // Get product details for items
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await this.productModel.findById(item.product).lean();
          return {
            productId: item.product.toString(),
            productName: product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            description: product?.description || '',
          };
        }),
      );

      // Calculate remaining amount
      const remainingAmount = Math.max(0, total - amountPaid);

      await this.notificationsService.createNotification({
        userId,
        type: 'BILL_CREATED',
        title: 'New Bill Created',
        message: `Bill ${billNumber} created for ${customer?.name || 'Customer'} - Amount: ${total.toFixed(2)}`,
        data: {
          billId: bill._id.toString(),
          billNumber,
          customerName: customer?.name || 'Unknown',
          customerPhone: customer?.phone || '',
          totalAmount: total,
          amountPaid,
          remainingAmount,
          paymentStatus: status,
          paymentMethod: dto.paymentMethod,
          itemCount: items.length,
          items: itemsWithDetails,
          subtotal,
          discount,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Log error but don't fail bill creation if notification fails
      console.error('Failed to create BILL_CREATED notification:', err);
    }

    return bill;
  }

  async getBill(id: string): Promise<BillDocument | null> {
    return this.billModel
      .findById(id)
      .populate('customer')
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean() as Promise<BillDocument | null>;
  }

  async listBills(userId?: string): Promise<BillDocument[]> {
    const query = userId ? { userId: new Types.ObjectId(userId) } : {};
    return this.billModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean() as Promise<BillDocument[]>;
  }

  async listBillsPaginated(
    page: number,
    limit: number,
    userId: string,
  ): Promise<{
    bills: BillDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      this.billModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer')
        .populate({ path: 'items', populate: { path: 'product' } })
        .lean(),
      this.billModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    // Log first bill to verify customer data is populated
    if (bills && bills.length > 0) {
      console.log(
        '✅ First bill structure:',
        JSON.stringify(bills[0], null, 2),
      );
      console.log('👥 Customer data:', bills[0]?.customer);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      bills: bills as BillDocument[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateBill(
    id: string,
    updateData: Partial<CreateBillDto>,
    userId: string,
  ) {
    const bill = await this.billModel.findById(id);
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Process update data with proper typing
    const processedData: any = { ...updateData };

    // If marking as paid, ensure proper state update
    if (
      (updateData as any)?.status === 'Paid' ||
      (updateData as any)?.amountPaid !== undefined
    ) {
      const amountPaid = (updateData as any)?.amountPaid || bill.amountPaid;
      const total = bill.total;

      // Automatically set status based on amount paid
      if (amountPaid >= total) {
        processedData.status = 'Paid';
      } else {
        processedData.status = 'Pending';
      }
    }

    // Update bill logic here
    const updatedBill = (await this.billModel
      .findByIdAndUpdate(id, { $set: processedData }, { new: true })
      .populate('customer')
      .populate({ path: 'items', populate: { path: 'product' } })
      .exec()) as BillDocument | null;

    if (!updatedBill) {
      throw new NotFoundException('Bill not found after update');
    }

    try {
      const remainingAmount = Math.max(
        0,
        (updatedBill as any).total - (updatedBill as any).amountPaid,
      );
      const customerName = (updatedBill as any).customer?.name || 'Unknown';
      const customerPhone = (updatedBill as any).customer?.phone || '';
      await this.transactionsService.create({
        userId,
        billId: updatedBill._id.toString(),
        type: 'BILL_UPDATED',
        title: 'Bill Updated',
        message: `Bill ${updatedBill.billNumber} updated`,
        action: 'BILL_UPDATED',
        data: {
          billId: updatedBill._id.toString(),
          billNumber: updatedBill.billNumber,
          customerName,
          customerPhone,
          subtotal: (updatedBill as any).subtotal,
          discount: (updatedBill as any).discount,
          totalAmount: (updatedBill as any).total,
          amountPaid: (updatedBill as any).amountPaid,
          remainingAmount,
          paymentStatus: (updatedBill as any).status,
          paymentMethod: (updatedBill as any).paymentMethod,
          itemCount: (updatedBill as any).items?.length || 0,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {}

    return updatedBill;
  }

  async deleteBill(id: string, userId: string) {
    const bill = await this.billModel.findById(id);
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Increment product stock back
    await Promise.all(
      bill.items.map((item) =>
        this.productModel.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
        ),
      ),
    );

    return this.billModel.findByIdAndDelete(id);
  }

  async debugPopulateCheck(userId: string) {
    console.log('\n🔍 DEBUG: Checking populate functionality...\n');

    // Get first bill without populate
    const billWithoutPopulate = await this.billModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    console.log(
      '❌ Without populate - customer field:',
      billWithoutPopulate?.customer,
    );

    // Get first bill WITH populate
    const billWithPopulate = await this.billModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('customer')
      .lean();

    console.log(
      '✅ With populate - customer field:',
      billWithPopulate?.customer,
    );

    // Check if customer is string or object
    const customerType = typeof billWithPopulate?.customer;
    console.log(`Customer type: ${customerType}`);

    if (customerType === 'object' && billWithPopulate?.customer) {
      console.log('👥 Customer details:', {
        name: (billWithPopulate.customer as any)?.name,
        phone: (billWithPopulate.customer as any)?.phone,
        address: (billWithPopulate.customer as any)?.address,
      });
    } else {
      console.log(
        '⚠️ Customer is just an ID (string):',
        billWithPopulate?.customer,
      );
    }

    return {
      success: true,
      message: 'Debug check complete. See server logs.',
      billWithoutPopulate,
      billWithPopulate,
      customerIsObject: customerType === 'object',
    };
  }

  async getDashboardTotals(userId: string): Promise<{
    totalSalesAllTime: number;
    totalPendingAmountAllTime: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    // Get all bills for this user
    const bills = await this.billModel.find({ userId: userObjectId }).lean();

    // Calculate totals
    let totalSalesAllTime = 0;
    let totalPendingAmountAllTime = 0;

    bills.forEach((bill: any) => {
      // Total sales (sum of all bills' total amounts)
      totalSalesAllTime += bill.total || 0;

      // Total pending (sum of pending bills' outstanding amounts)
      if (bill.status === 'Pending') {
        const pending = Math.max(0, (bill.total || 0) - (bill.amountPaid || 0));
        totalPendingAmountAllTime += pending;
      }
    });

    return {
      totalSalesAllTime: Math.round(totalSalesAllTime * 100) / 100,
      totalPendingAmountAllTime:
        Math.round(totalPendingAmountAllTime * 100) / 100,
    };
  }

  async getTotalBillsCount(userId: string): Promise<{ totalBills: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const totalBills = await this.billModel.countDocuments({
      userId: userObjectId,
    });
    return { totalBills };
  }

  async getSalesReport(
    timeFilter: 'day' | 'week' | 'month' | 'all',
    userId: string,
  ): Promise<{
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    totalProductsSold: number;
    dailyStats: { date: string; sales: number; orders: number }[];
    topProducts: {
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }[];
    timeFilter: 'day' | 'week' | 'month' | 'all';
  }> {
    const now = new Date();
    let start: Date | undefined;
    const d = new Date(now);
    if (timeFilter === 'day') {
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    } else if (timeFilter === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
    } else if (timeFilter === 'month') {
      start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    } else {
      start = undefined;
    }

    const match: any = { userId: new Types.ObjectId(userId) };
    if (start) {
      match.createdAt = { $gte: start, $lte: now };
    }

    const bills = await this.billModel.find(match).lean();

    const totalSales = bills.reduce((sum, b: any) => sum + (b.total || 0), 0);
    const totalOrders = bills.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const customerSet = new Set<string>(
      bills.map((b: any) => String(b.customer)),
    );
    const totalCustomers = customerSet.size;
    const totalProductsSold = bills.reduce(
      (sum, b: any) =>
        sum +
        (Array.isArray(b.items)
          ? b.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0)
          : 0),
      0,
    );

    const productAgg: Record<string, { quantity: number; revenue: number }> =
      {};
    for (const b of bills) {
      for (const it of b.items || []) {
        const pid = String(it.product);
        const qty = Number(it.quantity || 0);
        const rev = Number(it.price || 0) * qty;
        if (!productAgg[pid]) productAgg[pid] = { quantity: 0, revenue: 0 };
        productAgg[pid].quantity += qty;
        productAgg[pid].revenue += rev;
      }
    }
    const productIds = Object.keys(productAgg).map(
      (id) => new Types.ObjectId(id),
    );
    const products = productIds.length
      ? await this.productModel
          .find({ _id: { $in: productIds } })
          .select({ name: 1 })
          .lean()
      : [];
    const nameMap = new Map<string, string>(
      products.map((p: any) => [String(p._id), String(p.name || '')]),
    );
    const topProducts = Object.entries(productAgg)
      .map(([productId, agg]) => ({
        productId,
        name: nameMap.get(productId) || '',
        quantity: agg.quantity,
        revenue: agg.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const dailyMap = new Map<string, { sales: number; orders: number }>();
    for (const b of bills) {
      const dstr = new Date(b.createdAt).toISOString().slice(0, 10);
      const cur = dailyMap.get(dstr) || { sales: 0, orders: 0 };
      cur.sales += Number(b.total || 0);
      cur.orders += 1;
      dailyMap.set(dstr, cur);
    }
    const dailyStats = Array.from(dailyMap.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, v]) => ({ date, sales: v.sales, orders: v.orders }));

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalCustomers,
      totalProductsSold,
      dailyStats,
      topProducts,
      timeFilter,
    };
  }
}
