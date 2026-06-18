import { BaseService } from './BaseService';
import GoodsReturn from '../models/GoodsReturn';
import InventoryItem from '../models/InventoryItem';
import StockMovement from '../models/StockMovement';
import { IGoodsReturn } from '@/types/models';
import { AppError } from '../utils/errors';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';

export class GoodsReturnService extends BaseService<IGoodsReturn> {
  constructor() {
    super(GoodsReturn);
  }

  /**
   * Create goods return
   * This will:
   * 1. Reduce inventory stock (for damaged items)
   * 2. Create goods return record
   * 3. Create stock movement record
   */
  async createGoodsReturn(
    inventoryItemId: string,
    returnData: {
      originalChallanNumber: string;
      originalChallanDate?: Date;
      damagedQuantity: number;
      returnedQuantity: number;
      returnReason: 'damaged' | 'defective' | 'quality_issue' | 'wrong_item' | 'expired' | 'other';
      returnReasonDetails?: string;
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
      supplierId?: string;
      supplierName?: string;
      supplierCode?: string;
      notes?: string;
      tags?: string[];
      approvalRequired?: boolean;
    },
    userId: string,
    companyId: string
  ): Promise<IGoodsReturn> {
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

      // Validate quantities
      if (returnData.damagedQuantity < 0 || returnData.returnedQuantity < 0) {
        throw new AppError('Quantities cannot be negative', 400);
      }

      const totalQuantity = returnData.damagedQuantity + returnData.returnedQuantity;
      if (totalQuantity <= 0) {
        throw new AppError('Total quantity must be greater than 0', 400);
      }

      const availableStock = inventoryItem.stock?.currentStock || 0;
      if (availableStock < totalQuantity) {
        throw new AppError(
          `Insufficient stock. Available: ${availableStock}, Requested: ${totalQuantity}`,
          400
        );
      }

      // Calculate stock impact
      const inventoryStockBefore = availableStock;
      const inventoryStockAfter = inventoryStockBefore - totalQuantity;

      // Get existing damaged and returned stock for this item
      const existingReturns = await GoodsReturn.find({
        companyId,
        inventoryItemId,
        status: 'active'
      });

      const damagedStockBefore = existingReturns.reduce(
        (sum, ret) => sum + (ret.damagedQuantity || 0),
        0
      );
      const returnedStockBefore = existingReturns.reduce(
        (sum, ret) => sum + (ret.returnedQuantity || 0),
        0
      );

      const damagedStockAfter = damagedStockBefore + returnData.damagedQuantity;
      const returnedStockAfter = returnedStockBefore + returnData.returnedQuantity;

      // Calculate unit cost from inventory item if not provided
      const unitCost =
        returnData.unitCost ||
        inventoryItem.pricing?.costPrice ||
        inventoryItem.stock?.averageCost ||
        0;

      const damagedValue = unitCost * returnData.damagedQuantity;
      const returnedValue = unitCost * returnData.returnedQuantity;
      const totalValue = unitCost * totalQuantity;

      // Generate return number before creating the document
      const returnNumber = await this.generateReturnNumber(companyId);

      // Create goods return record
      const goodsReturnRecord = new GoodsReturn({
        returnNumber,
        companyId: new Types.ObjectId(companyId),
        inventoryItemId: new Types.ObjectId(inventoryItemId),
        itemCode: inventoryItem.itemCode,
        itemName: inventoryItem.itemName,
        itemDescription: inventoryItem.itemDescription,
        originalChallanNumber: returnData.originalChallanNumber,
        originalChallanDate: returnData.originalChallanDate,
        damagedQuantity: returnData.damagedQuantity,
        returnedQuantity: returnData.returnedQuantity,
        totalQuantity,
        unit: inventoryItem.stock?.unit || 'pcs',
        returnReason: returnData.returnReason,
        returnReasonDetails: returnData.returnReasonDetails,
        warehouseId: returnData.warehouseId
          ? new Types.ObjectId(returnData.warehouseId)
          : undefined,
        warehouseName: returnData.warehouseName,
        zone: returnData.zone,
        rack: returnData.rack,
        bin: returnData.bin,
        stockImpact: {
          inventoryStockBefore,
          inventoryStockAfter,
          damagedStockBefore,
          damagedStockAfter,
          returnedStockBefore,
          returnedStockAfter
        },
        unitCost,
        damagedValue,
        returnedValue,
        totalValue,
        qualityGrade: returnData.qualityGrade,
        defectDetails: returnData.defectDetails,
        batchNumber: returnData.batchNumber || inventoryItem.specifications?.batchNumber,
        lotNumber: returnData.lotNumber || inventoryItem.specifications?.lotNumber,
        manufacturingDate: inventoryItem.specifications?.manufacturingDate,
        expiryDate: inventoryItem.specifications?.expiryDate,
        supplierId: returnData.supplierId
          ? new Types.ObjectId(returnData.supplierId)
          : undefined,
        supplierName: returnData.supplierName,
        supplierCode: returnData.supplierCode,
        approval: {
          isRequired: returnData.approvalRequired || false,
          status: returnData.approvalRequired ? 'pending' : 'approved'
        },
        returnStatus: returnData.approvalRequired ? 'pending' : 'approved',
        notes: returnData.notes,
        tags: returnData.tags || [],
        status: 'active',
        createdBy: new Types.ObjectId(userId)
      });

      // Update inventory stock (reduce by total quantity)
      inventoryItem.stock!.currentStock = inventoryStockAfter;
      inventoryItem.stock!.availableStock = Math.max(
        0,
        inventoryStockAfter - (inventoryItem.stock?.reservedStock || 0)
      );
      inventoryItem.stock!.damagedStock = (inventoryItem.stock?.damagedStock || 0) + returnData.damagedQuantity;
      inventoryItem.stock!.totalValue =
        inventoryStockAfter * (inventoryItem.stock?.averageCost || 0);
      inventoryItem.tracking!.lastStockUpdate = new Date();

      // Save both records in a transaction
      await Promise.all([
        goodsReturnRecord.save(),
        inventoryItem.save()
      ]);

      // Create stock movement record for damaged items
      if (returnData.damagedQuantity > 0) {
        try {
          const StockMovement = (await import('../models/StockMovement')).default;
          const stockMovement = new StockMovement({
            companyId: new Types.ObjectId(companyId),
            movementNumber: await this.generateMovementNumber(companyId),
            movementDate: new Date(),
            itemId: new Types.ObjectId(inventoryItemId),
            itemCode: inventoryItem.itemCode,
            itemName: inventoryItem.itemName,
            movementType: 'outward',
            quantity: returnData.damagedQuantity,
            unit: inventoryItem.stock?.unit || 'pcs',
            rate: unitCost,
            totalValue: damagedValue,
            fromLocation: returnData.warehouseId
              ? {
                  warehouseId: new Types.ObjectId(returnData.warehouseId),
                  warehouseName: returnData.warehouseName,
                  isExternal: false
                }
              : undefined,
            referenceDocument: {
              documentType: 'goods_return',
              documentId: goodsReturnRecord._id,
              documentNumber: goodsReturnRecord.returnNumber
            },
            stockImpact: {
              stockBefore: inventoryStockBefore,
              stockAfter: inventoryStockAfter,
              availableBefore: inventoryItem.stock?.availableStock || 0,
              availableAfter: inventoryStockAfter - (inventoryItem.stock?.reservedStock || 0)
            },
            reason: `Goods Return - Damaged: ${returnData.returnReason}`,
            notes: `Damaged goods return. Challan: ${returnData.originalChallanNumber}`,
            tags: ['goods_return'],
            createdBy: new Types.ObjectId(userId)
          });
          await stockMovement.save();
        } catch (movementError) {
          logger.warn('Failed to create stock movement record for goods return', {
            error: movementError,
            returnId: goodsReturnRecord._id
          });
          // Don't fail the entire operation if stock movement fails
        }
      }

      logger.info('Goods return created successfully', {
        returnNumber: goodsReturnRecord.returnNumber,
        inventoryItemId,
        companyId
      });

      return goodsReturnRecord;
    } catch (error: any) {
      logger.error('Error creating goods return', {
        error: error.message,
        inventoryItemId,
        companyId,
        returnData
      });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to create goods return', 500, error);
    }
  }

  /**
   * Get goods returns by challan number
   */
  async getReturnsByChallan(
    companyId: string,
    challanNumber: string
  ): Promise<IGoodsReturn[]> {
    try {
      return await GoodsReturn.find({
        companyId: new Types.ObjectId(companyId),
        originalChallanNumber: challanNumber,
        status: 'active'
      })
        .populate('inventoryItemId', 'itemCode itemName')
        .populate('createdBy', 'name email')
        .sort({ returnDate: -1 });
    } catch (error: any) {
      logger.error('Error fetching returns by challan', { error, companyId, challanNumber });
      throw new AppError('Failed to fetch returns by challan', 500, error);
    }
  }

  /**
   * Get return summary by challan
   */
  async getChallanReturnSummary(
    companyId: string,
    challanNumber: string
  ): Promise<{
    challanNumber: string;
    totalReturns: number;
    totalDamagedQuantity: number;
    totalReturnedQuantity: number;
    totalValue: number;
    returns: IGoodsReturn[];
  }> {
    try {
      const returns = await this.getReturnsByChallan(companyId, challanNumber);
      
      const summary = {
        challanNumber,
        totalReturns: returns.length,
        totalDamagedQuantity: returns.reduce((sum, ret) => sum + (ret.damagedQuantity || 0), 0),
        totalReturnedQuantity: returns.reduce((sum, ret) => sum + (ret.returnedQuantity || 0), 0),
        totalValue: returns.reduce((sum, ret) => sum + (ret.totalValue || 0), 0),
        returns
      };

      return summary;
    } catch (error: any) {
      logger.error('Error getting challan return summary', { error, companyId, challanNumber });
      throw new AppError('Failed to get challan return summary', 500, error);
    }
  }

  /**
   * Generate movement number for stock movement
   */
  private async generateMovementNumber(companyId: string): Promise<string> {
    const Company = (await import('../models/Company')).default;
    const company = await Company.findById(companyId);
    const companyCode = company?.companyCode || 'COMP';
    
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    const seconds = today.getSeconds().toString().padStart(2, '0');
    const milliseconds = today.getMilliseconds().toString().padStart(3, '0');
    
    const StockMovement = (await import('../models/StockMovement')).default;
    const count = await StockMovement.countDocuments({ 
      companyId: new Types.ObjectId(companyId),
      movementDate: {
        $gte: new Date(year, today.getMonth(), today.getDate()),
        $lt: new Date(year, today.getMonth(), today.getDate() + 1)
      }
    });

    return `MOV${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${(count + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Generate return number
   */
  private async generateReturnNumber(companyId: string): Promise<string> {
    try {
      const Company = (await import('../models/Company')).default;
      const company = await Company.findById(companyId);
      const companyCode = company?.companyCode || 'COMP';

      // Generate return number: GR-{COMPANY_CODE}-{YYYYMMDD}-{SEQ}
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

      // Find the count of returns created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const count = await GoodsReturn.countDocuments({
        companyId: new Types.ObjectId(companyId),
        returnDate: { $gte: todayStart, $lte: todayEnd }
      });

      const sequence = String(count + 1).padStart(4, '0');
      return `GR-${companyCode}-${date}-${sequence}`;
    } catch (error) {
      logger.error('Error generating return number', { error, companyId });
      throw new AppError('Failed to generate return number', 500);
    }
  }
}

