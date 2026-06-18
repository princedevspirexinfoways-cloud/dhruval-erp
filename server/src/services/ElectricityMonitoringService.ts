import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import ElectricityMonitoring from '../models/ElectricityMonitoring';
import { IElectricityMonitoring } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ElectricityMonitoringService extends BaseService<IElectricityMonitoring> {
  constructor() {
    super(ElectricityMonitoring);
  }

  /**
   * Create a new electricity monitoring system
   */
  async createMonitoringSystem(monitoringData: Partial<IElectricityMonitoring>, createdBy?: string): Promise<IElectricityMonitoring> {
    try {
      this.validateMonitoringData(monitoringData);

      const monitoring = await this.create({
        ...monitoringData,
        monitoringId: `EM-${Date.now()}`,
        readings: [],
        powerQuality: [],
        energyConsumption: [],
        alerts: [],
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Electricity monitoring system created successfully', {
        monitoringId: monitoring.monitoringId,
        monitoringName: monitoring.monitoringName,
        location: monitoring.location,
        createdBy
      });

      return monitoring;
    } catch (error) {
      logger.error('Error creating electricity monitoring system', { error, monitoringData, createdBy });
      throw error;
    }
  }

  /**
   * Get monitoring data by company
   */
  async getMonitoringByCompany(companyId: string, options: any = {}): Promise<IElectricityMonitoring[]> {
    try {
      let query: any = { 
        companyId: new Types.ObjectId(companyId)
      };

      if (options.meterNumber) {
        query.meterNumber = options.meterNumber;
      }

      if (options.sourceType) {
        query.sourceType = options.sourceType;
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
   * Get electricity consumption statistics from real database data
   */
  async getConsumptionStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };

      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalSystems,
        activeSystems,
        consumptionStats,
        alertCount,
        performanceStats
      ] = await Promise.all([
        this.count(matchQuery),
        this.count({
          ...matchQuery,
          'currentStatus.operationalStatus': 'active'
        }),
        this.model.aggregate([
          { $match: matchQuery },
          { $unwind: '$energyConsumption' },
          { $group: {
            _id: null,
            totalConsumption: { $sum: '$energyConsumption.totalConsumption' },
            avgConsumption: { $avg: '$energyConsumption.totalConsumption' },
            maxConsumption: { $max: '$energyConsumption.totalConsumption' }
          }}
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $project: { alertCount: { $size: '$alerts' } } },
          { $group: { _id: null, totalAlerts: { $sum: '$alertCount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: {
            _id: null,
            avgPowerFactor: { $avg: '$performance.powerFactor' },
            avgEfficiency: { $avg: '$performance.efficiency' },
            avgCostPerUnit: { $avg: '$performance.costPerUnit' }
          }}
        ])
      ]);

      return {
        totalSystems,
        activeSystems,
        totalAlerts: alertCount[0]?.totalAlerts || 0,
        consumption: {
          total: consumptionStats[0]?.totalConsumption || 0,
          average: consumptionStats[0]?.avgConsumption || 0,
          peak: consumptionStats[0]?.maxConsumption || 0
        },
        performance: {
          averagePowerFactor: performanceStats[0]?.avgPowerFactor || 0,
          averageEfficiency: performanceStats[0]?.avgEfficiency || 0,
          averageCostPerUnit: performanceStats[0]?.avgCostPerUnit || 0
        }
      };
    } catch (error) {
      logger.error('Error getting consumption statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Get energy source comparison from real database data
   */
  async getEnergySourceComparison(companyId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery = {
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      };

      const [
        renewableData,
        gridData,
        totalConsumption
      ] = await Promise.all([
        this.model.aggregate([
          { $match: matchQuery },
          { $unwind: '$energyConsumption' },
          { $match: { 'energyConsumption.source': { $in: ['solar', 'wind', 'renewable'] } } },
          { $group: {
            _id: '$energyConsumption.source',
            totalConsumption: { $sum: '$energyConsumption.totalConsumption' },
            totalCost: { $sum: '$energyConsumption.cost' }
          }}
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $unwind: '$energyConsumption' },
          { $match: { 'energyConsumption.source': { $in: ['grid', 'utility'] } } },
          { $group: {
            _id: '$energyConsumption.source',
            totalConsumption: { $sum: '$energyConsumption.totalConsumption' },
            totalCost: { $sum: '$energyConsumption.cost' }
          }}
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $unwind: '$energyConsumption' },
          { $group: {
            _id: null,
            totalConsumption: { $sum: '$energyConsumption.totalConsumption' },
            totalCost: { $sum: '$energyConsumption.cost' }
          }}
        ])
      ]);

      const renewable = renewableData.reduce((acc, curr) => ({
        totalConsumption: acc.totalConsumption + curr.totalConsumption,
        totalCost: acc.totalCost + curr.totalCost
      }), { totalConsumption: 0, totalCost: 0 });

      const grid = gridData.reduce((acc, curr) => ({
        totalConsumption: acc.totalConsumption + curr.totalConsumption,
        totalCost: acc.totalCost + curr.totalCost
      }), { totalConsumption: 0, totalCost: 0 });

      const total = totalConsumption[0] || { totalConsumption: 0, totalCost: 0 };

      return {
        renewable: {
          ...renewable,
          percentage: total.totalConsumption > 0 ? (renewable.totalConsumption / total.totalConsumption) * 100 : 0
        },
        grid: {
          ...grid,
          percentage: total.totalConsumption > 0 ? (grid.totalConsumption / total.totalConsumption) * 100 : 0
        },
        total,
        savings: {
          consumption: renewable.totalConsumption,
          cost: grid.totalCost > 0 ? grid.totalCost - renewable.totalCost : 0,
          percentage: grid.totalCost > 0 ? ((grid.totalCost - renewable.totalCost) / grid.totalCost) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Error getting energy source comparison', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Validate monitoring data
   */
  private validateMonitoringData(monitoringData: Partial<IElectricityMonitoring>): void {
    if (!monitoringData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!monitoringData.monitoringName) {
      throw new AppError('Monitoring name is required', 400);
    }

    if (!monitoringData.location) {
      throw new AppError('Location is required', 400);
    }
  }
}
