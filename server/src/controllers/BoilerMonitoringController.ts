import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { BoilerMonitoringService } from '../services/BoilerMonitoringService';
import { IBoilerMonitoring } from '../types/models';

export class BoilerMonitoringController extends BaseController<IBoilerMonitoring> {
  private boilerMonitoringService: BoilerMonitoringService;

  constructor() {
    const boilerMonitoringService = new BoilerMonitoringService();
    super(boilerMonitoringService, 'BoilerMonitoring');
    this.boilerMonitoringService = boilerMonitoringService;
  }

  /**
   * Create a new boiler monitoring entry
   */
  async createMonitoringEntry(req: Request, res: Response): Promise<void> {
    try {
      const monitoringData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const monitoring = await this.boilerMonitoringService.createBoilerMonitoring(monitoringData, createdBy);

      this.sendSuccess(res, monitoring, 'Boiler monitoring entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create boiler monitoring entry');
    }
  }

  /**
   * Get monitoring data by company
   */
  async getMonitoringByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, boilerId, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (boilerId) {
        options.boilerId = boilerId;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const monitoring = await this.boilerMonitoringService.getMonitoringByCompany(companyId.toString(), options);

      this.sendSuccess(res, monitoring, 'Boiler monitoring data retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get boiler monitoring data');
    }
  }

  /**
   * Get temperature alerts
   */
  async getTemperatureAlerts(req: Request, res: Response): Promise<void> {
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

      const alerts = await this.boilerMonitoringService.getBoilerAlerts(companyId.toString(), dateRange);

      this.sendSuccess(res, alerts, 'Temperature alerts retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get temperature alerts');
    }
  }

  /**
   * Get boiler statistics
   */
  async getBoilerStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { boilerId, startDate, endDate } = req.query;

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

      const stats = await this.boilerMonitoringService.getBoilerStats(
        companyId.toString(), 
        boilerId as string, 
        dateRange
      );

      this.sendSuccess(res, stats, 'Boiler statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get boiler statistics');
    }
  }

  /**
   * Get monitoring entry by ID
   */
  async getMonitoringById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const monitoring = await this.boilerMonitoringService.findById(id);

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
