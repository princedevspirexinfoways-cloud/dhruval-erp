import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import Vehicle from '../models/Vehicle';
import type { ISimpleVehicle } from '../models/Vehicle';

import { logger } from '../utils/logger';
import { AppError } from '@/utils/errors';

export class VehicleService extends BaseService<ISimpleVehicle> {
  constructor() {
    super(Vehicle);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<any> {
    try {
      return await Vehicle.findById(id)
        .populate('createdBy', 'username email')
        .populate('companyId', 'name')
        .lean();
    } catch (error) {
      logger.error('Error finding vehicle by ID', { error, id });
      throw error;
    }
  }

  /**
   * Create new vehicle
   */
  async create(data: any): Promise<any> {
    try {
      const vehicle = new Vehicle(data);
      return await vehicle.save();
    } catch (error) {
      logger.error('Error creating vehicle', { error, data });
      throw error;
    }
  }

  /**
   * Update vehicle
   */
  async update(id: string, data: any, updatedBy?: string): Promise<any> {
    try {
      // Ensure both status and currentStatus are updated when status changes
      const updateData = { ...data, lastModifiedBy: updatedBy };
      if (data.status) {
        updateData.currentStatus = data.status;
      }
      
      return await Vehicle.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      logger.error('Error updating vehicle', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete vehicle
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Vehicle.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting vehicle', { error, id });
      throw error;
    }
  }

  /**
   * Find many vehicles
   */
  async findMany(query: any, options?: any): Promise<any[]> {
    try {
      return await Vehicle.find(query)
        .populate('createdBy', 'username email')
        .populate('companyId', 'name')
        .sort(options?.sort || { createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Error finding vehicles', { error, query });
      throw error;
    }
  }

  /**
   * Find one vehicle
   */
  async findOne(query: any): Promise<any> {
    try {
      return await Vehicle.findOne(query)
        .populate('createdBy', 'username email')
        .populate('companyId', 'name')
        .lean();
    } catch (error) {
      logger.error('Error finding vehicle', { error, query });
      throw error;
    }
  }

  /**
   * Count vehicles
   */
  async count(query: any): Promise<number> {
    try {
      return await Vehicle.countDocuments(query);
    } catch (error) {
      logger.error('Error counting vehicles', { error, query });
      throw error;
    }
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(vehicleData: Partial<ISimpleVehicle>, createdBy?: string): Promise<ISimpleVehicle> {
    try {
      // Validate required fields
      if (!vehicleData.vehicleNumber) {
        throw new AppError('Vehicle number is required', 400);
      }
      if (!vehicleData.driverName) {
        throw new AppError('Driver name is required', 400);
      }
      if (!vehicleData.driverPhone) {
        throw new AppError('Driver phone is required', 400);
      }
      if (!vehicleData.purpose) {
        throw new AppError('Purpose is required', 400);
      }
      if (!vehicleData.reason) {
        throw new AppError('Reason is required', 400);
      }
      if (!vehicleData.companyId) {
        throw new AppError('Company ID is required', 400);
      }

      // Check if vehicle number already exists
      const existingVehicle = await this.findOne({
        vehicleNumber: vehicleData.vehicleNumber?.toUpperCase(),
        companyId: vehicleData.companyId
      });

      if (existingVehicle) {
        throw new AppError('Vehicle number already exists', 400);
      }

      const vehicleDataWithDefaults = {
        ...vehicleData,
        vehicleNumber: vehicleData.vehicleNumber?.toUpperCase(),
        status: 'in',
        timeIn: new Date()
      };
      
      // Create vehicle using the model directly to avoid TypeScript issues
      const vehicle = new Vehicle({
        ...vehicleDataWithDefaults,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      });
      
      const savedVehicle = await vehicle.save();

      logger.info('Vehicle created successfully', {
        vehicleId: savedVehicle._id,
        vehicleNumber: savedVehicle.vehicleNumber,
        purpose: savedVehicle.purpose,
        companyId: vehicleData.companyId,
        createdBy
      });

      return savedVehicle;
    } catch (error) {
      logger.error('Error creating vehicle', { error, vehicleData, createdBy });
      throw error;
    }
  }

  /**
   * Get vehicle by number
   */
  async getVehicleByNumber(vehicleNumber: string, companyId: string): Promise<ISimpleVehicle | null> {
    try {
      return await this.findOne({
        vehicleNumber: vehicleNumber.toUpperCase(),
        companyId: new Types.ObjectId(companyId)
      });
    } catch (error) {
      logger.error('Error getting vehicle by number', { error, vehicleNumber, companyId });
      throw error;
    }
  }

  /**
   * Get vehicles by company
   */
  async getVehiclesByCompany(companyId: string, options: any = {}): Promise<ISimpleVehicle[]> {
    try {
      // Build the base query
      const baseQuery: any = {
        companyId: new Types.ObjectId(companyId)
      };

      // Add status filtering if provided
      if (options.status) {
        baseQuery.status = options.status;
      }

      // Add search filtering if provided
      if (options.search) {
        baseQuery.$or = [
          { vehicleNumber: { $regex: options.search, $options: 'i' } },
          { driverName: { $regex: options.search, $options: 'i' } },
          { driverPhone: { $regex: options.search, $options: 'i' } }
        ];
      }

      // Handle date filtering separately to avoid serialization issues
      let finalQuery = { ...baseQuery };
      
      if (options.dateFrom || options.dateTo) {
        // Create the date filter object directly without intermediate variables
        finalQuery.timeIn = {};
        if (options.dateFrom) {
          finalQuery.timeIn.$gte = new Date(options.dateFrom);
        }
        if (options.dateTo) {
          finalQuery.timeIn.$lt = new Date(options.dateTo);
        }
      }

      logger.info('Vehicle query constructed', { 
        query: JSON.stringify(finalQuery, null, 2), 
        options
      });

      // Handle pagination
      const queryOptions: any = {};
      if (options.sort) {
        queryOptions.sort = options.sort;
      }
      if (options.skip) {
        queryOptions.skip = options.skip;
      }
      if (options.limit) {
        queryOptions.limit = options.limit;
      }

      // Debug: Log the exact query object before passing to findMany
      logger.info('About to execute query', { 
        queryType: typeof finalQuery,
        queryIsArray: Array.isArray(finalQuery),
        queryKeys: Object.keys(finalQuery),
        timeInType: typeof finalQuery.timeIn,
        timeInValue: finalQuery.timeIn
      });

      // Use aggregation pipeline for date filtering to avoid casting issues
      if (options.dateFrom || options.dateTo) {
        const pipeline: any[] = [
          { $match: finalQuery }
        ];
        
        // Add pagination
        if (queryOptions.skip) {
          pipeline.push({ $skip: queryOptions.skip });
        }
        if (queryOptions.limit) {
          pipeline.push({ $limit: queryOptions.limit });
        }
        if (queryOptions.sort) {
          pipeline.push({ $sort: queryOptions.sort });
        }
        
        // Add population for createdBy and companyId
        pipeline.push(
          { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' } },
          { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'companyId' } },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          { $unwind: { path: '$companyId', preserveNullAndEmptyArrays: true } }
        );
        
        logger.info('Using aggregation pipeline for date filtering');
        return await Vehicle.aggregate(pipeline);
      } else {
        return await this.findMany(finalQuery, queryOptions);
      }
    } catch (error) {
      logger.error('Error getting vehicles by company', { error, companyId, options });
      throw error;
    }
  }



  /**
   * Get vehicles by purpose
   */
  async getVehiclesByPurpose(companyId: string, purpose: string): Promise<ISimpleVehicle[]> {
    try {
      return await this.findMany({
        companyId: new Types.ObjectId(companyId),
        purpose
      });
    } catch (error) {
      logger.error('Error getting vehicles by purpose', { error, companyId, purpose });
      throw error;
    }
  }

  /**
   * Checkout vehicle (mark as out)
   */
  async checkoutVehicle(vehicleId: string, updatedBy?: string): Promise<ISimpleVehicle | null> {
    try {
      const vehicle = await this.findById(vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      if (vehicle.status === 'out') {
        throw new AppError('Vehicle is already checked out', 400);
      }

      const updatedVehicle = await this.update(vehicleId, {
        status: 'out',
        currentStatus: 'out',
        timeOut: new Date()
      }, updatedBy);

      logger.info('Vehicle checked out', {
        vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        updatedBy
      });

      return updatedVehicle;
    } catch (error) {
      logger.error('Error checking out vehicle', { error, vehicleId, updatedBy });
      throw error;
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(
    vehicleId: string, 
    status: string,
    updatedBy?: string
  ): Promise<ISimpleVehicle | null> {
    try {
      const vehicle = await this.findById(vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      const validStatuses = ['active', 'maintenance', 'out_of_service', 'deleted'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid vehicle status', 400);
      }

      const updatedVehicle = await this.update(vehicleId, {
        status,
        lastStatusUpdate: new Date()
      }, updatedBy);

      logger.info('Vehicle status updated', { 
        vehicleId, 
        oldStatus: vehicle.currentStatus,
        newStatus: status,
        updatedBy 
      });

      return updatedVehicle;
    } catch (error) {
      logger.error('Error updating vehicle status', { error, vehicleId, status, updatedBy });
      throw error;
    }
  }

  /**
   * Add maintenance record
   */
  async addMaintenanceRecord(
    vehicleId: string, 
    maintenanceData: any,
    addedBy?: string
  ): Promise<ISimpleVehicle | null> {
    try {
      const vehicle = await this.findById(vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      const maintenanceRecord = {
        ...maintenanceData,
        maintenanceId: new Types.ObjectId(),
        recordedAt: new Date(),
        recordedBy: addedBy ? new Types.ObjectId(addedBy) : undefined
      };

      const updatedVehicle = await this.update(vehicleId, {
        $push: { maintenanceHistory: maintenanceRecord },
        lastMaintenanceDate: maintenanceData.maintenanceDate || new Date()
      }, addedBy);

      logger.info('Maintenance record added to vehicle', { 
        vehicleId, 
        maintenanceType: maintenanceData.maintenanceType,
        addedBy 
      });

      return updatedVehicle;
    } catch (error) {
      logger.error('Error adding maintenance record', { error, vehicleId, maintenanceData, addedBy });
      throw error;
    }
  }

  /**
   * Get vehicles due for maintenance
   */
  async getVehiclesDueForMaintenance(companyId: string): Promise<ISimpleVehicle[]> {
    try {
      const today = new Date();
      const query = { 
        companyId: new Types.ObjectId(companyId),
        status: 'active',
        $or: [
          { nextMaintenanceDate: { $lte: today } },
          { 'insurance.expiryDate': { $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) } }, // 30 days
          { 'registration.expiryDate': { $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) } }
        ]
      };

      return await this.findMany(query, { sort: { nextMaintenanceDate: 1 } });
    } catch (error) {
      logger.error('Error getting vehicles due for maintenance', { error, companyId });
      throw error;
    }
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(companyId: string): Promise<any> {
    try {
      const [
        totalVehicles,
        vehiclesByStatus,
        vehiclesByType,
        maintenanceDue,
        insuranceExpiring,
        registrationExpiring
      ] = await Promise.all([
        this.count({ companyId: new Types.ObjectId(companyId), status: { $ne: 'deleted' } }),
        Vehicle.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), status: { $ne: 'deleted' } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Vehicle.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), status: 'active' } },
          { $group: { _id: '$vehicleType', count: { $sum: 1 } } }
        ]),
        this.count({
          companyId: new Types.ObjectId(companyId),
          status: 'active',
          nextMaintenanceDate: { $lte: new Date() }
        }),
        this.count({
          companyId: new Types.ObjectId(companyId),
          status: 'active',
          'insurance.expiryDate': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        }),
        this.count({
          companyId: new Types.ObjectId(companyId),
          status: 'active',
          'registration.expiryDate': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalVehicles,
        vehiclesByStatus,
        vehiclesByType,
        maintenanceDue,
        insuranceExpiring,
        registrationExpiring
      };
    } catch (error) {
      logger.error('Error getting vehicle statistics', { error, companyId });
      throw error;
    }
  }



  /**
   * Get vehicle maintenance history
   */
  async getMaintenanceHistory(vehicleId: string): Promise<any[]> {
    try {
      const vehicle = await this.findById(vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      return []; // Return empty array as maintenance history is not stored as array in this interface
    } catch (error) {
      logger.error('Error getting vehicle maintenance history', { error, vehicleId });
      throw error;
    }
  }

  /**
   * Validate vehicle data
   */
  private validateVehicleData(vehicleData: Partial<ISimpleVehicle>): void {
    if (!vehicleData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!vehicleData.vehicleNumber) {
      throw new AppError('Vehicle number is required', 400);
    }

    if (!vehicleData.driverName) {
      throw new AppError('Driver name is required', 400);
    }

    if (!vehicleData.driverPhone) {
      throw new AppError('Driver phone is required', 400);
    }

    const validPurposes = ['delivery', 'pickup', 'maintenance', 'other'];
    if (vehicleData.purpose && !validPurposes.includes(vehicleData.purpose)) {
      throw new AppError('Invalid vehicle purpose', 400);
    }
  }

  /**
   * Get vehicles by type
   */
  async getVehiclesByType(companyId: string, vehicleType: string): Promise<any[]> {
    try {
      return await Vehicle.find({
        companyId: new Types.ObjectId(companyId),
        purpose: vehicleType
      })
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Error getting vehicles by type', { error, companyId, vehicleType });
      throw error;
    }
  }
}
