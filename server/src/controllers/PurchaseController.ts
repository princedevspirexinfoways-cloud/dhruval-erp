import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PurchaseService } from '../services/PurchaseService';
import { IPurchaseOrder } from '../types/models';

interface User {
  id?: string;
  isSuperAdmin?: boolean;
  companyId?: string | any; // Allow ObjectId type
}

interface PurchaseFilters {
  companyId: string;
  status?: string;
  paymentStatus?: string;
  supplierId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  limit: number;
}

export class PurchaseController extends BaseController<IPurchaseOrder> {
  private purchaseService: PurchaseService;

  constructor() {
    super(new PurchaseService(), 'Purchase');
    this.purchaseService = this.service as PurchaseService;
  }

  private getTargetCompanyId(user: User | undefined, providedCompanyId?: string): string | null {
    if (!user) {
      return null;
    }
    return user.isSuperAdmin && providedCompanyId ? providedCompanyId : user.companyId ?? null;
  }

  private validatePagination(page: string | undefined, limit: string | undefined): { page: number; limit: number } {
    return {
      page: page && !isNaN(parseInt(page)) ? parseInt(page) : 1,
      limit: limit && !isNaN(parseInt(limit)) ? parseInt(limit) : 10,
    };
  }

  private sendUnauthorized(res: Response): void {
    this.sendError(res, new Error('Unauthorized'), 'User authentication required', 401);
  }

  private sendBadRequest(res: Response, message: string): void {
    this.sendError(res, new Error(message), message, 400);
  }

  /**
   * Get purchase statistics with company ID support
   */
  async getPurchaseStats(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.query as { companyId?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const stats = await this.purchaseService.getPurchaseStats(targetCompanyId);
      this.sendSuccess(res, stats, 'Purchase statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get purchase statistics', 500);
    }
  }

  /**
   * Get purchase analytics (combined overview + analytics)
   */
  async getPurchaseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', companyId } = req.query as { period?: string; companyId?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const analytics = await this.purchaseService.getPurchaseAnalytics(targetCompanyId, period);
      this.sendSuccess(res, analytics, 'Purchase analytics retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get purchase analytics', 500);
    }
  }

  /**
   * Get purchase orders with company ID filtering
   */
  async getPurchaseOrders(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        status,
        paymentStatus,
        supplierId,
        category,
        dateFrom,
        dateTo,
        search,
        page,
        limit,
      } = req.query as { [key: string]: string | undefined };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const { page: pageNum, limit: limitNum } = this.validatePagination(page, limit);
      const filters: PurchaseFilters = {
        companyId: targetCompanyId,
        status,
        paymentStatus,
        supplierId,
        category,
        dateFrom,
        dateTo,
        search,
        page: pageNum,
        limit: limitNum,
      };

      const orders = await this.purchaseService.getPurchaseOrders(filters);
      this.sendSuccess(res, orders, 'Purchase orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get purchase orders', 500);
    }
  }

  /**
   * Create a new purchase order with company ID handling
   */
  async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!orderData || typeof orderData !== 'object') {
        this.sendBadRequest(res, 'Invalid order data');
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, orderData.companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const order = await this.purchaseService.createPurchaseOrder(
        { ...orderData, companyId: targetCompanyId },
        user.userId || user.id, // Use userId if available, fallback to id
      );
      this.sendSuccess(res, order, 'Purchase order created successfully', 201);
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to create purchase order', 500);
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!user.companyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const order = await this.purchaseService.getPurchaseOrderById(id, user.companyId);
      this.sendSuccess(res, order, 'Purchase order retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get purchase order', 500);
    }
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!updateData || typeof updateData !== 'object') {
        this.sendBadRequest(res, 'Invalid update data');
        return;
      }

      if (!user.companyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const order = await this.purchaseService.updatePurchaseOrder(id, updateData, user.id, user.companyId);
      this.sendSuccess(res, order, 'Purchase order updated successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to update purchase order', 500);
    }
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!user.companyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      await this.purchaseService.deletePurchaseOrder(id, user.companyId);
      this.sendSuccess(res, null, 'Purchase order deleted successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to delete purchase order', 500);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus, amount } = req.body;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!paymentStatus || amount === undefined) {
        this.sendBadRequest(res, 'Payment status and amount are required');
        return;
      }

      if (!user.companyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const order = await this.purchaseService.updatePaymentStatus(id, paymentStatus, amount, user.id, user.companyId);
      this.sendSuccess(res, order, 'Payment status updated successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to update payment status', 500);
    }
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(req: Request, res: Response): Promise<void> {
    try {
      const { orderIds, updates } = req.body;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!Array.isArray(orderIds) || !updates || typeof updates !== 'object') {
        this.sendBadRequest(res, 'Invalid order IDs or updates data');
        return;
      }

      if (!user.companyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const orders = await this.purchaseService.bulkUpdateOrders(orderIds, updates, user.id, user.companyId);
      this.sendSuccess(res, orders, 'Orders updated successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to update orders', 500);
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const { companyId, page, limit } = req.query as { companyId?: string; page?: string; limit?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const { page: pageNum, limit: limitNum } = this.validatePagination(page, limit);
      const orders = await this.purchaseService.getOrdersByStatus(status, targetCompanyId, pageNum, limitNum);
      this.sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get orders', 500);
    }
  }

  /**
   * Get orders by supplier
   */
  async getOrdersBySupplier(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const { companyId, page, limit } = req.query as { companyId?: string; page?: string; limit?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const { page: pageNum, limit: limitNum } = this.validatePagination(page, limit);
      const orders = await this.purchaseService.getOrdersBySupplier(supplierId, targetCompanyId, pageNum, limitNum);
      this.sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get orders', 500);
    }
  }

  /**
   * Get supplier report
   */
  async getSupplierReport(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, companyId } = req.query as { dateFrom?: string; dateTo?: string; companyId?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const report = await this.purchaseService.getSupplierReport(targetCompanyId, dateFrom, dateTo);
      this.sendSuccess(res, report, 'Supplier report retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get supplier report', 500);
    }
  }

  /**
   * Get category spend
   */
  async getCategorySpend(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, companyId } = req.query as { dateFrom?: string; dateTo?: string; companyId?: string };
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const spend = await this.purchaseService.getCategorySpend(targetCompanyId, dateFrom, dateTo);
      this.sendSuccess(res, spend, 'Category spend retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get category spend', 500);
    }
  }

  /**
   * Export purchase data
   */
  async exportPurchaseData(req: Request, res: Response): Promise<void> {
    try {
      const { format } = req.params;
      const filters = req.body;
      const user = req.user as any;

      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      if (!filters || typeof filters !== 'object') {
        this.sendBadRequest(res, 'Invalid filters data');
        return;
      }

      const targetCompanyId = this.getTargetCompanyId(user, filters.companyId);
      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const downloadUrl = await this.purchaseService.exportPurchaseData(format, {
        ...filters,
        companyId: targetCompanyId,
      });
      this.sendSuccess(res, { downloadUrl }, 'Data exported successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to export data', 500);
    }
  }
}