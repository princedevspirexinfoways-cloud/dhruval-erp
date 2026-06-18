import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { BusinessAnalyticsService } from '../services/BusinessAnalyticsService';
import { IBusinessAnalytics } from '../types/models';

export class BusinessAnalyticsController extends BaseController<IBusinessAnalytics> {
  private businessAnalyticsService: BusinessAnalyticsService;

  constructor() {
    const businessAnalyticsService = new BusinessAnalyticsService();
    super(businessAnalyticsService, 'BusinessAnalytics');
    this.businessAnalyticsService = businessAnalyticsService;
  }

  /**
   * Create a new analytics entry
   */
  async createAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analyticsData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const analytics = await this.businessAnalyticsService.createAnalytics(analyticsData, createdBy);

      this.sendSuccess(res, analytics, 'Business analytics created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create business analytics');
    }
  }

  /**
   * Get analytics by company
   */
  async getAnalyticsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, reportType, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (reportType) {
        options.reportType = reportType;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const analytics = await this.businessAnalyticsService.getAnalyticsByCompany(companyId.toString(), options);

      this.sendSuccess(res, analytics, 'Business analytics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get business analytics');
    }
  }

  /**
   * Generate sales analytics
   */
  async generateSalesAnalytics(req: Request, res: Response): Promise<void> {
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

      const salesAnalytics = await this.businessAnalyticsService.generateSalesAnalytics(companyId.toString(), dateRange);

      this.sendSuccess(res, salesAnalytics, 'Sales analytics generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate sales analytics');
    }
  }

  /**
   * Generate inventory analytics
   */
  async generateInventoryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const inventoryAnalytics = await this.businessAnalyticsService.generateInventoryAnalytics(companyId.toString());

      this.sendSuccess(res, inventoryAnalytics, 'Inventory analytics generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate inventory analytics');
    }
  }

  /**
   * Get analytics by ID
   */
  async getAnalyticsById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const analytics = await this.businessAnalyticsService.findById(id);

      if (!analytics) {
        this.sendError(res, new Error('Analytics not found'), 'Analytics not found', 404);
        return;
      }

      this.sendSuccess(res, analytics, 'Analytics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get analytics');
    }
  }
}
