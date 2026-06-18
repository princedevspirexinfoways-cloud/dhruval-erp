import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SalesAnalyticsService } from '../services/SalesAnalyticsService';

export class SalesAnalyticsController {
  private salesAnalyticsService: SalesAnalyticsService;

  constructor() {
    this.salesAnalyticsService = new SalesAnalyticsService();
  }

  protected sendSuccess(res: Response, data: any, message: string = 'Operation successful', statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected sendError(res: Response, error: any, message: string = 'Operation failed', statusCode: number = 500): void {
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }

  async getCustomerSalesAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        customerId,
        productId,
        status,
        groupBy = 'customer',
        sortBy = 'revenue',
        sortOrder = 'desc'
      } = req.query;

      const result = await this.salesAnalyticsService.getCustomerSalesAnalytics({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        customerId: customerId as string,
        productId: productId as string,
        status: status as string,
        groupBy: groupBy as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getCustomerSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        customerId,
        productId,
        status,
        groupBy = 'customer',
        sortBy = 'revenue',
        sortOrder = 'desc',
        includeDetails = false,
        page = 1,
        limit = 50
      } = req.query;

      const result = await this.salesAnalyticsService.getCustomerSalesReport({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        customerId: customerId as string,
        productId: productId as string,
        status: status as string,
        groupBy: groupBy as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeDetails: includeDetails === 'true',
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async exportCustomerSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        format = 'pdf',
        timeRange = '30d',
        startDate,
        endDate,
        companyId,
        customerId,
        productId,
        status,
        groupBy = 'customer',
        sortBy = 'revenue',
        sortOrder = 'desc',
        includeDetails = false
      } = req.body;

      const result = await this.salesAnalyticsService.exportCustomerSalesReport({
        format: format as 'pdf' | 'excel' | 'csv',
        timeRange,
        startDate,
        endDate,
        companyId,
        customerId,
        productId,
        status,
        groupBy,
        sortBy,
        sortOrder,
        includeDetails
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getProductSalesPerformance(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        category,
        groupBy = 'product'
      } = req.query;

      const result = await this.salesAnalyticsService.getProductSalesPerformance({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        groupBy: groupBy as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getCategorySalesPerformance(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        groupBy = 'category'
      } = req.query;

      const result = await this.salesAnalyticsService.getCategorySalesPerformance({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getSalesTrends(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        granularity = 'daily',
        includeForecast = false
      } = req.query;

      const result = await this.salesAnalyticsService.getSalesTrends({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        granularity: granularity as 'daily' | 'weekly' | 'monthly',
        includeForecast: includeForecast === 'true'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getCustomerSegmentation(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        timeRange = '30d',
        segmentationType = 'revenue'
      } = req.query;

      const result = await this.salesAnalyticsService.getCustomerSegmentation({
        companyId: companyId as string,
        timeRange: timeRange as string,
        segmentationType: segmentationType as 'revenue' | 'frequency' | 'recency' | 'value'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getSalesTeamPerformance(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        timeRange = '30d',
        startDate,
        endDate,
        teamMemberId
      } = req.query;

      const result = await this.salesAnalyticsService.getSalesTeamPerformance({
        companyId: companyId as string,
        timeRange: timeRange as string,
        startDate: startDate as string,
        endDate: endDate as string,
        teamMemberId: teamMemberId as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
