import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import BoilerMonitoring from '../models/BoilerMonitoring';
import { IBoilerMonitoring } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BoilerMonitoringService extends BaseService<IBoilerMonitoring> {
  constructor() {
    super(BoilerMonitoring);
  }

  /**
   * Create a new boiler monitoring system
   */
  async createBoilerMonitoring(monitoringData: Partial<IBoilerMonitoring>, createdBy?: string): Promise<IBoilerMonitoring> {
    try {
      this.validateMonitoringData(monitoringData);

      const monitoring = await this.create({
        ...monitoringData,
        boilerId: `BM-${Date.now()}`,
        readings: [],
        alerts: [],
        maintenanceRecords: [],
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Boiler monitoring system created successfully', {
        boilerId: monitoring.boilerId,
        boilerName: monitoring.boilerName,
        boilerNumber: monitoring.boilerNumber,
        createdBy
      });

      return monitoring;
    } catch (error) {
      logger.error('Error creating boiler monitoring system', { error, monitoringData, createdBy });
      throw error;
    }
  }

  /**
   * Get monitoring data by company
   */
  async getMonitoringByCompany(companyId: string, options: any = {}): Promise<IBoilerMonitoring[]> {
    try {
      let query: any = { 
        companyId: new Types.ObjectId(companyId)
      };

      if (options.boilerId) {
        query.boilerId = options.boilerId;
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
      logger.error('Error getting monitoring data by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get boiler alerts
   */
  async getBoilerAlerts(companyId: string, dateRange?: { start: Date; end: Date }): Promise<IBoilerMonitoring[]> {
    try {
      let query: any = {
        companyId: new Types.ObjectId(companyId),
        'alerts.0': { $exists: true }
      };

      if (dateRange) {
        query.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      return await this.findMany(query, {
        sort: { createdAt: -1 }
      });
    } catch (error) {
      logger.error('Error getting boiler alerts', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Get boiler statistics from real database data
   */
  async getBoilerStats(companyId: string, boilerId?: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };

      if (boilerId) {
        matchQuery.boilerId = boilerId;
      }

      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalBoilers,
        activeBoilers,
        alertCount,
        performanceStats,
        readingsStats
      ] = await Promise.all([
        this.count(matchQuery),
        this.count({
          ...matchQuery,
          'currentStatus.operationalStatus': 'running'
        }),
        this.model.aggregate([
          { $match: matchQuery },
          { $project: { alertCount: { $size: '$alerts' } } },
          { $group: { _id: null, totalAlerts: { $sum: '$alertCount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: {
            _id: null,
            avgEfficiency: { $avg: '$performance.efficiency' },
            avgFuelConsumption: { $avg: '$performance.fuelConsumption' },
            avgMaintenanceCost: { $avg: '$performance.maintenanceCost' }
          }}
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $project: { readingCount: { $size: '$readings' } } },
          { $group: {
            _id: null,
            totalReadings: { $sum: '$readingCount' },
            avgReadingsPerBoiler: { $avg: '$readingCount' }
          }}
        ])
      ]);

      return {
        totalBoilers,
        activeBoilers,
        totalAlerts: alertCount[0]?.totalAlerts || 0,
        totalReadings: readingsStats[0]?.totalReadings || 0,
        averageReadingsPerBoiler: readingsStats[0]?.avgReadingsPerBoiler || 0,
        performance: {
          averageEfficiency: performanceStats[0]?.avgEfficiency || 0,
          averageFuelConsumption: performanceStats[0]?.avgFuelConsumption || 0,
          averageMaintenanceCost: performanceStats[0]?.avgMaintenanceCost || 0
        }
      };
    } catch (error) {
      logger.error('Error getting boiler statistics', { error, companyId, boilerId, dateRange });
      throw error;
    }
  }

  /**
   * Validate monitoring data
   */
  private validateMonitoringData(monitoringData: Partial<IBoilerMonitoring>): void {
    if (!monitoringData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!monitoringData.boilerName) {
      throw new AppError('Boiler name is required', 400);
    }

    if (!monitoringData.boilerNumber) {
      throw new AppError('Boiler number is required', 400);
    }
  }
}
