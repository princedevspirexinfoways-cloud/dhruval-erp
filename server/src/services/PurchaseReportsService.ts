import { Types } from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface ReportFilters {
  companyId?: string;
  vendorId?: string;
  itemId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class PurchaseReportsService {
  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid ObjectId: ${id}`, 400);
    }
    return new Types.ObjectId(id);
  }

  private validateDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new AppError(`Invalid date: ${dateStr}`, 400);
    }
    return date;
  }

  private buildDateFilter(dateFrom?: string, dateTo?: string): any {
    const filter: any = {};
    if (dateFrom || dateTo) {
      filter.poDate = {};
      if (dateFrom) {
        filter.poDate.$gte = this.validateDate(dateFrom);
      }
      if (dateTo) {
        const endDate = this.validateDate(dateTo);
        if (endDate) {
          // Set to end of day
          endDate.setHours(23, 59, 59, 999);
          filter.poDate.$lte = endDate;
        }
      }
    }
    return filter;
  }

  /**
   * Get Vendor-wise Purchase Summary
   * Handles both suppliers and agents as vendors
   */
  async getVendorWisePurchaseSummary(filters: ReportFilters): Promise<any[]> {
    try {
      const { companyId, vendorId, dateFrom, dateTo } = filters;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const matchConditions: any = {
        companyId: this.validateObjectId(companyId),
        isActive: true
      };

      // Add date filter
      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(matchConditions, dateFilter);
      }

      // Build vendor filter - check both supplier and agent
      if (vendorId) {
        matchConditions.$or = [
          { 'supplier.supplierId': this.validateObjectId(vendorId) },
          { 'agent.agentId': this.validateObjectId(vendorId) }
        ];
      }

      const vendorSummary = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $project: {
            vendorId: {
              $cond: [
                { $ifNull: ['$supplier.supplierId', false] },
                '$supplier.supplierId',
                '$agent.agentId'
              ]
            },
            vendorName: {
              $cond: [
                { $ifNull: ['$supplier.supplierName', false] },
                '$supplier.supplierName',
                '$agent.agentName'
              ]
            },
            vendorType: {
              $cond: [
                { $ifNull: ['$supplier.supplierId', false] },
                'supplier',
                'agent'
              ]
            },
            contactPerson: {
              $cond: [
                { $ifNull: ['$supplier.contactPerson', false] },
                '$supplier.contactPerson',
                '$agent.agentName'
              ]
            },
            contactNumber: {
              $cond: [
                { $ifNull: ['$supplier.phone', false] },
                '$supplier.phone',
                '$agent.agentContactNumber'
              ]
            },
            email: '$supplier.email',
            gstin: '$supplier.gstin',
            poNumber: 1,
            poDate: 1,
            amounts: 1,
            items: 1
          }
        },
        {
          $group: {
            _id: '$vendorId',
            vendorName: { $first: '$vendorName' },
            vendorType: { $first: '$vendorType' },
            contactPerson: { $first: '$contactPerson' },
            contactNumber: { $first: '$contactNumber' },
            email: { $first: '$email' },
            gstin: { $first: '$gstin' },
            totalPurchases: { $sum: '$amounts.grandTotal' },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: { $sum: '$items.quantity' } },
            items: { $push: '$items' },
            orderDates: { $push: '$poDate' }
          }
        },
        {
          $project: {
            vendorId: { $toString: '$_id' },
            vendorName: 1,
            vendorType: 1,
            contactPerson: 1,
            contactNumber: 1,
            email: 1,
            gstin: 1,
            totalPurchases: 1,
            totalOrders: 1,
            totalQuantity: 1,
            averageOrderValue: { $divide: ['$totalPurchases', '$totalOrders'] },
            items: 1,
            orderDates: 1
          }
        },
        { $sort: { totalPurchases: -1 } }
      ]);

      // Process items for each vendor
      const result = await Promise.all(
        vendorSummary.map(async (vendor) => {
          // Flatten and group items
          const itemMap = new Map<string, any>();

          for (const itemArray of vendor.items) {
            for (const item of itemArray) {
              const itemId = item.itemId?.toString() || item._id?.toString() || 'unknown';
              const itemName = item.itemName || item.name || 'Unknown Item';
              const itemCode = item.itemCode || item.code || '';
              const category = item.category || '';

              if (!itemMap.has(itemId)) {
                itemMap.set(itemId, {
                  itemId,
                  itemName,
                  itemCode,
                  category,
                  totalQuantity: 0,
                  totalAmount: 0,
                  rates: []
                });
              }

              const itemData = itemMap.get(itemId)!;
              itemData.totalQuantity += item.quantity || 0;
              itemData.totalAmount += (item.lineTotal || item.amount || 0);
              if (item.rate) {
                itemData.rates.push(item.rate);
              }
            }
          }

          const items = Array.from(itemMap.values()).map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode,
            category: item.category,
            totalQuantity: item.totalQuantity,
            totalAmount: item.totalAmount,
            averageRate: item.rates.length > 0
              ? item.rates.reduce((a, b) => a + b, 0) / item.rates.length
              : 0,
            orderDates: vendor.orderDates.map((d: Date) => d.toISOString())
          }));

          return {
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            contactPerson: vendor.contactPerson,
            contactNumber: vendor.contactNumber,
            email: vendor.email,
            gstin: vendor.gstin,
            totalPurchases: vendor.totalPurchases || 0,
            totalOrders: vendor.totalOrders,
            totalQuantity: vendor.totalQuantity || 0,
            averageOrderValue: vendor.averageOrderValue || 0,
            items
          };
        })
      );

      return result;
    } catch (error) {
      logger.error('Error in getVendorWisePurchaseSummary', { error, filters });
      throw error;
    }
  }

  /**
   * Get Item-wise Purchase Report
   */
  async getItemWisePurchaseReport(filters: ReportFilters): Promise<any[]> {
    try {
      const { companyId, itemId, category, dateFrom, dateTo } = filters;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const matchConditions: any = {
        companyId: this.validateObjectId(companyId),
        isActive: true
      };

      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(matchConditions, dateFilter);
      }

      if (category) {
        matchConditions.category = category;
      }

      const itemReport = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        { $unwind: '$items' },
        {
          $match: itemId ? { 'items.itemId': this.validateObjectId(itemId) } : {}
        },
        {
          $group: {
            _id: '$items.itemId',
            itemName: { $first: '$items.itemName' },
            itemCode: { $first: '$items.itemCode' },
            category: { $first: '$items.category' },
            subcategory: { $first: '$items.subcategory' },
            totalQuantity: { $sum: '$items.quantity' },
            totalAmount: { $sum: { $ifNull: ['$items.lineTotal', 0] } },
            rates: { $push: '$items.rate' },
            purchases: {
              $push: {
                poNumber: '$poNumber',
                poDate: '$poDate',
                vendorName: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierName', false] },
                    '$supplier.supplierName',
                    '$agent.agentName'
                  ]
                },
                vendorId: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierId', false] },
                    { $toString: '$supplier.supplierId' },
                    { $toString: '$agent.agentId' }
                  ]
                },
                quantity: '$items.quantity',
                rate: '$items.rate',
                amount: { $ifNull: ['$items.lineTotal', 0] },
                unit: '$items.unit'
              }
            }
          }
        },
        {
          $project: {
            itemId: { $toString: '$_id' },
            itemName: 1,
            itemCode: 1,
            category: 1,
            subcategory: 1,
            totalQuantity: 1,
            totalAmount: 1,
            averageRate: { $avg: '$rates' },
            minRate: { $min: '$rates' },
            maxRate: { $max: '$rates' },
            purchaseCount: { $size: '$purchases' },
            purchases: 1
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      return itemReport.map((item) => ({
        ...item,
        purchases: item.purchases.map((p: any) => ({
          ...p,
          poDate: p.poDate?.toISOString() || new Date().toISOString()
        }))
      }));
    } catch (error) {
      logger.error('Error in getItemWisePurchaseReport', { error, filters });
      throw error;
    }
  }

  /**
   * Get Category-wise Purchase Report
   */
  async getCategoryWisePurchaseReport(filters: ReportFilters): Promise<any[]> {
    try {
      const { companyId, category, dateFrom, dateTo } = filters;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const matchConditions: any = {
        companyId: this.validateObjectId(companyId),
        isActive: true
      };

      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(matchConditions, dateFilter);
      }

      if (category) {
        matchConditions.category = category;
      }

      const categoryReport = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$category',
            totalPurchases: { $sum: '$amounts.grandTotal' },
            totalQuantity: { $sum: { $sum: '$items.quantity' } },
            totalOrders: { $sum: 1 },
            items: { $push: '$items' },
            vendors: {
              $addToSet: {
                vendorId: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierId', false] },
                    { $toString: '$supplier.supplierId' },
                    { $toString: '$agent.agentId' }
                  ]
                },
                vendorName: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierName', false] },
                    '$supplier.supplierName',
                    '$agent.agentName'
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            totalPurchases: 1,
            totalQuantity: 1,
            totalOrders: 1,
            averageOrderValue: { $divide: ['$totalPurchases', '$totalOrders'] },
            items: 1,
            vendors: 1
          }
        },
        { $sort: { totalPurchases: -1 } }
      ]);

      // Process items and vendors for each category
      const result = await Promise.all(
        categoryReport.map(async (cat) => {
          // Process items
          const itemMap = new Map<string, any>();
          for (const itemArray of cat.items) {
            for (const item of itemArray) {
              const itemId = item.itemId?.toString() || item._id?.toString() || 'unknown';
              const itemName = item.itemName || item.name || 'Unknown Item';
              const itemCode = item.itemCode || item.code || '';

              if (!itemMap.has(itemId)) {
                itemMap.set(itemId, {
                  itemId,
                  itemName,
                  itemCode,
                  totalQuantity: 0,
                  totalAmount: 0,
                  rates: []
                });
              }

              const itemData = itemMap.get(itemId)!;
              itemData.totalQuantity += item.quantity || 0;
              itemData.totalAmount += (item.lineTotal || item.amount || 0);
              if (item.rate) {
                itemData.rates.push(item.rate);
              }
            }
          }

          const items = Array.from(itemMap.values()).map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode,
            totalQuantity: item.totalQuantity,
            totalAmount: item.totalAmount,
            averageRate: item.rates.length > 0
              ? item.rates.reduce((a, b) => a + b, 0) / item.rates.length
              : 0
          }));

          // Process vendors
          const vendorMap = new Map<string, any>();
          for (const vendor of cat.vendors) {
            if (!vendor.vendorId) continue;
            if (!vendorMap.has(vendor.vendorId)) {
              vendorMap.set(vendor.vendorId, {
                vendorId: vendor.vendorId,
                vendorName: vendor.vendorName,
                totalPurchases: 0,
                totalOrders: 0
              });
            }
          }

          // Get vendor stats from orders
          const vendorStats = await PurchaseOrder.aggregate([
            {
              $match: {
                ...matchConditions,
                category: cat.category
              }
            },
            {
              $group: {
                _id: {
                  vendorId: {
                    $cond: [
                      { $ifNull: ['$supplier.supplierId', false] },
                      { $toString: '$supplier.supplierId' },
                      { $toString: '$agent.agentId' }
                    ]
                  }
                },
                totalPurchases: { $sum: '$amounts.grandTotal' },
                totalOrders: { $sum: 1 }
              }
            }
          ]);

          const vendors = vendorStats.map((stat) => ({
            vendorId: stat._id.vendorId,
            vendorName: vendorMap.get(stat._id.vendorId)?.vendorName || 'Unknown',
            totalPurchases: stat.totalPurchases,
            totalOrders: stat.totalOrders
          }));

          return {
            category: cat.category || 'uncategorized',
            totalPurchases: cat.totalPurchases || 0,
            totalQuantity: cat.totalQuantity || 0,
            totalOrders: cat.totalOrders,
            averageOrderValue: cat.averageOrderValue || 0,
            items,
            vendors
          };
        })
      );

      return result;
    } catch (error) {
      logger.error('Error in getCategoryWisePurchaseReport', { error, filters });
      throw error;
    }
  }

  /**
   * Get Date Range Report
   */
  async getDateRangeReport(filters: ReportFilters): Promise<any> {
    try {
      const { companyId, vendorId, dateFrom, dateTo } = filters;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      if (!dateFrom || !dateTo) {
        throw new AppError('Date range (dateFrom and dateTo) is required', 400);
      }

      const matchConditions: any = {
        companyId: this.validateObjectId(companyId),
        isActive: true
      };

      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(matchConditions, dateFilter);
      }

      if (vendorId) {
        matchConditions.$or = [
          { 'supplier.supplierId': this.validateObjectId(vendorId) },
          { 'agent.agentId': this.validateObjectId(vendorId) }
        ];
      }

      const [summary, vendorDetails, itemDetails, poEntries] = await Promise.all([
        // Summary
        PurchaseOrder.aggregate([
          { $match: matchConditions },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amounts.grandTotal' },
              totalQuantity: { $sum: { $sum: '$items.quantity' } },
              totalOrders: { $sum: 1 }
            }
          }
        ]),

        // Vendor Details
        PurchaseOrder.aggregate([
          { $match: matchConditions },
          {
            $group: {
              _id: {
                vendorId: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierId', false] },
                    { $toString: '$supplier.supplierId' },
                    { $toString: '$agent.agentId' }
                  ]
                },
                vendorName: {
                  $cond: [
                    { $ifNull: ['$supplier.supplierName', false] },
                    '$supplier.supplierName',
                    '$agent.agentName'
                  ]
                }
              },
              totalPurchases: { $sum: '$amounts.grandTotal' },
              totalOrders: { $sum: 1 }
            }
          },
          {
            $project: {
              vendorId: '$_id.vendorId',
              vendorName: '$_id.vendorName',
              totalPurchases: 1,
              totalOrders: 1
            }
          },
          { $sort: { totalPurchases: -1 } }
        ]),

        // Item Details
        PurchaseOrder.aggregate([
          { $match: matchConditions },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.itemId',
              itemName: { $first: '$items.itemName' },
              itemCode: { $first: '$items.itemCode' },
              totalQuantity: { $sum: '$items.quantity' },
              totalAmount: { $sum: { $ifNull: ['$items.lineTotal', 0] } }
            }
          },
          {
            $project: {
              itemId: { $toString: '$_id' },
              itemName: 1,
              itemCode: 1,
              totalQuantity: 1,
              totalAmount: 1
            }
          },
          { $sort: { totalAmount: -1 } }
        ]),

        // PO Entries
        PurchaseOrder.aggregate([
          { $match: matchConditions },
          {
            $project: {
              poNumber: 1,
              poDate: 1,
              vendorName: {
                $cond: [
                  { $ifNull: ['$supplier.supplierName', false] },
                  '$supplier.supplierName',
                  '$agent.agentName'
                ]
              },
              vendorId: {
                $cond: [
                  { $ifNull: ['$supplier.supplierId', false] },
                  { $toString: '$supplier.supplierId' },
                  { $toString: '$agent.agentId' }
                ]
              },
              totalAmount: '$amounts.grandTotal',
              totalQuantity: { $sum: '$items.quantity' },
              itemCount: { $size: '$items' },
              status: 1,
              paymentStatus: 1
            }
          },
          { $sort: { poDate: -1 } }
        ])
      ]);

      const summaryData = summary[0] || {
        totalAmount: 0,
        totalQuantity: 0,
        totalOrders: 0
      };

      return {
        dateFrom,
        dateTo,
        totalAmount: summaryData.totalAmount || 0,
        totalQuantity: summaryData.totalQuantity || 0,
        totalOrders: summaryData.totalOrders || 0,
        averageOrderValue: summaryData.totalOrders > 0
          ? (summaryData.totalAmount || 0) / summaryData.totalOrders
          : 0,
        vendorDetails: vendorDetails.map((v) => ({
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          totalPurchases: v.totalPurchases || 0,
          totalOrders: v.totalOrders
        })),
        itemDetails: itemDetails.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          itemCode: i.itemCode,
          totalQuantity: i.totalQuantity || 0,
          totalAmount: i.totalAmount || 0
        })),
        poEntries: poEntries.map((po) => ({
          poNumber: po.poNumber,
          poDate: po.poDate?.toISOString() || new Date().toISOString(),
          vendorName: po.vendorName,
          vendorId: po.vendorId,
          totalAmount: po.totalAmount || 0,
          totalQuantity: po.totalQuantity || 0,
          itemCount: po.itemCount || 0,
          status: po.status || 'unknown',
          paymentStatus: po.paymentStatus
        }))
      };
    } catch (error) {
      logger.error('Error in getDateRangeReport', { error, filters });
      throw error;
    }
  }
}
