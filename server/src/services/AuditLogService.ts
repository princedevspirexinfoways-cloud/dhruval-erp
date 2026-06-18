import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import AuditLog from '../models/AuditLog';
import { IAuditLog } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuditLogService extends BaseService<IAuditLog> {
  constructor() {
    super(AuditLog);
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(auditData: Partial<IAuditLog>, createdBy?: string): Promise<IAuditLog> {
    try {
      // Validate audit data
      this.validateAuditData(auditData);

      const auditLog = await this.create({
        ...auditData,
        // timestamp: new Date(), // TODO: Add to interface
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      // Note: We don't log audit log creation to avoid infinite loops
      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log', { error, auditData, createdBy });
      throw error;
    }
  }

  /**
   * Log user action
   */
  async logUserAction(
    userId: string,
    companyId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    try {
      const auditData: Partial<IAuditLog> = {
        userId: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        action,
        actionCategory: 'user_action',
        actionType: 'create',
        resource: resourceType,
        resourceType,
        resourceId: resourceId,
        eventTimestamp: new Date(),
        eventId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        eventSource: 'web_app',
        eventSeverity: 'info',
        oldData: details?.oldData,
        newData: details?.newData
      };

      return await this.createAuditLog(auditData, userId);
    } catch (error) {
      logger.error('Error logging user action', { error, userId, action, resourceType });
      throw error;
    }
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    companyId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<IAuditLog> {
    try {
      const auditData: Partial<IAuditLog> = {
        companyId: new Types.ObjectId(companyId),
        action,
        actionCategory: 'system_event',
        actionType: 'create',
        resource: resourceType,
        resourceType,
        resourceId: resourceId,
        eventTimestamp: new Date(),
        eventId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        eventSource: 'system',
        eventSeverity: severity === 'critical' ? 'critical' : severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info',
        oldData: details?.oldData,
        newData: details?.newData
      };

      return await this.createAuditLog(auditData);
    } catch (error) {
      logger.error('Error logging system event', { error, companyId, action, resourceType });
      throw error;
    }
  }

  /**
   * Get audit logs by user
   */
  async getAuditLogsByUser(userId: string, companyId: string, options: any = {}): Promise<IAuditLog[]> {
    try {
      let query: any = { 
        userId: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId)
      };

      if (options.action) {
        query.action = options.action;
      }

      if (options.resourceType) {
        query.resourceType = options.resourceType;
      }

      if (options.dateRange) {
        query.timestamp = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      return await this.findMany(query, { 
        sort: { timestamp: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting audit logs by user', { error, userId, companyId, options });
      throw error;
    }
  }

  /**
   * Get audit logs by resource
   */
  async getAuditLogsByResource(resourceType: string, resourceId: string, companyId: string, options: any = {}): Promise<IAuditLog[]> {
    try {
      const query = { 
        resourceType,
        resourceId: new Types.ObjectId(resourceId),
        companyId: new Types.ObjectId(companyId)
      };

      return await this.findMany(query, { 
        sort: { timestamp: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting audit logs by resource', { error, resourceType, resourceId, companyId });
      throw error;
    }
  }

  /**
   * Get audit logs by company
   */
  async getAuditLogsByCompany(companyId: string, options: any = {}): Promise<IAuditLog[]> {
    try {
      let query: any = { 
        companyId: new Types.ObjectId(companyId)
      };

      if (options.action) {
        query.action = options.action;
      }

      if (options.resourceType) {
        query.resourceType = options.resourceType;
      }

      if (options.severity) {
        query.severity = options.severity;
      }

      if (options.dateRange) {
        query.timestamp = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      if (options.search) {
        query.$or = [
          { action: { $regex: options.search, $options: 'i' } },
          { resourceType: { $regex: options.search, $options: 'i' } },
          { 'details.description': { $regex: options.search, $options: 'i' } }
        ];
      }

      return await this.findMany(query, { 
        sort: { timestamp: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting audit logs by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };
      
      if (dateRange) {
        matchQuery.timestamp = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalLogs,
        logsByAction,
        logsByResourceType,
        logsBySeverity,
        topUsers
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$resourceType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        this.model.aggregate([
          { $match: { ...matchQuery, userId: { $exists: true } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalLogs,
        logsByAction,
        logsByResourceType,
        logsBySeverity,
        topUsers
      };
    } catch (error) {
      logger.error('Error getting audit statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Clean old audit logs
   */
  async cleanOldLogs(companyId: string, retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.model.deleteMany({
        companyId: new Types.ObjectId(companyId),
        timestamp: { $lt: cutoffDate }
      });

      logger.info('Old audit logs cleaned', { 
        companyId, 
        retentionDays, 
        deletedCount: result.deletedCount 
      });

      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error cleaning old audit logs', { error, companyId, retentionDays });
      throw error;
    }
  }

  /**
   * Validate audit data
   */
  private validateAuditData(auditData: Partial<IAuditLog>): void {
    if (!auditData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!auditData.action) {
      throw new AppError('Action is required', 400);
    }

    if (!auditData.resourceType) {
      throw new AppError('Resource type is required', 400);
    }
  }
}
