import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { FoldingCheckingService } from '../services/FoldingCheckingService';
import { IFoldingChecking } from '../models/FoldingChecking';

export class FoldingCheckingController extends BaseController<any> {
  private foldingService: FoldingCheckingService;

  constructor() {
    const service = new FoldingCheckingService();
    super(service, 'FoldingChecking');
    this.foldingService = service;
  }

  /**
   * Create a new folding + checking entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const foldingData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (foldingData.customerId === '' || foldingData.customerId === null) {
        foldingData.customerId = undefined;
      }

      const folding = await this.foldingService.createFoldingChecking(foldingData, userId);
      this.sendSuccess(res, folding, 'Folding + Checking entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create folding + checking entry');
    }
  }

  /**
   * Update QC results
   */
  async updateQC(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { checkedMeter, rejectedMeter, qcStatus, checkerName } = req.body;
      const { userId } = this.getUserInfo(req);

      // Validate input
      if (checkedMeter === undefined && rejectedMeter === undefined) {
        this.sendError(res, new Error('Invalid data'), 'At least one of checkedMeter or rejectedMeter is required', 400);
        return;
      }

      if ((checkedMeter !== undefined && checkedMeter < 0) || (rejectedMeter !== undefined && rejectedMeter < 0)) {
        this.sendError(res, new Error('Invalid data'), 'Meter values must be non-negative', 400);
        return;
      }

      if (!qcStatus || !['pass', 'fail', 'partial'].includes(qcStatus)) {
        this.sendError(res, new Error('Invalid data'), 'QC status must be one of: pass, fail, partial', 400);
        return;
      }

      if (!checkerName || checkerName.trim() === '') {
        this.sendError(res, new Error('Invalid data'), 'Checker name is required', 400);
        return;
      }

      const result = await this.foldingService.updateQC(
        id,
        checkedMeter || 0,
        rejectedMeter || 0,
        qcStatus,
        checkerName.trim(),
        userId
      );

      // Create descriptive message based on what was moved
      let message = 'QC results updated successfully';
      const movements = [];
      
      if (result.packing) {
        movements.push(`${checkedMeter || 0}m moved to Packing`);
      }
      if (result.rejectionStock) {
        movements.push(`${rejectedMeter || 0}m moved to Rejection Stock`);
      }
      
      const pendingMeter = (result.folding.inputMeter || 0) - (checkedMeter || 0) - (rejectedMeter || 0);
      if (pendingMeter > 0) {
        movements.push(`${pendingMeter}m remains in Folding+Checking WIP`);
      }
      
      if (movements.length > 0) {
        message += ` - ${movements.join(', ')}`;
      }

      this.sendSuccess(res, result, message);
    } catch (error) {
      this.sendError(res, error, 'Failed to update QC results');
    }
  }

  /**
   * Get all folding + checking entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { qcStatus, status } = req.query;
      const foldings = await this.foldingService.getAllFoldings(companyId, {
        qcStatus: qcStatus as string,
        status: status as string
      });

      this.sendSuccess(res, foldings, 'Folding + Checking entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get folding + checking entries');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const folding = await this.foldingService.findById(id);

      if (!folding) {
        this.sendError(res, new Error('Not found'), 'Folding + Checking entry not found', 404);
        return;
      }

      this.sendSuccess(res, folding, 'Folding + Checking entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get folding + checking entry');
    }
  }

  /**
   * Update folding + checking entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const folding = await this.foldingService.update(id, updateData, userId);
      if (!folding) {
        this.sendError(res, new Error('Not found'), 'Folding + Checking entry not found', 404);
        return;
      }

      this.sendSuccess(res, folding, 'Folding + Checking entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update folding + checking entry');
    }
  }
}


