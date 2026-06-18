import ProductionLog, { IProductionLog } from '../models/ProductionLog';
import { logger } from '../utils/logger';

export class ProductionLogService {
  // Create status change log for production
  static async createStatusChangeLog(data: {
    productionStage: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole?: string;
    fromStatus: string;
    toStatus: string;
    changeReason: string;
    notes?: string;
    duration?: number;
    productionData?: {
      batchNumber?: string;
      productionOrderNumber?: string;
      customerName?: string;
      fabricType?: string;
      fabricColor?: string;
      quantity?: number;
      unit?: string;
      machineName?: string;
      machineId?: string;
      temperature?: number;
      pressure?: number;
      speed?: number;
      efficiency?: number;
      qualityGrade?: string;
      defects?: string[];
    };
    requestInfo: {
      ipAddress: string;
      userAgent: string;
      sessionId?: string;
      requestId?: string;
      method?: string;
      url?: string;
    };
    metadata?: any;
  }): Promise<IProductionLog> {
    try {
      const productionLog = await ProductionLog.createStatusChangeLog(data);
      
      logger.info('Production status change log created successfully', {
        logId: productionLog._id,
        productionStage: data.productionStage,
        entityType: data.entityType,
        entityId: data.entityId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        userId: data.userId,
        batchNumber: data.productionData?.batchNumber,
        timestamp: new Date().toISOString()
      });

      return productionLog;
    } catch (error) {
      logger.error('Error creating production status change log:', {
        error: error.message,
        stack: error.stack,
        data,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Create general production log
  static async createProductionLog(data: {
    logType: 'status_change' | 'stage_change' | 'quality_check' | 'machine_start' | 'machine_stop' | 'material_input' | 'material_output' | 'error' | 'maintenance';
    productionStage: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole?: string;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
    }>;
    productionData?: {
      batchNumber?: string;
      productionOrderNumber?: string;
      customerName?: string;
      fabricType?: string;
      fabricColor?: string;
      quantity?: number;
      unit?: string;
      machineName?: string;
      machineId?: string;
      temperature?: number;
      pressure?: number;
      speed?: number;
      efficiency?: number;
      qualityGrade?: string;
      defects?: string[];
    };
    requestInfo: {
      ipAddress: string;
      userAgent: string;
      sessionId?: string;
      requestId?: string;
      method?: string;
      url?: string;
    };
    metadata?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<IProductionLog> {
    try {
      const productionLog = await ProductionLog.createProductionLog(data);
      
      logger.info('Production log created successfully', {
        logId: productionLog._id,
        logType: data.logType,
        productionStage: data.productionStage,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        batchNumber: data.productionData?.batchNumber,
        timestamp: new Date().toISOString()
      });

      return productionLog;
    } catch (error) {
      logger.error('Error creating production log:', {
        error: error.message,
        stack: error.stack,
        data,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get logs by production stage
  static async getLogsByStage(
    productionStage: string,
    options: {
      limit?: number;
      skip?: number;
      logType?: string;
      startDate?: Date;
      endDate?: Date;
      batchNumber?: string;
    } = {}
  ): Promise<IProductionLog[]> {
    try {
      const filter: any = {
        productionStage,
        isArchived: false
      };

      if (options.logType) {
        filter.logType = options.logType;
      }

      if (options.batchNumber) {
        filter['productionData.batchNumber'] = options.batchNumber;
      }

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
      }

      const logs = await ProductionLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);

      return logs;
    } catch (error) {
      logger.error('Error retrieving logs by production stage:', {
        error: error.message,
        productionStage,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get logs by batch number
  static async getLogsByBatch(
    batchNumber: string,
    options: {
      limit?: number;
      skip?: number;
      logType?: string;
      productionStage?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<IProductionLog[]> {
    try {
      const filter: any = {
        'productionData.batchNumber': batchNumber,
        isArchived: false
      };

      if (options.logType) {
        filter.logType = options.logType;
      }

      if (options.productionStage) {
        filter.productionStage = options.productionStage;
      }

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
      }

      const logs = await ProductionLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(options.limit || 100)
        .skip(options.skip || 0);

      return logs;
    } catch (error) {
      logger.error('Error retrieving logs by batch:', {
        error: error.message,
        batchNumber,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get status change logs for a specific entity
  static async getStatusChangeLogs(
    entityType: string,
    entityId: string
  ): Promise<IProductionLog[]> {
    try {
      const logs = await ProductionLog.find({
        entityType,
        entityId,
        logType: 'status_change',
        isArchived: false
      })
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 });

      return logs;
    } catch (error) {
      logger.error('Error retrieving status change logs:', {
        error: error.message,
        entityType,
        entityId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get recent production activity
  static async getRecentProductionActivity(
    options: {
      limit?: number;
      productionStage?: string;
      logType?: string;
      severity?: string;
      hours?: number;
    } = {}
  ): Promise<IProductionLog[]> {
    try {
      const filter: any = {
        isArchived: false
      };

      if (options.productionStage) {
        filter.productionStage = options.productionStage;
      }

      if (options.logType) {
        filter.logType = options.logType;
      }

      if (options.severity) {
        filter.severity = options.severity;
      }

      if (options.hours) {
        const hoursAgo = new Date(Date.now() - (options.hours * 60 * 60 * 1000));
        filter.timestamp = { $gte: hoursAgo };
      }

      const logs = await ProductionLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(options.limit || 100);

      return logs;
    } catch (error) {
      logger.error('Error retrieving recent production activity:', {
        error: error.message,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get production statistics
  static async getProductionStatistics(
    options: {
      startDate?: Date;
      endDate?: Date;
      productionStage?: string;
      userId?: string;
    } = {}
  ): Promise<any> {
    try {
      const filter: any = {
        isArchived: false
      };

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
      }

      if (options.productionStage) {
        filter.productionStage = options.productionStage;
      }

      if (options.userId) {
        filter.userId = options.userId;
      }

      const stats = await ProductionLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              logType: '$logType',
              productionStage: '$productionStage',
              action: '$action'
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueBatches: { $addToSet: '$productionData.batchNumber' },
            lastActivity: { $max: '$timestamp' }
          }
        },
        {
          $group: {
            _id: '$_id.logType',
            totalCount: { $sum: '$count' },
            stages: {
              $push: {
                stage: '$_id.productionStage',
                action: '$_id.action',
                count: '$count',
                uniqueUsers: { $size: '$uniqueUsers' },
                uniqueBatches: { $size: '$uniqueBatches' },
                lastActivity: '$lastActivity'
              }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error getting production statistics:', {
        error: error.message,
        options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Mark logs as read
  static async markLogsAsRead(logIds: string[]): Promise<void> {
    try {
      await ProductionLog.updateMany(
        { _id: { $in: logIds } },
        { isRead: true }
      );

      logger.info('Production logs marked as read', {
        logIds,
        count: logIds.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error marking production logs as read:', {
        error: error.message,
        logIds,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Archive old logs
  static async archiveOldLogs(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      
      const result = await ProductionLog.updateMany(
        { 
          timestamp: { $lt: cutoffDate },
          isArchived: false 
        },
        { isArchived: true }
      );

      logger.info('Old production logs archived', {
        daysOld,
        cutoffDate,
        archivedCount: result.modifiedCount,
        timestamp: new Date().toISOString()
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('Error archiving old production logs:', {
        error: error.message,
        daysOld,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

