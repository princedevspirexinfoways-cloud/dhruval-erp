import { Types } from 'mongoose';
import { InventoryService } from './InventoryService';
// import { StockMovement } from '../models/StockMovement';
// import InventoryItem from '../models/InventoryItem';
import { ProductionBatch } from '../models/ProductionBatch';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import InventoryItem from '../models/InventoryItem';
import StockMovement from '../models/StockMovement';

export interface MaterialConsumptionRequest {
  batchId: string;
  stageNumber: number;
  materials: {
    itemId: string;
    plannedQuantity: number;
    actualQuantity: number;
    wasteQuantity?: number;
    returnedQuantity?: number;
    unit: string;
    notes?: string;
  }[];
  consumedBy: string;
  consumptionDate?: Date;
}

export interface MaterialReservationRequest {
  batchId: string;
  materials: {
    itemId: string;
    quantity: number;
    unit: string;
  }[];
  reservedBy: string;
}

export interface StageOutputRequest {
  batchId: string;
  stageNumber: number;
  outputs: {
    itemName: string;
    category: {
      primary: 'semi_finished' | 'finished_goods' | 'working_inventory';
      secondary: string;
      tertiary?: string;
    };
    quantity: number;
    unit: string;
    qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
    defects?: string[];
    notes?: string;
  }[];
  producedBy: string;
  productionDate?: Date;
}

