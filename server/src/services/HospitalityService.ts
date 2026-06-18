import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import Hospitality from '../models/Hospitality';
import { IHospitality } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class HospitalityService extends BaseService<IHospitality> {
  constructor() {
    super(Hospitality);
  }

  /**
   * Create a new hospitality facility
   */
  async createHospitalityFacility(hospitalityData: Partial<IHospitality>, createdBy?: string): Promise<IHospitality> {
    try {
      this.validateHospitalityData(hospitalityData);

      const hospitality = await this.create({
        ...hospitalityData,
        facilityId: `HSP-${Date.now()}`,
        totalBookings: 0,
        activeBookings: 0,
        totalGuests: 0,
        vipGuests: 0,
        repeatGuests: 0,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Hospitality facility created successfully', {
        facilityId: hospitality.facilityId,
        facilityName: hospitality.facilityName,
        facilityType: hospitality.facilityType,
        createdBy
      });

      return hospitality;
    } catch (error) {
      logger.error('Error creating hospitality facility', { error, hospitalityData, createdBy });
      throw error;
    }
  }

  /**
   * Get hospitality facilities by company
   */
  async getHospitalityByCompany(companyId: string, options: any = {}): Promise<IHospitality[]> {
    try {
      let query: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (options.facilityName) {
        query.facilityName = { $regex: options.facilityName, $options: 'i' };
      }

      if (options.facilityType) {
        query.facilityType = options.facilityType;
      }

      if (options.dateRange) {
        query.createdAt = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      return await this.findMany(query, {
        sort: { createdAt: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting hospitality facilities by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get hospitality statistics
   */
  async getHospitalityStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };

      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalFacilities,
        facilitiesByType,
        totalBookings,
        totalGuests,
        avgOccupancy
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$facilityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalBookings: { $sum: '$totalBookings' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalGuests: { $sum: '$totalGuests' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, avgOccupancy: { $avg: '$occupancy.currentOccupancy' } } }
        ])
      ]);

      return {
        totalFacilities,
        facilitiesByType,
        totalBookings: totalBookings[0]?.totalBookings || 0,
        totalGuests: totalGuests[0]?.totalGuests || 0,
        averageOccupancy: avgOccupancy[0]?.avgOccupancy || 0
      };
    } catch (error) {
      logger.error('Error getting hospitality statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Get monthly hospitality report
   */
  async getMonthlyReport(companyId: string, year: number, month: number): Promise<any> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const matchQuery = {
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const [
        monthlyEntries,
        dailyBreakdown
      ] = await Promise.all([
        this.findMany(matchQuery, { sort: { createdAt: -1 } }),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: {
            _id: { $dayOfMonth: '$createdAt' },
            totalBookings: { $sum: '$totalBookings' },
            facilityCount: { $sum: 1 }
          }},
          { $sort: { '_id': 1 } }
        ])
      ]);

      return {
        monthlyEntries,
        dailyBreakdown,
        summary: {
          totalFacilities: monthlyEntries.length,
          totalBookings: monthlyEntries.reduce((sum, entry) => sum + (entry.totalBookings || 0), 0)
        }
      };
    } catch (error) {
      logger.error('Error getting monthly hospitality report', { error, companyId, year, month });
      throw error;
    }
  }

  /**
   * Validate hospitality data
   */
  private validateHospitalityData(hospitalityData: Partial<IHospitality>): void {
    if (!hospitalityData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!hospitalityData.facilityName) {
      throw new AppError('Facility name is required', 400);
    }

    if (!hospitalityData.facilityType) {
      throw new AppError('Facility type is required', 400);
    }
  }
}
