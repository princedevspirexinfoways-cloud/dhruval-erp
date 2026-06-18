import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { GatePass, IGatePass } from '../models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateGatePassRequest {
  vehicleId?: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  driverIdNumber?: string;
  driverLicenseNumber?: string;
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other';
  reason: string;
  personToMeet?: string;
  department?: string;
  companyId: string;
  securityNotes?: string;
  /** Spec: link to one of Dispatch / Invoice / Job Work */
  dispatchId?: string;
  invoiceId?: string;
  jobWorkChallanId?: string;
  partyReceiver?: string;
  transportName?: string;
  materialList?: { designNo?: string; description?: string; quantity: number; unit: string; baleCount?: number; cartonCount?: number }[];
  weights?: { tare?: number; gross?: number; net?: number };
  remarks?: string;
  items?: {
    description: string;
    quantity: number;
    value?: number;
  }[];
  images?: string[];
}

export interface GatePassStats {
  totalGatePasses: number;
  activeGatePasses: number;
  completedGatePasses: number;
  expiredGatePasses: number;
  cancelledGatePasses: number;
  averageDuration: number;
  todayGatePasses: number;
  purposeBreakdown: {
    delivery: number;
    pickup: number;
    maintenance: number;
    other: number;
  };
}

export class GatePassService extends BaseService<IGatePass> {
  constructor() {
    super(GatePass);
  }

  /**
   * Find many with advanced populate
   */
  private async findManyWithPopulate(filter: any, options: any = {}): Promise<IGatePass[]> {
    try {
      let query = this.model.find(filter, null, options);
      
      // Add populate with select
      query = query
        .populate('vehicleId', 'vehicleNumber driverName driverPhone')
        .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
        .populate('printedBy', 'username email personalInfo.firstName personalInfo.lastName')
        .populate('approvedBy', 'username email personalInfo.firstName personalInfo.lastName')
        .populate('companyId', 'companyName companyCode');

      return await query.exec();
    } catch (error) {
      logger.error('Error finding gate passes with populate', { error, filter });
      throw error;
    }
  }

  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Create a new gate pass
   */
  async createGatePass(gatePassData: CreateGatePassRequest, createdBy?: string): Promise<IGatePass> {
    try {
      // Validate required fields (spec: Vehicle No required; Vehicle ID optional when creating from dispatch/invoice)
      if (!gatePassData.vehicleNumber) {
        throw new AppError('Vehicle number is required', 400);
      }
      if (!gatePassData.driverName) {
        throw new AppError('Driver name is required', 400);
      }
      if (!gatePassData.driverPhone) {
        throw new AppError('Driver phone is required', 400);
      }
      if (!gatePassData.purpose) {
        throw new AppError('Purpose is required', 400);
      }
      if (!gatePassData.reason) {
        throw new AppError('Reason is required', 400);
      }
      if (!gatePassData.companyId) {
        throw new AppError('Company ID is required', 400);
      }

      // Check if there's already an active gate pass for this vehicle
      const existingActiveGatePass = await this.findOne({
        vehicleNumber: gatePassData.vehicleNumber.toUpperCase(),
        companyId: gatePassData.companyId,
        status: 'active',
        isActive: true
      });

      if (existingActiveGatePass) {
        throw new AppError('Vehicle already has an active gate pass', 400);
      }

      const createData: any = {
        ...gatePassData,
        vehicleNumber: gatePassData.vehicleNumber.toUpperCase(),
        companyId: this.validateObjectId(gatePassData.companyId) as any,
        status: 'active' as const,
        timeIn: new Date(),
        isActive: true
      };
      if (gatePassData.vehicleId) {
        createData.vehicleId = this.validateObjectId(gatePassData.vehicleId);
      }
      if (gatePassData.dispatchId) createData.dispatchId = this.validateObjectId(gatePassData.dispatchId);
      if (gatePassData.invoiceId) createData.invoiceId = this.validateObjectId(gatePassData.invoiceId);
      if (gatePassData.jobWorkChallanId) createData.jobWorkChallanId = this.validateObjectId(gatePassData.jobWorkChallanId);
      
      const gatePass = await this.create(createData, createdBy);

      logger.info('Gate pass created successfully', {
        gatePassId: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        vehicleNumber: gatePass.vehicleNumber,
        purpose: gatePass.purpose,
        companyId: gatePassData.companyId,
        createdBy
      });

      return gatePass;
    } catch (error) {
      logger.error('Error creating gate pass', { 
        error: error.message || error, 
        stack: error.stack,
        gatePassData, 
        createdBy 
      });
      throw error;
    }
  }

