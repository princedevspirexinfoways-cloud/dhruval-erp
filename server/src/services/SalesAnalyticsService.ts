import CustomerOrder from '../models/CustomerOrder';
import Customer from '../models/Customer';
import Company from '../models/Company';

export interface SalesAnalyticsParams {
  timeRange?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  productId?: string;
  status?: string;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDetails?: boolean;
  page?: number;
  limit?: number;
  category?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  segmentationType?: 'revenue' | 'frequency' | 'recency' | 'value';
  teamMemberId?: string;
  includeForecast?: boolean;
}

export interface SalesAnalyticsResult {
  summary: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    activeCustomers: number;
    customersGrowth: number;
    averageOrderValue: number;
    aovGrowth: number;
  };
  salesData: Array<{
    period: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  customerData: Array<{
    customerId: string;
    customerName: string;
    customerEmail: string;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastOrderDate: string;
    status: 'active' | 'inactive';
  }>;
  productData: Array<{
    productId: string;
    productName: string;
    category: string;
    totalOrders: number;
    totalRevenue: number;
    totalQuantity: number;
  }>;
  revenueTrends: Array<{
    period: string;
    revenue: number;
    orders: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orders: number;
  }>;
}

export class SalesAnalyticsService {
  async getCustomerSalesAnalytics(params: SalesAnalyticsParams): Promise<SalesAnalyticsResult> {
    try {
      const { companyId, timeRange, startDate, endDate, customerId, productId, status, groupBy, sortBy, sortOrder } = params;
      
      // Build date filter
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      
      // Build match conditions
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (customerId) matchConditions.customerId = customerId;
      if (productId) matchConditions['items.productId'] = productId;
      if (status) matchConditions.status = status;

      // Get current period data
      const currentData = await CustomerOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            uniqueCustomers: { $addToSet: '$customerId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalOrders: 1,
            activeCustomers: { $size: '$uniqueCustomers' }
          }
        }
      ]);

      // Get previous period data for growth calculation
      const previousDateFilter = this.buildPreviousPeriodFilter(timeRange, startDate, endDate);
      const previousMatchConditions = { ...previousDateFilter };
      if (companyId) previousMatchConditions.companyId = companyId;
      if (customerId) previousMatchConditions.customerId = customerId;
      if (productId) previousMatchConditions['items.productId'] = productId;
      if (status) previousMatchConditions.status = status;

      const previousData = await CustomerOrder.aggregate([
        { $match: previousMatchConditions },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            uniqueCustomers: { $addToSet: '$customerId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalOrders: 1,
            activeCustomers: { $size: '$uniqueCustomers' }
          }
        }
      ]);

      const current = currentData[0] || { totalRevenue: 0, totalOrders: 0, activeCustomers: 0 };
      const previous = previousData[0] || { totalRevenue: 0, totalOrders: 0, activeCustomers: 0 };

      // Calculate growth percentages
      const revenueGrowth = previous.totalRevenue > 0 ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 : 0;
      const ordersGrowth = previous.totalOrders > 0 ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100 : 0;
      const customersGrowth = previous.activeCustomers > 0 ? ((current.activeCustomers - previous.activeCustomers) / previous.activeCustomers) * 100 : 0;

      // Get customer data
      const customerData = await this.getCustomerData(matchConditions, groupBy, sortBy, sortOrder);

      // Get product data
      const productData = await this.getProductData(matchConditions, groupBy, sortBy, sortOrder);

      // Get revenue trends
      const revenueTrends = await this.getRevenueTrends(matchConditions, timeRange);

      // Get top customers
      const topCustomers = await this.getTopCustomers(matchConditions, 10);

      // Get top products
      const topProducts = await this.getTopProducts(matchConditions, 10);

      return {
        summary: {
          totalRevenue: current.totalRevenue,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          totalOrders: current.totalOrders,
          ordersGrowth: Math.round(ordersGrowth * 100) / 100,
          activeCustomers: current.activeCustomers,
          customersGrowth: Math.round(customersGrowth * 100) / 100,
          averageOrderValue: current.totalOrders > 0 ? current.totalRevenue / current.totalOrders : 0,
          aovGrowth: 0 // Calculate AOV growth if needed
        },
        salesData: await this.getSalesData(matchConditions, timeRange),
        customerData,
        productData,
        revenueTrends,
        topCustomers,
        topProducts
      };
    } catch (error) {
      console.error('Error in getCustomerSalesAnalytics:', error);
      throw error;
    }
  }

  async getCustomerSalesReport(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, customerId, productId, status, groupBy, sortBy, sortOrder, includeDetails, page = 1, limit = 50 } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (customerId) matchConditions.customerId = customerId;
      if (productId) matchConditions['items.productId'] = productId;
      if (status) matchConditions.status = status;

      const skip = (page - 1) * limit;

      // Get customer summary data
      const customerSummary = await CustomerOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$customerId',
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            lastOrderDate: { $max: '$orderDate' }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $project: {
            customerId: '$_id',
            customerName: '$customerInfo.name',
            customerEmail: '$customerInfo.email',
            totalOrders: 1,
            totalRevenue: 1,
            averageOrderValue: { $divide: ['$totalRevenue', '$totalOrders'] },
            lastOrderDate: 1,
            status: { $cond: [{ $gte: ['$totalOrders', 1] }, 'active', 'inactive'] }
          }
        },
        { $sort: { [sortBy || 'totalRevenue']: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      // Get total count for pagination
      const totalCount = await CustomerOrder.aggregate([
        { $match: matchConditions },
        { $group: { _id: '$customerId' } },
        { $count: 'total' }
      ]);

      const totalResults = totalCount[0]?.total || 0;
      const totalPages = Math.ceil(totalResults / limit);

      // Get detailed order information if requested
      let orderDetails = [];
      if (includeDetails) {
        orderDetails = await this.getOrderDetails(matchConditions, customerSummary.map(c => c.customerId));
      }

      // Merge order details with customer summary
      const enrichedData = customerSummary.map(customer => ({
        ...customer,
        orderDetails: includeDetails ? orderDetails.filter(od => od.customerId === customer.customerId) : undefined
      }));

      return {
        data: enrichedData,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          timeRange,
          startDate,
          endDate,
          customerId,
          productId,
          status,
          groupBy,
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      console.error('Error in getCustomerSalesReport:', error);
      throw error;
    }
  }

  async exportCustomerSalesReport(params: SalesAnalyticsParams & { format: 'pdf' | 'excel' | 'csv' }): Promise<any> {
    try {
      // Get the data for export
      const reportData = await this.getCustomerSalesReport({ ...params, includeDetails: true, limit: 1000 });
      
      // Generate export file based on format
      let downloadUrl = '';
      let fileName = `customer-sales-report-${new Date().toISOString().split('T')[0]}`;
      
      switch (params.format) {
        case 'pdf':
          // Implement PDF generation
          downloadUrl = `/exports/${fileName}.pdf`;
          break;
        case 'excel':
          // Implement Excel generation
          downloadUrl = `/exports/${fileName}.xlsx`;
          break;
        case 'csv':
          // Implement CSV generation
          downloadUrl = `/exports/${fileName}.csv`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      return {
        downloadUrl,
        fileName: `${fileName}.${params.format}`,
        format: params.format,
        recordCount: reportData.data.length
      };
    } catch (error) {
      console.error('Error in exportCustomerSalesReport:', error);
      throw error;
    }
  }

  async getProductSalesPerformance(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, category, groupBy } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (category) matchConditions['items.category'] = category;

      const result = await CustomerOrder.aggregate([
        { $match: matchConditions },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            category: { $first: '$items.category' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$items.totalPrice' },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getProductSalesPerformance:', error);
      throw error;
    }
  }

  async getCategorySalesPerformance(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, groupBy } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;

      const result = await CustomerOrder.aggregate([
        { $match: matchConditions },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$items.totalPrice' },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getCategorySalesPerformance:', error);
      throw error;
    }
  }

  async getSalesTrends(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, granularity } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;

      let groupByFormat = '%Y-%m-%d';
      if (granularity === 'weekly') groupByFormat = '%Y-%U';
      if (granularity === 'monthly') groupByFormat = '%Y-%m';

      const result = await CustomerOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$orderDate' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return result.map(item => ({
        period: item._id,
        revenue: item.revenue,
        orders: item.orders
      }));
    } catch (error) {
      console.error('Error in getSalesTrends:', error);
      throw error;
    }
  }

  async getCustomerSegmentation(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, segmentationType } = params;
      
      const dateFilter = this.buildDateFilter(timeRange);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;

      let segmentationField: any = '$totalAmount';
      if (segmentationType === 'frequency') segmentationField = { $size: '$orders' };
      if (segmentationType === 'recency') segmentationField = { $subtract: [new Date(), '$lastOrderDate'] };

      const result = await CustomerOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$customerId',
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            lastOrderDate: { $max: '$orderDate' }
          }
        },
        {
          $bucket: {
            groupBy: segmentationField,
            boundaries: [0, 1000, 5000, 10000, 50000, 100000],
            default: 'High Value',
            output: {
              count: { $sum: 1 },
              customers: { $push: '$_id' },
              avgRevenue: { $avg: '$totalRevenue' }
            }
          }
        }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getCustomerSegmentation:', error);
      throw error;
    }
  }

  async getSalesTeamPerformance(params: SalesAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, teamMemberId } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (teamMemberId) matchConditions.salesPersonId = teamMemberId;

      const result = await CustomerOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$salesPersonId',
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
            customerCount: { $addToSet: '$customerId' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'salesPerson'
          }
        },
        { $unwind: '$salesPerson' },
        {
          $project: {
            salesPersonId: '$_id',
            salesPersonName: '$salesPerson.name',
            totalRevenue: 1,
            totalOrders: 1,
            avgOrderValue: 1,
            uniqueCustomers: { $size: '$customerCount' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getSalesTeamPerformance:', error);
      throw error;
    }
  }

  // Helper methods
  private buildDateFilter(timeRange?: string, startDate?: string, endDate?: string): any {
    if (startDate && endDate) {
      return {
        orderDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    if (timeRange) {
      const now = new Date();
      let start = new Date();
      
      switch (timeRange) {
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          break;
        default:
          start.setDate(now.getDate() - 30);
      }

      return {
        orderDate: {
          $gte: start,
          $lte: now
        }
      };
    }

    return {};
  }

  private buildPreviousPeriodFilter(timeRange?: string, startDate?: string, endDate?: string): any {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end.getTime() - start.getTime();
      
      return {
        orderDate: {
          $gte: new Date(start.getTime() - duration),
          $lt: start
        }
      };
    }

    if (timeRange) {
      const now = new Date();
      let start = new Date();
      let end = new Date();
      
      switch (timeRange) {
        case '7d':
          end.setDate(now.getDate() - 7);
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          end.setDate(now.getDate() - 30);
          start.setDate(end.getDate() - 30);
          break;
        case '90d':
          end.setDate(now.getDate() - 90);
          start.setDate(end.getDate() - 90);
          break;
        case '1y':
          end.setFullYear(now.getFullYear() - 1);
          start.setFullYear(end.getFullYear() - 1);
          break;
        default:
          end.setDate(now.getDate() - 30);
          start.setDate(end.getDate() - 30);
      }

      return {
        orderDate: {
          $gte: start,
          $lt: end
        }
      };
    }

    return {};
  }

  private async getCustomerData(matchConditions: any, groupBy: string, sortBy: string, sortOrder: 'asc' | 'desc'): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$orderDate' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $project: {
          customerId: '$_id',
          customerName: '$customerInfo.name',
          customerEmail: '$customerInfo.email',
          totalOrders: 1,
          totalRevenue: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$totalOrders'] },
          lastOrderDate: 1,
          status: { $cond: [{ $gte: ['$totalOrders', 1] }, 'active', 'inactive'] }
        }
      },
      { $sort: { [sortBy || 'totalRevenue']: sortOrder === 'asc' ? 1 : -1 } }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getProductData(matchConditions: any, groupBy: string, sortBy: string, sortOrder: 'asc' | 'desc'): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          category: { $first: '$items.category' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { [sortBy || 'totalRevenue']: sortOrder === 'asc' ? 1 : -1 } }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getRevenueTrends(matchConditions: any, timeRange?: string): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getTopCustomers(matchConditions: any, limit: number): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$customerId',
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $project: {
          customerId: '$_id',
          customerName: '$customerInfo.name',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getTopProducts(matchConditions: any, limit: number): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          revenue: { $sum: '$items.totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getSalesData(matchConditions: any, timeRange?: string): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$customerId' }
        }
      },
      {
        $project: {
          period: '$_id',
          revenue: 1,
          orders: 1,
          customers: { $size: '$customers' }
        }
      },
      { $sort: { period: 1 } }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }

  private async getOrderDetails(matchConditions: any, customerIds: string[]): Promise<any[]> {
    const pipeline: any[] = [
      { $match: { ...matchConditions, customerId: { $in: customerIds } } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          orderId: 1,
          orderNumber: 1,
          orderDate: 1,
          totalAmount: 1,
          status: 1,
          customerId: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                productId: '$$item.productId',
                productName: '$$item.productName',
                quantity: '$$item.quantity',
                unitPrice: '$$item.unitPrice',
                totalPrice: '$$item.totalPrice'
              }
            }
          }
        }
      },
      { $sort: { orderDate: -1 } }
    ];

    return await CustomerOrder.aggregate(pipeline);
  }
}
