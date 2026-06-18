import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuditLogService } from '../services/AuditLogService';
import { IAuditLog } from '../types/models';

export class AuditLogController extends BaseController<IAuditLog> {
  private auditLogService: AuditLogService;

  constructor() {
    const auditLogService = new AuditLogService();
    super(auditLogService, 'AuditLog');
    this.auditLogService = auditLogService;
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const auditData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const auditLog = await this.auditLogService.createAuditLog(auditData, createdBy);

      this.sendSuccess(res, auditLog, 'Audit log created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create audit log');
    }
  }

  /**
   * Log user action
   */
  async logUserAction(req: Request, res: Response): Promise<void> {
    try {
      const { action, resourceType, resourceId, details } = req.body;
      const userId = (req.user?.userId || req.user?._id)?.toString();
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        this.sendError(res, new Error('User ID and Company ID are required'), 'Authentication required', 401);
        return;
      }

      const auditLog = await this.auditLogService.logUserAction(
        userId.toString(),
        companyId.toString(),
        action,
        resourceType,
        resourceId,
        details
      );

      this.sendSuccess(res, auditLog, 'User action logged successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to log user action');
    }
  }

  /**
   * Get audit logs by company
   */
  async getAuditLogsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, action, resourceType, search, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (action) {
        options.action = action;
      }

      if (resourceType) {
        options.resourceType = resourceType;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const auditLogs = await this.auditLogService.getAuditLogsByCompany(companyId.toString(), options);

      this.sendSuccess(res, auditLogs, 'Audit logs retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get audit logs');
    }
  }

  /**
   * Get audit logs by user
   */
  async getAuditLogsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, action, resourceType } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        action: action as string,
        resourceType: resourceType as string
      };

      const auditLogs = await this.auditLogService.getAuditLogsByUser(userId, companyId.toString(), options);

      this.sendSuccess(res, auditLogs, 'User audit logs retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get user audit logs');
    }
  }

  /**
   * Get audit logs by resource
   */
  async getAuditLogsByResource(req: Request, res: Response): Promise<void> {
    try {
      const { resourceType, resourceId } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const auditLogs = await this.auditLogService.getAuditLogsByResource(resourceType, resourceId, companyId.toString(), options);

      this.sendSuccess(res, auditLogs, 'Resource audit logs retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get resource audit logs');
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.auditLogService.getAuditStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Audit statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get audit statistics');
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const auditLog = await this.auditLogService.findById(id);

      if (!auditLog) {
        this.sendError(res, new Error('Audit log not found'), 'Audit log not found', 404);
        return;
      }

      this.sendSuccess(res, auditLog, 'Audit log retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get audit log');
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(req: Request, res: Response): Promise<void> {
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

      const auditLogs = await this.auditLogService.findMany({
        companyId,
        $or: [
          { action: { $regex: searchTerm, $options: 'i' } },
          { resourceType: { $regex: searchTerm, $options: 'i' } },
          { userName: { $regex: searchTerm, $options: 'i' } }
        ]
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, auditLogs, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search audit logs');
    }
  }
}
