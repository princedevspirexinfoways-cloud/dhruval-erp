import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ProductionFlowService } from '../services/ProductionFlowService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Logger is already imported as logger

export class ProductionFlowController extends BaseController<any> {
  private productionFlowService: ProductionFlowService;

  constructor() {
    super(null as any, 'ProductionFlow');
    this.productionFlowService = new ProductionFlowService();
  }

  /**
   * Handle errors consistently
   */
  private handleError(res: Response, error: any): void {
    logger.error('ProductionFlowController Error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Initialize production flow for an order
   */
  async initializeFlow(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId } = req.params;
      const { companyId } = req.user;

      if (!productionOrderId) {
        res.status(400).json({
          success: false,
          message: 'Production order ID is required'
        });
        return;
      }

      const result = await this.productionFlowService.initializeProductionFlow(productionOrderId);

      res.status(200).json({
        success: true,
        message: 'Production flow initialized successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error initializing production flow', { error, body: req.body });
      this.handleError(res, error);
    }
  }

  /**
   * Start a production stage
   */
  async startStage(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId, stageNumber } = req.params;
      const { startedBy } = req.body;
      const { userId } = req.user;

      if (!productionOrderId || !stageNumber) {
        res.status(400).json({
          success: false,
          message: 'Production order ID and stage number are required'
        });
        return;
      }

      const result = await this.productionFlowService.startStage(
        productionOrderId,
        parseInt(stageNumber),
        startedBy || userId
      );

      res.status(200).json({
        success: true,
        message: 'Production stage started successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error starting production stage', { error, body: req.body });
      this.handleError(res, error);
    }
  }

  /**
   * Complete a production stage
   */
  async completeStage(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId, stageNumber } = req.params;
      const { 
        actualQuantity, 
        qualityNotes, 
        defectQuantity, 
        completedBy,
        qualityGrade,
        images,
        notes
      } = req.body;
      const { userId } = req.user;

      if (!productionOrderId || !stageNumber) {
        res.status(400).json({
          success: false,
          message: 'Production order ID and stage number are required'
        });
        return;
      }

      const result = await this.productionFlowService.completeStage(
        productionOrderId,
        parseInt(stageNumber),
        {
          actualQuantity,
          qualityNotes,
          defectQuantity,
          completedBy: completedBy || userId,
          qualityGrade,
          images,
          notes
        }
      );

      res.status(200).json({
        success: true,
        message: 'Production stage completed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error completing production stage', { error, body: req.body });
      this.handleError(res, error);
    }
  }

  /**
   * Get production flow status
   */
  async getFlowStatus(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId } = req.params;

      if (!productionOrderId) {
        res.status(400).json({
          success: false,
          message: 'Production order ID is required'
        });
        return;
      }

      const result = await this.productionFlowService.getProductionFlowStatus(productionOrderId);

      res.status(200).json({
        success: true,
        message: 'Production flow status retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting production flow status', { error, params: req.params });
      this.handleError(res, error);
    }
  }

  /**
   * Get production flow dashboard
   */
  async getFlowDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.user;

      const result = await this.productionFlowService.getProductionFlowDashboard(companyId.toString());

      res.status(200).json({
        success: true,
        message: 'Production flow dashboard retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting production flow dashboard', { error, user: req.user });
      this.handleError(res, error);
    }
  }

  /**
   * Hold a production stage
   */
  async holdStage(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId, stageNumber } = req.params;
      const { reason, heldBy } = req.body;
      const { userId } = req.user;

      if (!productionOrderId || !stageNumber || !reason) {
        res.status(400).json({
          success: false,
          message: 'Production order ID, stage number, and reason are required'
        });
        return;
      }

      const result = await this.productionFlowService.holdStage(
        productionOrderId,
        parseInt(stageNumber),
        reason,
        heldBy || userId
      );

      res.status(200).json({
        success: true,
        message: 'Production stage held successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error holding production stage', { error, body: req.body });
      this.handleError(res, error);
    }
  }

  /**
   * Resume a held production stage
   */
  async resumeStage(req: Request, res: Response): Promise<void> {
    try {
      const { productionOrderId, stageNumber } = req.params;
      const { resumedBy } = req.body;
      const { userId } = req.user;

      if (!productionOrderId || !stageNumber) {
        res.status(400).json({
          success: false,
          message: 'Production order ID and stage number are required'
        });
        return;
      }

      const result = await this.productionFlowService.resumeStage(
        productionOrderId,
        parseInt(stageNumber),
        resumedBy || userId
      );

      res.status(200).json({
        success: true,
        message: 'Production stage resumed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error resuming production stage', { error, body: req.body });
      this.handleError(res, error);
    }
  }

  /**
   * Get stage-wise production summary
   */
  async getStageSummary(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.user;
      const { stageType, dateFrom, dateTo } = req.query;

      // This would be implemented based on specific requirements
      // For now, return a basic structure
      const result = {
        stageType: stageType || 'all',
        dateRange: {
          from: dateFrom,
          to: dateTo
        },
        summary: {
          totalOrders: 0,
          completedOrders: 0,
          inProgressOrders: 0,
          onHoldOrders: 0,
          averageCompletionTime: 0,
          efficiency: 0
        }
      };

      res.status(200).json({
        success: true,
        message: 'Stage summary retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting stage summary', { error, query: req.query });
      this.handleError(res, error);
    }
  }

  /**
   * Get production flow analytics
   */
  async getFlowAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.user;
      const { period = '30d' } = req.query;

      // This would be implemented based on specific requirements
      // For now, return a basic structure
      const result = {
        period,
        analytics: {
          totalProduction: 0,
          averageCycleTime: 0,
          qualityMetrics: {
            passRate: 0,
            defectRate: 0,
            reworkRate: 0
          },
          efficiencyMetrics: {
            machineUtilization: 0,
            laborEfficiency: 0,
            overallEfficiency: 0
          },
          costMetrics: {
            materialCost: 0,
            laborCost: 0,
            overheadCost: 0,
            totalCost: 0
          }
        }
      };

      res.status(200).json({
        success: true,
        message: 'Production flow analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting production flow analytics', { error, query: req.query });
      this.handleError(res, error);
    }
  }
}
