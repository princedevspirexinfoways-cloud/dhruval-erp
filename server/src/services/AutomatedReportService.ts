import { AdvancedReport } from '../models/AdvancedReport';
import InventoryItem from '../models/InventoryItem';
import ProductionOrder from '../models/ProductionOrder';
import CustomerOrder from '../models/CustomerOrder';
import FinancialTransaction from '../models/FinancialTransaction';
import { Dispatch } from '../models/Dispatch';
import Customer from '../models/Customer';
import { SpareSupplier } from '../models/Supplier';
import StockMovement from '../models/StockMovement';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { createObjectCsvWriter } from 'csv-writer';

export interface ReportData {
  inventory: any;
  production: any;
  sales: any;
  financial: any;
  logistics: any;
  summary: any;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class AutomatedReportService {
  private emailTransporter: nodemailer.Transporter;
  private exportDir: string;

  constructor(emailConfig: EmailConfig) {
    this.emailTransporter = nodemailer.createTransport(emailConfig);
    this.exportDir = path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  /**
   * Ensure export directory exists
   */
  private ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(companyId: string, date: Date = new Date()): Promise<ReportData> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    try {
      // Fetch all data for the day
      const [inventory, production, sales, financial, logistics] = await Promise.all([
        this.getInventoryData(companyId, startDate, endDate),
        this.getProductionData(companyId, startDate, endDate),
        this.getSalesData(companyId, startDate, endDate),
        this.getFinancialData(companyId, startDate, endDate),
        this.getLogisticsData(companyId, startDate, endDate)
      ]);

      // Calculate summary
      const summary = this.calculateDailySummary(inventory, production, sales, financial, logistics);

      return {
        inventory,
        production,
        sales,
        financial,
        logistics,
        summary
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(companyId: string, weekStart: Date): Promise<ReportData> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    try {
      const [inventory, production, sales, financial, logistics] = await Promise.all([
        this.getInventoryData(companyId, weekStart, weekEnd),
        this.getProductionData(companyId, weekStart, weekEnd),
        this.getSalesData(companyId, weekStart, weekEnd),
        this.getFinancialData(companyId, weekStart, weekEnd),
        this.getLogisticsData(companyId, weekStart, weekEnd)
      ]);

      const summary = this.calculateWeeklySummary(inventory, production, sales, financial, logistics, weekStart);

      return {
        inventory,
        production,
        sales,
        financial,
        logistics,
        summary
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(companyId: string, month: number, year: number): Promise<ReportData> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    try {
      const [inventory, production, sales, financial, logistics] = await Promise.all([
        this.getInventoryData(companyId, monthStart, monthEnd),
        this.getProductionData(companyId, monthStart, monthEnd),
        this.getSalesData(companyId, monthStart, monthEnd),
        this.getFinancialData(companyId, monthStart, monthEnd),
        this.getLogisticsData(companyId, monthStart, monthEnd)
      ]);

      const summary = this.calculateMonthlySummary(inventory, production, sales, financial, logistics, month, year);

      return {
        inventory,
        production,
        sales,
        financial,
        logistics,
        summary
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  /**
   * Get inventory data for the period
   */
  private async getInventoryData(companyId: string, startDate: Date, endDate: Date) {
    const inventory = await InventoryItem.find({
      companyId,
      'lifecycle.createdAt': { $gte: startDate, $lte: endDate }
    }).lean();

    const stockMovements = await StockMovement.find({
      companyId,
      movementDate: { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      currentInventory: inventory,
      stockMovements,
      lowStockItems: inventory.filter(item => item.stock.currentStock <= item.stock.reorderLevel),
      newItems: inventory.filter(item => 
        item.createdAt >= startDate && item.createdAt <= endDate
      )
    };
  }

  /**
   * Get production data for the period
   */
  private async getProductionData(companyId: string, startDate: Date, endDate: Date) {
    const productionOrders = await ProductionOrder.find({
      companyId,
      orderDate: { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      totalOrders: productionOrders.length,
      completedOrders: productionOrders.filter(order => order.status === 'completed'),
      pendingOrders: productionOrders.filter(order => order.status === 'draft'),
      inProgressOrders: productionOrders.filter(order => order.status === 'in_progress'),
      totalProduction: productionOrders.reduce((sum, order) => sum + order.completedQuantity, 0),
      efficiency: this.calculateEfficiency(productionOrders)
    };
  }

  /**
   * Get sales data for the period
   */
  private async getSalesData(companyId: string, startDate: Date, endDate: Date) {
    const orders = await CustomerOrder.find({
      companyId,
      orderDate: { $gte: startDate, $lte: endDate }
    }).lean();

    const customers = await Customer.find({
      companyId,
      'lifecycle.createdAt': { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.orderSummary.finalAmount, 0),
      newCustomers: customers.length,
      pendingPayments: orders.filter(order => order.payment.paymentStatus === 'pending'),
      orderStatuses: this.groupByStatus(orders, 'status')
    };
  }

  /**
   * Get financial data for the period
   */
  private async getFinancialData(companyId: string, startDate: Date, endDate: Date) {
    const transactions = await FinancialTransaction.find({
      companyId,
      transactionDate: { $gte: startDate, $lte: endDate }
    }).lean();

    const income = transactions.filter(t => t.transactionType === 'income');
    const expenses = transactions.filter(t => t.transactionType === 'expense');

    return {
      totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
      netProfit: income.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, t) => sum + t.amount, 0),
      transactions: transactions,
      categoryBreakdown: this.groupByCategory(transactions)
    };
  }

  /**
   * Get logistics data for the period
   */
  private async getLogisticsData(companyId: string, startDate: Date, endDate: Date) {
    const dispatches = await Dispatch.find({
      companyId,
      dispatchDate: { $gte: startDate, $lte: endDate }
    }).lean();

    return {
      totalDispatch: dispatches.length,
      totalDeliveries: dispatches.filter(d => d.status === 'completed').length,
      pendingDeliveries: dispatches.filter(d => d.status === 'in-progress').length,
      rtoCount: 0, // Not available in simple dispatch model
      dispatchStatuses: this.groupByStatus(dispatches, 'status')
    };
  }

  /**
   * Calculate daily summary
   */
  private calculateDailySummary(inventory: any, production: any, sales: any, financial: any, logistics: any) {
    return {
      date: new Date(),
      inventorySummary: {
        totalItems: inventory.currentInventory.length,
        totalValue: inventory.currentInventory.reduce((sum: number, item: any) => sum + item.stock.totalValue, 0),
        lowStockItems: inventory.lowStockItems.length,
        newItems: inventory.newItems.length
      },
      productionSummary: {
        totalOrders: production.totalOrders,
        completedOrders: production.completedOrders.length,
        pendingOrders: production.pendingOrders.length,
        totalProduction: production.totalProduction,
        efficiency: production.efficiency
      },
      salesSummary: {
        totalOrders: sales.totalOrders,
        totalRevenue: sales.totalRevenue,
        newCustomers: sales.newCustomers,
        pendingPayments: sales.pendingPayments.length
      },
      financialSummary: {
        totalIncome: financial.totalIncome,
        totalExpenses: financial.totalExpenses,
        netProfit: financial.netProfit,
        bankBalance: 0 // This would need to be calculated from bank accounts
      },
      logisticsSummary: {
        totalDispatch: logistics.totalDispatch,
        totalDeliveries: logistics.totalDeliveries,
        pendingDeliveries: logistics.pendingDeliveries,
        rtoCount: logistics.rtoCount
      }
    };
  }

  /**
   * Calculate weekly summary
   */
  private calculateWeeklySummary(inventory: any, production: any, sales: any, financial: any, logistics: any, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      weekStart,
      weekEnd,
      weekNumber: this.getWeekNumber(weekStart),
      trends: this.calculateTrends(production, sales, financial),
      comparisons: this.calculateWeeklyComparisons(production, sales, financial)
    };
  }

  /**
   * Calculate monthly summary
   */
  private calculateMonthlySummary(inventory: any, production: any, sales: any, financial: any, logistics: any, month: number, year: number) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      month,
      year,
      monthName: monthNames[month - 1],
      monthlyTotals: {
        inventory: this.calculateInventoryTotals(inventory),
        production: this.calculateProductionTotals(production),
        sales: this.calculateSalesTotals(sales),
        financial: this.calculateFinancialTotals(financial),
        logistics: this.calculateLogisticsTotals(logistics)
      },
      monthlyAverages: {
        dailyProduction: production.totalProduction / this.getDaysInMonth(month, year),
        dailySales: sales.totalRevenue / this.getDaysInMonth(month, year),
        dailyExpenses: financial.totalExpenses / this.getDaysInMonth(month, year)
      },
      monthlyGrowth: this.calculateMonthlyGrowth(month, year, production, sales, financial)
    };
  }

  /**
   * Generate Excel file
   */
  async generateExcelFile(reportData: ReportData, reportType: string, date: Date): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add summary data
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Date', date.toDateString()]);
    worksheet.addRow(['Report Type', reportType]);
    worksheet.addRow([]);

    // Add inventory summary
    worksheet.addRow(['Inventory Summary']);
    worksheet.addRow(['Total Items', reportData.summary.inventorySummary.totalItems]);
    worksheet.addRow(['Total Value', reportData.summary.inventorySummary.totalValue]);
    worksheet.addRow(['Low Stock Items', reportData.summary.inventorySummary.lowStockItems]);
    worksheet.addRow(['New Items', reportData.summary.inventorySummary.newItems]);
    worksheet.addRow([]);

    // Add production summary
    worksheet.addRow(['Production Summary']);
    worksheet.addRow(['Total Orders', reportData.summary.productionSummary.totalOrders]);
    worksheet.addRow(['Completed Orders', reportData.summary.productionSummary.completedOrders]);
    worksheet.addRow(['Pending Orders', reportData.summary.productionSummary.pendingOrders]);
    worksheet.addRow(['Total Production', reportData.summary.productionSummary.totalProduction]);
    worksheet.addRow(['Efficiency', `${reportData.summary.productionSummary.efficiency}%`]);
    worksheet.addRow([]);

    // Add sales summary
    worksheet.addRow(['Sales Summary']);
    worksheet.addRow(['Total Orders', reportData.summary.salesSummary.totalOrders]);
    worksheet.addRow(['Total Revenue', reportData.summary.salesSummary.totalRevenue]);
    worksheet.addRow(['New Customers', reportData.summary.salesSummary.newCustomers]);
    worksheet.addRow(['Pending Payments', reportData.summary.salesSummary.pendingPayments]);
    worksheet.addRow([]);

    // Add financial summary
    worksheet.addRow(['Financial Summary']);
    worksheet.addRow(['Total Income', reportData.summary.financialSummary.totalIncome]);
    worksheet.addRow(['Total Expenses', reportData.summary.financialSummary.totalExpenses]);
    worksheet.addRow(['Net Profit', reportData.summary.financialSummary.netProfit]);
    worksheet.addRow([]);

    // Add logistics summary
    worksheet.addRow(['Logistics Summary']);
    worksheet.addRow(['Total Dispatch', reportData.summary.logisticsSummary.totalDispatch]);
    worksheet.addRow(['Total Deliveries', reportData.summary.logisticsSummary.totalDeliveries]);
    worksheet.addRow(['Pending Deliveries', reportData.summary.logisticsSummary.pendingDeliveries]);
    worksheet.addRow(['RTO Count', reportData.summary.logisticsSummary.rtoCount]);

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Generate filename
    const fileName = `${reportType}_Report_${date.toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(this.exportDir, fileName);

    // Save file
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate CSV file
   */
  async generateCSVFile(reportData: ReportData, reportType: string, date: Date): Promise<string> {
    const fileName = `${reportType}_Report_${date.toISOString().split('T')[0]}.csv`;
    const filePath = path.join(this.exportDir, fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'category', title: 'Category' },
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' },
        { id: 'date', title: 'Date' }
      ]
    });

    const records = [
      { category: 'Inventory', metric: 'Total Items', value: reportData.summary.inventorySummary.totalItems, date: date.toDateString() },
      { category: 'Inventory', metric: 'Total Value', value: reportData.summary.inventorySummary.totalValue, date: date.toDateString() },
      { category: 'Inventory', metric: 'Low Stock Items', value: reportData.summary.inventorySummary.lowStockItems, date: date.toDateString() },
      { category: 'Production', metric: 'Total Orders', value: reportData.summary.productionSummary.totalOrders, date: date.toDateString() },
      { category: 'Production', metric: 'Completed Orders', value: reportData.summary.productionSummary.completedOrders, date: date.toDateString() },
      { category: 'Sales', metric: 'Total Revenue', value: reportData.summary.salesSummary.totalRevenue, date: date.toDateString() },
      { category: 'Financial', metric: 'Net Profit', value: reportData.summary.financialSummary.netProfit, date: date.toDateString() },
      { category: 'Logistics', metric: 'Total Deliveries', value: reportData.summary.logisticsSummary.totalDeliveries, date: date.toDateString() }
    ];

    await csvWriter.writeRecords(records);
    return filePath;
  }

  /**
   * Send report via email
   */
  async sendReportEmail(
    to: string[],
    subject: string,
    body: string,
    attachments: string[]
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@erp.com',
        to: to.join(', '),
        subject,
        html: body,
        attachments: attachments.map(filePath => ({
          filename: path.basename(filePath),
          path: filePath
        }))
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Store report data in database
   */
  async storeReportData(
    companyId: string,
    reportType: string,
    reportData: ReportData,
    date: Date
  ): Promise<void> {
    try {
      const report = new AdvancedReport({
        companyId,
        reportId: `${reportType.toUpperCase()}_${date.toISOString().split('T')[0]}`,
        reportName: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${date.toDateString()}`,
        reportDescription: `Automated ${reportType} report generated on ${date.toDateString()}`,
        reportCategory: 'automated',
        reportType: reportType as any,
        filters: {
          dateRange: {
            startDate: date,
            endDate: date,
            period: reportType
          }
        },
        reportData: {
          data: reportData,
          summary: reportData.summary
        },
        status: 'completed',
        createdBy: 'system',
        accessControl: {
          isPublic: true,
          allowedRoles: ['owner', 'manager', 'accountant']
        }
      });

      await report.save();
    } catch (error) {
      console.error('Error storing report data:', error);
      throw error;
    }
  }

  /**
   * Clean up generated files
   */
  async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  }

  /**
   * Helper methods
   */
  private calculateEfficiency(orders: any[]): number {
    if (orders.length === 0) return 0;
    const completed = orders.filter(order => order.status === 'completed').length;
    return Math.round((completed / orders.length) * 100);
  }

  private groupByStatus(items: any[], statusField: string): any {
    return items.reduce((acc, item) => {
      const status = item[statusField];
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByCategory(transactions: any[]): any {
    return transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {});
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private calculateTrends(production: any, sales: any, financial: any): any {
    // This would need historical data to calculate trends
    return {
      inventoryTrend: 'stable',
      productionTrend: 'stable',
      salesTrend: 'stable',
      financialTrend: 'stable'
    };
  }

  private calculateWeeklyComparisons(production: any, sales: any, financial: any): any {
    // This would need previous week data to calculate comparisons
    return {
      previousWeek: {},
      percentageChange: {}
    };
  }

  private calculateInventoryTotals(inventory: any): any {
    return {
      totalItems: inventory.currentInventory.length,
      totalValue: inventory.currentInventory.reduce((sum: number, item: any) => sum + item.stock.totalValue, 0)
    };
  }

  private calculateProductionTotals(production: any): any {
    return {
      totalOrders: production.totalOrders,
      totalProduction: production.totalProduction,
      efficiency: production.efficiency
    };
  }

  private calculateSalesTotals(sales: any): any {
    return {
      totalOrders: sales.totalOrders,
      totalRevenue: sales.totalRevenue
    };
  }

  private calculateFinancialTotals(financial: any): any {
    return {
      totalIncome: financial.totalIncome,
      totalExpenses: financial.totalExpenses,
      netProfit: financial.netProfit
    };
  }

  private calculateLogisticsTotals(logistics: any): any {
    return {
      totalDispatch: logistics.totalDispatch,
      totalDeliveries: logistics.totalDeliveries
    };
  }

  private getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  private calculateMonthlyGrowth(month: number, year: number, production: any, sales: any, financial: any): any {
    // This would need previous month data to calculate growth
    return {
      monthOverMonth: 0,
      yearOverYear: 0
    };
  }
}
