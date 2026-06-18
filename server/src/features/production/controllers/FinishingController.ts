import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { FinishingService } from '../services/FinishingService';
import { IFinishing } from '../models/Finishing';

export class FinishingController extends BaseController<any> {
  private finishingService: FinishingService;

  constructor() {
    const service = new FinishingService();
    super(service, 'Finishing');
    this.finishingService = service;
  }

  /**
   * Create a new finishing entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const finishingData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (finishingData.customerId === '' || finishingData.customerId === null) {
        finishingData.customerId = undefined;
      }

      const finishing = await this.finishingService.createFinishing(finishingData, userId);
      this.sendSuccess(res, finishing, 'Finishing entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create finishing entry');
    }
  }

  /**
   * Update finishing output
   */
  async updateOutput(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { finishedMeter, rejectedMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!finishedMeter && !rejectedMeter) {
        this.sendError(res, new Error('Invalid data'), 'Finished or rejected meter is required', 400);
        return;
      }

      const result = await this.finishingService.updateOutput(
        id,
        finishedMeter || 0,
        rejectedMeter || 0,
        userId
      );
      this.sendSuccess(res, result, 'Finishing output updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update finishing output');
    }
  }

  /**
   * Get all finishing entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { finishingType, status } = req.query;
      const finishings = await this.finishingService.getAllFinishings(companyId, {
        finishingType: finishingType as string,
        status: status as string
      });

      this.sendSuccess(res, finishings, 'Finishing entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get finishing entries');
    }
  }

  /**
   * Get WIP
   */
  async getWIP(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const wip = await this.finishingService.getWIP(companyId);
      this.sendSuccess(res, wip, 'Finishing WIP retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get finishing WIP');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const finishing = await this.finishingService.findById(id);

      if (!finishing) {
        this.sendError(res, new Error('Not found'), 'Finishing entry not found', 404);
        return;
      }

      this.sendSuccess(res, finishing, 'Finishing entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get finishing entry');
    }
  }

  /**
   * Update finishing entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const finishing = await this.finishingService.update(id, updateData, userId);
      if (!finishing) {
        this.sendError(res, new Error('Not found'), 'Finishing entry not found', 404);
        return;
      }

      this.sendSuccess(res, finishing, 'Finishing entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update finishing entry');
    }
  }
}


