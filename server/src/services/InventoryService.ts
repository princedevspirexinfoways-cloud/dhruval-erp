import { BaseService } from './BaseService';
import InventoryItem from '../models/InventoryItem';
import StockMovement from '../models/StockMovement';
import Warehouse from '../models/Warehouse';
import { IInventoryItem, IStockMovement } from '@/types/models';
import { AppError } from '../utils/errors';

import { logger } from '@/utils/logger';
import { Types } from 'mongoose';
import QueryOptimizer from '../utils/query-optimizer';

export class InventoryService extends BaseService<IInventoryItem> {
  constructor() {
    super(InventoryItem);
  }

  /**
   * Create a new inventory item with validation
   */
  async createInventoryItem(itemData: Partial<IInventoryItem>, createdBy?: string): Promise<IInventoryItem> {
    try {
      // Validate item data
      this.validateInventoryItemData(itemData);

      // Generate item code if not provided
      if (!itemData.itemCode) {
        itemData.itemCode = await this.generateItemCode(itemData.companyId!.toString(), itemData.itemName!);
      }

      // Check if item code already exists in the company (only after generating itemCode)
      const existingItem = await this.findOne({ 
        itemCode: itemData.itemCode?.toUpperCase(),
        companyId: itemData.companyId
      });

      if (existingItem) {
        throw new AppError('Item code already exists in this company', 400);
      }

      // Generate company item code if not provided
      if (!itemData.companyItemCode) {
        // Get company code from companyId
        const Company = (await import('../models/Company')).default;
        const company = await Company.findById(itemData.companyId);
        if (!company) {
          throw new AppError('Company not found', 400);
        }
        itemData.companyItemCode = `${company.companyCode}-${itemData.itemCode}`;
      }

      // Get unit from multiple possible locations
      const unit = itemData.stock?.unit || (itemData as any).unit || (itemData as any).unitOfMeasure || 'pcs';
      
      // Handle category in different formats
      let category = itemData.category;
      if (typeof category === 'string') {
        category = { primary: category };
      } else if (category && typeof category === 'object') {
        // Handle nested category objects (e.g., { primary: { primary: "Chemicals" } })
        const categoryPrimary = category.primary;
        if (categoryPrimary && typeof categoryPrimary === 'object' && categoryPrimary !== null) {
          category = {
            primary: (categoryPrimary as any).primary || (categoryPrimary as any).name || '',
            secondary: (categoryPrimary as any).secondary || category.secondary || '',
            tertiary: (categoryPrimary as any).tertiary || category.tertiary || ''
          };
        } else {
          // Ensure category.primary is a string
          category = {
            primary: typeof categoryPrimary === 'string' ? categoryPrimary : '',
            secondary: category.secondary || '',
            tertiary: category.tertiary || ''
          };
        }
      }
      
      // Set default values
      const itemToCreate = {
        ...itemData,
        itemCode: itemData.itemCode ? itemData.itemCode.toUpperCase() : undefined,
        companyItemCode: itemData.companyItemCode ? itemData.companyItemCode.toUpperCase() : undefined,
        category: category, // Use the processed category
        stock: {
          ...itemData.stock,
          currentStock: itemData.stock?.currentStock || (itemData as any).currentStock || 0,
          availableStock: itemData.stock?.availableStock || (itemData as any).currentStock || 0,
          reservedStock: itemData.stock?.reservedStock || 0,
          reorderLevel: itemData.stock?.reorderLevel || (itemData as any).reorderPoint || 0,
          maxStockLevel: itemData.stock?.maxStockLevel || 0,
          unit: unit,
          valuationMethod: itemData.stock?.valuationMethod || (itemData as any).stockingMethod || 'FIFO',
          averageCost: itemData.stock?.averageCost || itemData.pricing?.costPrice || 0,
          totalValue: itemData.stock?.totalValue || 0,
          minStockLevel: itemData.stock?.minStockLevel || 0,
          inTransitStock: itemData.stock?.inTransitStock || 0,
          damagedStock: itemData.stock?.damagedStock || 0
        },
        pricing: {
          ...itemData.pricing,
          costPrice: itemData.pricing?.costPrice || 0,
          sellingPrice: itemData.pricing?.sellingPrice || 0,
          mrp: itemData.pricing?.mrp || 0
        },
        tracking: {
          createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
          lastModifiedBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
          lastStockUpdate: new Date(),
          lastMovementDate: new Date(),
          totalInward: 0,
          totalOutward: 0,
          totalAdjustments: 0
        }
      };

      const item = await this.create(itemToCreate, createdBy);

      logger.info('Inventory item created successfully', { 
        itemId: item._id, 
        itemCode: item.itemCode,
        companyId: itemData.companyId,
        createdBy 
      });

      // Add initial price to price history if price is provided
      if (itemData.pricing?.costPrice && itemData.pricing.costPrice > 0) {
        await InventoryItem.findByIdAndUpdate(item._id, {
          $push: {
            priceHistory: {
              price: itemData.pricing.costPrice,
              changedAt: new Date(),
              changedBy: createdBy ? new Types.ObjectId(createdBy) : undefined
            }
          }
        });
      }

      return item;
    } catch (error) {
      logger.error('Error creating inventory item', { error, itemData, createdBy });
      throw error;
    }
  }

