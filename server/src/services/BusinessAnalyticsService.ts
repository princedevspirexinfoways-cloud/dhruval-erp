import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import BusinessAnalytics from '../models/BusinessAnalytics';
import { IBusinessAnalytics } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BusinessAnalyticsService extends BaseService<IBusinessAnalytics> {
  constructor() {
    super(BusinessAnalytics);
  }

  /**
   * Create a new business analytics system
   */
  async createAnalytics(analyticsData: Partial<IBusinessAnalytics>, createdBy?: string): Promise<IBusinessAnalytics> {
    try {
      this.validateAnalyticsData(analyticsData);

      const analytics = await this.create({
        ...analyticsData,
        analyticsId: `BA-${Date.now()}`,
        kpiMetrics: [],
        totalMetrics: 0,
        activeMetrics: 0,
        dataSources: [],
        reports: [],
        dashboards: [],
        alerts: [],
        integrations: [],
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Business analytics system created successfully', {
        analyticsId: analytics.analyticsId,
        analyticsName: analytics.analyticsName,
        createdBy
      });

      return analytics;
    } catch (error) {
      logger.error('Error creating business analytics system', { error, analyticsData, createdBy });
      throw error;
    }
  }

  /**
   * Get analytics by company
   */
  async getAnalyticsByCompany(companyId: string, options: any = {}): Promise<IBusinessAnalytics[]> {
    try {
      let query: any = { 
        companyId: new Types.ObjectId(companyId)
      };

      if (options.reportType) {
        query.reportType = options.reportType;
      }

      if (options.dateRange) {
        query.generatedAt = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      return await this.findMany(query, { 
        sort: { generatedAt: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting analytics by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Generate sales analytics from real database data
   */
  async generateSalesAnalytics(companyId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const { default: Invoice } = await import('../models/Invoice');
      const { default: CustomerOrder } = await import('../models/CustomerOrder');
      const { default: Customer } = await import('../models/Customer');

      const matchQuery = {
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      };

      const [
        totalSalesData,
        totalOrdersData,
        topProductsData,
        salesByMonthData,
        customerAnalyticsData
      ] = await Promise.all([
        // Total sales from invoices
        Invoice.aggregate([
          { $match: { ...matchQuery, status: 'paid' } },
          { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]),
        // Total orders
        CustomerOrder.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalOrders: { $sum: 1 } } }
        ]),
        // Top products from orders
        CustomerOrder.aggregate([
          { $match: matchQuery },
          { $unwind: '$items' },
          { $group: {
            _id: '$items.itemName',
            totalQuantity: { $sum: '$items.quantity' },
            totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
          }},
          { $sort: { totalValue: -1 } },
          { $limit: 10 }
        ]),
        // Sales by month
        Invoice.aggregate([
          { $match: { ...matchQuery, status: 'paid' } },
          { $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }},
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        // Customer analytics
        Customer.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId) } },
          { $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            newCustomers: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', dateRange.start] },
                  1,
                  0
                ]
              }
            }
          }}
        ])
      ]);

      const totalSales = totalSalesData[0]?.totalSales || 0;
      const totalOrders = totalOrdersData[0]?.totalOrders || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts: topProductsData,
        salesByMonth: salesByMonthData,
        customerAnalytics: {
          newCustomers: customerAnalyticsData[0]?.newCustomers || 0,
          totalCustomers: customerAnalyticsData[0]?.totalCustomers || 0,
          returningCustomers: (customerAnalyticsData[0]?.totalCustomers || 0) - (customerAnalyticsData[0]?.newCustomers || 0),
          customerRetentionRate: customerAnalyticsData[0]?.totalCustomers > 0 ?
            ((customerAnalyticsData[0]?.totalCustomers - customerAnalyticsData[0]?.newCustomers) / customerAnalyticsData[0]?.totalCustomers) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Error generating sales analytics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Generate inventory analytics from real database data
   */
  async generateInventoryAnalytics(companyId: string): Promise<any> {
    try {
      const { default: InventoryItem } = await import('../models/InventoryItem');
      const { default: StockMovement } = await import('../models/StockMovement');

      const matchQuery = { companyId: new Types.ObjectId(companyId) };

      const [
        totalItemsData,
        lowStockItemsData,
        outOfStockItemsData,
        totalValueData,
        topMovingItemsData,
        slowMovingItemsData
      ] = await Promise.all([
        // Total items
        InventoryItem.countDocuments(matchQuery),
        // Low stock items (quantity < reorderLevel)
        InventoryItem.countDocuments({
          ...matchQuery,
          $expr: { $lt: ['$currentStock', '$reorderLevel'] }
        }),
        // Out of stock items
        InventoryItem.countDocuments({
          ...matchQuery,
          currentStock: { $lte: 0 }
        }),
        // Total inventory value
        InventoryItem.aggregate([
          { $match: matchQuery },
          { $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } }
          }}
        ]),
        // Top moving items (most stock movements in last 30 days)
        StockMovement.aggregate([
          {
            $match: {
              ...matchQuery,
              movementDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          { $group: {
            _id: '$itemId',
            totalMovements: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }},
          { $sort: { totalMovements: -1 } },
          { $limit: 10 },
          { $lookup: {
            from: 'inventory_items',
            localField: '_id',
            foreignField: '_id',
            as: 'item'
          }},
          { $unwind: '$item' },
          { $project: {
            itemName: '$item.itemName',
            itemCode: '$item.itemCode',
            totalMovements: 1,
            totalQuantity: 1
          }}
        ]),
        // Slow moving items (least stock movements in last 90 days)
        StockMovement.aggregate([
          {
            $match: {
              ...matchQuery,
              movementDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
            }
          },
          { $group: {
            _id: '$itemId',
            totalMovements: { $sum: 1 }
          }},
          { $sort: { totalMovements: 1 } },
          { $limit: 10 },
          { $lookup: {
            from: 'inventory_items',
            localField: '_id',
            foreignField: '_id',
            as: 'item'
          }},
          { $unwind: '$item' },
          { $project: {
            itemName: '$item.itemName',
            itemCode: '$item.itemCode',
            totalMovements: 1
          }}
        ])
      ]);

      // Calculate stock turnover rate
      const totalValue = totalValueData[0]?.totalValue || 0;
      const totalMovementValue = topMovingItemsData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
      const stockTurnoverRate = totalValue > 0 ? (totalMovementValue / totalValue) * 100 : 0;

      return {
        totalItems: totalItemsData,
        lowStockItems: lowStockItemsData,
        outOfStockItems: outOfStockItemsData,
        totalValue,
        topMovingItems: topMovingItemsData,
        slowMovingItems: slowMovingItemsData,
        stockTurnoverRate
      };
    } catch (error) {
      logger.error('Error generating inventory analytics', { error, companyId });
      throw error;
    }
  }

  /**
   * Validate analytics data
   */
  private validateAnalyticsData(analyticsData: Partial<IBusinessAnalytics>): void {
    if (!analyticsData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!analyticsData.analyticsName) {
      throw new AppError('Analytics name is required', 400);
    }
  }
}
