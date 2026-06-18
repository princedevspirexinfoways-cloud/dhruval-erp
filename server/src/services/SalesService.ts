import { BaseService } from './BaseService';
import { ICustomerOrder } from '../types/models';
import { Types } from 'mongoose';
import CustomerOrder from '../models/CustomerOrder';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import Quotation from '../models/Quotation';
import { InventoryService } from './InventoryService';
import { AppError } from '../utils/errors';

export class SalesService extends BaseService<ICustomerOrder> {
  constructor() {
    super(CustomerOrder as any);
  }

  /**
   * Get comprehensive sales dashboard data (Overview + Analytics combined)
   */
  async getSalesDashboard(
    companyId: string, 
    period: string = 'month',
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    try {
      const dateRange = this.getDateRange(period, dateFrom, dateTo);
      
      const [
        stats,
        analytics,
        recentOrders,
        topCustomers,
        topProducts,
        salesTrends
      ] = await Promise.all([
        this.getSalesStats(companyId, period),
        this.getSalesAnalytics(companyId, period, dateFrom, dateTo),
        this.getRecentOrders(companyId, 5),
        this.getTopCustomers(companyId, dateRange.start, dateRange.end, 5),
        this.getTopProducts(companyId, dateRange.start, dateRange.end, 5),
        this.getSalesTrends(companyId, period, 'daily')
      ]);

      return {
        stats,
        analytics,
        recentOrders,
        topCustomers,
        topProducts,
        salesTrends,
        summary: {
          totalRevenue: stats.totalSales,
          totalOrders: stats.totalOrders,
          averageOrderValue: stats.totalSales / stats.totalOrders,
          growthRate: stats.monthlyGrowth,
          pendingPayments: stats.pendingPayments,
          overduePayments: stats.overduePayments
        }
      };
    } catch (error) {
      console.error('Error in getSalesDashboard:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(companyId: string, period: string = 'month'): Promise<any> {
    try {
      const dateRange = this.getDateRange(period);
      
      const matchQuery = {
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      };

      const [
        totalSalesData,
        totalOrdersData,
        pendingPaymentsData,
        overduePaymentsData,
        previousPeriodData
      ] = await Promise.all([
        // Current period total sales
        Invoice.aggregate([
          { $match: { ...matchQuery, status: 'paid' } },
          { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]),
        // Current period total orders
        CustomerOrder.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalOrders: { $sum: 1 } } }
        ]),
        // Pending payments
        CustomerOrder.aggregate([
          { $match: { ...matchQuery, 'payment.paymentStatus': 'pending' } },
          { $group: { _id: null, pendingAmount: { $sum: '$payment.balanceAmount' } } }
        ]),
        // Overdue payments
        CustomerOrder.aggregate([
          { 
            $match: { 
              ...matchQuery, 
              'payment.paymentStatus': { $in: ['pending', 'partial'] },
              'payment.dueDate': { $lt: new Date() }
            } 
          },
          { $group: { _id: null, overdueAmount: { $sum: '$payment.balanceAmount' } } }
        ]),
        // Previous period for growth calculation
        Invoice.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              status: 'paid',
              createdAt: {
                $gte: dateRange.previousStart,
                $lt: dateRange.start
              }
            } 
          },
          { $group: { _id: null, previousSales: { $sum: '$totalAmount' } } }
        ])
      ]);

      const totalSales = totalSalesData[0]?.totalSales || 0;
      const totalOrders = totalOrdersData[0]?.totalOrders || 0;
      const pendingPayments = pendingPaymentsData[0]?.pendingAmount || 0;
      const overduePayments = overduePaymentsData[0]?.overdueAmount || 0;
      const previousSales = previousPeriodData[0]?.previousSales || 0;

      const monthlyGrowth = previousSales > 0 
        ? ((totalSales - previousSales) / previousSales) * 100 
        : 0;

      return {
        totalSales,
        totalOrders,
        pendingPayments,
        overduePayments,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
      };
    } catch (error) {
      console.error('Error in getSalesStats:', error);
      throw error;
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(
    companyId: string, 
    period: string = 'month',
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    try {
      const dateRange = this.getDateRange(period, dateFrom, dateTo);
      
      const [
        dailySales,
        monthlySales,
        topProducts,
        salesByStatus,
        customerSegmentation
      ] = await Promise.all([
        // Daily sales data
        Invoice.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              status: 'paid',
              createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            } 
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              amount: { $sum: '$totalAmount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        // Monthly sales data
        Invoice.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              status: 'paid',
              createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            } 
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              amount: { $sum: '$totalAmount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        // Top products
        CustomerOrder.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            } 
          },
          { $unwind: '$orderItems' },
          {
            $group: {
              _id: '$orderItems.itemName',
              quantity: { $sum: '$orderItems.quantity' },
              revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.unitPrice'] } }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 }
        ]),
        // Sales by status
        CustomerOrder.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              createdAt: { $gte: dateRange.start, $lte: dateRange.end }
            } 
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              amount: { $sum: '$orderSummary.finalAmount' }
            }
          }
        ]),
        // Customer segmentation
        Customer.aggregate([
          { 
            $match: { 
              companyId: new Types.ObjectId(companyId),
              'relationship.customerType': { $exists: true }
            } 
          },
          {
            $group: {
              _id: '$relationship.customerType',
              count: { $sum: 1 },
              totalValue: { $sum: '$purchaseHistory.totalOrderValue' }
            }
          }
        ])
      ]);

      return {
        dailySales,
        monthlySales,
        topProducts,
        salesByStatus,
        customerSegmentation
      };
    } catch (error) {
      console.error('Error in getSalesAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get sales orders with filtering
   */
  async getSalesOrders(filters: any): Promise<any> {
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
      } = filters;

      const matchQuery: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (status) matchQuery.status = status;
      if (paymentStatus) matchQuery['payment.paymentStatus'] = paymentStatus;
      if (customerId) matchQuery.customerId = new Types.ObjectId(customerId);
      if (category) matchQuery.category = category;
      if (dateFrom || dateTo) {
        matchQuery.createdAt = {};
        if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
      }

      const pipeline: any[] = [
        { $match: matchQuery },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        {
          $addFields: {
            customerName: '$customer.customerName',
            customerCode: '$customer.customerCode'
          }
        }
      ];

      if (search) {
        pipeline.unshift({
          $match: {
            $or: [
              { orderNumber: { $regex: search, $options: 'i' } },
              { 'customer.customerName': { $regex: search, $options: 'i' } },
              { 'customer.customerCode': { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      const [orders, totalCount] = await Promise.all([
        CustomerOrder.aggregate([
          ...pipeline,
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $sort: { createdAt: -1 } }
        ]),
        CustomerOrder.aggregate([
          ...pipeline,
          { $count: 'total' }
        ])
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount[0]?.total || 0,
          pages: Math.ceil((totalCount[0]?.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getSalesOrders:', error);
      throw error;
    }
  }

  /**
   * Create a new sales order with inventory validation and stock reservation
   */
  async createSalesOrder(orderData: any, userId: string): Promise<any> {
    try {
      const inventoryService = new InventoryService();
      
      // Validate inventory items and check stock availability
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const stockValidationResults = [];
        
        for (const item of orderData.orderItems) {
          // Find the inventory item by productId, itemId, or itemName
          let inventoryItem;
          if (item.productId) {
            inventoryItem = await inventoryService.findById(item.productId);
          } else if (item.itemId) {
            // Handle case where client sends itemId instead of productId
            inventoryItem = await inventoryService.findById(item.itemId);
          } else if (item.itemName) {
            inventoryItem = await inventoryService.findOne({
              itemName: item.itemName,
              companyId: orderData.companyId
            });
          }
          
          if (!inventoryItem) {
            throw new AppError(`Inventory item "${item.itemName}" not found`, 400);
          }
          
          // Check if sufficient stock is available
          const availableStock = inventoryItem.stock?.availableStock || 0;
          if (availableStock < item.quantity) {
            stockValidationResults.push({
              itemName: item.itemName,
              requested: item.quantity,
              available: availableStock,
              insufficient: item.quantity - availableStock
            });
          }
        }
        
        // If any items have insufficient stock, throw error with details
        if (stockValidationResults.length > 0) {
          const errorMessage = stockValidationResults.map(result => 
            `${result.itemName}: Requested ${result.requested}, Available ${result.available}`
          ).join('; ');
          throw new AppError(`Insufficient stock for: ${errorMessage}`, 400);
        }
        
        // Reserve stock for all items and update orderItems with productId
        for (const item of orderData.orderItems) {
          let inventoryItem;
          if (item.productId) {
            inventoryItem = await inventoryService.findById(item.productId);
          } else if (item.itemId) {
            // Handle case where client sends itemId instead of productId
            inventoryItem = await inventoryService.findById(item.itemId);
          } else if (item.itemName) {
            inventoryItem = await inventoryService.findOne({
              itemName: item.itemName,
              companyId: orderData.companyId
            });
          }
          
          if (inventoryItem) {
            // Add productId to the item if not present
            if (!item.productId) {
              item.productId = inventoryItem._id;
            }
            
            await inventoryService.reserveStock(
              inventoryItem._id.toString(),
              item.quantity,
              `Sales Order: ${orderData.orderNumber || 'Pending'}`,
              userId
            );
          }
        }
      }
      
      // Create the sales order
      const order = new CustomerOrder({
        ...orderData,
        createdBy: userId,
        lastModifiedBy: userId
      });

      await order.save();
      
      console.log('Sales order created successfully with inventory validation', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        itemsCount: orderData.orderItems?.length || 0,
        createdBy: userId
      });
      
      return order;
    } catch (error) {
      console.error('Error in createSalesOrder:', error);
      throw error;
    }
  }

  /**
   * Get sales order by ID
   */
  async getSalesOrderById(id: string, companyId: string): Promise<any> {
    try {
      const order = await CustomerOrder.findOne({
        _id: id,
        companyId: new Types.ObjectId(companyId)
      }).populate('customerId', 'customerName customerCode');

      if (!order) {
        throw new Error('Sales order not found');
      }

      return order;
    } catch (error) {
      console.error('Error in getSalesOrderById:', error);
      throw error;
    }
  }

  /**
   * Update sales order
   */
  async updateSalesOrder(id: string, updateData: any, userId: string, companyId: string): Promise<any> {
    try {
      const order = await CustomerOrder.findOneAndUpdate(
        {
          _id: id,
          companyId: new Types.ObjectId(companyId)
        },
        {
          ...updateData,
          lastModifiedBy: userId,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        throw new Error('Sales order not found');
      }

      return order;
    } catch (error) {
      console.error('Error in updateSalesOrder:', error);
      throw error;
    }
  }

  /**
   * Delete sales order
   */
  async deleteSalesOrder(id: string, companyId: string): Promise<void> {
    try {
      const result = await CustomerOrder.deleteOne({
        _id: id,
        companyId: new Types.ObjectId(companyId)
      });

      if (result.deletedCount === 0) {
        throw new Error('Sales order not found');
      }
    } catch (error) {
      console.error('Error in deleteSalesOrder:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string, 
    paymentStatus: string, 
    amount: number, 
    userId: string, 
    companyId: string
  ): Promise<any> {
    try {
      const order = await CustomerOrder.findOne({
        _id: id,
        companyId: new Types.ObjectId(companyId)
      });

      if (!order) {
        throw new Error('Sales order not found');
      }

      order.payment.paymentStatus = paymentStatus as 'pending' | 'advance_received' | 'partial' | 'paid' | 'overdue';
      if (amount) {
        order.payment.advanceReceived += amount;
        order.payment.balanceAmount = order.orderSummary.finalAmount - order.payment.advanceReceived;
      }

      order.payment.paymentHistory.push({
        paymentDate: new Date(),
        amount: amount || 0,
        paymentMethod: 'manual',
        referenceNumber: `PAY-${Date.now()}`,
        remarks: `Payment status updated to ${paymentStatus}`
      });

      order.lastModifiedBy = new Types.ObjectId(userId);
      order.updatedAt = new Date();

      await order.save();
      return order;
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      throw error;
    }
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(orderIds: string[], updates: any, userId: string, companyId: string): Promise<any> {
    try {
      const result = await CustomerOrder.updateMany(
        {
          _id: { $in: orderIds },
          companyId: new Types.ObjectId(companyId)
        },
        {
          ...updates,
          lastModifiedBy: userId,
          updatedAt: new Date()
        }
      );

      return { updated: result.modifiedCount };
    } catch (error) {
      console.error('Error in bulkUpdateOrders:', error);
      throw error;
    }
  }

  /**
   * Get customer sales report
   */
  async getCustomerSalesReport(companyId: string, dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      const matchQuery: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (dateFrom || dateTo) {
        matchQuery.createdAt = {};
        if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
      }

      const report = await CustomerOrder.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        {
          $group: {
            _id: '$customerId',
            customerName: { $first: '$customer.customerName' },
            customerCode: { $first: '$customer.customerCode' },
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$orderSummary.finalAmount' },
            averageOrderValue: { $avg: '$orderSummary.finalAmount' },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      return report;
    } catch (error) {
      console.error('Error in getCustomerSalesReport:', error);
      throw error;
    }
  }

  /**
   * Get product sales performance
   */
  async getProductSalesPerformance(
    companyId: string, 
    dateFrom?: string, 
    dateTo?: string, 
    category?: string
  ): Promise<any> {
    try {
      const matchQuery: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (dateFrom || dateTo) {
        matchQuery.createdAt = {};
        if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
      }

      const pipeline: any[] = [
        { $match: matchQuery },
        { $unwind: '$orderItems' }
      ];

      if (category) {
        pipeline.push({ $match: { 'orderItems.category': category } });
      }

      pipeline.push({
        $group: {
          _id: '$orderItems.itemName',
          category: { $first: '$orderItems.category' },
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.unitPrice'] } },
          averagePrice: { $avg: '$orderItems.unitPrice' }
        }
      });

      pipeline.push({ $sort: { totalRevenue: -1 } });

      const performance = await CustomerOrder.aggregate(pipeline);
      return performance;
    } catch (error) {
      console.error('Error in getProductSalesPerformance:', error);
      throw error;
    }
  }

  /**
   * Get sales trends
   */
  async getSalesTrends(companyId: string, period: string = 'month', granularity: string = 'daily'): Promise<any> {
    try {
      const dateRange = this.getDateRange(period);
      
      const format = granularity === 'daily' ? '%Y-%m-%d' : '%Y-%m';
      
      const trends = await Invoice.aggregate([
        { 
          $match: { 
            companyId: new Types.ObjectId(companyId),
            status: 'paid',
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format, date: "$createdAt" } },
            amount: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return trends;
    } catch (error) {
      console.error('Error in getSalesTrends:', error);
      throw error;
    }
  }

  /**
   * Export sales data
   */
  async exportSalesData(format: string, filters: any): Promise<any> {
    try {
      // This would integrate with your export service
      // For now, return a placeholder
      return {
        downloadUrl: `/exports/sales-${Date.now()}.${format}`,
        filename: `sales-export-${Date.now()}.${format}`
      };
    } catch (error) {
      console.error('Error in exportSalesData:', error);
      throw error;
    }
  }

  /**
   * Get sales team performance
   */
  async getSalesTeamPerformance(
    companyId: string, 
    dateFrom?: string, 
    dateTo?: string, 
    teamMemberId?: string
  ): Promise<any> {
    try {
      const matchQuery: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (dateFrom || dateTo) {
        matchQuery.createdAt = {};
        if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
      }

      if (teamMemberId) {
        matchQuery['salesPerson.salesPersonId'] = new Types.ObjectId(teamMemberId);
      }

      const performance = await CustomerOrder.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$salesPerson.salesPersonId',
            salesPersonName: { $first: '$salesPerson.salesPersonName' },
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$orderSummary.finalAmount' },
            averageOrderValue: { $avg: '$orderSummary.finalAmount' },
            commission: { $sum: '$salesPerson.commission' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      return performance;
    } catch (error) {
      console.error('Error in getSalesTeamPerformance:', error);
      throw error;
    }
  }

  // Helper methods
  private getDateRange(period: string, dateFrom?: string, dateTo?: string): any {
    const now = new Date();
    const start = dateFrom ? new Date(dateFrom) : new Date();
    const end = dateTo ? new Date(dateTo) : new Date();

    if (!dateFrom && !dateTo) {
      switch (period) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          start.setMonth(now.getMonth() - 1);
      }
    }

    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 1);

    return {
      start,
      end,
      previousStart,
      previousEnd: start
    };
  }

  private async getRecentOrders(companyId: string, limit: number): Promise<any> {
    return CustomerOrder.find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customerId', 'customerName customerCode');
  }

  private async getTopCustomers(companyId: string, start: Date, end: Date, limit: number): Promise<any> {
    return CustomerOrder.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customer.customerName' },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.finalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit }
    ]);
  }

  private async getTopProducts(companyId: string, start: Date, end: Date, limit: number): Promise<any> {
    return CustomerOrder.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.itemName',
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.unitPrice'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }
}
