import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { ProgramDetailsService } from '../services/ProgramDetailsService';
import { IProgramDetails } from '../models/ProgramDetails';

export class ProgramDetailsController extends BaseController<any> {
  private programDetailsService: ProgramDetailsService;

  constructor() {
    const service = new ProgramDetailsService();
    super(service, 'ProgramDetails');
    this.programDetailsService = service;
  }

  /**
   * Create a new program details entry
   */
  async createProgramDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const programData = {
        ...req.body,
        companyId
      };

      const program = await this.programDetailsService.createProgramDetails(programData, userId);
      this.sendSuccess(res, program, 'Program details created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create program details');
    }
  }

  /**
   * Get program details by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const program = await this.programDetailsService.findById(id);

      if (!program) {
        this.sendError(res, new Error('Not found'), 'Program details not found', 404);
        return;
      }

      this.sendSuccess(res, program, 'Program details retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get program details');
    }
  }

  /**
   * Get all program details for company
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { page, limit, status } = req.query;
      const result = await this.programDetailsService.getByCompany(companyId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string
      });

      res.status(200).json({
        success: true,
        message: 'Program details retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get program details');
    }
  }

  /**
   * Get program details by order number
   */
  async getByOrderNumber(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { orderNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const program = await this.programDetailsService.getByOrderNumber(companyId, orderNumber);
      if (!program) {
        this.sendError(res, new Error('Not found'), 'Program details not found', 404);
        return;
      }

      this.sendSuccess(res, program, 'Program details retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get program details');
    }
  }

  /**
   * Update program details
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const program = await this.programDetailsService.update(id, updateData, userId);
      if (!program) {
        this.sendError(res, new Error('Not found'), 'Program details not found', 404);
        return;
      }

      this.sendSuccess(res, program, 'Program details updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update program details');
    }
  }

  /**
   * Delete program details
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);

      const deleted = await this.programDetailsService.delete(id, userId);
      if (!deleted) {
        this.sendError(res, new Error('Not found'), 'Program details not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Program details deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete program details');
    }
  }
}

