import { Request, Response } from 'express';
import { BaseController } from './BaseController';
// @ts-ignore
import { SalesService } from '../services/SalesService';
import { ICustomerOrder } from '../types/models';

export class SalesController extends BaseController<ICustomerOrder> {
  protected salesService: SalesService;

  constructor() {
    const salesService = new SalesService();
    super(salesService, 'Sales');
    this.salesService = salesService;
  }

  /**
   * Get comprehensive sales dashboard data (Overview + Analytics combined)
   */
  async getSalesDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, period = 'month', dateFrom, dateTo } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const dashboardData = await this.salesService.getSalesDashboard(
        targetCompanyId,
        period.toString(),
        dateFrom?.toString(),
        dateTo?.toString()
      );

      this.sendSuccess(res, dashboardData, 'Sales dashboard data retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales dashboard data');
    }
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, period = 'month' } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.salesService.getSalesStats(targetCompanyId, period.toString());
      this.sendSuccess(res, stats, 'Sales statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales statistics');
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', companyId, dateFrom, dateTo } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const analytics = await this.salesService.getSalesAnalytics(
        targetCompanyId,
        period.toString(),
        dateFrom?.toString(),
        dateTo?.toString()
      );
      this.sendSuccess(res, analytics, 'Sales analytics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales analytics');
    }
  }

  /**
   * Get sales orders with filtering
   */
  async getSalesOrders(req: Request, res: Response): Promise<void> {
    try {
      const { 
        companyId, 
        status, 
        paymentStatus, 
        customerId, 
        category, 
        dateFrom, 
        dateTo, 
        search, 
        page = 1, 
        limit = 10 
      } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const filters = {
        companyId: targetCompanyId,
        status: status?.toString(),
        paymentStatus: paymentStatus?.toString(),
        customerId: customerId?.toString(),
        category: category?.toString(),
        dateFrom: dateFrom?.toString(),
        dateTo: dateTo?.toString(),
        search: search?.toString(),
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString())
      };

      const orders = await this.salesService.getSalesOrders(filters);
      this.sendSuccess(res, orders, 'Sales orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales orders');
    }
  }

  /**
   * Create a new sales order
   */
  async createSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && orderData.companyId 
        ? orderData.companyId 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // Use _id instead of id for user ID
      const userId = user?._id?.toString() || user?.id?.toString();

      if (!userId) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      const order = await this.salesService.createSalesOrder(
        { ...orderData, companyId: targetCompanyId }, 
        userId
      );
      this.sendSuccess(res, order, 'Sales order created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create sales order');
    }
  }

  /**
   * Get sales order by ID
   */
  async getSalesOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      const order = await this.salesService.getSalesOrderById(id, user?.companyId?.toString());
      this.sendSuccess(res, order, 'Sales order retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales order');
    }
  }

  /**
   * Update sales order
   */
  async updateSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = req.user;

      // Use _id instead of id for user ID
      const userId = user?._id?.toString() || user?.id?.toString();

      const order = await this.salesService.updateSalesOrder(
        id, 
        updateData, 
        userId, 
        user?.companyId?.toString()
      );
      this.sendSuccess(res, order, 'Sales order updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update sales order');
    }
  }

  /**
   * Delete sales order
   */
  async deleteSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      await this.salesService.deleteSalesOrder(id, user?.companyId?.toString());
      this.sendSuccess(res, null, 'Sales order deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete sales order');
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus, amount } = req.body;
      const user = req.user;

      // Use _id instead of id for user ID
      const userId = user?._id?.toString() || user?.id?.toString();

      const order = await this.salesService.updatePaymentStatus(
        id, 
        paymentStatus, 
        amount, 
        userId, 
        user?.companyId?.toString()
      );
      this.sendSuccess(res, order, 'Payment status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update payment status');
    }
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(req: Request, res: Response): Promise<void> {
    try {
      const { orderIds, updates } = req.body;
      const user = req.user;

      // Use _id instead of id for user ID
      const userId = user?._id?.toString() || user?.id?.toString();

      const orders = await this.salesService.bulkUpdateOrders(
        orderIds, 
        updates, 
        userId, 
        user?.companyId?.toString()
      );
      this.sendSuccess(res, orders, 'Orders updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update orders');
    }
  }

  /**
   * Get customer sales report
   */
  async getCustomerSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, companyId } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const report = await this.salesService.getCustomerSalesReport(
        targetCompanyId, 
        dateFrom?.toString(), 
        dateTo?.toString()
      );
      this.sendSuccess(res, report, 'Customer sales report retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get customer sales report');
    }
  }

  /**
   * Get product sales performance
   */
  async getProductSalesPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, companyId, category } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const performance = await this.salesService.getProductSalesPerformance(
        targetCompanyId, 
        dateFrom?.toString(), 
        dateTo?.toString(),
        category?.toString()
      );
      this.sendSuccess(res, performance, 'Product sales performance retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get product sales performance');
    }
  }

  /**
   * Get sales trends
   */
  async getSalesTrends(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', companyId, granularity = 'daily' } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const trends = await this.salesService.getSalesTrends(
        targetCompanyId,
        period.toString(),
        granularity.toString()
      );
      this.sendSuccess(res, trends, 'Sales trends retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales trends');
    }
  }

  /**
   * Export sales data
   */
  async exportSalesData(req: Request, res: Response): Promise<void> {
    try {
      const { format } = req.params;
      const filters = req.body;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && filters.companyId 
        ? filters.companyId 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const downloadUrl = await this.salesService.exportSalesData(
        format, 
        { ...filters, companyId: targetCompanyId }
      );
      this.sendSuccess(res, { downloadUrl }, 'Data exported successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to export data');
    }
  }

  /**
   * Get sales team performance
   */
  async getSalesTeamPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, companyId, teamMemberId } = req.query;
      const user = req.user;

      const targetCompanyId = user?.isSuperAdmin && companyId 
        ? companyId.toString() 
        : user?.companyId?.toString();

      if (!targetCompanyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const performance = await this.salesService.getSalesTeamPerformance(
        targetCompanyId,
        dateFrom?.toString(),
        dateTo?.toString(),
        teamMemberId?.toString()
      );
      this.sendSuccess(res, performance, 'Sales team performance retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get sales team performance');
    }
  }
}