  /**
   * Update inventory item with price history tracking
   */
  async update(id: string, data: Partial<IInventoryItem>, userId?: string): Promise<IInventoryItem | null> {
    try {
      const existingItem = await this.findById(id);
      if (!existingItem) {
        throw new AppError('Inventory item not found', 404);
      }

      // Track price change if price is being updated
      const newPrice = data.pricing?.costPrice || (data as any).price;
      const oldPrice = existingItem.pricing?.costPrice || 0;

      if (newPrice && newPrice !== oldPrice && newPrice > 0) {
        // Add price history entry
        const priceHistoryEntry = {
          price: newPrice,
          previousPrice: oldPrice,
          changedAt: new Date(),
          changedBy: userId ? new Types.ObjectId(userId) : undefined,
          reason: (data as any).priceChangeReason || 'Price updated',
          notes: (data as any).priceChangeNotes || ''
        };

        // Update with price history
        await InventoryItem.findByIdAndUpdate(id, {
          $push: { priceHistory: priceHistoryEntry }
        });
      }

      // Call parent update method
      return await super.update(id, data, userId);
    } catch (error) {
      logger.error('Error updating inventory item', { error, id, userId });
      throw error;
    }
  }

  /**
   * Update stock levels
   */
  async updateStock(
    itemId: string, 
    warehouseId: string,
    quantity: number, 
    movementType: 'in' | 'out' | 'transfer' | 'adjustment',
    reference?: string,
    notes?: string,
    updatedBy?: string
  ): Promise<IInventoryItem | null> {
    try {
      const item = await this.findById(itemId);
      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      // Validate warehouse
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        throw new AppError('Warehouse not found', 404);
      }

      // Calculate new stock levels
      let newCurrentStock = item.stock?.currentStock || 0;
      let newAvailableStock = item.stock?.availableStock || 0;

      if (movementType === 'in') {
        newCurrentStock += quantity;
        newAvailableStock += quantity;
      } else if (movementType === 'out') {
        if (newAvailableStock < quantity) {
          throw new AppError('Insufficient stock available', 400);
        }
        newCurrentStock -= quantity;
        newAvailableStock -= quantity;
      } else if (movementType === 'adjustment') {
        newCurrentStock = quantity;
        newAvailableStock = quantity - (item.stock?.reservedStock || 0);
      }

      // Update item stock
      const updatedItem = await this.update(itemId, {
        'stock.currentStock': newCurrentStock,
        'stock.availableStock': newAvailableStock,
        'stock.totalValue': newCurrentStock * (item.pricing?.costPrice || 0)
      } as any, updatedBy);

      // Create stock movement record
      const mappedMovementType = movementType === 'in' ? 'inward' :
                                 movementType === 'out' ? 'outward' :
                                 movementType as 'transfer' | 'adjustment';

      // Determine document type based on reference
      let documentType: 'purchase_order' | 'sales_order' | 'production_order' | 'transfer_note' | 'adjustment_note' | 'return_note' = 'adjustment_note';
      if (reference) {
        if (reference.includes('RETURN') || reference.includes('return')) {
          documentType = 'return_note';
        } else if (reference.includes('PO-') || reference.includes('PURCHASE')) {
          documentType = 'purchase_order';
        } else if (reference.includes('SO-') || reference.includes('SALES')) {
          documentType = 'sales_order';
        } else if (reference.includes('PROD-') || reference.includes('PRODUCTION')) {
          documentType = 'production_order';
        } else if (reference.includes('TRANSFER')) {
          documentType = 'transfer_note';
        }
      }

      await this.createStockMovement({
        companyId: item.companyId,
        itemId: new Types.ObjectId(itemId),
        movementType: mappedMovementType,
        quantity,
        unit: item.stock?.unit || 'pcs',
        movementDate: new Date(),
        movementNumber: `MOV-${Date.now()}`,
        toLocation: {
          warehouseId: new Types.ObjectId(warehouseId),
          warehouseName: warehouse.warehouseName,
          isExternal: false
        },
        referenceDocument: reference ? {
          documentType,
          documentNumber: reference
        } : undefined,
        notes,
        createdBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined
      });

      logger.info('Stock updated successfully', { 
        itemId, 
        warehouseId,
        movementType,
        quantity,
        newStock: newCurrentStock,
        updatedBy 
      });

      return updatedItem;
    } catch (error) {
      logger.error('Error updating stock', { error, itemId, warehouseId, quantity, movementType });
      throw error;
    }
  }

  /**
   * Reserve stock
   */
  async reserveStock(itemId: string, quantity: number, reference?: string, reservedBy?: string): Promise<IInventoryItem | null> {
    try {
      const item = await this.findById(itemId);
      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const availableStock = item.stock?.availableStock || 0;
      if (availableStock < quantity) {
        throw new AppError('Insufficient stock available for reservation', 400);
      }

      const newReservedStock = (item.stock?.reservedStock || 0) + quantity;
      const newAvailableStock = availableStock - quantity;

      const updatedItem = await this.update(itemId, {
        'stock.reservedStock': newReservedStock,
        'stock.availableStock': newAvailableStock
      } as any, reservedBy);

      logger.info('Stock reserved successfully', { 
        itemId, 
        quantity,
        reference,
        newReservedStock,
        newAvailableStock,
        reservedBy 
      });

      return updatedItem;
    } catch (error) {
      logger.error('Error reserving stock', { error, itemId, quantity, reference });
      throw error;
    }
  }

  /**
   * Release reserved stock
   */
  async releaseReservedStock(itemId: string, quantity: number, reference?: string, releasedBy?: string): Promise<IInventoryItem | null> {
    try {
      const item = await this.findById(itemId);
      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const reservedStock = item.stock?.reservedStock || 0;
      if (reservedStock < quantity) {
        throw new AppError('Cannot release more stock than reserved', 400);
      }

      const newReservedStock = reservedStock - quantity;
      const newAvailableStock = (item.stock?.availableStock || 0) + quantity;

      const updatedItem = await this.update(itemId, {
        'stock.reservedStock': newReservedStock,
        'stock.availableStock': newAvailableStock
      } as any, releasedBy);

      logger.info('Reserved stock released successfully', { 
        itemId, 
        quantity,
        reference,
        newReservedStock,
        newAvailableStock,
        releasedBy 
      });

      return updatedItem;
    } catch (error) {
      logger.error('Error releasing reserved stock', { error, itemId, quantity, reference });
      throw error;
    }
  }

  /**
   * Get low stock items with optimization
   */
  async getLowStockItems(companyId: string): Promise<IInventoryItem[]> {
    try {
      const startTime = Date.now();

      // Use optimized aggregation pipeline for better performance
      const pipeline = QueryOptimizer.optimizeAggregationPipeline([
        {
          $match: QueryOptimizer.createCompanyFilter(companyId, {
            'status.isActive': true,
            $expr: { $lte: ['$stock.currentStock', '$stock.reorderLevel'] }
          })
        },
        {
          $project: {
            itemCode: 1,
            itemName: 1,
            'stock.currentStock': 1,
            'stock.reorderLevel': 1,
            unitPrice: 1,
            category: 1,
            lastUpdated: 1
          }
        },
        { $sort: { 'stock.currentStock': 1 } }, // Most critical items first
        { $limit: 100 } // Prevent excessive results
      ]);

      const items = await this.aggregate(pipeline);

      QueryOptimizer.logQueryPerformance('getLowStockItems', startTime, items.length, { companyId });

      logger.info(`Found ${items.length} low stock items for company ${companyId}`);
      return items as IInventoryItem[];
    } catch (error) {
      logger.error('Error getting low stock items', { error, companyId });
      throw error;
    }
  }

  /**
   * Get stock movement history
   */
  async getStockMovementHistory(itemId: string, limit: number = 50): Promise<IStockMovement[]> {
    try {
      const movements = await StockMovement.find({ itemId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('warehouseId', 'warehouseName')
        .populate('createdBy', 'personalInfo.firstName personalInfo.lastName');

      return movements;
    } catch (error) {
      logger.error('Error getting stock movement history', { error, itemId });
      throw error;
    }
  }

  /**
   * Search inventory items
   */
  async searchItems(
    companyId: string, 
    searchTerm: string, 
    page: number = 1, 
    limit: number = 10
  ) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      
      const filter = {
        companyId: new Types.ObjectId(companyId),
        isActive: true,
        $or: [
          { itemCode: searchRegex },
          { itemName: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { subCategory: searchRegex },
          { brand: searchRegex },
          { model: searchRegex }
        ]
      };

      return await this.paginate(filter, page, limit, { itemName: 1 });
    } catch (error) {
      logger.error('Error searching inventory items', { error, companyId, searchTerm });
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(companyId: string) {
    try {
      const [
        totalItems,
        activeItems,
        lowStockItems,
        outOfStockItems,
        totalValue
      ] = await Promise.all([
        this.count({ companyId: new Types.ObjectId(companyId) }),
        this.count({ companyId: new Types.ObjectId(companyId), isActive: true }),
        this.getLowStockItems(companyId).then(items => items.length),
        this.count({
          companyId: new Types.ObjectId(companyId),
          'status.isActive': true,
          'stock.currentStock': 0
        }),
        this.calculateTotalInventoryValue(companyId)
      ]);

      return {
        totalItems,
        activeItems,
        inactiveItems: totalItems - activeItems,
        lowStockItems,
        outOfStockItems,
        totalValue,
        averageValue: activeItems > 0 ? totalValue / activeItems : 0
      };
    } catch (error) {
      logger.error('Error getting inventory statistics', { error, companyId });
      throw error;
    }
  }

  /**
   * Create stock movement record
   */
  private async createStockMovement(movementData: Partial<IStockMovement>): Promise<IStockMovement> {
    try {
      const movement = new StockMovement({
        ...movementData,
        movementDate: new Date(),
        isActive: true
      });

      return await movement.save();
    } catch (error) {
      logger.error('Error creating stock movement', { error, movementData });
      throw error;
    }
  }

  /**
   * Calculate total inventory value with optimization
   */
  private async calculateTotalInventoryValue(companyId: string): Promise<number> {
    try {
      const startTime = Date.now();

      // Use optimized aggregation with proper indexing
      const pipeline = QueryOptimizer.optimizeAggregationPipeline([
        {
          $match: QueryOptimizer.createCompanyFilter(companyId, {
            'status.isActive': true,
            'stock.currentStock': { $gt: 0 } // Only items with stock
          })
        },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: ['$stock.currentStock', '$pricing.costPrice']
              }
            },
            totalItems: { $sum: 1 }
          }
        }
      ]);

      const result = await this.aggregate(pipeline);

      QueryOptimizer.logQueryPerformance('calculateTotalInventoryValue', startTime, 1, { companyId });

      return result.length > 0 ? result[0].totalValue || 0 : 0;
    } catch (error) {
      logger.error('Error calculating total inventory value', { error, companyId });
      return 0;
    }
  }

  /**
   * Generate item code
   */
  private async generateItemCode(companyId: string, itemName: string): Promise<string> {
    try {
      // Generate code from item name
      const baseCode = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Check for uniqueness
      while (await this.exists({ itemCode: code, companyId: new Types.ObjectId(companyId) })) {
        code = `${baseCode}${counter.toString().padStart(3, '0')}`;
        counter++;
      }

      return code;
    } catch (error) {
      logger.error('Error generating item code', { error, companyId, itemName });
      throw new AppError('Failed to generate item code', 500);
    }
  }

  /**
   * Validate inventory item data
   */
  private validateInventoryItemData(itemData: Partial<IInventoryItem>): void {
    if (!itemData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!itemData.itemName) {
      throw new AppError('Item name is required', 400);
    }

    if (!itemData.category) {
      throw new AppError('Category is required', 400);
    }

    // Check for unit in multiple possible locations
    const unit = itemData.stock?.unit || (itemData as any).unit || (itemData as any).unitOfMeasure;
    if (!unit) {
      throw new AppError('Unit is required', 400);
    }

    if (itemData.pricing?.costPrice && itemData.pricing.costPrice < 0) {
      throw new AppError('Cost price cannot be negative', 400);
    }

    if (itemData.pricing?.sellingPrice && itemData.pricing.sellingPrice < 0) {
      throw new AppError('Selling price cannot be negative', 400);
    }

    if (itemData.stock?.reorderLevel && itemData.stock.reorderLevel < 0) {
      throw new AppError('Reorder level cannot be negative', 400);
    }
  }
}
