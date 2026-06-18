import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { RejectionStockService } from '../services/RejectionStockService';
import { IRejectionStock } from '../models/RejectionStock';

export class RejectionStockController extends BaseController<any> {
  private rejectionService: RejectionStockService;

  constructor() {
    const service = new RejectionStockService();
    super(service, 'RejectionStock');
    this.rejectionService = service;
  }

  /**
   * Get total rejection stock
   */
  async getTotal(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const total = await this.rejectionService.getTotalRejectionStock(companyId);
      this.sendSuccess(res, { totalRejection: total }, 'Total rejection stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get total rejection stock');
    }
  }

  /**
   * Get all rejection stocks
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { sourceModule, status } = req.query;
      const stocks = await this.rejectionService.getAllStocks(companyId, {
        sourceModule: sourceModule as string,
        status: status as string
      });

      this.sendSuccess(res, stocks, 'Rejection stocks retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get rejection stocks');
    }
  }

  /**
   * Get rejection stock by lot number
   */
  async getByLotNumber(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stocks = await this.rejectionService.getByLotNumber(companyId, lotNumber);
      this.sendSuccess(res, stocks, 'Rejection stocks retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get rejection stocks');
    }
  }

  /**
   * Update rejection stock status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!status || !['disposed', 'reworked'].includes(status)) {
        this.sendError(res, new Error('Invalid status'), 'Status must be disposed or reworked', 400);
        return;
      }

      const stock = await this.rejectionService.updateStatus(id, status, userId);
      this.sendSuccess(res, stock, 'Rejection stock status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update rejection stock status');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stock = await this.rejectionService.findById(id);

      if (!stock) {
        this.sendError(res, new Error('Not found'), 'Rejection stock not found', 404);
        return;
      }

      this.sendSuccess(res, stock, 'Rejection stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get rejection stock');
    }
  }
}






