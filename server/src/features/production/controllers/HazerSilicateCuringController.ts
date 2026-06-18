import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { HazerSilicateCuringService } from '../services/HazerSilicateCuringService';
import { IHazerSilicateCuring } from '../models/HazerSilicateCuring';

export class HazerSilicateCuringController extends BaseController<any> {
  private processService: HazerSilicateCuringService;

  constructor() {
    const service = new HazerSilicateCuringService();
    super(service, 'HazerSilicateCuring');
    this.processService = service;
  }

  /**
   * Create a new process entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const processData: any = {
        ...req.body,
        companyId
      };

      // Convert empty strings to undefined for optional fields
      if (processData.customerId === '' || processData.customerId === null) {
        processData.customerId = undefined;
      }

      const process = await this.processService.createProcess(processData, userId);
      this.sendSuccess(res, process, 'Process entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create process entry');
    }
  }

  /**
   * Update process output
   */
  async updateOutput(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { processedMeter, lossMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!processedMeter && !lossMeter) {
        this.sendError(res, new Error('Invalid data'), 'Processed or loss meter is required', 400);
        return;
      }

      const result = await this.processService.updateOutput(
        id,
        processedMeter || 0,
        lossMeter || 0,
        userId
      );
      this.sendSuccess(res, result, 'Process output updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update process output');
    }
  }

  /**
   * Get all processes
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { processType, status } = req.query;
      const processes = await this.processService.getAllProcesses(companyId, {
        processType: processType as string,
        status: status as string
      });

      this.sendSuccess(res, processes, 'Processes retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get processes');
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

      const wip = await this.processService.getWIP(companyId);
      this.sendSuccess(res, wip, 'Process WIP retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get process WIP');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const process = await this.processService.findById(id);

      if (!process) {
        this.sendError(res, new Error('Not found'), 'Process entry not found', 404);
        return;
      }

      this.sendSuccess(res, process, 'Process entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get process entry');
    }
  }

  /**
   * Update process entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const process = await this.processService.update(id, updateData, userId);
      if (!process) {
        this.sendError(res, new Error('Not found'), 'Process entry not found', 404);
        return;
      }

      this.sendSuccess(res, process, 'Process entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update process entry');
    }
  }
}


