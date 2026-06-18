import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { PackingService } from '../services/PackingService';
import { IPacking } from '../models/Packing';

export class PackingController extends BaseController<any> {
  private packingService: PackingService;

  constructor() {
    const service = new PackingService();
    super(service, 'Packing');
    this.packingService = service;
  }

  /**
   * Create a new packing entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const packingData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (packingData.customerId === '' || packingData.customerId === null) {
        packingData.customerId = undefined;
      }

      const packing = await this.packingService.createPacking(packingData, userId);
      this.sendSuccess(res, packing, 'Packing entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create packing entry');
    }
  }

  /**
   * Update packing
   */
  async updatePacking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { totalPackedBale, totalPackedMeter, finishedGoodsInventoryId } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!totalPackedBale && !totalPackedMeter) {
        this.sendError(res, new Error('Invalid data'), 'Packed bale or meter is required', 400);
        return;
      }

      const packing = await this.packingService.updatePacking(
        id,
        totalPackedBale || 0,
        totalPackedMeter || 0,
        finishedGoodsInventoryId,
        userId
      );
      this.sendSuccess(res, packing, 'Packing updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update packing');
    }
  }

  /**
   * Get all packing entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { status, isDispatchReady } = req.query;
      const packings = await this.packingService.getAllPackings(companyId, {
        status: status as string,
        isDispatchReady: isDispatchReady === 'true'
      });

      this.sendSuccess(res, packings, 'Packing entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get packing entries');
    }
  }

  /**
   * Get dispatch ready packings
   */
  async getDispatchReady(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const packings = await this.packingService.getDispatchReady(companyId);
      this.sendSuccess(res, packings, 'Dispatch ready packings retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get dispatch ready packings');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const packing = await this.packingService.findById(id);

      if (!packing) {
        this.sendError(res, new Error('Not found'), 'Packing entry not found', 404);
        return;
      }

      this.sendSuccess(res, packing, 'Packing entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get packing entry');
    }
  }

  /**
   * Update packing entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const packing = await this.packingService.update(id, updateData, userId);
      if (!packing) {
        this.sendError(res, new Error('Not found'), 'Packing entry not found', 404);
        return;
      }

      this.sendSuccess(res, packing, 'Packing entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update packing entry');
    }
  }
}


