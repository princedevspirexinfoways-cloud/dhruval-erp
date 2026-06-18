import PurchaseOrder from '../models/PurchaseOrder';
import { SpareSupplier } from '../models/Supplier';
import Company from '../models/Company';

export interface PurchaseAnalyticsParams {
  timeRange?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  category?: string;
  status?: string;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDetails?: boolean;
  page?: number;
  limit?: number;
  granularity?: 'daily' | 'weekly' | 'monthly';
  chemicalType?: string;
  fabricType?: string;
  gsm?: string;
  materialType?: string;
  analysisType?: 'quality' | 'delivery' | 'pricing' | 'overall';
}

export interface SupplierPurchaseAnalyticsResult {
  summary: {
    totalPurchase: number;
    purchaseGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    activeSuppliers: number;
    suppliersGrowth: number;
    averageOrderValue: number;
    aovGrowth: number;
    totalChemicals: number;
    totalFabrics: number;
    totalPacking: number;
  };
  purchaseData: Array<{
    period: string;
    purchase: number;
    orders: number;
    suppliers: number;
  }>;
  supplierData: Array<{
    supplierId: string;
    supplierName: string;
    supplierEmail: string;
    totalOrders: number;
    totalPurchase: number;
    averageOrderValue: number;
    lastOrderDate: string;
    status: 'active' | 'inactive';
    category: string;
  }>;
  categoryData: Array<{
    categoryId: string;
    categoryName: string;
    totalOrders: number;
    totalPurchase: number;
    totalQuantity: number;
  }>;
  purchaseTrends: Array<{
    period: string;
    purchase: number;
    orders: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    purchase: number;
    orders: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    purchase: number;
    orders: number;
  }>;
}

