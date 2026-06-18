import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GatePassService, CreateGatePassRequest } from '../services/GatePassService';

export class GatePassController {
  private gatePassService: GatePassService;

  constructor() {
    this.gatePassService = new GatePassService();
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
   * Create a new gate pass
   */
  async createGatePass(req: Request, res: Response): Promise<void> {
    try {
      const gatePassData: CreateGatePassRequest = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      // Add company ID from user context
      if (!gatePassData.companyId && req.user?.companyId) {
        gatePassData.companyId = req.user.companyId.toString();
      }

      const gatePass = await this.gatePassService.createGatePass(gatePassData, createdBy);

      this.sendSuccess(res, gatePass, 'Gate pass created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create gate pass');
    }
  }

  /**
   * Get gate passes by company
   */
  async getGatePassesByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
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
      } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        purpose: purpose as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.gatePassService.getGatePassesByCompany(companyId.toString(), options);

      // Transform the data to match frontend expectations
      const transformedData = result.data.map(gatePass => {
        const gatePassObj = gatePass.toObject();
        
        // Map status values to frontend expectations
        let status = gatePassObj.status;
        if (gatePassObj.currentStatus) {
          // Map currentStatus values to status values
          const statusMap: { [key: string]: string } = {
            'in': 'active',
            'out': 'completed',
            'cancelled': 'cancelled',
            'expired': 'expired'
          };
          status = statusMap[gatePassObj.currentStatus] || gatePassObj.currentStatus;
        }
        
        return {
          ...gatePassObj,
          status, // Use mapped status
          companyId: typeof gatePassObj.companyId === 'object' ? gatePassObj.companyId._id : gatePassObj.companyId,
          createdBy: typeof gatePassObj.createdBy === 'object' ? gatePassObj.createdBy._id : gatePassObj.createdBy,
          printedBy: typeof gatePassObj.printedBy === 'object' ? gatePassObj.printedBy._id : gatePassObj.printedBy,
          approvedBy: typeof gatePassObj.approvedBy === 'object' ? gatePassObj.approvedBy._id : gatePassObj.approvedBy,
          vehicleId: typeof gatePassObj.vehicleId === 'object' ? gatePassObj.vehicleId._id : gatePassObj.vehicleId,
        };
      });

      res.status(200).json({
        data: transformedData,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get gate passes');
    }
  }

