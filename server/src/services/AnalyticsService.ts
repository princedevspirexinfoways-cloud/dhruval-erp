import CustomerOrder from '../models/CustomerOrder';
import InventoryItem from '../models/InventoryItem';
import ProductionOrder from '../models/ProductionOrder';
import FinancialTransaction from '../models/FinancialTransaction';
import Employee from '../models/Employee';
import Customer from '../models/Customer';
import { SpareSupplier } from '../models/Supplier';
import Visitor from '../models/Visitor';
import Company from '../models/Company';
import { Types } from 'mongoose';

export interface AnalyticsParams {
  companyId: string;
  timeRange?: string;
  startDate?: Date;
  endDate?: Date;
  date?: Date;
  year?: number;
  month?: number;
  departments?: string[];
  products?: string[];
  statuses?: string[];
  metrics?: string[];
  includeDetails?: boolean;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  reportType?: 'dispatched' | 'return' | 'completed' | 'all';
}

export class AnalyticsService {
  async getAnalyticsDashboard(params: AnalyticsParams) {
    try {
      const { companyId, timeRange = '30d', startDate, endDate } = params;

      console.log('Analytics Dashboard Params:', { companyId, timeRange, startDate, endDate });

      // Ensure we have proper Date objects
      const queryEndDate = endDate ? new Date(endDate) : new Date();
      const queryStartDate = startDate ? new Date(startDate) : this.calculateStartDate(timeRange);

      console.log('Calculated dates:', { 
        queryStartDate: queryStartDate.toISOString(), 
        queryEndDate: queryEndDate.toISOString(),
        startDateType: typeof queryStartDate,
        endDateType: typeof queryEndDate
      });

      // Validate dates
      if (isNaN(queryEndDate.getTime()) || isNaN(queryStartDate.getTime())) {
        throw new Error('Invalid date range provided');
      }

      const [orders, inventory, production, financial, employees, customers, suppliers, visitors] = await Promise.all([
        this.getOrdersData(companyId, queryStartDate, queryEndDate),
        this.getInventoryData(companyId),
        this.getProductionData(companyId, queryStartDate, queryEndDate),
        this.getFinancialData(companyId, queryStartDate, queryEndDate),
        this.getEmployeeData(companyId),
        this.getCustomerData(companyId),
        this.getSupplierData(companyId),
        this.getVisitorData(companyId, queryStartDate, queryEndDate)
      ]);

      console.log('Data fetched successfully:', {
        orders: orders.length,
        inventory: inventory.length,
        production: production.length,
        financial: financial.length,
        employees: employees.length,
        customers: customers.length,
        suppliers: suppliers.length,
        visitors: visitors.length
      });

      // Calculate KPIs
      const kpiData = this.calculateKPIs({ orders, inventory, production, financial, employees, customers, suppliers, visitors });
      console.log('Calculated KPIs:', kpiData);

      return {
        kpiData: this.calculateKPIs({ orders, inventory, production, financial, employees, customers, suppliers, visitors }),
        revenueData: this.generateRevenueData(orders, financial, timeRange),
        departmentData: this.generateDepartmentData(employees, production, financial),
        resourceData: this.generateResourceData(employees, production, inventory),
        inventoryDistribution: this.generateInventoryDistribution(inventory),
        vehicleData: this.generateVehicleData(),
        productionBatchData: this.generateProductionBatchData(production),
        purchaseOrderData: this.generatePurchaseOrderData(),
        recentOrders: this.generateRecentOrders(orders),
        recentVisitors: this.generateRecentVisitors(visitors),
        recentProduction: this.generateRecentProduction(production),
        topProducts: this.generateTopProducts(orders, inventory),
        topCustomers: this.generateTopCustomers(orders, customers),
        topSuppliers: this.generateTopSuppliers(suppliers)
      };
    } catch (error) {
      console.error('Error in getAnalyticsDashboard:', error);
      throw error;
    }
  }

  async getKPIData(params: AnalyticsParams) {
    const { companyId, timeRange = '30d', startDate, endDate } = params;

    // Ensure we have proper Date objects
    const queryEndDate = endDate ? new Date(endDate) : new Date();
    const queryStartDate = startDate ? new Date(startDate) : this.calculateStartDate(timeRange);

    // Validate dates
    if (isNaN(queryEndDate.getTime()) || isNaN(queryStartDate.getTime())) {
      throw new Error('Invalid date range provided');
    }

    const [orders, production, financial, inventory] = await Promise.all([
      this.getOrdersData(companyId, queryStartDate, queryEndDate),
      this.getProductionData(companyId, queryStartDate, queryEndDate),
      this.getFinancialData(companyId, queryStartDate, queryEndDate),
      this.getInventoryData(companyId)
    ]);

    return this.calculateKPIs({ orders, production, financial, inventory });
  }

