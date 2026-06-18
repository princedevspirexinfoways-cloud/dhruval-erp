import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { BatchCenterService } from '../services/BatchCenterService';
import { IBatchCenter } from '../models/BatchCenter';

export class BatchCenterController extends BaseController<any> {
  private batchCenterService: BatchCenterService;

  constructor() {
    const service = new BatchCenterService();
    super(service, 'BatchCenter');
    this.batchCenterService = service;
  }

  /**
   * Create a new batch entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const batchData = {
        ...req.body,
        companyId
      };

      const batch = await this.batchCenterService.createBatchEntry(batchData, userId);
      this.sendSuccess(res, batch, 'Batch entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create batch entry');
    }
  }

  /**
   * Get all batch entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { page, limit, status } = req.query;
      const result = await this.batchCenterService.getAllBatches(companyId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string
      });

      res.status(200).json({
        success: true,
        message: 'Batch entries retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get batch entries');
    }
  }

  /**
   * Update received meter
   */
  async updateReceivedMeter(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { receivedMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!receivedMeter || receivedMeter < 0) {
        this.sendError(res, new Error('Invalid meter'), 'Received meter is required and must be >= 0', 400);
        return;
      }

      const batch = await this.batchCenterService.updateReceivedMeter(id, receivedMeter, userId);
      this.sendSuccess(res, batch, 'Received meter updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update received meter');
    }
  }

  /**
   * Get party name by lot number (for auto-fill)
   */
  async getPartyNameByLot(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const partyName = await this.batchCenterService.getPartyNameByLot(companyId, lotNumber);
      this.sendSuccess(res, { partyName }, 'Party name retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get party name');
    }
  }

  /**
   * Get comprehensive lot details including customer information
   */
  async getLotDetails(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const lotDetails = await this.batchCenterService.getLotDetailsWithCustomer(companyId, lotNumber);
      
      if (!lotDetails) {
        this.sendSuccess(res, { 
          partyName: null, 
          customerId: null, 
          quality: null,
          availableMeter: null,
          sourceModule: null
        }, 'Lot not found in any production module');
        return;
      }

      this.sendSuccess(res, lotDetails, 'Lot details retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get lot details');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await this.batchCenterService.findById(id);

      if (!batch) {
        this.sendError(res, new Error('Not found'), 'Batch entry not found', 404);
        return;
      }

      this.sendSuccess(res, batch, 'Batch entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get batch entry');
    }
  }

  /**
   * Update batch entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const batch = await this.batchCenterService.update(id, updateData, userId);
      if (!batch) {
        this.sendError(res, new Error('Not found'), 'Batch entry not found', 404);
        return;
      }

      this.sendSuccess(res, batch, 'Batch entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update batch entry');
    }
  }
}

