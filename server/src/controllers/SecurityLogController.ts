import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SecurityLogService } from '../services/SecurityLogService';
import { ISecurityLog } from '../types/models';

export class SecurityLogController extends BaseController<ISecurityLog> {
  private securityLogService: SecurityLogService;

  constructor() {
    const securityLogService = new SecurityLogService();
    super(securityLogService, 'SecurityLog');
    this.securityLogService = securityLogService;
  }

  /**
   * Create a new security log entry
   */
  async createSecurityLog(req: Request, res: Response): Promise<void> {
    try {
      const securityData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const securityLog = await this.securityLogService.createSecurityLog(securityData, createdBy);

      this.sendSuccess(res, securityLog, 'Security log created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create security log');
    }
  }

  /**
   * Get security logs by company
   */
  async getSecurityLogsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, eventType, priority, search, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (eventType) {
        options.eventType = eventType;
      }

      if (priority) {
        options.priority = priority;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const securityLogs = await this.securityLogService.getSecurityLogsByCompany(companyId.toString(), options);

      this.sendSuccess(res, securityLogs, 'Security logs retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get security logs');
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.securityLogService.getSecurityStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Security statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get security statistics');
    }
  }

  /**
   * Get security log by ID
   */
  async getSecurityLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const securityLog = await this.securityLogService.findById(id);

      if (!securityLog) {
        this.sendError(res, new Error('Security log not found'), 'Security log not found', 404);
        return;
      }

      this.sendSuccess(res, securityLog, 'Security log retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get security log');
    }
  }

  /**
   * Update security log
   */
  async updateSecurityLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const securityLog = await this.securityLogService.update(id, updateData, updatedBy);

      if (!securityLog) {
        this.sendError(res, new Error('Security log not found'), 'Security log not found', 404);
        return;
      }

      this.sendSuccess(res, securityLog, 'Security log updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update security log');
    }
  }

  /**
   * Search security logs
   */
  async searchSecurityLogs(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { q: searchTerm, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!searchTerm) {
        this.sendError(res, new Error('Search term is required'), 'Search term is required', 400);
        return;
      }

      const securityLogs = await this.securityLogService.findMany({
        companyId,
        $or: [
          { eventType: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'location.name': { $regex: searchTerm, $options: 'i' } }
        ]
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, securityLogs, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search security logs');
    }
  }
}
