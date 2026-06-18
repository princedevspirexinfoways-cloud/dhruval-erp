import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { PurchaseOrder } from '../models';
import { IPurchaseOrder } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { InventoryService } from './InventoryService';
import { StockMovementService } from './StockMovementService';

export class PurchaseOrderService extends BaseService<IPurchaseOrder> {
  constructor() {
    super(PurchaseOrder);
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(orderData: Partial<IPurchaseOrder>, createdBy?: string): Promise<IPurchaseOrder> {
    try {
      // Validate order data
      this.validateOrderData(orderData);

      // Generate order number if not provided
      if (!orderData.poNumber) {
        orderData.poNumber = await this.generateOrderNumber(orderData.companyId!.toString());
      }

      // Calculate totals
      const totals = this.calculateOrderTotals(orderData.items || []);

      const order = await this.create({
        ...orderData,
        poNumber: orderData.poNumber,
        status: 'draft',
        amounts: {
          subtotal: totals.subtotal,
          totalTaxAmount: totals.totalTax,
          grandTotal: totals.totalAmount,
          totalDiscount: 0,
          taxableAmount: totals.subtotal,
          roundingAdjustment: 0,
          freightCharges: 0,
          packingCharges: 0,
          otherCharges: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Purchase order created successfully', { 
        orderId: order._id, 
        poNumber: order.poNumber,
        supplierId: order.supplier?.supplierId,
        grandTotal: order.amounts?.grandTotal,
        createdBy 
      });

      return order;
    } catch (error) {
      logger.error('Error creating purchase order', { error, orderData, createdBy });
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, updatedBy?: string, notes?: string): Promise<IPurchaseOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Purchase order not found', 404);
      }

      // Validate status transition
      this.validateStatusTransition(order.status, status);

      const updateData: any = { status };

      // Add notes if provided
      if (notes) {
        updateData.notes = notes;
      }

      // Set specific dates based on status
      if (status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = updatedBy;
      } else if (status === 'ordered') {
        updateData.orderedAt = new Date();
        updateData.orderedBy = updatedBy;
      } else if (status === 'partial') {
        updateData.lastReceivedDate = new Date();
      } else if (status === 'received') {
        updateData.lastReceivedDate = new Date();
        updateData.receivedAt = new Date();
        updateData.receivedBy = updatedBy;
      } else if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = updatedBy;
      }
      
      // Legacy status support
      if (status === 'sent') {
        updateData.sentAt = new Date();
      } else if (status === 'acknowledged') {
        updateData.acknowledgedAt = new Date();
      } else if (status === 'partially_received') {
        updateData.lastReceivedDate = new Date();
      }

      const updatedOrder = await this.update(orderId, updateData, updatedBy);

      logger.info('Purchase order status updated', { 
        orderId, 
        oldStatus: order.status,
        newStatus: status,
        updatedBy 
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error updating purchase order status', { error, orderId, status, updatedBy });
      throw error;
    }
  }



  /**
   * Get orders by status
   */
  async getOrdersByStatus(companyId: string, status: string, options: any = {}): Promise<IPurchaseOrder[]> {
    try {
      const query = {
        companyId: new Types.ObjectId(companyId),
        status
      };

      return await this.findMany(query, {
        sort: { createdAt: -1 },
        ...options
      });
    } catch (error) {
      logger.error('Error getting purchase orders by status', { error, companyId, status });
      throw error;
    }
  }

  /**
   * Get orders by supplier
   */
  async getOrdersBySupplier(supplierId: string, companyId: string, options: any = {}): Promise<IPurchaseOrder[]> {
    try {
      const query = {
        companyId: new Types.ObjectId(companyId),
        'supplier.supplierId': new Types.ObjectId(supplierId)
      };

      return await this.findMany(query, {
        sort: { createdAt: -1 },
        ...options
      });
    } catch (error) {
      logger.error('Error getting orders by supplier', { error, supplierId, companyId });
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { 
        companyId: new Types.ObjectId(companyId),
        isActive: { $ne: false } // Only count active orders
      };
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalOrders,
        ordersByStatus,
        totalValue,
        averageOrderValue,
        thisMonthOrders,
        thisMonthValue
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$amounts.grandTotal', 0] } } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalValue: { $sum: { $ifNull: ['$amounts.grandTotal', 0] } } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, avgValue: { $avg: { $ifNull: ['$amounts.grandTotal', 0] } } } }
        ]),
        this.model.countDocuments({
          companyId: new Types.ObjectId(companyId),
          isActive: { $ne: false },
          createdAt: { $gte: startOfMonth }
        }),
        this.model.aggregate([
          {
            $match: {
              companyId: new Types.ObjectId(companyId),
              isActive: { $ne: false },
              createdAt: { $gte: startOfMonth }
            }
          },
          { $group: { _id: null, totalValue: { $sum: { $ifNull: ['$amounts.grandTotal', 0] } } } }
        ])
      ]);

      // Convert ordersByStatus array to object for easier access
      const statusCounts: { [key: string]: number } = {};
      ordersByStatus.forEach((item: any) => {
        statusCounts[item._id] = item.count;
      });

      return {
        totalOrders,
        pendingOrders: statusCounts['pending'] || 0,
        approvedOrders: statusCounts['approved'] || 0,
        receivedOrders: statusCounts['received'] || 0,
        cancelledOrders: statusCounts['cancelled'] || 0,
        totalValue: totalValue[0]?.totalValue || 0,
        thisMonthOrders: thisMonthOrders || 0,
        thisMonthValue: thisMonthValue[0]?.totalValue || 0,
        averageOrderValue: averageOrderValue[0]?.avgValue || 0,
        ordersByStatus: statusCounts
      };
    } catch (error) {
      logger.error('Error getting order statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Get overdue orders
   */
  async getOverdueOrders(companyId: string): Promise<IPurchaseOrder[]> {
    try {
      const today = new Date();
      const query = { 
        companyId: new Types.ObjectId(companyId),
        status: { $in: ['sent', 'acknowledged', 'partially_received'] },
        expectedDeliveryDate: { $lt: today }
      };

      return await this.findMany(query, { sort: { expectedDeliveryDate: 1 } });
    } catch (error) {
      logger.error('Error getting overdue purchase orders', { error, companyId });
      throw error;
    }
  }

  /**
   * Get purchase order statistics
   */
  async getPurchaseOrderStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };
      
      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalOrders,
        ordersByStatus,
        totalSpend,
        averageOrderValue,
        topSuppliers,
        overdueCount
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$grandTotal' } } }
        ]),
        this.model.aggregate([
          { $match: { ...matchQuery, status: { $in: ['received', 'partially_received'] } } },
          { $group: { _id: null, totalSpend: { $sum: '$grandTotal' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, avgOrderValue: { $avg: '$grandTotal' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { 
            $group: { 
              _id: '$supplierId', 
              orderCount: { $sum: 1 }, 
              totalValue: { $sum: '$grandTotal' } 
            }
          },
          { $sort: { totalValue: -1 } },
          { $limit: 10 }
        ]),
        this.count({
          companyId: new Types.ObjectId(companyId),
          status: { $in: ['sent', 'acknowledged', 'partially_received'] },
          expectedDeliveryDate: { $lt: new Date() }
        })
      ]);

      return {
        totalOrders,
        ordersByStatus,
        totalSpend: totalSpend[0]?.totalSpend || 0,
        averageOrderValue: averageOrderValue[0]?.avgOrderValue || 0,
        topSuppliers,
        overdueCount
      };
    } catch (error) {
      logger.error('Error getting purchase order statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Get purchase order summary with stock impact
   */
  async getPurchaseOrderSummary(orderId: string): Promise<any> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Purchase order not found', 404);
      }

      const summary = {
        orderId: order._id,
        poNumber: order.poNumber,
        status: order.status,
        supplier: order.supplier,
        totalItems: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalReceived: order.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
        totalPending: order.items.reduce((sum, item) => sum + (item.pendingQuantity || 0), 0),
        totalValue: order.amounts?.grandTotal || 0,
        stockImpact: {
          itemsReceived: order.items.filter(item => (item.receivedQuantity || 0) > 0).length,
          totalStockAdded: order.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
          itemsWithStockMovement: order.items.filter(item => (item.receivedQuantity || 0) > 0).map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantityReceived: item.receivedQuantity || 0,
            stockValue: (item.receivedQuantity || 0) * (item.rate || 0)
          }))
        },
        dates: {
          created: order.createdAt,
          expectedDelivery: order.expectedDeliveryDate,
          firstReceipt: order.lastReceivedDate || null,
          fullyReceived: order.lastReceivedDate || null,
          completed: order.lastReceivedDate || null,
          cancelled: null
        }
      };

      return summary;
    } catch (error) {
      logger.error('Error getting purchase order summary', { error, orderId });
      throw error;
    }
  }

  /**
   * Calculate order totals
   */
  private calculateOrderTotals(items: any[]): { subtotal: number; totalTax: number; totalAmount: number } {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const itemTotal = item.quantity * item.rate;
      const itemTax = itemTotal * (item.taxRate || 0) / 100;

      subtotal += itemTotal;
      totalTax += itemTax;
    });

    const totalAmount = subtotal + totalTax;

    return { subtotal, totalTax, totalAmount };
  }

  /**
   * Generate order number
   */
  private async generateOrderNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.count({ 
      companyId: new Types.ObjectId(companyId),
      createdAt: {
        $gte: new Date(year, today.getMonth(), 1),
        $lt: new Date(year, today.getMonth() + 1, 1)
      }
    });

    return `PO${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Receive items for purchase order
   */
  async receiveItems(orderId: string, receivedItems: any[], receivedBy?: string): Promise<IPurchaseOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Purchase order not found', 404);
      }

      if (order.status !== 'acknowledged') {
        throw new AppError('Only acknowledged orders can receive items', 400);
      }

      // Initialize services
      const inventoryService = new InventoryService();
      const stockMovementService = new StockMovementService();

      // Update stock for each received item
      for (const receivedItem of receivedItems) {
        const orderItem = order.items.find(item => item.itemId.toString() === receivedItem.itemId);
        if (!orderItem) {
          throw new AppError(`Item ${receivedItem.itemId} not found in purchase order`, 404);
        }

        // Validate received quantity
        if (receivedItem.receivedQuantity <= 0) {
          throw new AppError(`Received quantity must be greater than 0 for item ${orderItem.itemName}`, 400);
        }

        if (receivedItem.receivedQuantity > orderItem.quantity) {
          throw new AppError(`Received quantity (${receivedItem.receivedQuantity}) cannot exceed ordered quantity (${orderItem.quantity}) for item ${orderItem.itemName}`, 400);
        }

        // Update stock quantity
        await inventoryService.updateStock(
          receivedItem.itemId,
          (order.deliveryInfo?.warehouseId || order.companyId).toString(), // Use delivery warehouse or company as default
          receivedItem.receivedQuantity,
          'in',
          `PO-${order.poNumber}`,
          `Received from purchase order ${order.poNumber}`,
          receivedBy
        );

        // Create stock movement record
        await stockMovementService.createStockMovement({
          companyId: order.companyId,
          itemId: receivedItem.itemId,
          itemCode: orderItem.itemCode,
          itemName: orderItem.itemName,
          movementType: 'inward',
          referenceDocument: {
            documentType: 'purchase_order',
            documentId: order._id,
            documentNumber: order.poNumber
          },
          quantity: receivedItem.receivedQuantity,
          unit: orderItem.unit,
          rate: orderItem.rate,
          totalValue: receivedItem.receivedQuantity * orderItem.rate,
          toLocation: {
            warehouseId: order.deliveryInfo?.warehouseId || order.companyId,
            warehouseName: order.deliveryInfo?.warehouseName || 'Main Warehouse',
            isExternal: false
          },
          notes: `Received from purchase order ${order.poNumber}`,
          movementDate: new Date()
        }, receivedBy);

        // Update the item's received quantity in the order
        orderItem.receivedQuantity = (orderItem.receivedQuantity || 0) + receivedItem.receivedQuantity;
        orderItem.pendingQuantity = orderItem.quantity - orderItem.receivedQuantity - (orderItem.rejectedQuantity || 0);

        logger.info('Stock updated for received item', {
          itemId: receivedItem.itemId,
          itemName: orderItem.itemName,
          quantity: receivedItem.receivedQuantity,
          totalReceived: orderItem.receivedQuantity,
          pending: orderItem.pendingQuantity,
          poNumber: order.poNumber,
          receivedBy
        });
      }

      // Update received quantities
      const updateData: any = {
        receivedItems,
        lastReceivedDate: new Date(),
        status: 'partially_received'
      };

      // Check if all items are fully received
      const allReceived = order.items.every(item => 
        (item.receivedQuantity || 0) >= item.quantity
      );

      if (allReceived) {
        updateData.status = 'completed';
        updateData.lastReceivedDate = new Date();
        
        logger.info('Purchase order completed', {
          orderId,
          poNumber: order.poNumber,
          completedAt: new Date(),
          receivedBy
        });
      } else {
        // Check if any items have been received
        const hasReceivedItems = order.items.some(item => (item.receivedQuantity || 0) > 0);
        if (hasReceivedItems) {
          updateData.status = 'partially_received';
        }
      }

      const updatedOrder = await this.update(orderId, updateData, receivedBy);

      logger.info('Items received for purchase order', {
        orderId,
        receivedItems: receivedItems.length,
        receivedBy
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error receiving items', { error, orderId, receivedItems, receivedBy });
      throw error;
    }
  }

  /**
   * Cancel purchase order
   */
  async cancelPurchaseOrder(orderId: string, cancelledBy?: string): Promise<IPurchaseOrder | null> {
    try {
      const order = await this.findById(orderId);
      if (!order) {
        throw new AppError('Purchase order not found', 404);
      }

      // Validate status transition
      this.validateStatusTransition(order.status, 'cancelled');

      const updateData: any = { 
        status: 'cancelled'
      };

      const updatedOrder = await this.update(orderId, updateData, cancelledBy);

      logger.info('Purchase order cancelled', { 
        orderId, 
        oldStatus: order.status,
        cancelledBy 
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Error cancelling purchase order', { error, orderId, cancelledBy });
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: { [key: string]: string[] } = {
      'draft': ['pending', 'cancelled'],
      'pending': ['approved', 'cancelled'],
      'approved': ['ordered', 'cancelled'],
      'ordered': ['partial', 'received', 'cancelled'],
      'partial': ['received', 'cancelled'],
      'received': [],
      'cancelled': [],
      // Legacy status support
      'sent': ['acknowledged', 'cancelled'],
      'acknowledged': ['partially_received', 'received', 'cancelled'],
      'partially_received': ['received', 'cancelled']
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
    }
  }

  /**
   * Validate order data
   */
  private validateOrderData(orderData: Partial<IPurchaseOrder>): void {
    if (!orderData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    // Either supplier OR agent must be present
    if (!orderData.supplier?.supplierId && !orderData.agent?.agentId) {
      throw new AppError('Either supplier or agent is required', 400);
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new AppError('Purchase order must have at least one item', 400);
    }

    // Validate each item
    orderData.items.forEach((item, index) => {
      if (!item.itemName) {
        throw new AppError(`Item ${index + 1}: Item name is required`, 400);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be greater than 0`, 400);
      }
      if (!item.rate || item.rate < 0) {
        throw new AppError(`Item ${index + 1}: Rate must be non-negative`, 400);
      }
    });
  }
}
