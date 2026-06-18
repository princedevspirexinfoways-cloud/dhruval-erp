import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { LongationStockService } from '../services/LongationStockService';
import { ILongationStock } from '../models/LongationStock';

export class LongationStockController extends BaseController<any> {
  private longationService: LongationStockService;

  constructor() {
    const service = new LongationStockService();
    super(service, 'LongationStock');
    this.longationService = service;
  }

  /**
   * Get total longation stock
   */
  async getTotal(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const total = await this.longationService.getTotalLongationStock(companyId);
      this.sendSuccess(res, { totalLongation: total }, 'Total longation stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get total longation stock');
    }
  }

  /**
   * Get all longation stocks
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { sourceModule, status } = req.query;
      const stocks = await this.longationService.getAllStocks(companyId, {
        sourceModule: sourceModule as string,
        status: status as string
      });

      this.sendSuccess(res, stocks, 'Longation stocks retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get longation stocks');
    }
  }

  /**
   * Get longation stock by lot number
   */
  async getByLotNumber(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stocks = await this.longationService.getByLotNumber(companyId, lotNumber);
      this.sendSuccess(res, stocks, 'Longation stocks retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get longation stocks');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stock = await this.longationService.findById(id);

      if (!stock) {
        this.sendError(res, new Error('Not found'), 'Longation stock not found', 404);
        return;
      }

      this.sendSuccess(res, stock, 'Longation stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get longation stock');
    }
  }
}