export class MaterialConsumptionService {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Reserve materials for a production batch
   */
  async reserveMaterialsForBatch(request: MaterialReservationRequest): Promise<void> {
    try {
      const batch = await ProductionBatch.findById(request.batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      // Reserve each material
      for (const material of request.materials) {
        await this.inventoryService.reserveStock(
          material.itemId,
          material.quantity,
          `BATCH-${batch.batchNumber}`,
          request.reservedBy
        );

        logger.info('Material reserved for batch', {
          batchId: request.batchId,
          batchNumber: batch.batchNumber,
          itemId: material.itemId,
          quantity: material.quantity,
          reservedBy: request.reservedBy
        });
      }

      // Update batch with material reservations
      await ProductionBatch.findByIdAndUpdate(request.batchId, {
        $push: {
          materialInputs: {
            $each: request.materials.map(m => ({
              itemId: new Types.ObjectId(m.itemId),
              plannedQuantity: m.quantity,
              unit: m.unit,
              status: 'reserved',
              reservedAt: new Date(),
              reservedBy: new Types.ObjectId(request.reservedBy)
            }))
          }
        }
      });

    } catch (error) {
      logger.error('Error reserving materials for batch', { error, request });
      throw error;
    }
  }

  /**
   * Consume materials for a production stage
   */
  async consumeMaterialsForStage(request: MaterialConsumptionRequest): Promise<void> {
    try {
      const batch = await ProductionBatch.findById(request.batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      const stage = batch.stages.find(s => (s as any).stageNumber === request.stageNumber);
      if (!stage) {
        throw new AppError(`Stage ${request.stageNumber} not found in batch`, 404);
      }

      // Process each material consumption
      for (const material of request.materials) {
        const inventoryItem = await InventoryItem.findById(material.itemId);
        if (!inventoryItem) {
          throw new AppError(`Inventory item ${material.itemId} not found`, 404);
        }

        // Check if sufficient stock is available (including reserved stock)
        const availableStock = inventoryItem.stock.currentStock;
        if (availableStock < material.actualQuantity) {
          throw new AppError(
            `Insufficient stock for ${inventoryItem.itemName}. Available: ${availableStock}, Required: ${material.actualQuantity}`,
            400
          );
        }

        // Get primary warehouse for the item
        const warehouseId = inventoryItem.locations[0]?.warehouseId?.toString();
        if (!warehouseId) {
          throw new AppError(`No warehouse location found for ${inventoryItem.itemName}`, 400);
        }

        // Consume the material (reduce stock)
        await this.inventoryService.updateStock(
          material.itemId,
          warehouseId,
          material.actualQuantity,
          'out',
          `BATCH-${batch.batchNumber}-STAGE-${request.stageNumber}`,
          `Material consumed for batch ${batch.batchNumber} at stage ${request.stageNumber}. ${material.notes || ''}`,
          request.consumedBy
        );

        // Handle waste if any
        if (material.wasteQuantity && material.wasteQuantity > 0) {
          await this.recordWaste(
            material.itemId,
            material.wasteQuantity,
            `BATCH-${batch.batchNumber}-STAGE-${request.stageNumber}-WASTE`,
            `Waste from batch ${batch.batchNumber} at stage ${request.stageNumber}`,
            request.consumedBy
          );
        }

        // Handle returned materials if any
        if (material.returnedQuantity && material.returnedQuantity > 0) {
          await this.inventoryService.updateStock(
            material.itemId,
            warehouseId,
            material.returnedQuantity,
            'in',
            `BATCH-${batch.batchNumber}-STAGE-${request.stageNumber}-RETURN`,
            `Material returned from batch ${batch.batchNumber} at stage ${request.stageNumber}`,
            request.consumedBy
          );
        }

        logger.info('Material consumed for stage', {
          batchId: request.batchId,
          stageNumber: request.stageNumber,
          itemId: material.itemId,
          itemName: inventoryItem.itemName,
          plannedQuantity: material.plannedQuantity,
          actualQuantity: material.actualQuantity,
          wasteQuantity: material.wasteQuantity || 0,
          returnedQuantity: material.returnedQuantity || 0,
          consumedBy: request.consumedBy
        });
      }

      // Update the stage with material consumption data
      await this.updateStageWithConsumption(request);

    } catch (error) {
      logger.error('Error consuming materials for stage', { error, request });
      throw error;
    }
  }

  /**
   * Record stage output and create inventory items for semi-finished/finished goods
   */
  async recordStageOutput(request: StageOutputRequest, userCompanyId?: string): Promise<string[]> {
    try {
      const batch = await ProductionBatch.findById(request.batchId);
      if (!batch) {
        throw new AppError('Production batch not found', 404);
      }

      const createdItemIds: string[] = [];

      // Create inventory items for each output
      for (const output of request.outputs) {
        const timestamp = Date.now();
        const itemCode = `${batch.batchNumber}-S${request.stageNumber}-${output.itemName.toUpperCase().replace(/\s+/g, '-')}-${timestamp}`;
        
        const inventoryItemData = {
          itemCode,
          companyItemCode: `${batch.batchNumber}-S${request.stageNumber}-${output.itemName}-${timestamp}`,
          itemName: output.itemName,
          description: `${output.itemName} produced from batch ${batch.batchNumber} at stage ${request.stageNumber}`,
          category: output.category,
          itemType: output.category.primary,
          unit: output.unit,
          companyId: userCompanyId || batch.companyId as any,
          
          // Production tracking
          productionInfo: {
            batchId: new Types.ObjectId(request.batchId),
            batchNumber: batch.batchNumber,
            stageNumber: request.stageNumber,
            producedBy: new Types.ObjectId(request.producedBy),
            productionDate: request.productionDate || new Date()
          },
          
          // Stock information
          stock: {
            currentStock: output.quantity,
            availableStock: output.quantity,
            reservedStock: 0,
            inTransitStock: 0,
            damagedStock: 0,
            unit: output.unit,
            reorderLevel: 0,
            minStockLevel: 0,
            maxStockLevel: output.quantity * 2,
            valuationMethod: 'FIFO' as const,
            averageCost: 0, // Will be calculated based on batch costs
            totalValue: 0
          },
          
          // Quality information
          quality: {
            qualityGrade: (output.qualityGrade === 'Reject' ? 'C' : output.qualityGrade) || 'A',
            defectPercentage: output.defects ? (output.defects.length / output.quantity) * 100 : 0,
            qualityCheckRequired: true,
            qualityParameters: output.defects || [],
            lastQualityCheck: new Date(),
            qualityNotes: output.notes || '',
            certifications: []
          }
        };

        let createdItem;
        try {
          createdItem = await this.inventoryService.createInventoryItem(
            inventoryItemData,
            request.producedBy
          );
        } catch (error: any) {
          // Handle duplicate key error by adding a random suffix
          if (error.code === 11000 && error.keyPattern?.companyItemCode) {
            logger.warn('Duplicate companyItemCode detected, retrying with random suffix', {
              originalCode: inventoryItemData.companyItemCode,
              batchId: request.batchId,
              stageNumber: request.stageNumber
            });
            
            // Add random suffix to make it unique
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            inventoryItemData.companyItemCode = `${inventoryItemData.companyItemCode}-${randomSuffix}`;
            inventoryItemData.itemCode = `${inventoryItemData.itemCode}-${randomSuffix}`;
            
            createdItem = await this.inventoryService.createInventoryItem(
              inventoryItemData,
              request.producedBy
            );
          } else {
            throw error;
          }
        }

        createdItemIds.push(createdItem._id.toString());

        logger.info('Stage output recorded as inventory item', {
          batchId: request.batchId,
          stageNumber: request.stageNumber,
          itemId: createdItem._id,
          itemCode: createdItem.itemCode,
          itemName: createdItem.itemName,
          quantity: output.quantity,
          qualityGrade: output.qualityGrade,
          producedBy: request.producedBy
        });

        // Small delay to ensure unique timestamps for multiple outputs
        if (request.outputs.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Update the batch stage with output information
      await this.updateStageWithOutput(request, createdItemIds);

      return createdItemIds;

    } catch (error) {
      logger.error('Error recording stage output', { error, request });
      throw error;
    }
  }

  /**
   * Transfer materials between inventory categories (e.g., raw_material -> working_inventory)
   */
  async transferMaterialCategory(
    itemId: string,
    fromCategory: string,
    toCategory: string,
    transferredBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const item = await InventoryItem.findById(itemId);
      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      // Update the item category
      await InventoryItem.findByIdAndUpdate(itemId, {
        'category.primary': toCategory,
        'tracking.lastModifiedBy': new Types.ObjectId(transferredBy),
        'tracking.lastMovementDate': new Date()
      });

      // Create a stock movement record for the category transfer
      await StockMovement.create({
        companyId: item.companyId,
        itemId: new Types.ObjectId(itemId),
        movementType: 'transfer',
        quantity: item.stock.currentStock,
        unit: item.stock.unit,
        movementDate: new Date(),
        movementNumber: `CAT-TRANSFER-${Date.now()}`,
        fromLocation: {
          warehouseId: item.locations[0]?.warehouseId,
          warehouseName: item.locations[0]?.warehouseName || 'Unknown',
          isExternal: false
        },
        toLocation: {
          warehouseId: item.locations[0]?.warehouseId,
          warehouseName: item.locations[0]?.warehouseName || 'Unknown',
          isExternal: false
        },
        referenceDocument: {
          documentType: 'transfer_note',
          documentNumber: `CAT-TRANSFER-${itemId}`
        },
        notes: notes || `Category transfer from ${fromCategory} to ${toCategory}`,
        createdBy: new Types.ObjectId(transferredBy)
      });

      logger.info('Material category transferred', {
        itemId,
        itemName: item.itemName,
        fromCategory,
        toCategory,
        transferredBy,
        notes
      });

    } catch (error) {
      logger.error('Error transferring material category', { error, itemId, fromCategory, toCategory });
      throw error;
    }
  }

  /**
   * Record waste materials
   */
  private async recordWaste(
    itemId: string,
    wasteQuantity: number,
    reference: string,
    notes: string,
    recordedBy: string
  ): Promise<void> {
    const item = await InventoryItem.findById(itemId);
    if (!item) return;

    // Update damaged stock
    await InventoryItem.findByIdAndUpdate(itemId, {
      $inc: { 'stock.damagedStock': wasteQuantity }
    });

    // Create waste movement record
    await StockMovement.create({
      companyId: item.companyId,
      itemId: new Types.ObjectId(itemId),
      movementType: 'damage',
      quantity: wasteQuantity,
      unit: item.stock.unit,
      movementDate: new Date(),
      movementNumber: `WASTE-${Date.now()}`,
      referenceDocument: {
        documentType: 'adjustment_note',
        documentNumber: reference
      },
      notes,
      createdBy: new Types.ObjectId(recordedBy)
    });
  }

  /**
   * Update stage with consumption data
   */
  private async updateStageWithConsumption(request: MaterialConsumptionRequest): Promise<void> {
    await ProductionBatch.findOneAndUpdate(
      { _id: request.batchId, 'stages.stageNumber': request.stageNumber },
      {
        $push: {
          'stages.$.inputMaterials': {
            $each: request.materials.map(m => ({
              itemId: new Types.ObjectId(m.itemId),
              plannedQuantity: m.plannedQuantity,
              actualQuantity: m.actualQuantity,
              wasteQuantity: m.wasteQuantity || 0,
              returnedQuantity: m.returnedQuantity || 0,
              unit: m.unit,
              consumedAt: request.consumptionDate || new Date(),
              consumedBy: new Types.ObjectId(request.consumedBy),
              notes: m.notes || ''
            }))
          }
        }
      }
    );
  }

  /**
   * Update stage with output data
   */
  private async updateStageWithOutput(request: StageOutputRequest, createdItemIds: string[]): Promise<void> {
    await ProductionBatch.findOneAndUpdate(
      { _id: request.batchId, 'stages.stageNumber': request.stageNumber },
      {
        $push: {
          'stages.$.outputMaterials': {
            $each: request.outputs.map((output, index) => ({
              itemId: new Types.ObjectId(createdItemIds[index]),
              itemName: output.itemName,
              quantity: output.quantity,
              unit: output.unit,
              qualityGrade: output.qualityGrade || 'A',
              defects: output.defects || [],
              producedAt: request.productionDate || new Date(),
              producedBy: new Types.ObjectId(request.producedBy),
              notes: output.notes || ''
            }))
          }
        }
      }
    );
  }
}
