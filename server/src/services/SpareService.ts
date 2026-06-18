import { FilterQuery, Types } from 'mongoose';
import { BaseService } from './BaseService';
import { ISpare } from '@/types/models';
import Spare from '../models/Spare';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export interface SpareFilters {
  companyId?: string; // Optional for superadmin access to all companies
  category?: string;
  manufacturer?: string;
  isActive?: boolean;
  isLowStock?: boolean;
  isCritical?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SpareStats {
  totalSpares: number;
  activeSpares: number;
  lowStockSpares: number;
  criticalSpares: number;
  outOfStockSpares: number;
  totalValue: number;
  categoriesBreakdown: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  criticalityBreakdown: Array<{
    criticality: string;
    count: number;
  }>;
}

export class SpareService extends BaseService<ISpare> {
  constructor() {
    super(Spare);
  }

  /**
   * Get spares by company with advanced filtering and pagination
   */
  async getSparesByCompany(filters: SpareFilters): Promise<{
    spares: ISpare[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Debug logging
      console.log('SpareService.getSparesByCompany called with filters:', filters);
      
      const {
        companyId,
        category,
        manufacturer,
        isActive,
        isLowStock,
        isCritical,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build filter query
      const query: FilterQuery<ISpare> = {};
      
      if (companyId) {
        query.companyId = new Types.ObjectId(companyId);
        console.log('Added companyId filter:', companyId);
      } else {
        console.log('No companyId filter - superadmin access to all companies');
      }
      
      if (category) {
        query.category = category;
        console.log('Added category filter:', category);
      }
      
      if (manufacturer) {
        query.manufacturer = new RegExp(manufacturer, 'i');
        console.log('Added manufacturer filter:', manufacturer);
      }
      
      if (isActive !== undefined) {
        query['status.isActive'] = isActive;
        console.log('Added isActive filter:', isActive);
      }
      
      if (isCritical !== undefined) {
        query['status.isCritical'] = isCritical;
        console.log('Added isCritical filter:', isCritical);
      }
      
      if (search) {
        query.$or = [
          { spareCode: new RegExp(search, 'i') },
          { spareName: new RegExp(search, 'i') },
          { partNumber: new RegExp(search, 'i') },
          { manufacturer: new RegExp(search, 'i') },
          { brand: new RegExp(search, 'i') }
        ];
        console.log('Added search filter:', search);
      }

      // Handle low stock filter
      if (isLowStock) {
        query.$expr = {
          $lte: ['$stock.currentStock', '$stock.reorderLevel']
        };
        console.log('Added low stock filter');
      }

      console.log('Final query:', JSON.stringify(query, null, 2));

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      console.log('Sort object:', sort);

      // Execute queries
      console.log('Executing database queries...');
      
      // First try without populate to see if that's the issue
      let spares;
      try {
        spares = await this.model
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();
        console.log('Query executed successfully without populate');
      } catch (populateError) {
        console.log('Populate error, trying without populate:', populateError.message);
        // If populate fails, try without it
        spares = await this.model
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();
      }
      
      const total = await this.model.countDocuments(query);

      console.log('Database query results:', { sparesCount: spares.length, total });

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${spares.length} spares for company ${companyId}`, {
        total,
        page,
        limit,
        totalPages
      });

      return {
        spares: spares as ISpare[],
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.log('Error in SpareService.getSparesByCompany:', error);
      logger.error('Error getting spares by company', { error, filters });
      throw new AppError('Failed to retrieve spares', 500, error);
    }
  }

  /**
   * Get spare statistics for dashboard
   */
  async getSpareStats(companyId: string): Promise<SpareStats> {
    try {
      const pipeline: any[] = [
        { $match: { companyId: new Types.ObjectId(companyId) } },
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalSpares: { $sum: 1 },
                  activeSpares: {
                    $sum: { $cond: [{ $eq: ['$status.isActive', true] }, 1, 0] }
                  },
                  lowStockSpares: {
                    $sum: { $cond: [{ $lte: ['$stock.currentStock', '$stock.reorderLevel'] }, 1, 0] }
                  },
                  criticalSpares: {
                    $sum: { $cond: [{ $eq: ['$status.isCritical', true] }, 1, 0] }
                  },
                  outOfStockSpares: {
                    $sum: { $cond: [{ $eq: ['$stock.currentStock', 0] }, 1, 0] }
                  },
                  totalValue: { $sum: '$stock.totalValue' }
                }
              }
            ],
            categoriesBreakdown: [
              {
                $group: {
                  _id: '$category',
                  count: { $sum: 1 },
                  value: { $sum: '$stock.totalValue' }
                }
              },
              { $sort: { count: -1 } }
            ],
            criticalityBreakdown: [
              {
                $group: {
                  _id: '$maintenance.criticality',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } }
            ]
          }
        }
      ];

      const [result] = await this.model.aggregate(pipeline);
      
      const stats: SpareStats = {
        totalSpares: result.totalStats[0]?.totalSpares || 0,
        activeSpares: result.totalStats[0]?.activeSpares || 0,
        lowStockSpares: result.totalStats[0]?.lowStockSpares || 0,
        criticalSpares: result.totalStats[0]?.criticalSpares || 0,
        outOfStockSpares: result.totalStats[0]?.outOfStockSpares || 0,
        totalValue: result.totalStats[0]?.totalValue || 0,
        categoriesBreakdown: result.categoriesBreakdown.map((item: any) => ({
          category: item._id,
          count: item.count,
          value: item.value
        })),
        criticalityBreakdown: result.criticalityBreakdown.map((item: any) => ({
          criticality: item._id,
          count: item.count
        }))
      };

      logger.info(`Retrieved spare stats for company ${companyId}`, stats);
      return stats;
    } catch (error) {
      logger.error('Error getting spare stats', { error, companyId });
      throw new AppError('Failed to retrieve spare statistics', 500, error);
    }
  }

  /**
   * Get low stock spares
   */
  async getLowStockSpares(companyId: string): Promise<ISpare[]> {
    try {
      const spares = await this.model
        .find({
          companyId: new Types.ObjectId(companyId),
          'status.isActive': true,
          $expr: {
            $lte: ['$stock.currentStock', '$stock.reorderLevel']
          }
        })
        .sort({ 'stock.currentStock': 1 })
        .populate('suppliers.supplierId', 'supplierName supplierCode')
        .lean();

      logger.info(`Retrieved ${spares.length} low stock spares for company ${companyId}`);
      return spares as ISpare[];
    } catch (error) {
      logger.error('Error getting low stock spares', { error, companyId });
      throw new AppError('Failed to retrieve low stock spares', 500, error);
    }
  }

  /**
   * Update spare stock
   */
  async updateStock(
    spareId: string,
    stockUpdate: {
      quantity: number;
      type: 'inward' | 'outward' | 'adjustment';
      reason: string;
      userId: string;
      warehouseId?: string;
    }
  ): Promise<ISpare | null> {
    try {
      const { quantity, type, reason, userId, warehouseId } = stockUpdate;
      
      const spare = await this.model.findById(spareId);
      if (!spare) {
        throw new AppError('Spare not found', 404);
      }

      // Update stock based on type
      switch (type) {
        case 'inward':
          spare.stock.currentStock += quantity;
          spare.tracking.totalInward += quantity;
          break;
        case 'outward':
          if (spare.stock.currentStock < quantity) {
            throw new AppError('Insufficient stock', 400);
          }
          spare.stock.currentStock -= quantity;
          spare.tracking.totalOutward += quantity;
          break;
        case 'adjustment':
          spare.stock.currentStock = quantity;
          spare.tracking.totalAdjustments += 1;
          break;
      }

      // Update tracking information
      spare.tracking.lastStockUpdate = new Date();
      spare.tracking.lastMovementDate = new Date();
      spare.tracking.lastModifiedBy = new Types.ObjectId(userId);

      // Recalculate available stock and total value
      spare.stock.availableStock = spare.stock.currentStock - spare.stock.reservedStock;
      spare.stock.totalValue = spare.stock.currentStock * spare.stock.averageCost;

      const updatedSpare = await spare.save();
      
      logger.info(`Updated stock for spare ${spareId}`, {
        type,
        quantity,
        newStock: updatedSpare.stock.currentStock,
        userId
      });

      return updatedSpare;
    } catch (error) {
      logger.error('Error updating spare stock', { error, spareId, stockUpdate });
      throw error instanceof AppError ? error : new AppError('Failed to update spare stock', 500, error);
    }
  }

  /**
   * Check if spare code is unique within company
   */
  async isSpareCodeUnique(companyId: string, spareCode: string, excludeId?: string): Promise<boolean> {
    try {
      const query: FilterQuery<ISpare> = {
        companyId: new Types.ObjectId(companyId),
        spareCode: spareCode.toUpperCase()
      };

      if (excludeId) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const existingSpare = await this.model.findOne(query);
      return !existingSpare;
    } catch (error) {
      logger.error('Error checking spare code uniqueness', { error, companyId, spareCode });
      throw new AppError('Failed to check spare code uniqueness', 500, error);
    }
  }

  /**
   * Get spares by category
   */
  async getSparesByCategory(companyId: string, category: string): Promise<ISpare[]> {
    try {
      const spares = await this.model
        .find({
          companyId: new Types.ObjectId(companyId),
          category,
          'status.isActive': true
        })
        .sort({ spareName: 1 })
        .lean();

      logger.info(`Retrieved ${spares.length} spares for category ${category} in company ${companyId}`);
      return spares as ISpare[];
    } catch (error) {
      logger.error('Error getting spares by category', { error, companyId, category });
      throw new AppError('Failed to retrieve spares by category', 500, error);
    }
  }
}
