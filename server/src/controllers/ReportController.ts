import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ReportService } from '../services/ReportService';
import { IReport } from '../types/models';

export class ReportController extends BaseController<IReport> {
  private reportService: ReportService;

  constructor() {
    const reportService = new ReportService();
    super(reportService, 'Report');
    this.reportService = reportService;
  }

  /**
   * Create a new report
   */
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const reportData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const report = await this.reportService.createReport(reportData, createdBy);

      this.sendSuccess(res, report, 'Report created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create report');
    }
  }

  /**
   * Get reports by company
   */
  async getReportsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, reportType, status, startDate, endDate } = req.query;

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

      if (status) {
        options.status = status;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const reports = await this.reportService.getReportsByCompany(companyId.toString(), options);

      this.sendSuccess(res, reports, 'Reports retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get reports');
    }
  }

  /**
   * Generate sales report
   */
  async generateSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate, format = 'json' } = req.query;

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

      const salesReport = await this.reportService.generateSalesReport(companyId.toString(), dateRange, format as string);

      this.sendSuccess(res, salesReport, 'Sales report generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate sales report');
    }
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { format = 'json' } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const inventoryReport = await this.reportService.generateInventoryReport(companyId.toString(), format as string);

      this.sendSuccess(res, inventoryReport, 'Inventory report generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate inventory report');
    }
  }

  /**
   * Generate production report
   */
  async generateProductionReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate, format = 'json' } = req.query;

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

      const productionReport = await this.reportService.generateProductionReport(companyId.toString(), dateRange, format as string);

      this.sendSuccess(res, productionReport, 'Production report generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate production report');
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.reportService.getReportStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Report statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get report statistics');
    }
  }

  /**
   * Generate supplier-wise purchase report
   */
  async generateSupplierWisePurchaseReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const {
        startDate,
        endDate,
        supplierId,
        status,
        category,
        page = 1,
        limit = 10,
        format = 'json'
      } = req.query;

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

      const filters = {
        supplierId: supplierId as string,
        status: status as string,
        category: category as string
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const supplierWiseReport = await this.reportService.generateSupplierWisePurchaseReport(
        companyId.toString(),
        dateRange,
        filters,
        pagination,
        format as string
      );

      this.sendSuccess(res, supplierWiseReport, 'Supplier-wise purchase report generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate supplier-wise purchase report');
    }
  }

  /**
   * Generate purchase summary report
   */
  async generatePurchaseSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate, format = 'json' } = req.query;

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

      const purchaseSummary = await this.reportService.generatePurchaseSummaryReport(companyId.toString(), dateRange, format as string);

      this.sendSuccess(res, purchaseSummary, 'Purchase summary report generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate purchase summary report');
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const report = await this.reportService.findById(id);

      if (!report) {
        this.sendError(res, new Error('Report not found'), 'Report not found', 404);
        return;
      }

      this.sendSuccess(res, report, 'Report retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get report');
    }
  }
}
