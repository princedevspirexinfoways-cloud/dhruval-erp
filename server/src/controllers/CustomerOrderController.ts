import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CustomerOrderService } from '../services/CustomerOrderService';
import { ICustomerOrder } from '../types/models';

export class CustomerOrderController extends BaseController<ICustomerOrder> {
  private customerOrderService: CustomerOrderService;

  constructor() {
    const customerOrderService = new CustomerOrderService();
    super(customerOrderService, 'CustomerOrder');
    this.customerOrderService = customerOrderService;
  }

  /**
   * Create a new customer order
   */
  async createCustomerOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.customerOrderService.createCustomerOrder(orderData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Customer order created successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.customerOrderService.updateOrderStatus(orderId, status, updatedBy);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10 } = req.query;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const orders = await this.customerOrderService.getOrdersByCustomer(customerId, companyId.toString(), options);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
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
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const orders = await this.customerOrderService.getOrdersByStatus(companyId.toString(), status, options);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
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
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.customerOrderService.getOrderStats(companyId.toString(), dateRange);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
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
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      let query: any = { companyId };

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'customer.customerName': { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { createdAt: -1 }
      };

      const orders = await this.customerOrderService.findMany(query, options);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update customer order
   */
  async updateCustomerOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.customerOrderService.update(id, updateData, updatedBy);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Customer order not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Customer order updated successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get customer order by ID
   */
  async getCustomerOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await this.customerOrderService.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Customer order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Delete customer order (soft delete)
   */
  async deleteCustomerOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.customerOrderService.update(id, {
        status: 'cancelled',
        cancelledAt: new Date()
      }, deletedBy);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Customer order not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Customer order cancelled successfully'
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get order by number
   */
  async getOrderByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const order = await this.customerOrderService.findOne({
        orderNumber,
        companyId
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Customer order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const cancelledBy = (req.user?.userId || req.user?._id)?.toString();

      const order = await this.customerOrderService.cancelOrder(orderId, reason, cancelledBy);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get stock impact summary
   */
  async getStockImpactSummary(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      const summary = await this.customerOrderService.getStockImpactSummary(orderId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Dispatch order (triggers stock deduction)
   */
  async dispatchOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { dispatchDetails } = req.body;
      const dispatchedBy = (req.user?.userId || req.user?._id)?.toString();

      // Update order status to dispatched (this will trigger stock deduction)
      const order = await this.customerOrderService.updateOrderStatus(orderId, 'dispatched', dispatchedBy);

      // You can add additional dispatch details here if needed
      if (dispatchDetails) {
        await this.customerOrderService.update(orderId, {
          'delivery.shippingDetails': dispatchDetails
        }, dispatchedBy);
      }

      res.json({
        success: true,
        message: 'Order dispatched successfully and stock deducted',
        data: order
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }
}
