import { BaseService } from './BaseService';
import Scrap from '../models/Scrap';
import InventoryItem from '../models/InventoryItem';
import StockMovement from '../models/StockMovement';
import { IScrap } from '@/types/models';
import { AppError } from '../utils/errors';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';

export class ScrapService extends BaseService<IScrap> {
  constructor() {
    super(Scrap);
  }

  /**
   * Move inventory item to scrap
   * This will:
   * 1. Reduce inventory stock
   * 2. Create scrap record
   * 3. Create stock movement record
   */
  async moveToScrap(
    inventoryItemId: string,
    scrapData: {
      quantity: number;
      scrapReason: 'damaged' | 'defective' | 'expired' | 'obsolete' | 'production_waste' | 'quality_reject' | 'other';
      scrapReasonDetails?: string;
      warehouseId?: string;
      warehouseName?: string;
      zone?: string;
      rack?: string;
      bin?: string;
      unitCost?: number;
      qualityGrade?: string;
      defectDetails?: string;
      batchNumber?: string;
      lotNumber?: string;
      notes?: string;
      tags?: string[];
      approvalRequired?: boolean;
    },
    userId: string,
    companyId: string
  ): Promise<IScrap> {
    try {
      // Validate inventory item
      const inventoryItem = await InventoryItem.findById(inventoryItemId);
      if (!inventoryItem) {
        throw new AppError('Inventory item not found', 404);
      }

      // Verify company match
      if (inventoryItem.companyId.toString() !== companyId) {
        throw new AppError('Inventory item does not belong to this company', 403);
      }

      // Validate quantity
      if (scrapData.quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400);
      }

      const availableStock = inventoryItem.stock?.currentStock || 0;
      if (availableStock < scrapData.quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${availableStock}, Requested: ${scrapData.quantity}`,
          400
        );
      }

      // Calculate stock impact
      const inventoryStockBefore = availableStock;
      const inventoryStockAfter = inventoryStockBefore - scrapData.quantity;

      // Get existing scrap stock for this item (if any)
      const existingScrap = await Scrap.findOne({
        companyId,
        inventoryItemId,
        status: 'active',
        'disposal.disposed': false
      });

      const scrapStockBefore = existingScrap
        ? (await this.getTotalScrapQuantity(inventoryItemId, companyId))
        : 0;
      const scrapStockAfter = scrapStockBefore + scrapData.quantity;

      // Calculate unit cost from inventory item if not provided
      const unitCost =
        scrapData.unitCost ||
        inventoryItem.pricing?.costPrice ||
        inventoryItem.stock?.averageCost ||
        0;

      const totalValue = unitCost * scrapData.quantity;

      // Generate scrap number before creating the document
      const scrapNumber = await this.generateScrapNumber(companyId);

      // Create scrap record
      const scrapRecord = new Scrap({
        scrapNumber,
        companyId: new Types.ObjectId(companyId),
        inventoryItemId: new Types.ObjectId(inventoryItemId),
        itemCode: inventoryItem.itemCode,
        itemName: inventoryItem.itemName,
        itemDescription: inventoryItem.itemDescription,
        quantity: scrapData.quantity,
        unit: inventoryItem.stock?.unit || 'pcs',
        scrapReason: scrapData.scrapReason,
        scrapReasonDetails: scrapData.scrapReasonDetails,
        warehouseId: scrapData.warehouseId
          ? new Types.ObjectId(scrapData.warehouseId)
          : undefined,
        warehouseName: scrapData.warehouseName,
        zone: scrapData.zone,
        rack: scrapData.rack,
        bin: scrapData.bin,
        stockImpact: {
          inventoryStockBefore,
          inventoryStockAfter,
          scrapStockBefore,
          scrapStockAfter
        },
        unitCost,
        totalValue,
        qualityGrade: scrapData.qualityGrade,
        defectDetails: scrapData.defectDetails,
        batchNumber: scrapData.batchNumber || inventoryItem.specifications?.batchNumber,
        lotNumber: scrapData.lotNumber || inventoryItem.specifications?.lotNumber,
        manufacturingDate: inventoryItem.specifications?.manufacturingDate,
        expiryDate: inventoryItem.specifications?.expiryDate,
        approval: {
          isRequired: scrapData.approvalRequired || false,
          status: scrapData.approvalRequired ? 'pending' : 'approved'
        },
        notes: scrapData.notes,
        tags: scrapData.tags || [],
        status: 'active',
        createdBy: new Types.ObjectId(userId)
      });

      // Update inventory stock
      inventoryItem.stock!.currentStock = inventoryStockAfter;
      inventoryItem.stock!.availableStock = Math.max(
        0,
        inventoryStockAfter - (inventoryItem.stock?.reservedStock || 0)
      );
      inventoryItem.stock!.totalValue =
        inventoryStockAfter * (inventoryItem.stock?.averageCost || 0);
      inventoryItem.tracking!.lastStockUpdate = new Date();
      inventoryItem.tracking!.lastMovementDate = new Date();
      inventoryItem.tracking!.totalOutward =
        (inventoryItem.tracking?.totalOutward || 0) + scrapData.quantity;

      // Update location stock if warehouse is specified
      if (scrapData.warehouseId && inventoryItem.locations) {
        const locationIndex = inventoryItem.locations.findIndex(
          (loc) =>
            loc.warehouseId?.toString() === scrapData.warehouseId && loc.isActive
        );
        if (locationIndex !== -1) {
          inventoryItem.locations[locationIndex].quantity = Math.max(
            0,
            inventoryItem.locations[locationIndex].quantity - scrapData.quantity
          );
          inventoryItem.locations[locationIndex].lastUpdated = new Date();
        }
      }

      // Save inventory item and scrap record in transaction
      await inventoryItem.save();
      const savedScrap = await scrapRecord.save();

      // Create stock movement record
      try {
        const stockMovement = new StockMovement({
          companyId: new Types.ObjectId(companyId),
          movementNumber: await this.generateMovementNumber(companyId),
          movementDate: new Date(),
          itemId: new Types.ObjectId(inventoryItemId),
          itemCode: inventoryItem.itemCode,
          itemName: inventoryItem.itemName,
          movementType: 'damage', // Using 'damage' as scrap is a type of damage
          quantity: scrapData.quantity,
          unit: inventoryItem.stock?.unit || 'pcs',
          rate: unitCost,
          totalValue: totalValue,
          fromLocation: scrapData.warehouseId
            ? {
                warehouseId: new Types.ObjectId(scrapData.warehouseId),
                warehouseName: scrapData.warehouseName,
                isExternal: false
              }
            : undefined,
          referenceDocument: {
            documentType: 'adjustment_note',
            documentId: savedScrap._id,
            documentNumber: savedScrap.scrapNumber
          },
          stockImpact: {
            stockBefore: inventoryStockBefore,
            stockAfter: inventoryStockAfter,
            availableBefore: inventoryItem.stock?.availableStock || 0,
            availableAfter: inventoryStockAfter - (inventoryItem.stock?.reservedStock || 0)
          },
          reason: `Moved to scrap: ${scrapData.scrapReason}`,
          notes: scrapData.scrapReasonDetails || scrapData.notes,
          tags: ['scrap'],
          createdBy: new Types.ObjectId(userId)
        });
        await stockMovement.save();
      } catch (movementError) {
        logger.warn('Failed to create stock movement record for scrap', {
          error: movementError,
          scrapId: savedScrap._id
        });
        // Don't fail the entire operation if stock movement fails
      }

      logger.info('Inventory moved to scrap successfully', {
        inventoryItemId,
        scrapId: savedScrap._id,
        quantity: scrapData.quantity,
        userId
      });

      return savedScrap;
    } catch (error) {
      logger.error('Error moving inventory to scrap', {
        error,
        inventoryItemId,
        scrapData,
        userId
      });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to move inventory to scrap', 500, error);
    }
  }

  /**
   * Get total scrap quantity for an inventory item
   */
  async getTotalScrapQuantity(
    inventoryItemId: string,
    companyId: string
  ): Promise<number> {
    try {
      const result = await Scrap.aggregate([
        {
          $match: {
            companyId: new Types.ObjectId(companyId),
            inventoryItemId: new Types.ObjectId(inventoryItemId),
            status: 'active',
            'disposal.disposed': false
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]);

      return result.length > 0 ? result[0].totalQuantity : 0;
    } catch (error) {
      logger.error('Error getting total scrap quantity', { error, inventoryItemId });
      return 0;
    }
  }

  /**
   * Get scrap items by company with filters
   */
  async getScrapByCompany(
    companyId: string,
    filters?: {
      status?: 'active' | 'disposed' | 'cancelled';
      scrapReason?: string;
      inventoryItemId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      disposed?: boolean;
    },
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    scraps: IScrap[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query: any = { companyId: new Types.ObjectId(companyId) };

      if (filters) {
        if (filters.status) {
          query.status = filters.status;
        }
        if (filters.scrapReason) {
          query.scrapReason = filters.scrapReason;
        }
        if (filters.inventoryItemId) {
          query.inventoryItemId = new Types.ObjectId(filters.inventoryItemId);
        }
        if (filters.dateFrom || filters.dateTo) {
          query.scrapDate = {};
          if (filters.dateFrom) {
            query.scrapDate.$gte = filters.dateFrom;
          }
          if (filters.dateTo) {
            query.scrapDate.$lte = filters.dateTo;
          }
        }
        if (filters.disposed !== undefined) {
          query['disposal.disposed'] = filters.disposed;
        }
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const sortBy = pagination?.sortBy || 'scrapDate';
      const sortOrder = pagination?.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      const [scraps, total] = await Promise.all([
        Scrap.find(query)
          .populate('inventoryItemId', 'itemCode itemName')
          .populate('warehouseId', 'name')
          .populate('createdBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Scrap.countDocuments(query)
      ]);

      return {
        scraps,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting scrap by company', { error, companyId });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to get scrap items', 500, error);
    }
  }

  /**
   * Get scrap summary/statistics
   */
  async getScrapSummary(companyId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalScrapQuantity: number;
    totalScrapValue: number;
    byReason: Array<{
      reason: string;
      quantity: number;
      value: number;
      count: number;
    }>;
    byItem: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      quantity: number;
      value: number;
    }>;
  }> {
    try {
      const matchQuery: any = {
        companyId: new Types.ObjectId(companyId),
        status: 'active',
        'disposal.disposed': false
      };

      if (dateFrom || dateTo) {
        matchQuery.scrapDate = {};
        if (dateFrom) matchQuery.scrapDate.$gte = dateFrom;
        if (dateTo) matchQuery.scrapDate.$lte = dateTo;
      }

      const [summaryByReason, summaryByItem, totalStats] = await Promise.all([
        // Summary by reason
        Scrap.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: '$scrapReason',
              quantity: { $sum: '$quantity' },
              value: { $sum: '$totalValue' },
              count: { $sum: 1 }
            }
          },
          { $sort: { quantity: -1 } }
        ]),
        // Summary by item
        Scrap.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: '$inventoryItemId',
              itemCode: { $first: '$itemCode' },
              itemName: { $first: '$itemName' },
              quantity: { $sum: '$quantity' },
              value: { $sum: '$totalValue' }
            }
          },
          { $sort: { quantity: -1 } },
          { $limit: 10 }
        ]),
        // Total stats
        Scrap.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$quantity' },
              totalValue: { $sum: '$totalValue' }
            }
          }
        ])
      ]);

      const totals = totalStats.length > 0 ? totalStats[0] : { totalQuantity: 0, totalValue: 0 };

      return {
        totalScrapQuantity: totals.totalQuantity || 0,
        totalScrapValue: totals.totalValue || 0,
        byReason: summaryByReason.map((item) => ({
          reason: item._id,
          quantity: item.quantity,
          value: item.value || 0,
          count: item.count
        })),
        byItem: summaryByItem.map((item) => ({
          itemId: item._id.toString(),
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.quantity,
          value: item.value || 0
        }))
      };
    } catch (error) {
      logger.error('Error getting scrap summary', { error, companyId });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to get scrap summary', 500, error);
    }
  }

  /**
   * Mark scrap as disposed
   */
  async markAsDisposed(
    scrapId: string,
    disposalData: {
      disposalMethod: 'sold' | 'donated' | 'recycled' | 'destroyed' | 'other';
      disposalValue?: number;
      disposalNotes?: string;
    },
    userId: string,
    companyId: string
  ): Promise<IScrap> {
    try {
      const scrap = await Scrap.findById(scrapId);
      if (!scrap) {
        throw new AppError('Scrap record not found', 404);
      }

      if (scrap.companyId.toString() !== companyId) {
        throw new AppError('Scrap does not belong to this company', 403);
      }

      if (scrap.disposal?.disposed) {
        throw new AppError('Scrap is already disposed', 400);
      }

      scrap.disposal = {
        disposed: true,
        disposalDate: new Date(),
        disposalMethod: disposalData.disposalMethod,
        disposalValue: disposalData.disposalValue || 0,
        disposalNotes: disposalData.disposalNotes,
        disposedBy: new Types.ObjectId(userId)
      };
      scrap.status = 'disposed';
      scrap.lastModifiedBy = new Types.ObjectId(userId);

      const updatedScrap = await scrap.save();

      logger.info('Scrap marked as disposed', {
        scrapId,
        disposalMethod: disposalData.disposalMethod,
        userId
      });

      return updatedScrap;
    } catch (error) {
      logger.error('Error marking scrap as disposed', { error, scrapId, userId });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to mark scrap as disposed', 500, error);
    }
  }

  /**
   * Generate scrap number
   */
  private async generateScrapNumber(companyId: string): Promise<string> {
    try {
      const Company = (await import('../models/Company')).default;
      const company = await Company.findById(companyId);
      const companyCode = company?.companyCode || 'COMP';

      // Generate scrap number: SCRAP-{COMPANY_CODE}-{YYYYMMDD}-{SEQ}
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

      // Find the count of scraps created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const count = await Scrap.countDocuments({
        companyId: new Types.ObjectId(companyId),
        scrapDate: { $gte: todayStart, $lte: todayEnd }
      });

      const sequence = String(count + 1).padStart(4, '0');
      return `SCRAP-${companyCode}-${date}-${sequence}`;
    } catch (error) {
      logger.error('Error generating scrap number', { error, companyId });
      throw new AppError('Failed to generate scrap number', 500);
    }
  }

  /**
   * Generate movement number for stock movement
   */
  private async generateMovementNumber(companyId: string): Promise<string> {
    const Company = (await import('../models/Company')).default;
    const company = await Company.findById(companyId);
    const companyCode = company?.companyCode || 'COMP';

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const count = await StockMovement.countDocuments({
      companyId: new Types.ObjectId(companyId),
      movementDate: { $gte: todayStart, $lte: todayEnd }
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `MOV-${companyCode}-${date}-${sequence}`;
  }
}


