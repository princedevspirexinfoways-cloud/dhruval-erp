import { BaseService } from './BaseService';
import ProductionOrder from '../models/ProductionOrder';
import InventoryItem from '../models/InventoryItem';
import { IProductionOrder, IRawMaterial } from '@/types/models';
import { AppError } from '../utils/errors';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';
import { InventoryService } from './InventoryService';
import QueryOptimizer from '../utils/query-optimizer';

export class ProductionService extends BaseService<IProductionOrder> {
  private inventoryService: InventoryService;

  constructor() {
    super(ProductionOrder);
    this.inventoryService = new InventoryService();
  }

  /**
   * Create a new production order with validation
   */
  async createProductionOrder(orderData: Partial<IProductionOrder>, createdBy?: string): Promise<IProductionOrder> {
    try {
      // Validate order data
      this.validateProductionOrderData(orderData);

      // Generate production order number
      const orderNumber = await this.generateOrderNumber(orderData.companyId!.toString());

      // Validate raw materials
      if (orderData.rawMaterials && orderData.rawMaterials.length > 0) {
        await this.validateRawMaterials(orderData.rawMaterials, orderData.companyId!.toString());
      }

      // Calculate total cost
      const materialCost = await this.calculateMaterialCost(orderData.rawMaterials || [], orderData.orderQuantity || 0);

      const order = await this.create({
        ...orderData,
        productionOrderNumber: orderNumber,
        costSummary: {
          materialCost,
          laborCost: 0,
          machineCost: 0,
          overheadCost: 0,
          jobWorkCost: 0,
          totalProductionCost: materialCost,
          costPerUnit: orderData.orderQuantity ? materialCost / orderData.orderQuantity : 0
        },
        status: 'draft',
        completedQuantity: 0,
        rejectedQuantity: 0,
        pendingQuantity: orderData.orderQuantity || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Production order created successfully', {
        orderId: order._id,
        orderNumber,
        companyId: orderData.companyId,
        createdBy
      });

      return order;
    } catch (error) {
      logger.error('Error creating production order', { error, orderData, createdBy });
      throw error;
    }
  }

