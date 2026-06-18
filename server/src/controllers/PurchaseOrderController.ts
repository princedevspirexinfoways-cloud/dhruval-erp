import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PurchaseOrderService } from '../services/PurchaseOrderService';
import { IPurchaseOrder } from '../types/models';

export class PurchaseOrderController extends BaseController<IPurchaseOrder> {
  private purchaseOrderService: PurchaseOrderService;

  constructor() {
    const purchaseOrderService = new PurchaseOrderService();
    super(purchaseOrderService, 'PurchaseOrder');
    this.purchaseOrderService = purchaseOrderService;
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.purchaseOrderService.createPurchaseOrder(orderData, createdBy);

      this.sendSuccess(res, order, 'Purchase order created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create purchase order');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.purchaseOrderService.updateOrderStatus(orderId, status, updatedBy, notes);

      this.sendSuccess(res, order, 'Purchase order status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update purchase order status');
    }
  }

  /**
   * Receive items
   */
  async receiveItems(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { receivedItems } = req.body;
      const receivedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.purchaseOrderService.receiveItems(orderId, receivedItems, receivedBy);

      this.sendSuccess(res, order, 'Items received successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to receive items');
    }
  }

  /**
   * Cancel purchase order
   */
  async cancelPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const cancelledBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.purchaseOrderService.cancelPurchaseOrder(orderId, cancelledBy);

      this.sendSuccess(res, order, 'Purchase order cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel purchase order');
    }
  }

  /**
   * Get orders by supplier
   */
  async getOrdersBySupplier(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const orders = await this.purchaseOrderService.getOrdersBySupplier(supplierId, companyId.toString(), options);

      this.sendSuccess(res, orders, 'Purchase orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get purchase orders');
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const orders = await this.purchaseOrderService.getOrdersByStatus(companyId.toString(), status, options);

      this.sendSuccess(res, orders, 'Purchase orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get purchase orders');
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.purchaseOrderService.getOrderStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Purchase order statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get purchase order statistics');
    }
  }

  /**
   * Get all orders by company
   */
  async getOrdersByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, status, search } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build base query
      const baseQuery: any = { companyId };
      if (status) {
        baseQuery.status = status;
      }

      let orders: any[];
      let total: number;

      if (search) {
        // Simple search - PO numbers are stored in uppercase, so convert search to uppercase
        const searchTerm = String(search).trim().toUpperCase();
        
        // Simple query - exact match or contains match
        // Try exact match first, then partial match
        const PurchaseOrder = (await import('../models/PurchaseOrder')).default;
        
        // Build query with exact match first
        const exactQuery = {
          ...baseQuery,
          $or: [
            { poNumber: searchTerm },
            { orderNumber: searchTerm }
          ]
        };
        
        // Try exact match first
        let ordersResult = await PurchaseOrder.find(exactQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean();
        
        let totalCount = await PurchaseOrder.countDocuments(exactQuery);
        
        // If no exact match, try partial match using aggregation (to avoid schema validation)
        if (ordersResult.length === 0) {
          const partialMatchPipeline: any[] = [
            { $match: baseQuery },
            {
              $match: {
                $or: [
                  { $expr: { $regexMatch: { input: { $toString: '$poNumber' }, regex: searchTerm, options: 'i' } } },
                  { $expr: { $regexMatch: { input: { $toString: '$orderNumber' }, regex: searchTerm, options: 'i' } } }
                ]
              }
            },
            { $sort: { createdAt: -1 as const } },
            { $skip: skip },
            { $limit: limitNum }
          ];
          
          const countPipeline: any[] = [
            { $match: baseQuery },
            {
              $match: {
                $or: [
                  { $expr: { $regexMatch: { input: { $toString: '$poNumber' }, regex: searchTerm, options: 'i' } } },
                  { $expr: { $regexMatch: { input: { $toString: '$orderNumber' }, regex: searchTerm, options: 'i' } } }
                ]
              }
            },
            { $count: 'total' }
          ];
          
          const [partialResult, countResult] = await Promise.all([
            PurchaseOrder.aggregate(partialMatchPipeline),
            PurchaseOrder.aggregate(countPipeline)
          ]);
          
          ordersResult = partialResult;
          totalCount = countResult[0]?.total || 0;
        }
        
        orders = ordersResult;
        total = totalCount;
      } else {
        // No search - use simple find query
        const PurchaseOrder = (await import('../models/PurchaseOrder')).default;
        const [ordersResult, totalCount] = await Promise.all([
          PurchaseOrder.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          PurchaseOrder.countDocuments(baseQuery)
        ]);
        orders = ordersResult;
        total = totalCount;
      }

      this.sendSuccess(res, {
        data: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }, 'Purchase orders retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get purchase orders');
    }
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.purchaseOrderService.update(id, updateData, updatedBy);

      if (!order) {
        this.sendError(res, new Error('Purchase order not found'), 'Purchase order not found', 404);
        return;
      }

      this.sendSuccess(res, order, 'Purchase order updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update purchase order');
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await this.purchaseOrderService.findById(id);

      if (!order) {
        this.sendError(res, new Error('Purchase order not found'), 'Purchase order not found', 404);
        return;
      }

      this.sendSuccess(res, order, 'Purchase order retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get purchase order');
    }
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      // Check if order exists first
      const order = await this.purchaseOrderService.findById(id);
      if (!order) {
        this.sendError(res, new Error('Purchase order not found'), 'Purchase order not found', 404);
        return;
      }

      // Delete the order (soft delete if isActive field exists, otherwise hard delete)
      await this.purchaseOrderService.delete(id, deletedBy);

      this.sendSuccess(res, null, 'Purchase order deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete purchase order');
    }
  }
}