export class PurchaseAnalyticsService {
  async getSupplierPurchaseAnalytics(params: PurchaseAnalyticsParams): Promise<SupplierPurchaseAnalyticsResult> {
    try {
      const { companyId, timeRange, startDate, endDate, supplierId, category, status, groupBy, sortBy, sortOrder } = params;
      
      // Build date filter
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      
      // Build match conditions
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (supplierId) matchConditions.supplierId = supplierId;
      if (category) matchConditions.category = category;
      if (status) matchConditions.status = status;

      // Get current period data
      const currentData = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalPurchase: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            uniqueSuppliers: { $addToSet: '$supplierId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalPurchase: 1,
            totalOrders: 1,
            activeSuppliers: { $size: '$uniqueSuppliers' }
          }
        }
      ]);

      // Get previous period data for growth calculation
      const previousDateFilter = this.buildPreviousPeriodFilter(timeRange, startDate, endDate);
      const previousMatchConditions = { ...previousDateFilter };
      if (companyId) previousMatchConditions.companyId = companyId;
      if (supplierId) previousMatchConditions.supplierId = supplierId;
      if (category) previousMatchConditions.category = category;
      if (status) previousMatchConditions.status = status;

      const previousData = await PurchaseOrder.aggregate([
        { $match: previousMatchConditions },
        {
          $group: {
            _id: null,
            totalPurchase: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            uniqueSuppliers: { $addToSet: '$supplierId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalPurchase: 1,
            totalOrders: 1,
            activeSuppliers: { $size: '$uniqueSuppliers' }
          }
        }
      ]);

      const current = currentData[0] || { totalPurchase: 0, totalOrders: 0, activeSuppliers: 0 };
      const previous = previousData[0] || { totalPurchase: 0, totalOrders: 0, activeSuppliers: 0 };

      // Calculate growth percentages
      const purchaseGrowth = previous.totalPurchase > 0 ? ((current.totalPurchase - previous.totalPurchase) / previous.totalPurchase) * 100 : 0;
      const ordersGrowth = previous.totalOrders > 0 ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100 : 0;
      const suppliersGrowth = previous.activeSuppliers > 0 ? ((current.activeSuppliers - previous.activeSuppliers) / previous.activeSuppliers) * 100 : 0;

      // Get supplier data
      const supplierData = await this.getSupplierData(matchConditions, groupBy, sortBy, sortOrder);

      // Get category data
      const categoryData = await this.getCategoryData(matchConditions, groupBy, sortBy, sortOrder);

      // Get purchase trends
      const purchaseTrends = await this.getPurchaseTrends({ companyId, timeRange, startDate, endDate });

      // Get top suppliers
      const topSuppliers = await this.getTopSuppliers(matchConditions, 10);

      // Get top categories
      const topCategories = await this.getTopCategories(matchConditions, 10);

      // Get category breakdown
      const categoryBreakdown = await this.getCategoryBreakdown(matchConditions);

      return {
        summary: {
          totalPurchase: current.totalPurchase,
          purchaseGrowth: Math.round(purchaseGrowth * 100) / 100,
          totalOrders: current.totalOrders,
          ordersGrowth: Math.round(ordersGrowth * 100) / 100,
          activeSuppliers: current.activeSuppliers,
          suppliersGrowth: Math.round(suppliersGrowth * 100) / 100,
          averageOrderValue: current.totalOrders > 0 ? current.totalPurchase / current.totalOrders : 0,
          aovGrowth: 0,
          totalChemicals: categoryBreakdown.chemicals || 0,
          totalFabrics: categoryBreakdown.fabrics || 0,
          totalPacking: categoryBreakdown.packing || 0
        },
        purchaseData: await this.getPurchaseData(matchConditions, timeRange),
        supplierData,
        categoryData,
        purchaseTrends,
        topSuppliers,
        topCategories
      };
    } catch (error) {
      console.error('Error in getSupplierPurchaseAnalytics:', error);
      throw error;
    }
  }

  async getSupplierPurchaseReport(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, supplierId, category, status, groupBy, sortBy, sortOrder, includeDetails, page = 1, limit = 50 } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (supplierId) matchConditions.supplierId = supplierId;
      if (category) matchConditions.category = category;
      if (status) matchConditions.status = status;

      const skip = (page - 1) * limit;

      // Get supplier summary data
      const supplierSummary = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$supplierId',
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            lastOrderDate: { $max: '$orderDate' }
          }
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplierInfo'
          }
        },
        { $unwind: '$supplierInfo' },
        {
          $project: {
            supplierId: '$_id',
            supplierName: '$supplierInfo.name',
            supplierEmail: '$supplierInfo.email',
            totalOrders: 1,
            totalPurchase: 1,
            averageOrderValue: { $divide: ['$totalPurchase', '$totalOrders'] },
            lastOrderDate: 1,
            status: { $cond: [{ $gte: ['$totalOrders', 1] }, 'active', 'inactive'] }
          }
        },
        { $sort: { [sortBy || 'totalPurchase']: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      // Get total count for pagination
      const totalCount = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        { $group: { _id: '$supplierId' } },
        { $count: 'total' }
      ]);

      const totalResults = totalCount[0]?.total || 0;
      const totalPages = Math.ceil(totalResults / limit);

      // Get detailed order information if requested
      let orderDetails = [];
      if (includeDetails) {
        orderDetails = await this.getOrderDetails(matchConditions, supplierSummary.map(s => s.supplierId));
      }

      // Merge order details with supplier summary
      const enrichedData = supplierSummary.map(supplier => ({
        ...supplier,
        orderDetails: includeDetails ? orderDetails.filter(od => od.supplierId === supplier.supplierId) : undefined
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
          supplierId,
          category,
          status,
          groupBy,
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      console.error('Error in getSupplierPurchaseReport:', error);
      throw error;
    }
  }

  async exportSupplierPurchaseReport(params: PurchaseAnalyticsParams & { format: 'pdf' | 'excel' | 'csv' }): Promise<any> {
    try {
      // Get the data for export
      const reportData = await this.getSupplierPurchaseReport({ ...params, includeDetails: true, limit: 1000 });
      
      // Generate export file based on format
      let downloadUrl = '';
      let fileName = `supplier-purchase-report-${new Date().toISOString().split('T')[0]}`;
      
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
      console.error('Error in exportSupplierPurchaseReport:', error);
      throw error;
    }
  }

  async getCategoryPurchasePerformance(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, category, groupBy } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (category) matchConditions.category = category;

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$category',
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$totalQuantity' }
          }
        },
        { $sort: { totalPurchase: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getCategoryPurchasePerformance:', error);
      throw error;
    }
  }

  async getChemicalsPurchaseTracking(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, chemicalType, supplierId } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter, category: 'chemicals' };
      if (companyId) matchConditions.companyId = companyId;
      if (chemicalType) matchConditions.chemicalType = chemicalType;
      if (supplierId) matchConditions.supplierId = supplierId;

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$chemicalType',
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$totalQuantity' },
            avgPrice: { $avg: '$unitPrice' }
          }
        },
        { $sort: { totalPurchase: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getChemicalsPurchaseTracking:', error);
      throw error;
    }
  }

  async getGreyFabricPurchaseTracking(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, fabricType, supplierId, gsm } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter, category: 'fabrics' };
      if (companyId) matchConditions.companyId = companyId;
      if (fabricType) matchConditions.fabricType = fabricType;
      if (supplierId) matchConditions.supplierId = supplierId;
      if (gsm) matchConditions.gsm = gsm;

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              fabricType: '$fabricType',
              gsm: '$gsm'
            },
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$totalQuantity' },
            avgPrice: { $avg: '$unitPrice' }
          }
        },
        { $sort: { totalPurchase: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getGreyFabricPurchaseTracking:', error);
      throw error;
    }
  }

  async getPackingMaterialPurchaseTracking(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, materialType, supplierId } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter, category: 'packing' };
      if (companyId) matchConditions.companyId = companyId;
      if (materialType) matchConditions.materialType = materialType;
      if (supplierId) matchConditions.supplierId = supplierId;

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$materialType',
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$totalQuantity' },
            avgPrice: { $avg: '$unitPrice' }
          }
        },
        { $sort: { totalPurchase: -1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getPackingMaterialPurchaseTracking:', error);
      throw error;
    }
  }

  async getPurchaseTrends(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, granularity } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;

      let groupByFormat = '%Y-%m-%d';
      if (granularity === 'weekly') groupByFormat = '%Y-%U';
      if (granularity === 'monthly') groupByFormat = '%Y-%m';

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$orderDate' }
            },
            purchase: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return result.map(item => ({
        period: item._id,
        purchase: item.purchase,
        orders: item.orders
      }));
    } catch (error) {
      console.error('Error in getPurchaseTrends:', error);
      throw error;
    }
  }

  async getSupplierPerformanceAnalysis(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, analysisType } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;

      let analysisPipeline: any[] = [
        { $match: matchConditions },
        {
          $group: {
            _id: '$supplierId',
            totalOrders: { $sum: 1 },
            totalPurchase: { $sum: '$totalAmount' },
            avgDeliveryTime: { $avg: { $subtract: ['$deliveryDate', '$orderDate'] } },
            qualityScore: { $avg: '$qualityRating' }
          }
        }
      ];

      if (analysisType === 'quality') {
        analysisPipeline.push({ $sort: { qualityScore: -1 } });
      } else if (analysisType === 'delivery') {
        analysisPipeline.push({ $sort: { avgDeliveryTime: 1 } });
      } else if (analysisType === 'pricing') {
        analysisPipeline.push({ $sort: { totalPurchase: -1 } });
      } else {
        analysisPipeline.push({ $sort: { totalPurchase: -1 } });
      }

      const result = await PurchaseOrder.aggregate(analysisPipeline);

      return result;
    } catch (error) {
      console.error('Error in getSupplierPerformanceAnalysis:', error);
      throw error;
    }
  }

  async getPurchaseCostAnalysis(params: PurchaseAnalyticsParams): Promise<any> {
    try {
      const { companyId, timeRange, startDate, endDate, category, groupBy } = params;
      
      const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
      const matchConditions: any = { ...dateFilter };
      if (companyId) matchConditions.companyId = companyId;
      if (category) matchConditions.category = category;

      let groupByField = '$month';
      if (groupBy === 'quarter') groupByField = '$quarter';
      if (groupBy === 'year') groupByField = '$year';
      if (groupBy === 'supplier') groupByField = '$supplierId';

      const result = await PurchaseOrder.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: groupByField,
            totalCost: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return result;
    } catch (error) {
      console.error('Error in getPurchaseCostAnalysis:', error);
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

  private async getSupplierData(matchConditions: any, groupBy: string, sortBy: string, sortOrder: 'asc' | 'desc'): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$supplierId',
          totalOrders: { $sum: 1 },
          totalPurchase: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$orderDate' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: '$supplierInfo' },
      {
        $project: {
          supplierId: '$_id',
          supplierName: '$supplierInfo.name',
          supplierEmail: '$supplierInfo.email',
          totalOrders: 1,
          totalPurchase: 1,
          averageOrderValue: { $divide: ['$totalPurchase', '$totalOrders'] },
          lastOrderDate: 1,
          status: { $cond: [{ $gte: ['$totalOrders', 1] }, 'active', 'inactive'] },
          category: '$supplierInfo.category'
        }
      },
      { $sort: { [sortBy || 'totalPurchase']: sortOrder === 'asc' ? 1 : -1 } }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getCategoryData(matchConditions: any, groupBy: string, sortBy: string, sortOrder: 'asc' | 'desc'): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$category',
          totalOrders: { $sum: 1 },
          totalPurchase: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$totalQuantity' }
        }
      },
      { $sort: { [sortBy || 'totalPurchase']: sortOrder === 'asc' ? 1 : -1 } }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getTopSuppliers(matchConditions: any, limit: number): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$supplierId',
          purchase: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: '$supplierInfo' },
      {
        $project: {
          supplierId: '$_id',
          supplierName: '$supplierInfo.name',
          purchase: 1,
          orders: 1
        }
      },
      { $sort: { purchase: -1 } },
      { $limit: limit }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getTopCategories(matchConditions: any, limit: number): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$category',
          purchase: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { purchase: -1 } },
      { $limit: limit }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getPurchaseData(matchConditions: any, timeRange?: string): Promise<any[]> {
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
          },
          purchase: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          suppliers: { $addToSet: '$supplierId' }
        }
      },
      {
        $project: {
          period: '$_id',
          purchase: 1,
          orders: 1,
          suppliers: { $size: '$suppliers' }
        }
      },
      { $sort: { period: 1 } }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getOrderDetails(matchConditions: any, supplierIds: string[]): Promise<any[]> {
    const pipeline: any[] = [
      { $match: { ...matchConditions, supplierId: { $in: supplierIds } } },
      {
        $project: {
          orderId: 1,
          orderNumber: 1,
          orderDate: 1,
          totalAmount: 1,
          status: 1,
          supplierId: 1,
          category: 1,
          items: 1
        }
      },
      { $sort: { orderDate: -1 } }
    ];

    return await PurchaseOrder.aggregate(pipeline);
  }

  private async getCategoryBreakdown(matchConditions: any): Promise<any> {
    const result = await PurchaseOrder.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$category',
          totalPurchase: { $sum: '$totalAmount' }
        }
      }
    ]);

    const breakdown: any = {};
    result.forEach(item => {
      breakdown[item._id] = item.totalPurchase;
    });

    return breakdown;
  }
}