  /**
   * Get gate passes by company with pagination and filters
   */
  async getGatePassesByCompany(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      purpose?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    data: IGatePass[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        purpose,
        dateFrom,
        dateTo,
        sortBy = 'timeIn',
        sortOrder = 'desc'
      } = options;

      // Build filter query
      const filter: any = {
        companyId: companyId as any,
        isActive: true
      };

      if (search) {
        filter.$or = [
          { gatePassNumber: { $regex: search, $options: 'i' } },
          { vehicleNumber: { $regex: search, $options: 'i' } },
          { driverName: { $regex: search, $options: 'i' } },
          { reason: { $regex: search, $options: 'i' } },
          { personToMeet: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (purpose) {
        filter.purpose = purpose;
      }

      if (dateFrom || dateTo) {
        filter.timeIn = {};
        if (dateFrom) {
          filter.timeIn.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          filter.timeIn.$lte = new Date(dateTo);
        }
      }

      // Build sort query
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.findManyWithPopulate(filter, { skip, limit, sort }),
        this.count(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting gate passes by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get gate pass by number
   */
  async getGatePassByNumber(gatePassNumber: string, companyId: string): Promise<IGatePass | null> {
    try {
      const gatePass = await this.model.findOne({
        gatePassNumber: gatePassNumber.toUpperCase(),
        companyId: companyId as any,
        isActive: true
      })
      .populate('vehicleId', 'vehicleNumber driverName driverPhone')
      .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('printedBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('approvedBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('companyId', 'companyName companyCode')
      .exec();

      return gatePass;
    } catch (error) {
      logger.error('Error getting gate pass by number', { error, gatePassNumber, companyId });
      throw error;
    }
  }

  /**
   * Complete gate pass (checkout)
   */
  async completeGatePass(gatePassId: string, completedBy?: string): Promise<IGatePass | null> {
    try {
      const gatePass = await this.findById(gatePassId);
      
      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      if (gatePass.status !== 'active') {
        throw new AppError('Gate pass is not active', 400);
      }

      gatePass.status = 'completed';
      gatePass.timeOut = new Date();
      
      if (completedBy) {
        gatePass.approvedBy = this.validateObjectId(completedBy) as any;
        gatePass.approvedAt = new Date();
      }

      await gatePass.save();

      logger.info('Gate pass completed successfully', {
        gatePassId: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        completedBy
      });

      return gatePass;
    } catch (error) {
      logger.error('Error completing gate pass', { error, gatePassId, completedBy });
      throw error;
    }
  }

  /**
   * Mark gate pass OUT at gate (spec: Security workflow - Create → Approved/Printed → Marked OUT at Gate)
   */
  async markOutAtGate(gatePassId: string, markedBy?: string): Promise<IGatePass | null> {
    try {
      const gatePass = await this.findById(gatePassId);
      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }
      if (['completed', 'cancelled', 'out_at_gate'].includes(gatePass.status)) {
        throw new AppError('Gate pass is already closed or out', 400);
      }
      (gatePass as any).status = 'out_at_gate';
      (gatePass as any).gateOutAt = new Date();
      gatePass.timeOut = new Date();
      await gatePass.save();
      logger.info('Gate pass marked OUT at gate', { gatePassId, gatePassNumber: gatePass.gatePassNumber, markedBy });
      return gatePass;
    } catch (error) {
      logger.error('Error marking gate pass out', { error, gatePassId });
      throw error;
    }
  }

  /**
   * Cancel gate pass
   */
  async cancelGatePass(gatePassId: string, cancelledBy?: string): Promise<IGatePass | null> {
    try {
      const gatePass = await this.findById(gatePassId);
      
      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      if (gatePass.status !== 'active') {
        throw new AppError('Gate pass is not active', 400);
      }

      gatePass.status = 'cancelled';
      
      if (cancelledBy) {
        gatePass.approvedBy = this.validateObjectId(cancelledBy) as any;
        gatePass.approvedAt = new Date();
      }

      await gatePass.save();

      logger.info('Gate pass cancelled successfully', {
        gatePassId: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        cancelledBy
      });

      return gatePass;
    } catch (error) {
      logger.error('Error cancelling gate pass', { error, gatePassId, cancelledBy });
      throw error;
    }
  }

  /**
   * Print gate pass
   */
  async printGatePass(gatePassId: string, printedBy: string): Promise<IGatePass | null> {
    try {
      const gatePass = await this.findById(gatePassId);
      
      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      gatePass.printedAt = new Date();
      gatePass.printedBy = this.validateObjectId(printedBy) as any;

      await gatePass.save();

      logger.info('Gate pass printed successfully', {
        gatePassId: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        printedBy
      });

      return gatePass;
    } catch (error) {
      logger.error('Error printing gate pass', { error, gatePassId, printedBy });
      throw error;
    }
  }

  /**
   * Get gate pass statistics
   */
  async getGatePassStats(companyId: string, dateFrom?: string, dateTo?: string): Promise<GatePassStats> {
    try {
      logger.info('Getting gate pass stats', { companyId, dateFrom, dateTo });
      
      const matchFilter: any = {
        companyId: new Types.ObjectId(companyId),
        isActive: true
      };

      if (dateFrom || dateTo) {
        matchFilter.timeIn = {};
        if (dateFrom) {
          matchFilter.timeIn.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          matchFilter.timeIn.$lte = new Date(dateTo);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      logger.info('Match filter for stats', { matchFilter });

      // Execute queries one by one to identify which one fails
      const totalGatePasses = await this.count(matchFilter);
      const activeGatePasses = await this.count({ ...matchFilter, status: 'active' });
      const completedGatePasses = await this.count({ ...matchFilter, status: 'completed' });
      const expiredGatePasses = await this.count({ ...matchFilter, status: 'expired' });
      const cancelledGatePasses = await this.count({ ...matchFilter, status: 'cancelled' });
      const todayGatePasses = await this.count({
        ...matchFilter,
        timeIn: { $gte: today, $lt: tomorrow }
      });

      logger.info('Basic counts completed', { 
        totalGatePasses, 
        activeGatePasses, 
        completedGatePasses, 
        expiredGatePasses, 
        cancelledGatePasses, 
        todayGatePasses 
      });

      // Purpose breakdown aggregation
      let purposeBreakdown = [];
      try {
        purposeBreakdown = await this.aggregate([
          { $match: matchFilter },
          {
            $group: {
              _id: '$purpose',
              count: { $sum: 1 }
            }
          }
        ]);
        logger.info('Purpose breakdown completed', { purposeBreakdown });
      } catch (error) {
        logger.error('Error in purpose breakdown aggregation', { error, matchFilter });
        throw error;
      }

      // Average duration aggregation
      let averageDuration = [];
      try {
        averageDuration = await this.aggregate([
          { $match: { ...matchFilter, status: 'completed', timeOut: { $exists: true } } },
          {
            $group: {
              _id: null,
              averageDuration: {
                $avg: {
                  $divide: [{ $subtract: ['$timeOut', '$timeIn'] }, 60000] // Convert to minutes
                }
              }
            }
          }
        ]);
        logger.info('Average duration completed', { averageDuration });
      } catch (error) {
        logger.error('Error in average duration aggregation', { error, matchFilter });
        throw error;
      }

      const purposeStats = {
        delivery: 0,
        pickup: 0,
        maintenance: 0,
        other: 0
      };

      purposeBreakdown.forEach((item: any) => {
        purposeStats[item._id as keyof typeof purposeStats] = item.count;
      });

      return {
        totalGatePasses,
        activeGatePasses,
        completedGatePasses,
        expiredGatePasses,
        cancelledGatePasses,
        averageDuration: averageDuration[0]?.averageDuration || 0,
        todayGatePasses,
        purposeBreakdown: purposeStats
      };
    } catch (error) {
      logger.error('Error getting gate pass statistics', { error, companyId, dateFrom, dateTo });
      throw error;
    }
  }

  /**
   * Get active gate passes
   */
  async getActiveGatePasses(companyId: string): Promise<IGatePass[]> {
    try {
      return await this.model.find({
        companyId: companyId as any,
        status: 'active',
        isActive: true
      })
      .sort({ timeIn: -1 })
      .populate('vehicleId', 'vehicleNumber driverName driverPhone')
      .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('companyId', 'companyName companyCode')
      .exec();
    } catch (error) {
      logger.error('Error getting active gate passes', { error, companyId });
      throw error;
    }
  }

  /**
   * Get gate pass history for a vehicle
   */
  async getVehicleGatePassHistory(vehicleNumber: string, companyId: string): Promise<IGatePass[]> {
    try {
      return await this.model.find({
        vehicleNumber: vehicleNumber.toUpperCase(),
        companyId: companyId as any,
        isActive: true
      })
      .sort({ timeIn: -1 })
      .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('printedBy', 'username email personalInfo.firstName personalInfo.lastName')
      .populate('approvedBy', 'username email personalInfo.firstName personalInfo.lastName')
      .exec();
    } catch (error) {
      logger.error('Error getting vehicle gate pass history', { error, vehicleNumber, companyId });
      throw error;
    }
  }
}
