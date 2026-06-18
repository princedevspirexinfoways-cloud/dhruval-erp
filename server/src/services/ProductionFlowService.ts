import { Types } from 'mongoose';
import { ProductionOrder } from '../models';
import { IProductionOrder, IProductionStage } from '../types/models';
import { BaseService } from './BaseService';
import { InventoryService } from './InventoryService';
import { StockMovementService } from './StockMovementService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Logger is already imported as logger

export class ProductionFlowService {
  private inventoryService: InventoryService;
  private stockMovementService: StockMovementService;

  constructor() {
    this.inventoryService = new InventoryService();
    this.stockMovementService = new StockMovementService();
  }

  /**
   * Initialize production flow with all stages
   */
  async initializeProductionFlow(productionOrderId: string): Promise<IProductionOrder | null> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      // Define complete textile production flow stages
      const flowStages: Partial<IProductionStage>[] = [
        {
          stageNumber: 1,
          stageName: 'Grey Fabric Inward (GRN Entry)',
          processType: 'grey_fabric_inward',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 60 // 1 hour
          },
          notes: 'Receive and inspect grey fabric from supplier'
        },
        {
          stageNumber: 2,
          stageName: 'Pre-Processing (Desizing/Bleaching)',
          processType: 'pre_processing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 240 // 4 hours
          },
          notes: 'Remove sizing and bleach fabric for better dye absorption'
        },
        {
          stageNumber: 3,
          stageName: 'Dyeing Process',
          processType: 'dyeing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 480 // 8 hours
          },
          notes: 'Apply base color to fabric'
        },
        {
          stageNumber: 4,
          stageName: 'Printing Process',
          processType: 'printing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 360 // 6 hours
          },
          notes: 'Apply design/pattern printing'
        },
        {
          stageNumber: 5,
          stageName: 'Washing Process',
          processType: 'washing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 180 // 3 hours
          },
          notes: 'Remove excess dye and chemicals'
        },
        {
          stageNumber: 6,
          stageName: 'Color Fixing',
          processType: 'fixing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 120 // 2 hours
          },
          notes: 'Fix colors to prevent bleeding'
        },
        {
          stageNumber: 7,
          stageName: 'Finishing Process (Stenter, Coating)',
          processType: 'finishing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 300 // 5 hours
          },
          notes: 'Apply finishing treatments and stretch fabric'
        },
        {
          stageNumber: 8,
          stageName: 'Quality Control (Pass/Hold/Reject)',
          processType: 'quality_control',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 60 // 1 hour
          },
          notes: 'Final quality inspection and approval'
        },
        {
          stageNumber: 9,
          stageName: 'Cutting & Packing (Labels & Cartons)',
          processType: 'cutting_packing',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 120 // 2 hours
          },
          notes: 'Cut fabric to required sizes and pack with labels'
        },
        {
          stageNumber: 10,
          stageName: 'Dispatch & Invoice (Stock Deduction)',
          processType: 'dispatch_invoice',
          status: 'pending',
          timing: {
            plannedStartTime: new Date(),
            plannedDuration: 30 // 30 minutes
          },
          notes: 'Prepare dispatch documents and deduct from stock'
        }
      ];

      // Update production order with flow stages
      productionOrder.productionStages = flowStages as IProductionStage[];
      productionOrder.status = 'approved';
      
      const updatedOrder = await productionOrder.save();

      logger.info('Production flow initialized successfully', {
        productionOrderId,
        stagesCount: flowStages.length
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error initializing production flow', { error, productionOrderId });
      throw error;
    }
  }

  /**
   * Start a specific production stage
   */
  async startStage(productionOrderId: string, stageNumber: number, startedBy?: string): Promise<IProductionOrder | null> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      const stage = productionOrder.productionStages.find(s => s.stageNumber === stageNumber);
      if (!stage) {
        throw new AppError('Production stage not found', 404);
      }

      if (stage.status !== 'pending') {
        throw new AppError('Stage is not in pending status', 400);
      }

      // Check if previous stage is completed
      if (stageNumber > 1) {
        const previousStage = productionOrder.productionStages.find(s => s.stageNumber === stageNumber - 1);
        if (previousStage && previousStage.status !== 'completed') {
          throw new AppError('Previous stage must be completed before starting this stage', 400);
        }
      }

      // Update stage status
      stage.status = 'in_progress';
      stage.timing.actualStartTime = new Date();
      stage.completedBy = startedBy ? new Types.ObjectId(startedBy) : undefined;

      // Update production order status
      if (productionOrder.status === 'approved') {
        productionOrder.status = 'in_progress';
        productionOrder.schedule.actualStartDate = new Date();
      }

      const updatedOrder = await productionOrder.save();

      logger.info('Production stage started successfully', {
        productionOrderId,
        stageNumber,
        stageName: stage.stageName,
        startedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error starting production stage', { error, productionOrderId, stageNumber });
      throw error;
    }
  }

  /**
   * Complete a specific production stage
   */
  async completeStage(
    productionOrderId: string, 
    stageNumber: number, 
    completionData: {
      actualQuantity?: number;
      qualityNotes?: string;
      defectQuantity?: number;
      completedBy?: string;
      qualityGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
      images?: string[];
      notes?: string;
    }
  ): Promise<IProductionOrder | null> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      const stage = productionOrder.productionStages.find(s => s.stageNumber === stageNumber);
      if (!stage) {
        throw new AppError('Production stage not found', 404);
      }

      if (stage.status !== 'in_progress') {
        throw new AppError('Stage is not in progress', 400);
      }

      // Update stage completion data
      stage.status = 'completed';
      stage.timing.actualEndTime = new Date();
      stage.completedBy = completionData.completedBy ? new Types.ObjectId(completionData.completedBy) : undefined;
      
      if (completionData.actualQuantity) {
        stage.output.producedQuantity = completionData.actualQuantity;
      }
      
      if (completionData.defectQuantity) {
        stage.output.defectQuantity = completionData.defectQuantity;
      }
      
      if (completionData.qualityGrade) {
        stage.qualityControl.finalQuality.qualityGrade = completionData.qualityGrade as 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject';
      }
      
      if (completionData.qualityNotes) {
        stage.qualityControl.finalQuality.qualityNotes = completionData.qualityNotes;
      }
      
      if (completionData.images) {
        stage.output.outputImages = completionData.images;
      }
      
      if (completionData.notes) {
        stage.notes = completionData.notes;
      }

      // Calculate actual duration
      if (stage.timing.actualStartTime && stage.timing.actualEndTime) {
        stage.timing.actualDuration = Math.round(
          (stage.timing.actualEndTime.getTime() - stage.timing.actualStartTime.getTime()) / (1000 * 60)
        );
      }

      // Update production order quantities
      if (completionData.actualQuantity) {
        productionOrder.completedQuantity += completionData.actualQuantity;
      }
      
      if (completionData.defectQuantity) {
        productionOrder.rejectedQuantity += completionData.defectQuantity;
      }

      // Check if all stages are completed
      const allStagesCompleted = productionOrder.productionStages.every(s => s.status === 'completed');
      if (allStagesCompleted) {
        productionOrder.status = 'completed';
        productionOrder.schedule.actualEndDate = new Date();
      }

      const updatedOrder = await productionOrder.save();

      logger.info('Production stage completed successfully', {
        productionOrderId,
        stageNumber,
        stageName: stage.stageName,
        actualQuantity: completionData.actualQuantity,
        completedBy: completionData.completedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error completing production stage', { error, productionOrderId, stageNumber });
      throw error;
    }
  }

  /**
   * Get production flow status
   */
  async getProductionFlowStatus(productionOrderId: string): Promise<{
    order: IProductionOrder;
    currentStage: IProductionStage | null;
    nextStage: IProductionStage | null;
    completedStages: number;
    totalStages: number;
    progressPercentage: number;
  }> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      const currentStage = productionOrder.productionStages.find(s => s.status === 'in_progress');
      const nextStage = productionOrder.productionStages.find(s => s.status === 'pending');
      const completedStages = productionOrder.productionStages.filter(s => s.status === 'completed').length;
      const totalStages = productionOrder.productionStages.length;
      const progressPercentage = Math.round((completedStages / totalStages) * 100);

      return {
        order: productionOrder,
        currentStage,
        nextStage,
        completedStages,
        totalStages,
        progressPercentage
      };
    } catch (error) {
      logger.error('Error getting production flow status', { error, productionOrderId });
      throw error;
    }
  }

  /**
   * Get production flow dashboard data
   */
  async getProductionFlowDashboard(companyId: string): Promise<{
    totalOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    delayedOrders: number;
    stageWiseCount: Record<string, number>;
    recentActivities: any[];
  }> {
    try {
      const totalOrders = await ProductionOrder.countDocuments({ companyId });
      const inProgressOrders = await ProductionOrder.countDocuments({ 
        companyId, 
        status: 'in_progress' 
      });
      const completedOrders = await ProductionOrder.countDocuments({ 
        companyId, 
        status: 'completed' 
      });
      const delayedOrders = await ProductionOrder.countDocuments({
        companyId,
        'schedule.plannedEndDate': { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      });

      // Get stage-wise counts
      const stageWiseCount: Record<string, number> = {};
      const stages = [
        'grey_fabric_inward', 'pre_processing', 'dyeing', 'printing', 
        'washing', 'fixing', 'finishing', 'quality_control', 
        'cutting_packing', 'dispatch_invoice'
      ];

      for (const stage of stages) {
        const count = await ProductionOrder.countDocuments({
          companyId,
          'productionStages.processType': stage,
          'productionStages.status': 'in_progress'
        });
        stageWiseCount[stage] = count;
      }

      // Get recent activities
      const recentActivities = await ProductionOrder.find({ companyId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('productionOrderNumber status updatedAt customerName')
        .lean();

      return {
        totalOrders,
        inProgressOrders,
        completedOrders,
        delayedOrders,
        stageWiseCount,
        recentActivities
      };
    } catch (error) {
      logger.error('Error getting production flow dashboard', { error, companyId });
      throw error;
    }
  }

  /**
   * Hold a production stage
   */
  async holdStage(
    productionOrderId: string, 
    stageNumber: number, 
    reason: string, 
    heldBy?: string
  ): Promise<IProductionOrder | null> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      const stage = productionOrder.productionStages.find(s => s.stageNumber === stageNumber);
      if (!stage) {
        throw new AppError('Production stage not found', 404);
      }

      if (stage.status !== 'in_progress') {
        throw new AppError('Stage is not in progress', 400);
      }

      stage.status = 'on_hold';
      stage.notes = reason;
      stage.completedBy = heldBy ? new Types.ObjectId(heldBy) : undefined;

      const updatedOrder = await productionOrder.save();

      logger.info('Production stage held successfully', {
        productionOrderId,
        stageNumber,
        stageName: stage.stageName,
        reason,
        heldBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error holding production stage', { error, productionOrderId, stageNumber });
      throw error;
    }
  }

  /**
   * Resume a held production stage
   */
  async resumeStage(
    productionOrderId: string, 
    stageNumber: number, 
    resumedBy?: string
  ): Promise<IProductionOrder | null> {
    try {
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      if (!productionOrder) {
        throw new AppError('Production order not found', 404);
      }

      const stage = productionOrder.productionStages.find(s => s.stageNumber === stageNumber);
      if (!stage) {
        throw new AppError('Production stage not found', 404);
      }

      if (stage.status !== 'on_hold') {
        throw new AppError('Stage is not on hold', 400);
      }

      stage.status = 'in_progress';
      stage.completedBy = resumedBy ? new Types.ObjectId(resumedBy) : undefined;

      const updatedOrder = await productionOrder.save();

      logger.info('Production stage resumed successfully', {
        productionOrderId,
        stageNumber,
        stageName: stage.stageName,
        resumedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error resuming production stage', { error, productionOrderId, stageNumber });
      throw error;
    }
  }
}
