import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { WashingService } from '../services/WashingService';
import { IWashing } from '../models/Washing';

export class WashingController extends BaseController<any> {
  private washingService: WashingService;

  constructor() {
    const service = new WashingService();
    super(service, 'Washing');
    this.washingService = service;
  }

  /**
   * Create a new washing entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const washingData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (washingData.customerId === '' || washingData.customerId === null) {
        washingData.customerId = undefined;
      }

      const washing = await this.washingService.createWashing(washingData, userId);
      this.sendSuccess(res, washing, 'Washing entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create washing entry');
    }
  }

  /**
   * Update washing output
   */
  async updateOutput(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { washedMeter, shrinkageMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      // Validate input
      if (washedMeter === undefined && shrinkageMeter === undefined) {
        this.sendError(res, new Error('Invalid data'), 'At least one of washedMeter or shrinkageMeter is required', 400);
        return;
      }

      if ((washedMeter !== undefined && washedMeter < 0) || (shrinkageMeter !== undefined && shrinkageMeter < 0)) {
        this.sendError(res, new Error('Invalid data'), 'Meter values must be non-negative', 400);
        return;
      }

      const result = await this.washingService.updateOutput(
        id,
        washedMeter || 0,
        shrinkageMeter || 0,
        userId
      );

      // Create descriptive message based on what was moved
      let message = 'Washing output updated successfully';
      const movements = [];
      
      if (result.finishing) {
        movements.push(`${washedMeter || 0}m moved to Finishing`);
      }
      if (result.longationStock) {
        movements.push(`${shrinkageMeter || 0}m moved to Longation Stock`);
      }
      
      const pendingMeter = (result.washing.inputMeter || 0) - (washedMeter || 0) - (shrinkageMeter || 0);
      if (pendingMeter > 0) {
        movements.push(`${pendingMeter}m remains in Washing WIP`);
      }
      
      if (movements.length > 0) {
        message += ` - ${movements.join(', ')}`;
      }

      this.sendSuccess(res, result, message);
    } catch (error) {
      this.sendError(res, error, 'Failed to update washing output');
    }
  }

  /**
   * Get all washing entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { washingType, status } = req.query;
      const washings = await this.washingService.getAllWashings(companyId, {
        washingType: washingType as string,
        status: status as string
      });

      this.sendSuccess(res, washings, 'Washing entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get washing entries');
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

      const wip = await this.washingService.getWIP(companyId);
      this.sendSuccess(res, wip, 'Washing WIP retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get washing WIP');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const washing = await this.washingService.findById(id);

      if (!washing) {
        this.sendError(res, new Error('Not found'), 'Washing entry not found', 404);
        return;
      }

      this.sendSuccess(res, washing, 'Washing entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get washing entry');
    }
  }

  /**
   * Update washing entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const washing = await this.washingService.update(id, updateData, userId);
      if (!washing) {
        this.sendError(res, new Error('Not found'), 'Washing entry not found', 404);
        return;
      }

      this.sendSuccess(res, washing, 'Washing entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update washing entry');
    }
  }
}


