import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { FeltService } from '../services/FeltService';
import { IFelt } from '../models/Felt';

export class FeltController extends BaseController<any> {
  private feltService: FeltService;

  constructor() {
    const service = new FeltService();
    super(service, 'Felt');
    this.feltService = service;
  }

  /**
   * Create a new felt entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const feltData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (feltData.customerId === '' || feltData.customerId === null) {
        feltData.customerId = undefined;
      }

      const felt = await this.feltService.createFelt(feltData, userId);
      this.sendSuccess(res, felt, 'Felt entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create felt entry');
    }
  }

  /**
   * Complete felt process
   */
  async completeFelt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { feltMeter, lossMeter, dateOut } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!feltMeter && !lossMeter) {
        this.sendError(res, new Error('Invalid data'), 'Felt or loss meter is required', 400);
        return;
      }

      const result = await this.feltService.completeFelt(
        id,
        feltMeter || 0,
        lossMeter || 0,
        new Date(dateOut),
        userId
      );
      this.sendSuccess(res, result, 'Felt process completed successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to complete felt process');
    }
  }

  /**
   * Get all felt entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { status } = req.query;
      const felts = await this.feltService.getAllFelts(companyId, {
        status: status as string
      });

      this.sendSuccess(res, felts, 'Felt entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get felt entries');
    }
  }

  /**
   * Get active felts
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const activeFelts = await this.feltService.getActiveFelts(companyId);
      this.sendSuccess(res, activeFelts, 'Active felts retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get active felts');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const felt = await this.feltService.findById(id);

      if (!felt) {
        this.sendError(res, new Error('Not found'), 'Felt entry not found', 404);
        return;
      }

      this.sendSuccess(res, felt, 'Felt entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get felt entry');
    }
  }

  /**
   * Update felt entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const felt = await this.feltService.update(id, updateData, userId);
      if (!felt) {
        this.sendError(res, new Error('Not found'), 'Felt entry not found', 404);
        return;
      }

      this.sendSuccess(res, felt, 'Felt entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update felt entry');
    }
  }
}


