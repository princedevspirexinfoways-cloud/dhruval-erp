import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import SecurityLog from '../models/SecurityLog';
import { ISecurityLog } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class SecurityLogService extends BaseService<ISecurityLog> {
  constructor() {
    super(SecurityLog);
  }

  /**
   * Create a new security log entry
   */
  async createSecurityLog(securityData: Partial<ISecurityLog>, createdBy?: string): Promise<ISecurityLog> {
    try {
      this.validateSecurityData(securityData);

      const securityLog = await this.create({
        ...securityData,
        logId: `SEC-${Date.now()}`,
        logNumber: `SL-${Date.now()}`,
        eventDateTime: securityData.eventDateTime || new Date(),
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Security log created successfully', {
        logId: securityLog.logId,
        eventType: securityLog.eventType,
        priority: securityLog.priority,
        createdBy
      });

      return securityLog;
    } catch (error) {
      logger.error('Error creating security log', { error, securityData, createdBy });
      throw error;
    }
  }

  /**
   * Get security logs by company
   */
  async getSecurityLogsByCompany(companyId: string, options: any = {}): Promise<ISecurityLog[]> {
    try {
      let query: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (options.eventType) {
        query.eventType = options.eventType;
      }

      if (options.priority) {
        query.priority = options.priority;
      }

      if (options.dateRange) {
        query.eventDateTime = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      return await this.findMany(query, {
        sort: { eventDateTime: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting security logs by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };

      if (dateRange) {
        matchQuery.eventDateTime = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalLogs,
        logsByEventType,
        logsByPriority
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      return {
        totalLogs,
        logsByEventType,
        logsByPriority
      };
    } catch (error) {
      logger.error('Error getting security statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Validate security data
   */
  private validateSecurityData(securityData: Partial<ISecurityLog>): void {
    if (!securityData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!securityData.eventType) {
      throw new AppError('Event type is required', 400);
    }

    if (!securityData.description) {
      throw new AppError('Description is required', 400);
    }
  }
}