  /**
   * Start production order
   */
  async startProduction(orderId: string, startedBy?: string): Promise<IProductionOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Production order not found', 404);
      }

      if (order.status !== 'approved') {
        throw new AppError('Production order must be approved before starting', 400);
      }

      // Check material availability
      await this.checkMaterialAvailability(order.rawMaterials || [], order.orderQuantity || 0);

      // Reserve materials
      await this.reserveMaterials(order.rawMaterials || [], order.orderQuantity || 0, orderId, startedBy);

      const updatedOrder = await this.update(orderId, {
        status: 'in_progress',
        'schedule.actualStartDate': new Date(),
        'productionStages.0.status': 'in_progress',
        'productionStages.0.timing.actualStartTime': new Date()
      }, startedBy);

      logger.info('Production order started successfully', {
        orderId,
        orderNumber: order.productionOrderNumber,
        startedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error starting production order', { error, orderId, startedBy });
      throw error;
    }
  }

  /**
   * Complete production stage
   */
  async completeStage(
    orderId: string, 
    stageIndex: number, 
    completionData: {
      actualQuantity?: number;
      qualityNotes?: string;
      defectQuantity?: number;
      completedBy?: string;
    }
  ): Promise<IProductionOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Production order not found', 404);
      }

      if (!order.productionStages || stageIndex >= order.productionStages.length) {
        throw new AppError('Invalid stage index', 400);
      }

      const stage = order.productionStages[stageIndex];
      if (stage.status === 'completed') {
        throw new AppError('Stage is already completed', 400);
      }

      // Update stage completion
      const updateData: any = {
        [`productionStages.${stageIndex}.status`]: 'completed',
        [`productionStages.${stageIndex}.timing.actualEndTime`]: new Date(),
        [`productionStages.${stageIndex}.output.producedQuantity`]: completionData.actualQuantity,
        [`productionStages.${stageIndex}.qualityControl.notes`]: completionData.qualityNotes,
        [`productionStages.${stageIndex}.updatedBy`]: completionData.completedBy ? new Types.ObjectId(completionData.completedBy) : undefined
      };

      // Check if this is the last stage
      const isLastStage = stageIndex === order.productionStages.length - 1;
      if (isLastStage) {
        updateData.status = 'completed';
        updateData['schedule.actualEndDate'] = new Date();
        updateData.completedQuantity = completionData.actualQuantity || order.orderQuantity;
        updateData.pendingQuantity = 0;
      } else {
        // Start next stage
        updateData[`productionStages.${stageIndex + 1}.status`] = 'in_progress';
        updateData[`productionStages.${stageIndex + 1}.timing.actualStartTime`] = new Date();
      }

      const updatedOrder = await this.update(orderId, updateData, completionData.completedBy);

      logger.info('Production stage completed successfully', { 
        orderId, 
        stageIndex,
        stageName: stage.stageName,
        completedBy: completionData.completedBy 
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error completing production stage', { error, orderId, stageIndex, completionData });
      throw error;
    }
  }

  /**
   * Complete production order
   */
  async completeProduction(
    orderId: string, 
    completionData: {
      actualQuantity: number;
      qualityNotes?: string;
      completedBy?: string;
    }
  ): Promise<IProductionOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Production order not found', 404);
      }

      if (order.status !== 'in_progress') {
        throw new AppError('Production order is not in progress', 400);
      }

      // Note: Finished goods inventory update would need to be handled separately
      // as the current IProductionOrder interface doesn't have finishedGoodId or warehouseId

      const updatedOrder = await this.update(orderId, {
        status: 'completed',
        'schedule.actualEndDate': new Date(),
        completedQuantity: completionData.actualQuantity,
        pendingQuantity: 0,
        'qualitySummary.totalProduced': completionData.actualQuantity,
        'qualitySummary.totalApproved': completionData.actualQuantity
      }, completionData.completedBy);

      logger.info('Production order completed successfully', {
        orderId,
        orderNumber: order.productionOrderNumber,
        actualQuantity: completionData.actualQuantity,
        completedBy: completionData.completedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error completing production order', { error, orderId, completionData });
      throw error;
    }
  }

  /**
   * Cancel production order
   */
  async cancelProduction(orderId: string, reason: string, cancelledBy?: string): Promise<IProductionOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Production order not found', 404);
      }

      if (order.status === 'completed') {
        throw new AppError('Cannot cancel completed production order', 400);
      }

      // Release reserved materials if order was in progress
      if (order.status === 'in_progress') {
        await this.releaseMaterials(order.rawMaterials || [], order.orderQuantity || 0, orderId, cancelledBy);
      }

      const updatedOrder = await this.update(orderId, {
        status: 'cancelled',
        notes: reason,
        updatedBy: cancelledBy ? new Types.ObjectId(cancelledBy) : undefined
      }, cancelledBy);

      logger.info('Production order cancelled successfully', {
        orderId,
        orderNumber: order.productionOrderNumber,
        reason,
        cancelledBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error cancelling production order', { error, orderId, reason, cancelledBy });
      throw error;
    }
  }

  /**
   * Get production statistics with optimization
   */
  async getProductionStats(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      const startTime = Date.now();

      // Build optimized filter
      let filter = QueryOptimizer.createCompanyFilter(companyId);
      if (startDate && endDate) {
        filter = { ...filter, ...QueryOptimizer.createDateRangeFilter('createdAt', startDate, endDate) };
      }

      // Use single optimized aggregation pipeline for better performance
      const pipeline = QueryOptimizer.optimizeAggregationPipeline([
        { $match: filter },
        {
          $facet: {
            statusStats: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            quantityStats: [
              {
                $group: {
                  _id: null,
                  totalPlannedQuantity: { $sum: '$quantityToProduce' },
                  totalActualQuantity: { $sum: '$quantityProduced' },
                  avgPlannedQuantity: { $avg: '$quantityToProduce' },
                  avgActualQuantity: { $avg: '$quantityProduced' }
                }
              }
            ],
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]);

      const [result] = await this.aggregate(pipeline);

      // Process status statistics
      const statusCounts = result.statusStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const totalOrders = result.totalStats[0]?.totalOrders || 0;
      const completedOrders = statusCounts.completed || 0;
      const inProgressOrders = statusCounts.in_progress || 0;
      const cancelledOrders = statusCounts.cancelled || 0;
      const draftOrders = statusCounts.draft || 0;

      const quantityStats = result.quantityStats[0] || {};
      const totalPlannedQuantity = quantityStats.totalPlannedQuantity || 0;
      const totalActualQuantity = quantityStats.totalActualQuantity || 0;

      const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100) : 0;
      const efficiency = totalPlannedQuantity > 0 ? ((totalActualQuantity / totalPlannedQuantity) * 100) : 0;

      QueryOptimizer.logQueryPerformance('getProductionStats', startTime, 1, { companyId, startDate, endDate });

      return {
        totalOrders,
        completedOrders,
        inProgressOrders,
        cancelledOrders,
        draftOrders,
        totalPlannedQuantity,
        totalActualQuantity,
        averagePlannedQuantity: quantityStats.avgPlannedQuantity || 0,
        averageActualQuantity: quantityStats.avgActualQuantity || 0,
        completionRate: Math.round(completionRate * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting production statistics', { error, companyId, startDate, endDate });
      throw error;
    }
  }

  /**
   * Check material availability
   */
  private async checkMaterialAvailability(rawMaterials: IRawMaterial[], orderQuantity: number): Promise<void> {
    for (const material of rawMaterials) {
      const item = await InventoryItem.findById(material.itemId);
      if (!item) {
        throw new AppError(`Material not found: ${material.itemName}`, 404);
      }

      const requiredQuantity = material.requiredQuantity * orderQuantity;
      const availableStock = item.stock?.currentStock || 0;

      if (availableStock < requiredQuantity) {
        throw new AppError(
          `Insufficient stock for ${material.itemName}. Required: ${requiredQuantity}, Available: ${availableStock}`,
          400
        );
      }
    }
  }

  /**
   * Reserve materials for production
   */
  private async reserveMaterials(rawMaterials: IRawMaterial[], orderQuantity: number, orderId: string, reservedBy?: string): Promise<void> {
    for (const material of rawMaterials) {
      const requiredQuantity = material.requiredQuantity * orderQuantity;
      await this.inventoryService.reserveStock(
        material.itemId.toString(),
        requiredQuantity,
        `Production Order: ${orderId}`,
        reservedBy
      );
    }
  }

  /**
   * Release reserved materials
   */
  private async releaseMaterials(rawMaterials: IRawMaterial[], orderQuantity: number, orderId: string, releasedBy?: string): Promise<void> {
    for (const material of rawMaterials) {
      const requiredQuantity = material.requiredQuantity * orderQuantity;
      await this.inventoryService.releaseReservedStock(
        material.itemId.toString(),
        requiredQuantity,
        `Production Order Cancelled: ${orderId}`,
        releasedBy
      );
    }
  }

  /**
   * Calculate material cost
   */
  private async calculateMaterialCost(rawMaterials: IRawMaterial[], orderQuantity: number): Promise<number> {
    let totalCost = 0;

    for (const material of rawMaterials) {
      const item = await InventoryItem.findById(material.itemId);
      if (item && item.pricing?.costPrice) {
        totalCost += material.requiredQuantity * orderQuantity * item.pricing.costPrice;
      }
    }

    return totalCost;
  }

  /**
   * Validate raw materials
   */
  private async validateRawMaterials(rawMaterials: IRawMaterial[], companyId: string): Promise<void> {
    for (const material of rawMaterials) {
      const item = await InventoryItem.findOne({
        _id: material.itemId,
        companyId: new Types.ObjectId(companyId),
        status: { isActive: true }
      });

      if (!item) {
        throw new AppError(`Raw material not found or inactive: ${material.itemName}`, 400);
      }
    }
  }

  /**
   * Generate production order number
   */
  private async generateOrderNumber(companyId: string): Promise<string> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Count orders for today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayCount = await this.count({
        companyId: new Types.ObjectId(companyId),
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      const sequence = (todayCount + 1).toString().padStart(4, '0');
      return `PO-${dateStr}-${sequence}`;
    } catch (error) {
      logger.error('Error generating production order number', { error, companyId });
      throw new AppError('Failed to generate production order number', 500);
    }
  }

  /**
   * Get total planned quantity
   */
  private async getTotalPlannedQuantity(filter: any): Promise<number> {
    try {
      const result = await ProductionOrder.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$plannedQuantity' } } }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get total actual quantity
   */
  private async getTotalActualQuantity(filter: any): Promise<number> {
    try {
      const result = await ProductionOrder.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$actualQuantity' } } }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validate production order data
   */
  private validateProductionOrderData(orderData: Partial<IProductionOrder>): void {
    if (!orderData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!orderData.product?.productType) {
      throw new AppError('Product type is required', 400);
    }

    if (!orderData.orderQuantity || orderData.orderQuantity <= 0) {
      throw new AppError('Order quantity must be greater than 0', 400);
    }

    if (!orderData.schedule?.plannedStartDate) {
      throw new AppError('Planned start date is required', 400);
    }

    if (!orderData.schedule?.plannedEndDate) {
      throw new AppError('Planned end date is required', 400);
    }

    if (new Date(orderData.schedule.plannedStartDate) >= new Date(orderData.schedule.plannedEndDate)) {
      throw new AppError('Planned end date must be after start date', 400);
    }
  }
}
