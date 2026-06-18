import { Types } from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder';
import { ISpareSupplier, IPurchaseOrder } from '../types/models';
import { BaseService } from './BaseService';
// import { InventoryService } from './InventoryService'; // REMOVED TO PREVENT CIRCULAR DEPENDENCY
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface PurchaseFilters {
  companyId: string;
  status?: string;
  supplierId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface PurchaseStats {
  totalPurchases: number;
  monthlySpend: number;
  totalSuppliers: number;
  pendingOrders: number;
  averageOrderValue: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface PurchaseAnalytics {
  dailyPurchases: Array<{ date: string; amount: number; orders: number }>;
  monthlyPurchases: Array<{ month: string; amount: number; orders: number }>;
  topSuppliers: Array<{ supplier: string; amount: number; orders: number }>;
  purchasesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  purchaseTrends: Array<{ period: string; amount: number; growth: number }>;
}

interface PurchaseOrderData {
  companyId: string;
  supplier: {
    supplierId: string;
    name?: string;
  };
  items: Array<{
    quantity: number;
    rate: number;
    category?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

const PENDING_STATUSES = ['draft', 'pending_approval', 'sent', 'acknowledged'] as const;

export class PurchaseService extends BaseService<IPurchaseOrder> {
  constructor() {
    super(PurchaseOrder);
  }

  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  private validateDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }
    return date;
  }

  private sanitizeSearch(search?: string): string | undefined {
    if (!search) return undefined;
    // Limit search length and escape regex special characters
    const maxLength = 100;
    const sanitized = search.slice(0, maxLength).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sanitized;
  }

  /**
   * Get purchase statistics
   */
  async getPurchaseStats(companyId: string): Promise<PurchaseStats> {
    this.validateObjectId(companyId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalPurchases, monthlySpend, totalSuppliers, pendingOrders, avgOrderValue, topCategories] =
      await Promise.all([
        PurchaseOrder.aggregate([
          { $match: { companyId: this.validateObjectId(companyId) } },
          { $group: { _id: null, total: { $sum: '$amounts.grandTotal' } } },
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$amounts.grandTotal' } } },
        ]),
        PurchaseOrder.aggregate([
          { $match: { companyId: this.validateObjectId(companyId) } },
          { $group: { _id: '$supplier.supplierId' } },
          { $count: 'total' },
        ]),
        PurchaseOrder.countDocuments({
          companyId: this.validateObjectId(companyId),
          status: { $in: PENDING_STATUSES },
        }),
        PurchaseOrder.aggregate([
          { $match: { companyId: this.validateObjectId(companyId) } },
          { $group: { _id: null, avg: { $avg: '$amounts.grandTotal' } } },
        ]),
        PurchaseOrder.aggregate([
          { $match: { companyId: this.validateObjectId(companyId) } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.category',
              amount: { $sum: { $multiply: ['$items.quantity', '$items.rate'] } },
            },
          },
          { $sort: { amount: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const totalAmount = totalPurchases[0]?.total ?? 0;
    const categoriesWithPercentage = topCategories.map((cat) => ({
      category: cat._id ?? 'Unknown',
      amount: cat.amount ?? 0,
      percentage: totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0,
    }));

    return {
      totalPurchases: totalAmount,
      monthlySpend: monthlySpend[0]?.total ?? 0,
      totalSuppliers: totalSuppliers[0]?.total ?? 0,
      pendingOrders,
      averageOrderValue: avgOrderValue[0]?.avg ?? 0,
      topCategories: categoriesWithPercentage,
    };
  }

  /**
   * Get purchase analytics
   */
  async getPurchaseAnalytics(companyId: string, period: string = 'month'): Promise<PurchaseAnalytics> {
    this.validateObjectId(companyId);
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        throw new Error(`Invalid period: ${period}`);
    }

    const [dailyPurchases, monthlyPurchases, topSuppliers, purchasesByCategory, purchaseTrends] =
      await Promise.all([
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              amount: { $sum: '$amounts.grandTotal' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              amount: { $sum: '$amounts.grandTotal' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startDate },
            },
          },
          {
            $lookup: {
              from: 'suppliers', // Ensure this matches the actual collection name
              localField: 'supplier.supplierId',
              foreignField: '_id',
              as: 'supplier',
            },
          },
          { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$supplier.supplierId',
              supplier: { $first: '$supplier.name' },
              amount: { $sum: '$amounts.grandTotal' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { amount: -1 } },
          { $limit: 10 },
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startDate },
            },
          },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.category',
              amount: { $sum: { $multiply: ['$items.quantity', '$items.rate'] } },
            },
          },
          { $sort: { amount: -1 } },
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              companyId: this.validateObjectId(companyId),
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              amount: { $sum: '$amounts.grandTotal' },
            },
          },
          { $sort: { _id: 1 } },
          {
            $group: {
              _id: null,
              periods: { $push: { period: '$_id', amount: '$amount' } },
            },
          },
        ]),
      ]);

    const totalCategoryAmount = purchasesByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    const categoriesWithPercentage = purchasesByCategory.map((cat) => ({
      category: cat._id ?? 'Unknown',
      amount: cat.amount ?? 0,
      percentage: totalCategoryAmount > 0 ? (cat.amount / totalCategoryAmount) * 100 : 0,
    }));

    const trends = purchaseTrends[0]?.periods ?? [];
    const trendsWithGrowth = trends.map((trend, index) => {
      const previousAmount = index > 0 ? trends[index - 1].amount : 0;
      const growth = previousAmount > 0 ? ((trend.amount - previousAmount) / previousAmount) * 100 : 0;
      return {
        period: trend.period,
        amount: trend.amount,
        growth,
      };
    });

    return {
      dailyPurchases: dailyPurchases.map((dp) => ({
        date: dp._id,
        amount: dp.amount ?? 0,
        orders: dp.orders ?? 0,
      })),
      monthlyPurchases: monthlyPurchases.map((mp) => ({
        month: mp._id,
        amount: mp.amount ?? 0,
        orders: mp.orders ?? 0,
      })),
      topSuppliers: topSuppliers.map((ts) => ({
        supplier: ts.supplier ?? 'Unknown',
        amount: ts.amount ?? 0,
        orders: ts.orders ?? 0,
      })),
      purchasesByCategory: categoriesWithPercentage,
      purchaseTrends: trendsWithGrowth,
    };
  }

  /**
   * Get purchase orders with filters
   */
  async getPurchaseOrders(filters: PurchaseFilters) {
    const { companyId, status, supplierId, category, dateFrom, dateTo, search, page, limit } = filters;

    this.validateObjectId(companyId);
    const query: any = { companyId: this.validateObjectId(companyId) };

    if (status) query.status = status;
    if (supplierId) query['supplier.supplierId'] = this.validateObjectId(supplierId);
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = this.validateDate(dateFrom);
      if (dateTo) query.createdAt.$lte = this.validateDate(dateTo);
    }

    const sanitizedSearch = this.sanitizeSearch(search);
    
    // Build base query without search first
    const baseQuery = { ...query };
    
    if (category) {
      baseQuery['items.category'] = category;
    }

    const skip = (page - 1) * limit;

    let orders: any[];
    let total: number;

    if (sanitizedSearch) {
      // Use aggregation pipeline for complex search with nested fields
      // Build search conditions using $or in aggregation
      const searchConditions: any[] = [
        { poNumber: { $regex: sanitizedSearch, $options: 'i' } },
        { orderNumber: { $regex: sanitizedSearch, $options: 'i' } },
        { notes: { $regex: sanitizedSearch, $options: 'i' } },
      ];

      // Use aggregation $match with $expr for nested field searches
      const aggregationPipeline: any[] = [
        { $match: baseQuery },
        {
          $match: {
            $or: [
              ...searchConditions,
              // For nested fields, check if they exist and match
              {
                $expr: {
                  $and: [
                    { $ne: ['$supplier.supplierName', null] },
                    { $ne: ['$supplier.supplierName', ''] },
                    {
                      $regexMatch: {
                        input: { $toString: '$supplier.supplierName' },
                        regex: sanitizedSearch,
                        options: 'i'
                      }
                    }
                  ]
                }
              },
              {
                $expr: {
                  $and: [
                    { $ne: ['$agent.agentName', null] },
                    { $ne: ['$agent.agentName', ''] },
                    {
                      $regexMatch: {
                        input: { $toString: '$agent.agentName' },
                        regex: sanitizedSearch,
                        options: 'i'
                      }
                    }
                  ]
                }
              },
              // Search in items array
              { 'items.itemName': { $regex: sanitizedSearch, $options: 'i' } },
              { 'items.itemCode': { $regex: sanitizedSearch, $options: 'i' } }
            ]
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      // Get total count
      const countPipeline = [
        { $match: baseQuery },
        {
          $match: {
            $or: [
              ...searchConditions,
              {
                $expr: {
                  $and: [
                    { $ne: ['$supplier.supplierName', null] },
                    { $ne: ['$supplier.supplierName', ''] },
                    {
                      $regexMatch: {
                        input: { $toString: '$supplier.supplierName' },
                        regex: sanitizedSearch,
                        options: 'i'
                      }
                    }
                  ]
                }
              },
              {
                $expr: {
                  $and: [
                    { $ne: ['$agent.agentName', null] },
                    { $ne: ['$agent.agentName', ''] },
                    {
                      $regexMatch: {
                        input: { $toString: '$agent.agentName' },
                        regex: sanitizedSearch,
                        options: 'i'
                      }
                    }
                  ]
                }
              },
              { 'items.itemName': { $regex: sanitizedSearch, $options: 'i' } },
              { 'items.itemCode': { $regex: sanitizedSearch, $options: 'i' } }
            ]
          }
        },
        { $count: 'total' }
      ];

      const [ordersResult, countResult] = await Promise.all([
        PurchaseOrder.aggregate(aggregationPipeline),
        PurchaseOrder.aggregate(countPipeline)
      ]);

      orders = ordersResult;
      total = countResult[0]?.total || 0;

      // Populate supplier if needed
      if (orders.length > 0) {
        const supplierIds = orders
          .map((o: any) => o.supplier?.supplierId)
          .filter((id: any) => id);
        
        if (supplierIds.length > 0) {
          const { Supplier } = await import('../models/Supplier');
          const suppliers = await Supplier.find({ _id: { $in: supplierIds } })
            .select('name email phone category')
            .lean();
          
          const supplierMap = new Map(suppliers.map((s: any) => [s._id.toString(), s]));
          orders = orders.map((order: any) => {
            if (order.supplier?.supplierId) {
              const supplier = supplierMap.get(order.supplier.supplierId.toString());
              if (supplier && typeof supplier === 'object' && supplier !== null) {
                const supplierObj = supplier as Record<string, any>;
                order.supplier = { ...order.supplier, ...supplierObj };
              }
            }
            return order;
          });
        }
      }
    } else {
      // No search - use simple find query
      [orders, total] = await Promise.all([
        PurchaseOrder.find(baseQuery)
          .populate('supplier.supplierId', 'name email phone category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PurchaseOrder.countDocuments(baseQuery),
      ]);
    }

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(orderData: PurchaseOrderData, createdBy: string): Promise<IPurchaseOrder> {
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Items array is required and must not be empty');
    }

    this.validateObjectId(orderData.companyId);
    if (orderData.supplier?.supplierId) {
      this.validateObjectId(orderData.supplier.supplierId);
    }

    const itemsWithTotals = orderData.items.map((item) => {
      if (typeof item.quantity !== 'number' || typeof item.rate !== 'number') {
        throw new Error('Item quantity and rate must be numbers');
      }
      
      // Handle temporary item IDs - if it's a temp ID, generate a new ObjectId
      let itemId = item.itemId;
      if (itemId && typeof itemId === 'string' && itemId.startsWith('temp-')) {
        // For temporary items, generate a new ObjectId
        itemId = new Types.ObjectId();
      }
      
      return {
        ...item,
        itemId: itemId,
        lineTotal: item.quantity * item.rate,
      };
    });

    const grandTotal = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);

    const purchaseOrderId = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = new PurchaseOrder({
      ...orderData,
      items: itemsWithTotals,
      amounts: {
        subtotal: grandTotal,
        totalDiscount: 0,
        taxableAmount: grandTotal,
        totalTaxAmount: 0,
        freightCharges: 0,
        packingCharges: 0,
        otherCharges: 0,
        roundingAdjustment: 0,
        grandTotal,
      },
      purchaseOrderId,
      createdBy: new Types.ObjectId(createdBy), // Ensure it's a proper ObjectId
      updatedBy: new Types.ObjectId(createdBy),
      status: 'draft',
      orderDate: new Date(),
    });

    const savedOrder = await order.save();

    // Automatically create inventory items for PO items
    try {
      await this.createInventoryItemsForPO(savedOrder, createdBy);
      logger.info('Inventory items created for PO', {
        poId: savedOrder._id,
        poNumber: purchaseOrderId,
        itemCount: itemsWithTotals.length
      });
    } catch (inventoryError) {
      // Log error but don't fail PO creation
      logger.error('Failed to create inventory items for PO', {
        poId: savedOrder._id,
        poNumber: purchaseOrderId,
        error: inventoryError
      });
    }

    return savedOrder;
  }

  /**
   * Create inventory items for PO items
   */
  private async createInventoryItemsForPO(purchaseOrder: any, createdBy: string): Promise<void> {
    // Dynamic import to prevent circular dependency
    const { InventoryService } = await import('./InventoryService');
    const inventoryService = new InventoryService();
    
    for (const item of purchaseOrder.items) {
      try {
        // Check if inventory item already exists
        const existingItem = await inventoryService.findOne({ itemCode: item.itemCode });
        if (existingItem) {
          // Update PO reference if item exists
          await inventoryService.update(existingItem._id.toString(), {
            'purchaseOrders': {
              $addToSet: {
                poId: purchaseOrder._id,
                poNumber: purchaseOrder.poNumber,
                orderedQuantity: item.quantity,
                receivedQuantity: 0,
                pendingQuantity: item.quantity,
                unitRate: item.rate
              }
            }
          } as any, createdBy);
          continue;
        }

        // Create new inventory item
        const inventoryItemData = {
          itemCode: item.itemCode,
          companyItemCode: `${purchaseOrder.poNumber}-${item.itemCode}`,
          itemName: item.itemName,
          description: item.description || `${item.itemName} from PO ${purchaseOrder.poNumber}`,
          category: {
            primary: 'raw_material' as const,
            secondary: 'fabric',
            tertiary: item.itemName.toLowerCase()
          },
          itemType: 'raw_material',
          unit: item.unit,
          companyId: purchaseOrder.companyId,
          
          // Stock information (initially 0 - will be updated by GRN)
          stock: {
            currentStock: 0,
            availableStock: 0,
            reservedStock: 0,
            inTransitStock: item.quantity, // Expected quantity
            damagedStock: 0,
            unit: item.unit,
            reorderLevel: 0,
            minStockLevel: 0,
            maxStockLevel: item.quantity * 2,
            valuationMethod: 'FIFO' as const,
            averageCost: item.rate,
            totalValue: 0
          },
          
          // Pricing information
          pricing: {
            costPrice: item.rate,
            sellingPrice: item.rate * 1.2, // 20% markup
            mrp: item.rate * 1.3, // 30% markup
            currency: 'INR'
          },
          
          // Purchase order reference
          purchaseOrders: [{
            poId: purchaseOrder._id,
            poNumber: purchaseOrder.poNumber,
            orderedQuantity: item.quantity,
            receivedQuantity: 0,
            pendingQuantity: item.quantity,
            unitRate: item.rate,
            supplierId: purchaseOrder.supplier.supplierId,
            supplierName: purchaseOrder.supplier.supplierName
          }],
          
          // Tracking information
          tracking: {
            createdBy: new Types.ObjectId(createdBy),
            lastModifiedBy: new Types.ObjectId(createdBy),
            lastStockUpdate: new Date(),
            lastMovementDate: new Date(),
            totalInward: 0,
            totalOutward: 0,
            totalAdjustments: 0
          },
          
          // Status
          status: {
            isActive: true,
            isDiscontinued: false,
            isFastMoving: false,
            isSlowMoving: false,
            isObsolete: false,
            requiresApproval: false
          },
          isActive: true
        };

        await inventoryService.createInventoryItem(inventoryItemData, createdBy);
        
        logger.info('Inventory item created for PO item', {
          poId: purchaseOrder._id,
          poNumber: purchaseOrder.poNumber,
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.quantity
        });
      } catch (error) {
        logger.error('Failed to create inventory item for PO item', {
          poId: purchaseOrder._id,
          poNumber: purchaseOrder.poNumber,
          itemCode: item.itemCode,
          error: error
        });
        // Continue with other items even if one fails
      }
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(id: string, companyId?: string): Promise<IPurchaseOrder> {
    this.validateObjectId(id);
    const query: any = { _id: this.validateObjectId(id) };
    if (companyId) {
      query.companyId = this.validateObjectId(companyId);
    }

    const order = await PurchaseOrder.findOne(query)
      .populate('supplier.supplierId', 'name email phone category')
      .lean();

    if (!order) {
      throw new Error(`Purchase order not found: ${id}`);
    }

    return order;
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(
    id: string,
    updateData: Partial<IPurchaseOrder>,
    updatedBy: string,
    companyId?: string
  ): Promise<IPurchaseOrder> {
    this.validateObjectId(id);
    const query: any = { _id: this.validateObjectId(id) };
    if (companyId) {
      query.companyId = this.validateObjectId(companyId);
    }

    const order = await PurchaseOrder.findOneAndUpdate(
      query,
      {
        ...updateData,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('supplier.supplierId', 'name email phone category')
      .lean();

    if (!order) {
      throw new Error(`Purchase order not found: ${id}`);
    }

    return order;
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(id: string, companyId?: string): Promise<void> {
    this.validateObjectId(id);
    const query: any = { _id: this.validateObjectId(id) };
    if (companyId) {
      query.companyId = this.validateObjectId(companyId);
    }

    const result = await PurchaseOrder.deleteOne(query);
    if (result.deletedCount === 0) {
      throw new Error(`Purchase order not found: ${id}`);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    amount: number,
    updatedBy: string,
    companyId?: string
  ): Promise<IPurchaseOrder> {
    this.validateObjectId(id);
    if (typeof paymentStatus !== 'string' || typeof amount !== 'number') {
      throw new Error('Invalid payment status or amount');
    }
    const query: any = { _id: this.validateObjectId(id) };
    if (companyId) {
      query.companyId = this.validateObjectId(companyId);
    }

    const order = await PurchaseOrder.findOneAndUpdate(
      query,
      {
        paymentStatus,
        lastPaymentAmount: amount,
        lastPaymentDate: new Date(),
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('supplier.supplierId', 'name email phone category')
      .lean();

    if (!order) {
      throw new Error(`Purchase order not found: ${id}`);
    }

    return order;
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(
    orderIds: string[],
    updates: Partial<IPurchaseOrder>,
    updatedBy: string,
    companyId?: string
  ): Promise<IPurchaseOrder[]> {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required and must not be empty');
    }
    orderIds.forEach((id) => this.validateObjectId(id));
    const query: any = { _id: { $in: orderIds.map((id) => this.validateObjectId(id)) } };
    if (companyId) {
      query.companyId = this.validateObjectId(companyId);
    }

    const result = await PurchaseOrder.updateMany(
      query,
      {
        ...updates,
        updatedBy,
        updatedAt: new Date(),
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error('No orders were updated');
    }

    return await PurchaseOrder.find(query)
      .populate('supplier.supplierId', 'name email phone category')
      .lean();
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: string, companyId: string, page: number = 1, limit: number = 10) {
    this.validateObjectId(companyId);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find({
        companyId: this.validateObjectId(companyId),
        status,
      })
        .populate('supplier.supplierId', 'name email phone category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrder.countDocuments({
        companyId: this.validateObjectId(companyId),
        status,
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders by supplier
   */
  async getOrdersBySupplier(supplierId: string, companyId: string, page: number = 1, limit: number = 10) {
    this.validateObjectId(companyId);
    this.validateObjectId(supplierId);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find({
        companyId: this.validateObjectId(companyId),
        'supplier.supplierId': this.validateObjectId(supplierId),
      })
        .populate('supplier.supplierId', 'name email phone category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrder.countDocuments({
        companyId: this.validateObjectId(companyId),
        'supplier.supplierId': this.validateObjectId(supplierId),
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get supplier report
   */
  async getSupplierReport(companyId: string, dateFrom?: string, dateTo?: string) {
    this.validateObjectId(companyId);
    const query: any = { companyId: this.validateObjectId(companyId) };

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = this.validateDate(dateFrom);
      if (dateTo) query.createdAt.$lte = this.validateDate(dateTo);
    }

    return await PurchaseOrder.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier.supplierId',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$supplier.supplierId',
          supplierId: { $first: '$supplier.supplierId' },
          supplierName: { $first: '$supplier.name' },
          category: { $first: '$supplier.category' },
          totalPurchases: { $sum: '$amounts.grandTotal' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$amounts.grandTotal' },
          lastOrderDate: { $max: '$createdAt' },
          outstandingAmount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, '$amounts.grandTotal', 0] } },
        },
      },
      {
        $addFields: {
          paymentStatus: {
            $cond: [{ $gt: ['$outstandingAmount', 0] }, 'delayed', 'good'],
          },
        },
      },
      { $sort: { totalPurchases: -1 } },
    ]);
  }

  /**
   * Get category spend
   */
  async getCategorySpend(companyId: string, dateFrom?: string, dateTo?: string) {
    this.validateObjectId(companyId);
    const query: any = { companyId: this.validateObjectId(companyId) };

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = this.validateDate(dateFrom);
      if (dateTo) query.createdAt.$lte = this.validateDate(dateTo);
    }

    const categoryData = await PurchaseOrder.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          amount: { $sum: { $multiply: ['$items.quantity', '$items.rate'] } },
          orders: { $addToSet: '$_id' },
        },
      },
      {
        $addFields: {
          orders: { $size: '$orders' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

    return categoryData.map((cat) => ({
      category: cat._id ?? 'Unknown',
      amount: cat.amount ?? 0,
      percentage: totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0,
      orders: cat.orders,
      topSuppliers: [], // Placeholder for potential supplier details
    }));
  }

  /**
   * Export purchase data
   */
  async exportPurchaseData(format: string, filters: PurchaseFilters): Promise<string> {
    if (!['csv', 'excel'].includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    this.validateObjectId(filters.companyId);
    const orders = await this.getPurchaseOrders(filters);

    // Placeholder for file generation logic
    // In production, implement CSV/Excel generation and upload to storage
    return `/api/v1/purchase/download/${Date.now()}.${format}`;
  }

  /**
   * Receive purchase order (NO STOCK UPDATE - Stock will be updated via GRN only)
   */
  async receivePurchaseOrder(
    orderId: string, 
    receivedItems: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unit: string;
      warehouseId: string;
      qualityCheck?: boolean;
      notes?: string;
    }>,
    receivedBy: string,
    companyId: string
  ): Promise<any> {
    try {
      // Find the purchase order
      const purchaseOrder = await PurchaseOrder.findOne({
        _id: orderId,
        companyId: this.validateObjectId(companyId)
      });

      if (!purchaseOrder) {
        throw new AppError('Purchase order not found', 404);
      }

      // Update purchase order status and received quantities
      // NOTE: NO INVENTORY STOCK UPDATE HERE - Stock will be updated via GRN approval only
      const updatedOrder = await PurchaseOrder.findOneAndUpdate(
        {
          _id: orderId,
          companyId: this.validateObjectId(companyId)
        },
        {
          status: 'partially_received', // Changed from 'received' to 'partially_received'
          actualDelivery: new Date(),
          receivedBy: receivedBy,
          receivedItems: receivedItems,
          lastReceivedDate: new Date(),
          // Update individual item received quantities
          $inc: {
            'items.$[elem].receivedQuantity': receivedItems.reduce((sum, item) => sum + item.quantity, 0)
          }
        },
        { 
          new: true,
          arrayFilters: [{ 'elem.itemId': { $in: receivedItems.map(item => item.itemId) } }]
        }
      );

      console.log('Purchase order received successfully (NO STOCK UPDATE - Use GRN for stock updates)', {
        orderId,
        receivedItemsCount: receivedItems.length,
        receivedBy,
        companyId,
        note: 'Stock will be updated when GRN is approved'
      });

      return updatedOrder;
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  }

  /**
   * Create new inventory item from purchase order
   */
  async createInventoryItemFromPurchase(
    itemData: {
      itemName: string;
      description?: string;
      category: string;
      quantity: number;
      unit: string;
      costPrice: number;
      warehouseId: string;
    },
    createdBy: string,
    companyId: string
  ): Promise<any> {
    try {
      // Dynamic import to prevent circular dependency
      const { InventoryService } = await import('./InventoryService');
      const inventoryService = new InventoryService();
      
      const newItemData = {
        itemName: itemData.itemName,
        itemDescription: itemData.description || '',
        itemCode: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        companyItemCode: `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        companyId: new Types.ObjectId(companyId),
        category: {
          primary: itemData.category as 'raw_material' | 'finished_goods' | 'consumables' | 'semi_finished' | 'spare_parts'
        },
        productType: 'saree' as const,
        stock: {
          currentStock: itemData.quantity,
          availableStock: itemData.quantity,
          reservedStock: 0,
          inTransitStock: 0,
          damagedStock: 0,
          unit: itemData.unit,
          minStockLevel: 0,
          reorderLevel: 0,
          maxStockLevel: itemData.quantity * 2,
          valuationMethod: 'FIFO' as const,
          averageCost: itemData.costPrice,
          totalValue: itemData.quantity * itemData.costPrice
        },
        pricing: {
          costPrice: itemData.costPrice,
          sellingPrice: itemData.costPrice * 1.2, // 20% markup
          mrp: itemData.costPrice * 1.5, // 50% markup
          currency: 'INR'
        },
        status: {
          isActive: true,
          isDiscontinued: false,
          isFastMoving: false,
          isSlowMoving: false,
          isObsolete: false,
          requiresApproval: false
        }
      };

      const inventoryItem = await inventoryService.createInventoryItem(newItemData, createdBy);

      // Add initial stock
      if (itemData.quantity > 0) {
        await inventoryService.updateStock(
          inventoryItem._id.toString(),
          itemData.warehouseId,
          itemData.quantity,
          'in',
          'Initial stock from purchase',
          'Initial stock added from purchase order',
          createdBy
        );
      }

      return inventoryItem;
    } catch (error) {
      console.error('Error creating inventory item from purchase:', error);
      throw error;
    }
  }
}