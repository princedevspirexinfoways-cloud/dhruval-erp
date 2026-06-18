import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { AfterBleachingService } from '../services/AfterBleachingService';
import { IAfterBleaching } from '../models/AfterBleaching';

export class AfterBleachingController extends BaseController<any> {
  private afterBleachingService: AfterBleachingService;

  constructor() {
    const service = new AfterBleachingService();
    super(service, 'AfterBleaching');
    this.afterBleachingService = service;
  }

  /**
   * Get all after bleaching stocks
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { status } = req.query;
      const stocks = await this.afterBleachingService.getAllStocks(companyId, {
        status: status as string
      });

      this.sendSuccess(res, stocks, 'After bleaching stocks retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get after bleaching stocks');
    }
  }

  /**
   * Send meter to printing
   */
  async sendToPrinting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { meter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!meter || meter <= 0) {
        this.sendError(res, new Error('Invalid meter'), 'Meter is required and must be greater than 0', 400);
        return;
      }

      const stock = await this.afterBleachingService.sendToPrinting(id, meter, userId);
      this.sendSuccess(res, stock, 'Meter sent to printing successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to send to printing');
    }
  }

  /**
   * Get longation stock
   */
  async getLongationStock(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const totalLongation = await this.afterBleachingService.getLongationStock(companyId);
      this.sendSuccess(res, { totalLongation }, 'Longation stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get longation stock');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stock = await this.afterBleachingService.findById(id);

      if (!stock) {
        this.sendError(res, new Error('Not found'), 'After bleaching stock not found', 404);
        return;
      }

      this.sendSuccess(res, stock, 'After bleaching stock retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get after bleaching stock');
    }
  }
}