  async getDailyReports(params: AnalyticsParams) {
    const { companyId, date, departments, metrics, includeDetails } = params;

    const reportDate = date || new Date();
    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    const [orders, production, visitors, financial, inventory] = await Promise.all([
      this.getOrdersData(companyId, startDate, endDate),
      this.getProductionData(companyId, startDate, endDate),
      this.getVisitorData(companyId, startDate, endDate),
      this.getFinancialData(companyId, startDate, endDate),
      this.getInventoryData(companyId)
    ]);

    // Filter by departments if specified
    let filteredProduction = production;
    if (departments && departments.length > 0) {
      filteredProduction = production.filter(p =>
        p.product?.productType && departments.includes(p.product.productType)
      );
    }

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0),
      productionOrders: filteredProduction.length,
      completedProduction: filteredProduction.filter(p => p.status === 'completed').length,
      visitors: visitors.length,
      totalExpenses: financial.filter(f => f.transactionType === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
      totalIncome: financial.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + (f.amount || 0), 0),
      inventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => (i.stock?.currentStock || 0) < (i.stock?.reorderLevel || 0)).length
    };

    const result: any = {
      date: reportDate,
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          createdAt: order.createdAt
        })),
        production: filteredProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          department: prod.product?.productType,
          createdAt: prod.createdAt
        })),
        visitors: visitors.map(visitor => ({
          id: visitor._id,
          name: visitor.personalInfo?.fullName || `${visitor.personalInfo?.firstName || ''} ${visitor.personalInfo?.lastName || ''}`.trim(),
          purpose: visitor.visitInfo?.visitPurpose || 'Not specified',
          personToMeet: visitor.hostInfo?.hostName || 'Not specified',
          inTime: visitor.entries?.[0]?.entryDateTime,
          outTime: visitor.exits?.[0]?.exitDateTime
        }))
      };
    }

    return result;
  }

  async getWeeklyReports(params: AnalyticsParams) {
    const { companyId, departments, metrics, includeDetails } = params;

    const startDate = this.getWeekStart();
    const endDate = this.getWeekEnd(startDate);

    const [orders, production, visitors, financial, inventory] = await Promise.all([
      this.getOrdersData(companyId, startDate, endDate),
      this.getProductionData(companyId, startDate, endDate),
      this.getVisitorData(companyId, startDate, endDate),
      this.getFinancialData(companyId, startDate, endDate),
      this.getInventoryData(companyId)
    ]);

    // Filter by departments if specified
    let filteredProduction = production;
    if (departments && departments.length > 0) {
      filteredProduction = production.filter(p =>
        p.product?.productType && departments.includes(p.product.productType)
      );
    }

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0),
      productionOrders: filteredProduction.length,
      completedProduction: filteredProduction.filter(p => p.status === 'completed').length,
      visitors: visitors.length,
      totalExpenses: financial.filter(f => f.transactionType === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
      totalIncome: financial.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + (f.amount || 0), 0),
      inventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => (i.stock?.currentStock || 0) < (i.stock?.reorderLevel || 0)).length
    };

    const result: any = {
      weekStart: startDate,
      weekEnd: endDate,
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          createdAt: order.createdAt
        })),
        production: filteredProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          department: prod.product?.productType,
          createdAt: prod.createdAt
        })),
        visitors: visitors.map(visitor => ({
          id: visitor._id,
          name: visitor.personalInfo?.fullName || `${visitor.personalInfo?.firstName || ''} ${visitor.personalInfo?.lastName || ''}`.trim(),
          purpose: visitor.visitInfo?.visitPurpose || 'Not specified',
          personToMeet: visitor.hostInfo?.hostName || 'Not specified',
          inTime: visitor.entries?.[0]?.entryDateTime,
          outTime: visitor.exits?.[0]?.exitDateTime
        }))
      };
    }

    return result;
  }

  async getMonthlyReports(params: AnalyticsParams) {
    const { companyId, year, month, departments, metrics, includeDetails } = params;

    const reportYear = year || new Date().getFullYear();
    const reportMonth = month || new Date().getMonth() + 1;

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

    const [orders, production, visitors, financial, inventory] = await Promise.all([
      this.getOrdersData(companyId, startDate, endDate),
      this.getProductionData(companyId, startDate, endDate),
      this.getVisitorData(companyId, startDate, endDate),
      this.getFinancialData(companyId, startDate, endDate),
      this.getInventoryData(companyId)
    ]);

    // Filter by departments if specified
    let filteredProduction = production;
    if (departments && departments.length > 0) {
      filteredProduction = production.filter(p =>
        p.product?.productType && departments.includes(p.product.productType)
      );
    }

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0),
      productionOrders: filteredProduction.length,
      completedProduction: filteredProduction.filter(p => p.status === 'completed').length,
      visitors: visitors.length,
      totalExpenses: financial.filter(f => f.transactionType === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
      totalIncome: financial.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + (f.amount || 0), 0),
      inventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => (i.stock?.currentStock || 0) < (i.stock?.reorderLevel || 0)).length
    };

    const result: any = {
      year: reportYear,
      month: reportMonth,
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          createdAt: order.createdAt
        })),
        production: filteredProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          department: prod.product?.productType,
          createdAt: prod.createdAt
        })),
        visitors: visitors.map(visitor => ({
          id: visitor._id,
          name: visitor.personalInfo?.fullName || `${visitor.personalInfo?.firstName || ''} ${visitor.personalInfo?.lastName || ''}`.trim(),
          purpose: visitor.visitInfo?.visitPurpose || 'Not specified',
          personToMeet: visitor.hostInfo?.hostName || 'Not specified',
          inTime: visitor.entries?.[0]?.entryDateTime,
          outTime: visitor.exits?.[0]?.exitDateTime
        }))
      };
    }

    return result;
  }

  async getCustomReports(params: AnalyticsParams) {
    const {
      companyId,
      startDate,
      endDate,
      departments,
      products,
      statuses,
      metrics,
      groupBy,
      sortBy,
      sortOrder,
      page = 1,
      limit = 50
    } = params;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // Build query filters
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date range provided');
    }

    const dateFilter = { $gte: start, $lte: end };

    const queryFilters: any = {
      companyId: new Types.ObjectId(companyId),
      createdAt: dateFilter
    };

    if (statuses && statuses.length > 0) {
      queryFilters.status = { $in: statuses };
    }

    if (products && products.length > 0) {
      queryFilters['items.productName'] = { $in: products };
    }

    const [orders, production, visitors, financial, inventory] = await Promise.all([
      CustomerOrder.aggregate([{ $match: queryFilters }]),
      ProductionOrder.aggregate([{
        $match: {
          companyId: new Types.ObjectId(companyId),
          createdAt: dateFilter,
          ...(departments && departments.length > 0 ? { department: { $in: departments } } : {})
        }
      }]),
      Visitor.aggregate([{
        $match: {
          companyId: new Types.ObjectId(companyId),
          createdAt: dateFilter
        }
      }]),
      FinancialTransaction.aggregate([{
        $match: {
          companyId: new Types.ObjectId(companyId),
          createdAt: dateFilter
        }
      }]),
      InventoryItem.find({ companyId: new Types.ObjectId(companyId) }).lean()
    ]);

    // Calculate summary
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0),
      productionOrders: production.length,
      completedProduction: production.filter(p => p.status === 'completed').length,
      visitors: visitors.length,
      totalExpenses: financial.filter(f => f.transactionType === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
      totalIncome: financial.filter(f => f.transactionType === 'income').reduce((sum, f) => sum + (f.amount || 0), 0),
      inventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => (i.stock?.currentStock || 0) < (i.stock?.reorderLevel || 0)).length
    };

    // Prepare data for response
    const allData = [
      ...orders.map(order => ({
        type: 'order',
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.orderSummary?.totalAmount || 0,
        status: order.status,
        createdAt: order.createdAt
      })),
      ...production.map(prod => ({
        type: 'production',
        id: prod._id,
        orderNumber: prod.productionOrderNumber,
        productName: prod.product?.design || prod.product?.productType || 'Unknown',
        quantity: prod.orderQuantity,
        status: prod.status,
        department: prod.product?.productType,
        createdAt: prod.createdAt
      })),
      ...visitors.map(visitor => ({
        type: 'visitor',
        id: visitor._id,
        name: visitor.personalInfo?.fullName || `${visitor.personalInfo?.firstName || ''} ${visitor.personalInfo?.lastName || ''}`.trim(),
        purpose: visitor.visitInfo?.visitPurpose || 'Not specified',
        personToMeet: visitor.hostInfo?.hostName || 'Not specified',
        inTime: visitor.entries?.[0]?.entryDateTime,
        outTime: visitor.exits?.[0]?.exitDateTime,
        createdAt: visitor.createdAt
      }))
    ];

    // Sort data
    if (sortBy && sortOrder) {
      allData.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a];
        const bValue = b[sortBy as keyof typeof b];

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: allData.length,
      page,
      limit,
      totalPages: Math.ceil(allData.length / limit),
      summary
    };
  }

  async getRealTimeAnalytics(params: AnalyticsParams) {
    const { companyId } = params;

    const now = new Date();
    const since = new Date(now.getTime() - (30 * 60 * 1000));

    const [orders, production, visitors] = await Promise.all([
      this.getOrdersData(companyId, since, now),
      this.getProductionData(companyId, since, now),
      this.getVisitorData(companyId, since, now)
    ]);

    return {
      timestamp: now,
      metrics: {
        orders: orders.length,
        production: production.length,
        visitors: visitors.length
      }
    };
  }

  /**
   * Get dispatched reports
   */
  async getDispatchedReports(params: AnalyticsParams) {
    const { companyId, startDate, endDate, includeDetails } = params;

    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const queryEndDate = endDate || new Date();

    const [orders, production] = await Promise.all([
      this.getOrdersData(companyId, queryStartDate, queryEndDate),
      this.getProductionData(companyId, queryStartDate, queryEndDate)
    ]);

    // Filter for dispatched items
    const dispatchedOrders = orders.filter(order => order.status === 'dispatched');
    const dispatchedProduction = production.filter(prod => prod.status === 'completed');

    const summary = {
      totalDispatched: dispatchedOrders.length + dispatchedProduction.length,
      dispatchedOrders: dispatchedOrders.length,
      dispatchedProduction: dispatchedProduction.length,
      totalValue: dispatchedOrders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0) +
                  dispatchedProduction.reduce((sum, prod) => sum + (prod.costSummary?.totalProductionCost || 0), 0),
      averageDispatchTime: this.calculateAverageDispatchTime(dispatchedOrders, dispatchedProduction)
    };

    const result: any = {
      reportType: 'dispatched',
      period: { startDate: queryStartDate, endDate: queryEndDate },
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: dispatchedOrders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          dispatchedAt: order.updatedAt,
          createdAt: order.createdAt
        })),
        production: dispatchedProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          dispatchedAt: prod.updatedAt,
          createdAt: prod.createdAt
        }))
      };
    }

    return result;
  }

  /**
   * Get return reports
   */
  async getReturnReports(params: AnalyticsParams) {
    const { companyId, startDate, endDate, includeDetails } = params;

    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const queryEndDate = endDate || new Date();

    const [orders, production] = await Promise.all([
      this.getOrdersData(companyId, queryStartDate, queryEndDate),
      this.getProductionData(companyId, queryStartDate, queryEndDate)
    ]);

    // Filter for returned items
    const returnedOrders = orders.filter(order => order.status === 'returned');
    const returnedProduction = production.filter(prod => prod.status === 'cancelled');

    const summary = {
      totalReturns: returnedOrders.length + returnedProduction.length,
      returnedOrders: returnedOrders.length,
      returnedProduction: returnedProduction.length,
      totalReturnValue: returnedOrders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0) +
                       returnedProduction.reduce((sum, prod) => sum + (prod.costSummary?.totalProductionCost || 0), 0),
      returnRate: this.calculateReturnRate(orders, production, returnedOrders, returnedProduction)
    };

    const result: any = {
      reportType: 'return',
      period: { startDate: queryStartDate, endDate: queryEndDate },
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: returnedOrders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          returnReason: 'Not specified',
          returnedAt: order.updatedAt,
          createdAt: order.createdAt
        })),
        production: returnedProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          returnReason: 'Not specified',
          returnedAt: prod.updatedAt,
          createdAt: prod.createdAt
        }))
      };
    }

    return result;
  }

  /**
   * Get completed reports
   */
  async getCompletedReports(params: AnalyticsParams) {
    const { companyId, startDate, endDate, includeDetails } = params;

    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const queryEndDate = endDate || new Date();

    const [orders, production] = await Promise.all([
      this.getOrdersData(companyId, queryStartDate, queryEndDate),
      this.getProductionData(companyId, queryStartDate, queryEndDate)
    ]);

    // Filter for completed items
    const completedOrders = orders.filter(order => order.status === 'completed' || order.status === 'delivered');
    const completedProduction = production.filter(prod => prod.status === 'completed');

    const summary = {
      totalCompleted: completedOrders.length + completedProduction.length,
      completedOrders: completedOrders.length,
      completedProduction: completedProduction.length,
      totalValue: completedOrders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0) +
                 completedProduction.reduce((sum, prod) => sum + (prod.costSummary?.totalProductionCost || 0), 0),
      completionRate: this.calculateCompletionRate(orders, production, completedOrders, completedProduction),
      averageCompletionTime: this.calculateAverageCompletionTime(completedOrders, completedProduction)
    };

    const result: any = {
      reportType: 'completed',
      period: { startDate: queryStartDate, endDate: queryEndDate },
      summary
    };

    if (includeDetails) {
      result.data = {
        orders: completedOrders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.orderSummary?.totalAmount || 0,
          status: order.status,
          completedAt: order.updatedAt,
          createdAt: order.createdAt
        })),
        production: completedProduction.map(prod => ({
          id: prod._id,
          orderNumber: prod.productionOrderNumber,
          productName: prod.product?.design || prod.product?.productType || 'Unknown',
          quantity: prod.orderQuantity,
          status: prod.status,
          completedAt: prod.updatedAt,
          createdAt: prod.createdAt
        }))
      };
    }

    return result;
  }

  async getFilterOptions(companyId: string) {
    const [departments, products, statuses] = await Promise.all([
      this.getDepartments(companyId),
      this.getProducts(companyId),
      this.getStatuses(companyId)
    ]);

    return {
      departments,
      products,
      statuses,
      metrics: this.getAvailableMetrics()
    };
  }

  async getReportTemplates(companyId: string) {
    return [
      {
        id: 'daily-summary',
        name: 'Daily Summary',
        description: 'Daily business summary report',
        type: 'daily'
      },
      {
        id: 'weekly-performance',
        name: 'Weekly Performance',
        description: 'Weekly performance metrics',
        type: 'weekly'
      },
      {
        id: 'monthly-review',
        name: 'Monthly Review',
        description: 'Monthly business review',
        type: 'monthly'
      }
    ];
  }

  async saveReportTemplate(templateData: any) {
    return {
      id: `template-${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Private helper methods
  private calculateStartDate(timeRange: string): Date {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      default:
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    console.log(`Calculated start date for ${timeRange}:`, startDate);
    return startDate;
  }

  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  private getWeekEnd(weekStart: Date): Date {
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }

  private calculateKPIs(data: any) {
    const { orders, inventory, production, financial, employees, customers, suppliers, visitors } = data;

    console.log('Calculating KPIs with data:', {
      ordersCount: orders?.length || 0,
      inventoryCount: inventory?.length || 0,
      productionCount: production?.length || 0,
      financialCount: financial?.length || 0,
      employeesCount: employees?.length || 0,
      customersCount: customers?.length || 0,
      suppliersCount: suppliers?.length || 0,
      visitorsCount: visitors?.length || 0
    });

    const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.orderSummary?.totalAmount || order.totalAmount || 0), 0) || 0;
    const totalExpenses = financial?.filter((f: any) => f.transactionType === 'expense').reduce((sum: number, f: any) => sum + (f.amount || 0), 0) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const averageOrderValue = orders?.length > 0 ? totalRevenue / orders.length : 0;
    
    const completedOrders = orders?.filter((o: any) => o.status === 'completed').length || 0;
    const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;
    const cancelledOrders = orders?.filter((o: any) => o.status === 'cancelled').length || 0;
    
    const completedProduction = production?.filter((p: any) => p.status === 'completed').length || 0;
    const productionEfficiency = production?.length > 0 ? (completedProduction / production.length) * 100 : 0;
    
    const lowStockItems = inventory?.filter((i: any) => (i.stock?.currentStock || 0) < (i.stock?.reorderLevel || 0)).length || 0;
    const inventoryTurnover = inventory?.length > 0 ? (totalRevenue / inventory.length) : 0;

    const kpiResult = {
      totalOrders: orders?.length || 0,
      totalRevenue,
      productionOrders: production?.length || 0,
      completedProduction,
      totalInventory: inventory?.length || 0,
      totalEmployees: employees?.length || 0,
      totalCustomers: customers?.length || 0,
      totalSuppliers: suppliers?.length || 0,
      totalVisitors: visitors?.length || 0,
      totalVehicles: 3, // Mock vehicle count
      totalPurchaseOrders: 3, // Mock purchase order count
      totalProductionBatches: production?.length || 0,
      completedBatches: completedProduction,
      totalProducts: inventory?.length || 0,
      lowStockItems,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalExpenses,
      netProfit,
      averageOrderValue,
      productionEfficiency,
      inventoryTurnover
    };

    console.log('Final KPI result:', kpiResult);
    return kpiResult;
  }

  private generateRevenueData(orders: any[], financial: any[], timeRange: string) {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.orderSummary?.totalAmount || order.totalAmount || 0), 0);

    return {
      total: totalRevenue,
      breakdown: this.groupDataByTime(orders, timeRange)
    };
  }

  private generateDepartmentData(employees: any[], production: any[], financial: any[]) {
    const departmentMap = new Map();

    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { count: 0, production: 0, revenue: 0 });
      }
      const deptData = departmentMap.get(dept);
      deptData.count += 1;
    });

    return Array.from(departmentMap.entries()).map(([dept, data]) => ({
      department: dept,
      ...data
    }));
  }

  private generateResourceData(employees: any[], production: any[], inventory: any[]) {
    return {
      totalEmployees: employees.length,
      activeProduction: production.filter(p => p.status === 'in_progress').length,
      totalInventory: inventory.length
    };
  }

  private generateInventoryDistribution(inventory: any[]) {
    const categoryMap = new Map();

    inventory.forEach(item => {
      const category = item.category || 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, 0);
      }
      const currentValue = categoryMap.get(category);
      categoryMap.set(category, currentValue + item.quantity * (item.unitPrice || 0));
    });

    const totalValue = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(categoryMap.entries()).map(([category, value]: [string, number]) => ({
      category,
      value,
      percentage: Math.round((value / totalValue) * 100)
    }));
  }

  private groupDataByTime(orders: any[], timeRange: string) {
    const timeData = new Map();

    orders.forEach(order => {
      const timeKey = this.getTimeKey(new Date(order.createdAt), timeRange);
      if (!timeData.has(timeKey)) {
        timeData.set(timeKey, { orders: 0, revenue: 0 });
      }
      const current = timeData.get(timeKey);
      current.orders += 1;
      current.revenue += order.orderSummary?.totalAmount || order.totalAmount || 0;
    });

    return Array.from(timeData.entries()).map(([time, data]) => ({
      time,
      ...data
    }));
  }

  private getTimeKey(date: Date, timeRange: string): string {
    switch (timeRange) {
      case '7d':
        return date.toISOString().split('T')[0];
      case '30d':
        return date.toISOString().split('T')[0];
      case '90d':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case '1y':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private async getDepartments(companyId: string) {
    const employees = await Employee.find({ companyId }).distinct('department');
    return employees.filter(dept => dept).map(dept => ({ value: dept, label: dept }));
  }

  private async getProducts(companyId: string) {
    const products = await InventoryItem.find({ companyId }).distinct('name');
    return products.map(product => ({ value: product, label: product }));
  }

  private async getStatuses(companyId: string) {
    const [orderStatuses, productionStatuses] = await Promise.all([
      CustomerOrder.distinct('status'),
      ProductionOrder.distinct('status')
    ]);

    const allStatuses = [...new Set([...orderStatuses, ...productionStatuses])];
    return allStatuses.map(status => ({ value: status, label: status }));
  }

  private getAvailableMetrics() {
    return [
      { value: 'revenue', label: 'Revenue' },
      { value: 'orders', label: 'Orders' },
      { value: 'production', label: 'Production' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'employees', label: 'Employees' },
      { value: 'customers', label: 'Customers' },
      { value: 'all', label: 'All Metrics' }
    ];
  }

  // Data fetching methods
  private async getOrdersData(companyId: string, startDate: Date, endDate: Date) {
    try {
      // Ensure dates are proper Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid dates provided to getOrdersData:', { startDate, endDate });
        return [];
      }

      console.log('Orders query:', {
        companyId,
        start: start.toISOString(),
        end: end.toISOString()
      });

      // Use simple find query with proper ObjectId conversion
      const orders = await CustomerOrder.find({
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).lean();

      console.log(`Found ${orders.length} orders for company ${companyId}`);

      if (orders.length > 0) {
        console.log('Sample order:', {
          id: orders[0]._id,
          orderNumber: orders[0].orderNumber,
          totalAmount: orders[0].orderSummary?.totalAmount,
          createdAt: orders[0].createdAt
        });
      }

      return orders;
    } catch (error) {
      console.error('Error in getOrdersData:', error);
      return [];
    }
  }

  private async getInventoryData(companyId: string) {
    try {
      const inventory = await InventoryItem.find({
        companyId: new Types.ObjectId(companyId)
      }).lean();

      console.log(`Found ${inventory.length} inventory items for company ${companyId}`);
      return inventory;
    } catch (error) {
      console.error('Error in getInventoryData:', error);
      return [];
    }
  }

  private async getProductionData(companyId: string, startDate: Date, endDate: Date) {
    try {
      // Ensure dates are proper Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid dates provided to getProductionData:', { startDate, endDate });
        return [];
      }

      const production = await ProductionOrder.find({
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).lean();

      console.log(`Found ${production.length} production orders for company ${companyId}`);
      return production;
    } catch (error) {
      console.error('Error in getProductionData:', error);
      return [];
    }
  }

  private async getFinancialData(companyId: string, startDate: Date, endDate: Date) {
    try {
      // Ensure dates are proper Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid dates provided to getFinancialData:', { startDate, endDate });
        return [];
      }

      console.log('Querying financial data with dates:', { start, end });

      const financial = await FinancialTransaction.find({
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).lean();

      console.log(`Found ${financial.length} financial transactions for company ${companyId}`);
      return financial;
    } catch (error) {
      console.error('Error in getFinancialData:', error);
      return [];
    }
  }

  private async getEmployeeData(companyId: string) {
    try {
      const employees = await Employee.find({
        companyId: new Types.ObjectId(companyId)
      }).lean();

      console.log(`Found ${employees.length} employees for company ${companyId}`);
      return employees;
    } catch (error) {
      console.error('Error in getEmployeeData:', error);
      return [];
    }
  }

  private async getCustomerData(companyId: string) {
    try {
      const customers = await Customer.find({
        companyId: new Types.ObjectId(companyId)
      }).lean();

      console.log(`Found ${customers.length} customers for company ${companyId}`);
      return customers;
    } catch (error) {
      console.error('Error in getCustomerData:', error);
      return [];
    }
  }

  private async getSupplierData(companyId: string) {
    try {
      const suppliers = await SpareSupplier.find({
        companyId: new Types.ObjectId(companyId)
      }).lean();

      console.log(`Found ${suppliers.length} suppliers for company ${companyId}`);
      return suppliers;
    } catch (error) {
      console.error('Error in getSupplierData:', error);
      return [];
    }
  }

  private async getVisitorData(companyId: string, startDate: Date, endDate: Date) {
    try {
      // Ensure dates are proper Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid dates provided to getVisitorData:', { startDate, endDate });
        return [];
      }

      const visitors = await Visitor.find({
        companyId: new Types.ObjectId(companyId),
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).lean();

      console.log(`Found ${visitors.length} visitors for company ${companyId}`);
      return visitors;
    } catch (error) {
      console.error('Error in getVisitorData:', error);
      return [];
    }
  }

  async exportReport(params: any) {
    const {
      reportType,
      format,
      timeRange,
      startDate,
      endDate,
      departments,
      products,
      statuses,
      includeCharts,
      includeDetails
    } = params;

    try {
      let reportData: any = {};

      // Get data based on report type
      switch (reportType) {
        case 'dashboard':
          reportData = await this.getAnalyticsDashboard({
            companyId: params.companyId,
            timeRange,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            departments,
            metrics: ['all']
          });
          break;
        case 'daily':
          reportData = await this.getDailyReports({
            companyId: params.companyId,
            date: startDate ? new Date(startDate) : new Date(),
            departments,
            metrics: ['all'],
            includeDetails
          });
          break;
        case 'weekly':
          reportData = await this.getWeeklyReports({
            companyId: params.companyId,
            departments,
            metrics: ['all'],
            includeDetails
          });
          break;
        case 'monthly':
          reportData = await this.getMonthlyReports({
            companyId: params.companyId,
            year: startDate ? new Date(startDate).getFullYear() : new Date().getFullYear(),
            month: startDate ? new Date(startDate).getMonth() + 1 : new Date().getMonth() + 1,
            departments,
            metrics: ['all'],
            includeDetails
          });
          break;
        case 'custom':
          reportData = await this.getCustomReports({
            companyId: params.companyId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            departments,
            products,
            statuses,
            metrics: ['all'],
            includeDetails: true
          });
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Generate export file
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `analytics-${reportType}-${timestamp}`;

      if (format === 'excel') {
        return {
          success: true,
          message: 'Excel report generated successfully',
          downloadUrl: `/api/analytics/export/${filename}.xlsx`,
          data: reportData
        };
      } else if (format === 'pdf') {
        return {
          success: true,
          message: 'PDF report generated successfully',
          downloadUrl: `/api/analytics/export/${filename}.pdf`,
          data: reportData
        };
      } else if (format === 'csv') {
        return {
          success: true,
          message: 'CSV report generated successfully',
          downloadUrl: `/api/analytics/export/${filename}.csv`,
          data: reportData
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export report');
    }
  }

  // New data generation methods for comprehensive analytics
  private generateVehicleData() {
    // Mock vehicle data - in real implementation, fetch from Vehicle model
    return [
      {
        vehicleId: 'V001',
        vehicleNumber: 'MH-12-AB-1234',
        type: 'Truck',
        status: 'active',
        lastMaintenance: '2024-01-15',
        totalTrips: 45,
        totalDistance: 2500
      },
      {
        vehicleId: 'V002',
        vehicleNumber: 'MH-12-CD-5678',
        type: 'Van',
        status: 'maintenance',
        lastMaintenance: '2024-01-20',
        totalTrips: 32,
        totalDistance: 1800
      },
      {
        vehicleId: 'V003',
        vehicleNumber: 'MH-12-EF-9012',
        type: 'Car',
        status: 'active',
        lastMaintenance: '2024-01-10',
        totalTrips: 28,
        totalDistance: 1200
      }
    ];
  }

  private generateProductionBatchData(production: any[]) {
    return production.slice(0, 10).map((prod, index) => ({
      batchId: prod.productionOrderNumber || `B${index + 1}`,
      productName: prod.product?.design || prod.product?.productType || 'Unknown Product',
      quantity: prod.orderQuantity || 0,
      status: prod.status || 'pending',
      startDate: prod.createdAt || new Date().toISOString(),
      endDate: prod.expectedCompletionDate || new Date().toISOString(),
      efficiency: Math.random() * 100 // Mock efficiency calculation
    }));
  }

  private generatePurchaseOrderData() {
    // Mock purchase order data - in real implementation, fetch from PurchaseOrder model
    return [
      {
        orderId: 'PO001',
        supplierName: 'ABC Suppliers Ltd',
        totalAmount: 150000,
        status: 'pending',
        orderDate: '2024-01-15',
        expectedDelivery: '2024-01-25'
      },
      {
        orderId: 'PO002',
        supplierName: 'XYZ Materials Inc',
        totalAmount: 85000,
        status: 'completed',
        orderDate: '2024-01-10',
        expectedDelivery: '2024-01-20'
      },
      {
        orderId: 'PO003',
        supplierName: 'DEF Components Co',
        totalAmount: 120000,
        status: 'in_progress',
        orderDate: '2024-01-12',
        expectedDelivery: '2024-01-22'
      }
    ];
  }

  private generateRecentOrders(orders: any[]) {
    return orders.slice(0, 10).map(order => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.orderSummary?.totalAmount || order.totalAmount || 0,
      status: order.status,
      createdAt: order.createdAt
    }));
  }

  private generateRecentVisitors(visitors: any[]) {
    return visitors.slice(0, 10).map(visitor => ({
      name: visitor.personalInfo?.fullName || `${visitor.personalInfo?.firstName || ''} ${visitor.personalInfo?.lastName || ''}`.trim(),
      purpose: visitor.visitInfo?.visitPurpose || 'Not specified',
      personToMeet: visitor.hostInfo?.hostName || 'Not specified',
      inTime: visitor.entries?.[0]?.entryDateTime,
      outTime: visitor.exits?.[0]?.exitDateTime
    }));
  }

  private generateRecentProduction(production: any[]) {
    return production.slice(0, 10).map(prod => ({
      batchId: prod.productionOrderNumber,
      productName: prod.product?.design || prod.product?.productType || 'Unknown',
      quantity: prod.orderQuantity,
      status: prod.status,
      department: prod.product?.productType,
      createdAt: prod.createdAt
    }));
  }

  private generateTopProducts(orders: any[], inventory: any[]) {
    // Calculate product performance from orders
    const productMap = new Map();
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown Product';
          if (!productMap.has(productName)) {
            productMap.set(productName, { name: productName, quantity: 0, revenue: 0 });
          }
          const product = productMap.get(productName);
          product.quantity += item.quantity || 0;
          product.revenue += (item.quantity || 0) * (item.unitPrice || 0);
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private generateTopCustomers(orders: any[], customers: any[]) {
    // Calculate customer performance from orders
    const customerMap = new Map();
    
    orders.forEach(order => {
      const customerName = order.customerName || 'Unknown Customer';
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, { name: customerName, orders: 0, totalSpent: 0 });
      }
      const customer = customerMap.get(customerName);
      customer.orders += 1;
      customer.totalSpent += order.orderSummary?.totalAmount || order.totalAmount || 0;
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  private generateTopSuppliers(suppliers: any[]) {
    // Mock supplier performance data - in real implementation, calculate from purchase orders
    return suppliers.slice(0, 10).map((supplier, index) => ({
      name: supplier.supplierName || supplier.name || `Supplier ${index + 1}`,
      orders: Math.floor(Math.random() * 20) + 5,
      totalValue: Math.floor(Math.random() * 500000) + 100000
    }));
  }

  // Helper calculation methods for reports
  private calculateAverageDispatchTime(dispatchedOrders: any[], dispatchedProduction: any[]) {
    const allDispatched = [...dispatchedOrders, ...dispatchedProduction];
    if (allDispatched.length === 0) return 0;

    const totalTime = allDispatched.reduce((sum, item) => {
      const created = new Date(item.createdAt);
      const dispatched = new Date(item.updatedAt);
      return sum + (dispatched.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / allDispatched.length / (1000 * 60 * 60 * 24)); // Days
  }

  private calculateReturnRate(orders: any[], production: any[], returnedOrders: any[], returnedProduction: any[]) {
    const totalItems = orders.length + production.length;
    const totalReturns = returnedOrders.length + returnedProduction.length;
    return totalItems > 0 ? (totalReturns / totalItems) * 100 : 0;
  }

  private calculateCompletionRate(orders: any[], production: any[], completedOrders: any[], completedProduction: any[]) {
    const totalItems = orders.length + production.length;
    const totalCompleted = completedOrders.length + completedProduction.length;
    return totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;
  }

  private calculateAverageCompletionTime(completedOrders: any[], completedProduction: any[]) {
    const allCompleted = [...completedOrders, ...completedProduction];
    if (allCompleted.length === 0) return 0;

    const totalTime = allCompleted.reduce((sum, item) => {
      const created = new Date(item.createdAt);
      const completed = new Date(item.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / allCompleted.length / (1000 * 60 * 60 * 24)); // Days
  }
}
