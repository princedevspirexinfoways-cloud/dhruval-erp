import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ProductionService } from '../services/ProductionService';
import { IProductionOrder } from '../types/models';

export class ProductionController extends BaseController<IProductionOrder> {
  private productionService: ProductionService;

  constructor() {
    const productionService = new ProductionService();
    super(productionService, 'ProductionOrder');
    this.productionService = productionService;
  }

  /**
   * Create a new production order
   */
  async createProductionOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.productionService.createProductionOrder(orderData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Production order created successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Start production
   */
  async startProduction(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const startedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.productionService.startProduction(orderId, startedBy);

      res.json({
        success: true,
        message: 'Production started successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Complete production stage
   */
  async completeStage(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { stageIndex, completionData } = req.body;

      const order = await this.productionService.completeStage(orderId, stageIndex, completionData);

      res.json({
        success: true,
        message: 'Production stage completed successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Complete production
   */
  async completeProduction(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const completionData = req.body;

      const order = await this.productionService.completeProduction(orderId, completionData);

      res.json({
        success: true,
        message: 'Production completed successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Cancel production
   */
  async cancelProduction(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const cancelledBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.productionService.cancelProduction(orderId, reason, cancelledBy);

      res.json({
        success: true,
        message: 'Production cancelled successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get production orders by company
   */
  async getProductionOrdersByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, status, search } = req.query;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (status) {
        options.status = status;
      }

      if (search) {
        options.search = search;
      }

      let query: any = { companyId };

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { productionOrderNumber: { $regex: search, $options: 'i' } },
          { productName: { $regex: search, $options: 'i' } }
        ];
      }

      const orders = await this.productionService.findMany(query, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { createdAt: -1 }
      });

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get production orders by status
   */
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const orders = await this.productionService.findMany({
        companyId,
        status
      }, { sort: { createdAt: -1 } });

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get production statistics
   */
  async getProductionStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.productionService.getProductionStats(companyId.toString(), dateRange);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update production order
   */
  async updateProductionOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.productionService.update(id, updateData, updatedBy);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Production order not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Production order updated successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get production order by ID
   */
  async getProductionOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await this.productionService.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Production order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get production order by number
   */
  async getOrderByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const order = await this.productionService.findOne({
        productionOrderNumber: orderNumber,
        companyId
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Production order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }
}