  /**
   * Get gate pass by number
   */
  async getGatePassByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { gatePassNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const gatePass = await this.gatePassService.getGatePassByNumber(gatePassNumber, companyId.toString());

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get gate pass');
    }
  }

  /**
   * Get gate pass by ID
   */
  async getGatePassById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const gatePass = await this.gatePassService.findById(id);

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get gate pass');
    }
  }

  /**
   * Complete gate pass (checkout)
   */
  async completeGatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const completedBy = (req.user?.userId || req.user?._id)?.toString();

      const gatePass = await this.gatePassService.completeGatePass(id, completedBy);

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass completed successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to complete gate pass');
    }
  }

  /**
   * Cancel gate pass
   */
  async cancelGatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cancelledBy = (req.user?.userId || req.user?._id)?.toString();

      const gatePass = await this.gatePassService.cancelGatePass(id, cancelledBy);

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel gate pass');
    }
  }

  /**
   * Print gate pass
   */
  async printGatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const printedBy = (req.user?.userId || req.user?._id)?.toString();

      const gatePass = await this.gatePassService.printGatePass(id, printedBy);

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass printed successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to print gate pass');
    }
  }

  /**
   * Mark gate pass OUT at gate (spec: security workflow)
   */
  async markOutAtGate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const markedBy = (req.user?.userId || req.user?._id)?.toString();
      const gatePass = await this.gatePassService.markOutAtGate(id, markedBy);
      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }
      this.sendSuccess(res, gatePass, 'Gate pass marked OUT at gate');
    } catch (error) {
      this.sendError(res, error, 'Failed to mark gate pass out');
    }
  }

  /**
   * Get gate pass statistics
   */
  async getGatePassStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { dateFrom, dateTo } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.gatePassService.getGatePassStats(
        companyId.toString(),
        dateFrom as string,
        dateTo as string
      );

      this.sendSuccess(res, stats, 'Gate pass statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get gate pass statistics');
    }
  }

  /**
   * Get active gate passes
   */
  async getActiveGatePasses(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const gatePasses = await this.gatePassService.getActiveGatePasses(companyId.toString());

      // Transform the data to match frontend expectations
      const transformedData = gatePasses.map(gatePass => {
        const gatePassObj = gatePass.toObject();
        
        // Map status values to frontend expectations
        let status = gatePassObj.status;
        if (gatePassObj.currentStatus) {
          // Map currentStatus values to status values
          const statusMap: { [key: string]: string } = {
            'in': 'active',
            'out': 'completed',
            'cancelled': 'cancelled',
            'expired': 'expired'
          };
          status = statusMap[gatePassObj.currentStatus] || gatePassObj.currentStatus;
        }
        
        return {
          ...gatePassObj,
          status, // Use mapped status
          companyId: typeof gatePassObj.companyId === 'object' ? gatePassObj.companyId._id : gatePassObj.companyId,
          createdBy: typeof gatePassObj.createdBy === 'object' ? gatePassObj.createdBy._id : gatePassObj.createdBy,
          printedBy: typeof gatePassObj.printedBy === 'object' ? gatePassObj.printedBy._id : gatePassObj.printedBy,
          approvedBy: typeof gatePassObj.approvedBy === 'object' ? gatePassObj.approvedBy._id : gatePassObj.approvedBy,
          vehicleId: typeof gatePassObj.vehicleId === 'object' ? gatePassObj.vehicleId._id : gatePassObj.vehicleId,
        };
      });

      this.sendSuccess(res, transformedData, 'Active gate passes retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get active gate passes');
    }
  }

  /**
   * Get vehicle gate pass history
   */
  async getVehicleGatePassHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const history = await this.gatePassService.getVehicleGatePassHistory(
        vehicleNumber,
        companyId.toString()
      );

      // Transform the data to match frontend expectations
      const transformedData = history.map(gatePass => {
        const gatePassObj = gatePass.toObject();
        
        // Map status values to frontend expectations
        let status = gatePassObj.status;
        if (gatePassObj.currentStatus) {
          // Map currentStatus values to status values
          const statusMap: { [key: string]: string } = {
            'in': 'active',
            'out': 'completed',
            'cancelled': 'cancelled',
            'expired': 'expired'
          };
          status = statusMap[gatePassObj.currentStatus] || gatePassObj.currentStatus;
        }
        
        return {
          ...gatePassObj,
          status, // Use mapped status
          companyId: typeof gatePassObj.companyId === 'object' ? gatePassObj.companyId._id : gatePassObj.companyId,
          createdBy: typeof gatePassObj.createdBy === 'object' ? gatePassObj.createdBy._id : gatePassObj.createdBy,
          printedBy: typeof gatePassObj.printedBy === 'object' ? gatePassObj.printedBy._id : gatePassObj.printedBy,
          approvedBy: typeof gatePassObj.approvedBy === 'object' ? gatePassObj.approvedBy._id : gatePassObj.approvedBy,
          vehicleId: typeof gatePassObj.vehicleId === 'object' ? gatePassObj.vehicleId._id : gatePassObj.vehicleId,
        };
      });

      this.sendSuccess(res, transformedData, 'Vehicle gate pass history retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get vehicle gate pass history');
    }
  }

  /**
   * Update gate pass
   */
  async updateGatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const gatePass = await this.gatePassService.update(id, updateData, updatedBy);

      if (!gatePass) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, gatePass, 'Gate pass updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update gate pass');
    }
  }

  /**
   * Delete gate pass (soft delete)
   */
  async deleteGatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.gatePassService.delete(id);

      if (!deleted) {
        this.sendError(res, new Error('Gate pass not found'), 'Gate pass not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Gate pass deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete gate pass');
    }
  }
}
