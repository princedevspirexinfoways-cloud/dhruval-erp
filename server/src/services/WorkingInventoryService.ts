import { Types } from 'mongoose';
import { InventoryService } from './InventoryService';
import { MaterialConsumptionService } from './MaterialConsumptionService';
import InventoryItem from '../models/InventoryItem';
import { ProductionBatch } from '../models/ProductionBatch';
import StockMovement from '../models/StockMovement';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface WorkingInventoryTransferRequest {
  sourceItemId: string;
  quantity: number;
  batchId: string;
  transferredBy: string;
  notes?: string;
}

export interface BatchToWorkingInventoryRequest {
  batchId: string;
  materialInputs: {
    itemId: string;
    quantity: number;
    unit: string;
  }[];
  transferredBy: string;
}

export class WorkingInventoryService {
  private inventoryService: InventoryService;
  private materialConsumptionService: MaterialConsumptionService;

  constructor() {
    this.inventoryService = new InventoryService();
    this.materialConsumptionService = new MaterialConsumptionService();
  }

  /**
   * Transfer raw materials to working inventory for a production batch
   */
  async transferToWorkingInventory(request: BatchToWorkingInventoryRequest): Promise<string[]> {
    try {
      const batch = await ProductionBatch.findById(request.batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      const workingInventoryItemIds: string[] = [];

      // Process each material input
      for (const materialInput of request.materialInputs) {
        const sourceItem = await InventoryItem.findById(materialInput.itemId);
        if (!sourceItem) {
          throw new AppError(`Source inventory item ${materialInput.itemId} not found`, 404);
        }

        // Check if sufficient stock is available
        if (sourceItem.stock.availableStock < materialInput.quantity) {
          throw new AppError(
            `Insufficient stock for ${sourceItem.itemName}. Available: ${sourceItem.stock.availableStock}, Required: ${materialInput.quantity}`,
            400
          );
        }

        // Create working inventory item
        const workingInventoryItemData = {
          itemCode: `WIP-${batch.batchNumber}-${sourceItem.itemCode}-${Date.now()}`,
          companyItemCode: `WIP-${batch.batchNumber}-${sourceItem.companyItemCode}`,
          itemName: `${sourceItem.itemName} (Working - Batch: ${batch.batchNumber})`,
          description: `Working inventory for batch ${batch.batchNumber} - ${sourceItem.itemDescription || sourceItem.itemName}`,
          category: {
            primary: 'working_inventory' as const,
            secondary: sourceItem.category.secondary,
            tertiary: sourceItem.category.tertiary
          },
          itemType: 'working_inventory',
          unit: materialInput.unit,
          companyId: batch.companyId as any,
          
          // Stock information
          stock: {
            currentStock: materialInput.quantity,
            availableStock: materialInput.quantity,
            reservedStock: 0,
            inTransitStock: 0,
            damagedStock: 0,
            unit: materialInput.unit,
            reorderLevel: 0,
            minStockLevel: 0,
            maxStockLevel: materialInput.quantity * 2,
            valuationMethod: 'FIFO' as const,
            averageCost: sourceItem.stock.averageCost,
            totalValue: materialInput.quantity * sourceItem.stock.averageCost
          },
          
          // Pricing information (inherit from source)
          pricing: {
            costPrice: sourceItem.pricing?.costPrice || 0,
            sellingPrice: sourceItem.pricing?.sellingPrice || 0,
            currency: sourceItem.pricing?.currency || 'INR'
          },
          
          // Quality information (inherit from source)
          quality: {
            qualityGrade: sourceItem.quality?.qualityGrade || 'A',
            defectPercentage: sourceItem.quality?.defectPercentage || 0,
            qualityCheckRequired: true,
            qualityParameters: sourceItem.quality?.qualityParameters || [],
            lastQualityCheck: new Date(),
            qualityNotes: `Transferred from ${sourceItem.itemName} for batch ${batch.batchNumber}`,
            certifications: sourceItem.quality?.certifications || []
          },
          
          // Production tracking
          productionInfo: {
            batchId: new Types.ObjectId(request.batchId),
            batchNumber: batch.batchNumber,
            sourceItemId: new Types.ObjectId(materialInput.itemId),
            transferredBy: new Types.ObjectId(request.transferredBy),
            transferDate: new Date()
          }
        };

        // Create the working inventory item
        const workingInventoryItem = await this.inventoryService.createInventoryItem(
          workingInventoryItemData,
          request.transferredBy
        );

        workingInventoryItemIds.push(workingInventoryItem._id.toString());

        // Reduce stock from source item
        const sourceWarehouseId = sourceItem.locations[0]?.warehouseId?.toString();
        if (!sourceWarehouseId) {
          throw new AppError(`No warehouse location found for ${sourceItem.itemName}`, 400);
        }

        await this.inventoryService.updateStock(
          materialInput.itemId,
          sourceWarehouseId,
          materialInput.quantity,
          'out',
          `BATCH-${batch.batchNumber}-WIP-TRANSFER`,
          `Transferred to working inventory for batch ${batch.batchNumber}`,
          request.transferredBy
        );

        // Create transfer movement record
        await StockMovement.create({
          companyId: batch.companyId,
          itemId: new Types.ObjectId(materialInput.itemId),
          movementType: 'transfer',
          quantity: materialInput.quantity,
          unit: materialInput.unit,
          movementDate: new Date(),
          movementNumber: `WIP-TRANSFER-${Date.now()}`,
          fromLocation: {
            warehouseId: new Types.ObjectId(sourceWarehouseId),
            warehouseName: sourceItem.locations[0]?.warehouseName || 'Unknown',
            isExternal: false
          },
          toLocation: {
            warehouseId: new Types.ObjectId(sourceWarehouseId), // Same warehouse, different category
            warehouseName: sourceItem.locations[0]?.warehouseName || 'Unknown',
            isExternal: false
          },
          referenceDocument: {
            documentType: 'transfer_note',
            documentNumber: `BATCH-${batch.batchNumber}-WIP`
          },
          notes: `Transfer to working inventory for production batch ${batch.batchNumber}`,
          createdBy: new Types.ObjectId(request.transferredBy)
        });

        logger.info('Material transferred to working inventory', {
          batchId: request.batchId,
          batchNumber: batch.batchNumber,
          sourceItemId: materialInput.itemId,
          sourceItemName: sourceItem.itemName,
          workingInventoryItemId: workingInventoryItem._id,
          quantity: materialInput.quantity,
          transferredBy: request.transferredBy
        });
      }

      // Update batch with working inventory references
      await ProductionBatch.findByIdAndUpdate(request.batchId, {
        $push: {
          workingInventoryItems: {
            $each: workingInventoryItemIds.map(id => new Types.ObjectId(id))
          }
        },
        status: 'in_progress',
        actualStartDate: new Date()
      });

      return workingInventoryItemIds;

    } catch (error) {
      logger.error('Error transferring materials to working inventory', { error, request });
      throw error;
    }
  }

  /**
   * Transfer working inventory back to finished goods after production completion
   */
  async transferToFinishedGoods(
    workingInventoryItemId: string,
    finishedGoodsData: {
      itemName: string;
      quantity: number;
      unit: string;
      qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
      defects?: string[];
      notes?: string;
    },
    transferredBy: string
  ): Promise<string> {
    try {
      const workingItem = await InventoryItem.findById(workingInventoryItemId);
      if (!workingItem) {
        throw new AppError('Working inventory item not found', 404);
      }

      if (workingItem.category.primary !== 'working_inventory') {
        throw new AppError('Item is not in working inventory', 400);
      }

      // Create finished goods item
      const finishedGoodsItemData = {
        itemCode: `FG-${workingItem.itemCode.replace('WIP-', '')}-${Date.now()}`,
        companyItemCode: `FG-${workingItem.companyItemCode.replace('WIP-', '')}`,
        itemName: finishedGoodsData.itemName,
        description: `Finished goods from ${workingItem.itemName}`,
        category: {
          primary: 'finished_goods' as const,
          secondary: workingItem.category.secondary,
          tertiary: workingItem.category.tertiary
        },
        itemType: 'finished_goods',
        unit: finishedGoodsData.unit,
        companyId: workingItem.companyId,
        
        // Stock information
        stock: {
          currentStock: finishedGoodsData.quantity,
          availableStock: finishedGoodsData.quantity,
          reservedStock: 0,
          inTransitStock: 0,
          damagedStock: 0,
          unit: finishedGoodsData.unit,
          reorderLevel: 0,
          minStockLevel: 0,
          maxStockLevel: finishedGoodsData.quantity * 2,
          valuationMethod: 'FIFO' as const,
          averageCost: workingItem.stock.averageCost,
          totalValue: finishedGoodsData.quantity * workingItem.stock.averageCost
        },
        
        // Pricing information
        pricing: {
          costPrice: workingItem.pricing?.costPrice || 0,
          sellingPrice: (workingItem.pricing?.costPrice || 0) * 1.3, // 30% markup
          currency: workingItem.pricing?.currency || 'INR'
        },
        
        // Quality information
        quality: {
          qualityGrade: (finishedGoodsData.qualityGrade === 'Reject' ? 'C' : finishedGoodsData.qualityGrade) || 'A',
          defectPercentage: finishedGoodsData.defects ? (finishedGoodsData.defects.length / finishedGoodsData.quantity) * 100 : 0,
          qualityCheckRequired: true,
          qualityParameters: finishedGoodsData.defects || [],
          lastQualityCheck: new Date(),
          qualityNotes: finishedGoodsData.notes || '',
          certifications: []
        },
        
        // Production tracking
        productionInfo: {
          ...(workingItem as any).productionInfo,
          completedBy: new Types.ObjectId(transferredBy),
          completionDate: new Date()
        }
      };

      // Create the finished goods item
      const finishedGoodsItem = await this.inventoryService.createInventoryItem(
        finishedGoodsItemData,
        transferredBy
      );

      // Mark working inventory item as consumed
      await InventoryItem.findByIdAndUpdate(workingInventoryItemId, {
        'stock.currentStock': 0,
        'stock.availableStock': 0,
        status: 'consumed',
        isActive: false
      });

      logger.info('Working inventory transferred to finished goods', {
        workingInventoryItemId,
        finishedGoodsItemId: finishedGoodsItem._id,
        quantity: finishedGoodsData.quantity,
        qualityGrade: finishedGoodsData.qualityGrade,
        transferredBy
      });

      return finishedGoodsItem._id.toString();

    } catch (error) {
      logger.error('Error transferring working inventory to finished goods', { error, workingInventoryItemId });
      throw error;
    }
  }

  /**
   * Get working inventory items for a batch
   */
  async getWorkingInventoryForBatch(batchId: string): Promise<any[]> {
    try {
      const workingInventoryItems = await InventoryItem.find({
        'category.primary': 'working_inventory',
        'productionInfo.batchId': new Types.ObjectId(batchId),
        isActive: true
      }).populate('productionInfo.sourceItemId', 'itemName itemCode');

      return workingInventoryItems;

    } catch (error) {
      logger.error('Error getting working inventory for batch', { error, batchId });
      throw error;
    }
  }

  /**
   * Get working inventory statistics
   */
  async getWorkingInventoryStats(companyId: string): Promise<any> {
    try {
      const stats = await InventoryItem.aggregate([
        {
          $match: {
            companyId: new Types.ObjectId(companyId),
            'category.primary': 'working_inventory',
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: '$stock.currentStock' },
            totalValue: { $sum: '$stock.totalValue' },
            averageValue: { $avg: '$stock.totalValue' }
          }
        }
      ]);

      return stats[0] || {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        averageValue: 0
      };

    } catch (error) {
      logger.error('Error getting working inventory stats', { error, companyId });
      throw error;
    }
  }
}
