import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { VehicleService } from '../services/VehicleService';

// Simplified Vehicle interface for gate pass system
interface ISimpleVehicle {
  _id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  purpose: 'delivery' | 'pickup' | 'maintenance' | 'other';
  reason: string;
  timeIn: Date;
  timeOut?: Date;
  status: 'in' | 'out' | 'pending';
  gatePassNumber?: string;
  images?: string[];
  companyId: any;
  createdBy: any;
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  // Helper methods for responses
  private sendSuccess(res: Response, data: any, message: string, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  private sendError(res: Response, error: any, message: string, statusCode: number = 500): void {
    res.status(statusCode).json({
      success: false,
      message,
      error: error.message || error
    });
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const vehicle = await this.vehicleService.createVehicle(vehicleData, createdBy);

      this.sendSuccess(res, vehicle, 'Vehicle created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create vehicle');
    }
  }

  /**
   * Get vehicle by number
   */
  async getVehicleByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const vehicle = await this.vehicleService.getVehicleByNumber(vehicleNumber, companyId.toString());

      if (!vehicle) {
        this.sendError(res, new Error('Vehicle not found'), 'Vehicle not found', 404);
        return;
      }

      this.sendSuccess(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicle');
    }
  }

  /**
   * Get vehicles by company
   */
  async getVehiclesByCompany(req: Request, res: Response): Promise<void> {
    try {
      // Get companyId from query parameter or user context
      let companyId = req.query.companyId as string || req.user?.companyId;
      const { page = 1, limit = 10, search, vehicleType, status, dateFrom, dateTo } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const options: any = {
        skip,
        limit: limitNum
      };

      if (search) {
        options.search = search;
      }

      if (vehicleType) {
        options.vehicleType = vehicleType;
      }

      if (status) {
        options.status = status;
      }

      if (dateFrom) {
        options.dateFrom = dateFrom;
      }

      if (dateTo) {
        options.dateTo = dateTo;
      }

      const vehicles = await this.vehicleService.getVehiclesByCompany(companyId.toString(), options);

      // Transform the data to match frontend expectations
      const transformedData = vehicles.map(vehicle => {
        const vehicleObj = typeof vehicle.toObject === 'function' ? vehicle.toObject() : vehicle;
        
        // Map status values to frontend expectations
        let status = vehicleObj.status;
        if (vehicleObj.currentStatus) {
          // Map currentStatus values to status values
          const statusMap: { [key: string]: string } = {
            'in': 'in',
            'out': 'out',
            'pending': 'pending'
          };
          status = statusMap[vehicleObj.currentStatus] || vehicleObj.currentStatus;
        }
        
        return {
          ...vehicleObj,
          status, // Use mapped status
          companyId: typeof vehicleObj.companyId === 'object' ? vehicleObj.companyId._id : vehicleObj.companyId,
          createdBy: typeof vehicleObj.createdBy === 'object' ? vehicleObj.createdBy._id : vehicleObj.createdBy,
        };
      });

      // Calculate pagination info
      const total = vehicles.length;
      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        data: transformedData,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicles');
    }
  }

  /**
   * Get vehicles by type
   */
  async getVehiclesByType(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleType } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const vehicles = await this.vehicleService.getVehiclesByType(companyId.toString(), vehicleType);

      this.sendSuccess(res, vehicles, 'Vehicles retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicles');
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const vehicle = await this.vehicleService.updateVehicleStatus(vehicleId, status, updatedBy);

      this.sendSuccess(res, vehicle, 'Vehicle status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update vehicle status');
    }
  }

  /**
   * Add maintenance record
   */
  async addMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const maintenanceData = req.body;
      const addedBy = (req.user?.userId || req.user?._id)?.toString();

      const vehicle = await this.vehicleService.addMaintenanceRecord(vehicleId, maintenanceData, addedBy);

      this.sendSuccess(res, vehicle, 'Maintenance record added successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to add maintenance record');
    }
  }

  /**
   * Get vehicles due for maintenance
   */
  async getVehiclesDueForMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const vehicles = await this.vehicleService.getVehiclesDueForMaintenance(companyId.toString());

      this.sendSuccess(res, vehicles, 'Vehicles due for maintenance retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicles due for maintenance');
    }
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.vehicleService.getVehicleStats(companyId.toString());

      this.sendSuccess(res, stats, 'Vehicle statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicle statistics');
    }
  }

  /**
   * Get maintenance history
   */
  async getMaintenanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;

      const history = await this.vehicleService.getMaintenanceHistory(vehicleId);

      this.sendSuccess(res, history, 'Maintenance history retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get maintenance history');
    }
  }

  /**
   * Update vehicle
   */
  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const vehicle = await this.vehicleService.update(id, updateData, updatedBy);

      if (!vehicle) {
        this.sendError(res, new Error('Vehicle not found'), 'Vehicle not found', 404);
        return;
      }

      this.sendSuccess(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update vehicle');
    }
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vehicle = await this.vehicleService.findById(id);

      if (!vehicle) {
        this.sendError(res, new Error('Vehicle not found'), 'Vehicle not found', 404);
        return;
      }

      this.sendSuccess(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicle');
    }
  }

  /**
   * Checkout vehicle
   */
  async checkoutVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const vehicle = await this.vehicleService.checkoutVehicle(id, updatedBy);

      if (!vehicle) {
        this.sendError(res, new Error('Vehicle not found'), 'Vehicle not found', 404);
        return;
      }

      this.sendSuccess(res, vehicle, 'Vehicle checked out successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to checkout vehicle');
    }
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.vehicleService.delete(id);

      if (!deleted) {
        this.sendError(res, new Error('Vehicle not found'), 'Vehicle not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Vehicle deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete vehicle');
    }
  }

  /**
   * Search vehicles
   */
  async searchVehicles(req: Request, res: Response): Promise<void> {
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

      const vehicles = await this.vehicleService.findMany({
        companyId,
        $or: [
          { vehicleNumber: { $regex: searchTerm, $options: 'i' } },
          { 'vehicleInfo.make': { $regex: searchTerm, $options: 'i' } },
          { 'vehicleInfo.model': { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, vehicles, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search vehicles');
    }
  }
}
