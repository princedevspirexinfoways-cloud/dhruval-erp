import { Request, Response } from 'express';
import { PurchaseAnalyticsService } from '../services/PurchaseAnalyticsService';

export class PurchaseAnalyticsController {
  private purchaseAnalyticsService: PurchaseAnalyticsService;

  constructor() {
    this.purchaseAnalyticsService = new PurchaseAnalyticsService();
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

  async getSupplierPurchaseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        supplierId,
        category,
        status,
        groupBy = 'supplier',
        sortBy = 'purchase',
        sortOrder = 'desc'
      } = req.query;

      const result = await this.purchaseAnalyticsService.getSupplierPurchaseAnalytics({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        supplierId: supplierId as string,
        category: category as string,
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

  async getSupplierPurchaseReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        supplierId,
        category,
        status,
        groupBy = 'supplier',
        sortBy = 'purchase',
        sortOrder = 'desc',
        includeDetails = false,
        page = 1,
        limit = 50
      } = req.query;

      const result = await this.purchaseAnalyticsService.getSupplierPurchaseReport({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        supplierId: supplierId as string,
        category: category as string,
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

  async exportSupplierPurchaseReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        format = 'pdf',
        timeRange = '30d',
        startDate,
        endDate,
        companyId,
        supplierId,
        category,
        status,
        groupBy = 'supplier',
        sortBy = 'purchase',
        sortOrder = 'desc',
        includeDetails = false
      } = req.body;

      const result = await this.purchaseAnalyticsService.exportSupplierPurchaseReport({
        format: format as 'pdf' | 'excel' | 'csv',
        timeRange,
        startDate,
        endDate,
        companyId,
        supplierId,
        category,
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

  async getCategoryPurchasePerformance(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        category,
        groupBy = 'category'
      } = req.query;

      const result = await this.purchaseAnalyticsService.getCategoryPurchasePerformance({
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

  async getChemicalsPurchaseTracking(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        chemicalType,
        supplierId
      } = req.query;

      const result = await this.purchaseAnalyticsService.getChemicalsPurchaseTracking({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        chemicalType: chemicalType as string,
        supplierId: supplierId as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getGreyFabricPurchaseTracking(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        fabricType,
        supplierId,
        gsm
      } = req.query;

      const result = await this.purchaseAnalyticsService.getGreyFabricPurchaseTracking({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        fabricType: fabricType as string,
        supplierId: supplierId as string,
        gsm: gsm as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getPackingMaterialPurchaseTracking(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        materialType,
        supplierId
      } = req.query;

      const result = await this.purchaseAnalyticsService.getPackingMaterialPurchaseTracking({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        materialType: materialType as string,
        supplierId: supplierId as string
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getPurchaseTrends(req: Request, res: Response): Promise<void> {
    try {
      const {
        timeRange = '30d',
        companyId,
        startDate,
        endDate,
        granularity = 'daily'
      } = req.query;

      const result = await this.purchaseAnalyticsService.getPurchaseTrends({
        timeRange: timeRange as string,
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        granularity: granularity as 'daily' | 'weekly' | 'monthly'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getSupplierPerformanceAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        timeRange = '30d',
        startDate,
        endDate,
        analysisType = 'overall'
      } = req.query;

      const result = await this.purchaseAnalyticsService.getSupplierPerformanceAnalysis({
        companyId: companyId as string,
        timeRange: timeRange as string,
        startDate: startDate as string,
        endDate: endDate as string,
        analysisType: analysisType as 'quality' | 'delivery' | 'pricing' | 'overall'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getPurchaseCostAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        timeRange = '30d',
        startDate,
        endDate,
        category,
        groupBy = 'month'
      } = req.query;

      const result = await this.purchaseAnalyticsService.getPurchaseCostAnalysis({
        companyId: companyId as string,
        timeRange: timeRange as string,
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        groupBy: groupBy as 'month' | 'quarter' | 'year' | 'supplier'
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
