import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ElectricityMonitoringService } from '../services/ElectricityMonitoringService';
import { IElectricityMonitoring } from '../types/models';

export class ElectricityMonitoringController extends BaseController<IElectricityMonitoring> {
  private electricityMonitoringService: ElectricityMonitoringService;

  constructor() {
    const electricityMonitoringService = new ElectricityMonitoringService();
    super(electricityMonitoringService, 'ElectricityMonitoring');
    this.electricityMonitoringService = electricityMonitoringService;
  }

  /**
   * Create a new electricity monitoring entry
   */
  async createMonitoringEntry(req: Request, res: Response): Promise<void> {
    try {
      const monitoringData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const monitoring = await this.electricityMonitoringService.createMonitoringSystem(monitoringData, createdBy);

      this.sendSuccess(res, monitoring, 'Electricity monitoring entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create electricity monitoring entry');
    }
  }

  /**
   * Get monitoring data by company
   */
  async getMonitoringByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, meterNumber, sourceType, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (meterNumber) {
        options.meterNumber = meterNumber;
      }

      if (sourceType) {
        options.sourceType = sourceType;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const monitoring = await this.electricityMonitoringService.getMonitoringByCompany(companyId.toString(), options);

      this.sendSuccess(res, monitoring, 'Electricity monitoring data retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get electricity monitoring data');
    }
  }

  /**
   * Get consumption statistics
   */
  async getConsumptionStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.electricityMonitoringService.getConsumptionStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Consumption statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get consumption statistics');
    }
  }

  /**
   * Get solar vs PGVCL comparison
   */
  async getSolarVsPGVCLComparison(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!startDate || !endDate) {
        this.sendError(res, new Error('Start date and end date are required'), 'Date range is required', 400);
        return;
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const comparison = await this.electricityMonitoringService.getEnergySourceComparison(companyId.toString(), dateRange);

      this.sendSuccess(res, comparison, 'Solar vs PGVCL comparison retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get solar vs PGVCL comparison');
    }
  }

  /**
   * Get monitoring entry by ID
   */
  async getMonitoringById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const monitoring = await this.electricityMonitoringService.findById(id);

      if (!monitoring) {
        this.sendError(res, new Error('Monitoring entry not found'), 'Monitoring entry not found', 404);
        return;
      }

      this.sendSuccess(res, monitoring, 'Monitoring entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get monitoring entry');
    }
  }
}
