import * as cron from 'node-cron';
import { AutomatedReportService, ReportData } from './AutomatedReportService';
import Company from '../models/Company';
import { AdvancedReport } from '../models/AdvancedReport';

export interface CronJobConfig {
  emailConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  reportConfig: {
    dailyTime: string; // HH:MM format
    weeklyTime: string; // HH:MM format, day will be Monday
    monthlyTime: string; // HH:MM format, day will be 1st of month
    recipients: {
      daily: string[];
      weekly: string[];
      monthly: string[];
    };
    formats: ('excel' | 'csv')[];
  };
}

export class CronJobScheduler {
  private automatedReportService: AutomatedReportService;
  private config: CronJobConfig;
  private isRunning: boolean = false;

  constructor(config: CronJobConfig) {
    this.config = config;
    this.automatedReportService = new AutomatedReportService(config.emailConfig);
  }

  /**
   * Start all cron jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('Cron jobs are already running');
      return;
    }

    console.log('🚀 Starting automated report cron jobs...');

    // Daily report - every day at specified time
    this.scheduleDailyReport();
    
    // Weekly report - every Monday at specified time
    this.scheduleWeeklyReport();
    
    // Monthly report - 1st of every month at specified time
    this.scheduleMonthlyReport();

    this.isRunning = true;
    console.log('✅ All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('No cron jobs are running');
      return;
    }

    console.log('🛑 Stopping all cron jobs...');
    cron.getTasks().forEach(task => task.stop());
    
    this.isRunning = false;
    console.log('✅ All cron jobs stopped successfully');
  }

  /**
   * Schedule daily report generation
   */
  private scheduleDailyReport(): void {
    const [hour, minute] = this.config.reportConfig.dailyTime.split(':');
    
    const cronExpression = `${minute} ${hour} * * *`;
    
    cron.schedule(cronExpression, async () => {
      console.log('📊 Starting daily report generation...');
      await this.generateAndSendDailyReports();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log(`📅 Daily report scheduled for ${this.config.reportConfig.dailyTime} IST`);
  }

  /**
   * Schedule weekly report generation
   */
  private scheduleWeeklyReport(): void {
    const [hour, minute] = this.config.reportConfig.weeklyTime.split(':');
    
    // Every Monday at specified time
    const cronExpression = `${minute} ${hour} * * 1`;
    
    cron.schedule(cronExpression, async () => {
      console.log('📊 Starting weekly report generation...');
      await this.generateAndSendWeeklyReports();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log(`📅 Weekly report scheduled for Monday ${this.config.reportConfig.weeklyTime} IST`);
  }

  /**
   * Schedule monthly report generation
   */
  private scheduleMonthlyReport(): void {
    const [hour, minute] = this.config.reportConfig.monthlyTime.split(':');
    
    // 1st of every month at specified time
    const cronExpression = `${minute} ${hour} 1 * *`;
    
    cron.schedule(cronExpression, async () => {
      console.log('📊 Starting monthly report generation...');
      await this.generateAndSendMonthlyReports();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log(`📅 Monthly report scheduled for 1st of month ${this.config.reportConfig.monthlyTime} IST`);
  }

  /**
   * Generate and send daily reports for all companies
   */
  private async generateAndSendDailyReports(): Promise<void> {
    try {
      const companies = await Company.find({ isActive: true });
      const today = new Date();
      
      console.log(`📊 Generating daily reports for ${companies.length} companies...`);

      for (const company of companies) {
        try {
          await this.processDailyReport(company._id.toString(), today);
          console.log(`✅ Daily report generated for company: ${company.companyName}`);
        } catch (error) {
          console.error(`❌ Error generating daily report for company ${company.companyName}:`, error);
        }
      }

      console.log('✅ Daily report generation completed for all companies');
    } catch (error) {
      console.error('❌ Error in daily report generation:', error);
    }
  }

  /**
   * Generate and send weekly reports for all companies
   */
  private async generateAndSendWeeklyReports(): Promise<void> {
    try {
      const companies = await Company.find({ isActive: true });
      const weekStart = this.getWeekStart(new Date());
      
      console.log(`📊 Generating weekly reports for ${companies.length} companies...`);

      for (const company of companies) {
        try {
          await this.processWeeklyReport(company._id.toString(), weekStart);
          console.log(`✅ Weekly report generated for company: ${company.companyName}`);
        } catch (error) {
          console.error(`❌ Error generating weekly report for company ${company.companyName}:`, error);
        }
      }

      console.log('✅ Weekly report generation completed for all companies');
    } catch (error) {
      console.error('❌ Error in weekly report generation:', error);
    }
  }

  /**
   * Generate and send monthly reports for all companies
   */
  private async generateAndSendMonthlyReports(): Promise<void> {
    try {
      const companies = await Company.find({ isActive: true });
      const now = new Date();
      const month = now.getMonth() + 1; // getMonth() returns 0-11
      const year = now.getFullYear();
      
      console.log(`📊 Generating monthly reports for ${companies.length} companies...`);

      for (const company of companies) {
        try {
          await this.processMonthlyReport(company._id.toString(), month, year);
          console.log(`✅ Monthly report generated for company: ${company.companyName}`);
        } catch (error) {
          console.error(`❌ Error generating monthly report for company ${company.companyName}:`, error);
        }
      }

      console.log('✅ Monthly report generation completed for all companies');
    } catch (error) {
      console.error('❌ Error in monthly report generation:', error);
    }
  }

  /**
   * Process daily report for a specific company
   */
  private async processDailyReport(companyId: string, date: Date): Promise<void> {
    try {
      // Generate report data
      const reportData = await this.automatedReportService.generateDailyReport(companyId, date);
      
      // Generate files
      const filePaths: string[] = [];
      
      if (this.config.reportConfig.formats.includes('excel')) {
        const excelPath = await this.automatedReportService.generateExcelFile(reportData, 'daily', date);
        filePaths.push(excelPath);
      }
      
      if (this.config.reportConfig.formats.includes('csv')) {
        const csvPath = await this.automatedReportService.generateCSVFile(reportData, 'daily', date);
        filePaths.push(csvPath);
      }

      // Send email
      const subject = `Daily Report - ${date.toDateString()}`;
      const body = this.generateDailyEmailBody(reportData, date);
      
      const emailSent = await this.automatedReportService.sendReportEmail(
        this.config.reportConfig.recipients.daily,
        subject,
        body,
        filePaths
      );

      if (emailSent) {
        console.log(`📧 Daily report email sent for company: ${companyId}`);
      }

      // Store report data in database
      await this.automatedReportService.storeReportData(companyId, 'daily', reportData, date);
      console.log(`💾 Daily report data stored in database for company: ${companyId}`);

      // Clean up generated files
      await this.automatedReportService.cleanupFiles(filePaths);
      console.log(`🧹 Daily report files cleaned up for company: ${companyId}`);

    } catch (error) {
      console.error(`Error processing daily report for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Process weekly report for a specific company
   */
  private async processWeeklyReport(companyId: string, weekStart: Date): Promise<void> {
    try {
      // Generate report data
      const reportData = await this.automatedReportService.generateWeeklyReport(companyId, weekStart);
      
      // Generate files
      const filePaths: string[] = [];
      
      if (this.config.reportConfig.formats.includes('excel')) {
        const excelPath = await this.automatedReportService.generateExcelFile(reportData, 'weekly', weekStart);
        filePaths.push(excelPath);
      }
      
      if (this.config.reportConfig.formats.includes('csv')) {
        const csvPath = await this.automatedReportService.generateCSVFile(reportData, 'weekly', weekStart);
        filePaths.push(csvPath);
      }

      // Send email
      const subject = `Weekly Report - Week ${this.getWeekNumber(weekStart)} (${weekStart.toDateString()})`;
      const body = this.generateWeeklyEmailBody(reportData, weekStart);
      
      const emailSent = await this.automatedReportService.sendReportEmail(
        this.config.reportConfig.recipients.weekly,
        subject,
        body,
        filePaths
      );

      if (emailSent) {
        console.log(`📧 Weekly report email sent for company: ${companyId}`);
      }

      // Store report data in database
      await this.automatedReportService.storeReportData(companyId, 'weekly', reportData, weekStart);
      console.log(`💾 Weekly report data stored in database for company: ${companyId}`);

      // Clean up generated files
      await this.automatedReportService.cleanupFiles(filePaths);
      console.log(`🧹 Weekly report files cleaned up for company: ${companyId}`);

    } catch (error) {
      console.error(`Error processing weekly report for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Process monthly report for a specific company
   */
  private async processMonthlyReport(companyId: string, month: number, year: number): Promise<void> {
    try {
      // Generate report data
      const reportData = await this.automatedReportService.generateMonthlyReport(companyId, month, year);
      
      // Generate files
      const filePaths: string[] = [];
      
      if (this.config.reportConfig.formats.includes('excel')) {
        const excelPath = await this.automatedReportService.generateExcelFile(reportData, 'monthly', new Date(year, month - 1, 1));
        filePaths.push(excelPath);
      }
      
      if (this.config.reportConfig.formats.includes('csv')) {
        const csvPath = await this.automatedReportService.generateCSVFile(reportData, 'monthly', new Date(year, month - 1, 1));
        filePaths.push(csvPath);
      }

      // Send email
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const subject = `Monthly Report - ${monthNames[month - 1]} ${year}`;
      const body = this.generateMonthlyEmailBody(reportData, month, year);
      
      const emailSent = await this.automatedReportService.sendReportEmail(
        this.config.reportConfig.recipients.monthly,
        subject,
        body,
        filePaths
      );

      if (emailSent) {
        console.log(`📧 Monthly report email sent for company: ${companyId}`);
      }

      // Store report data in database
      await this.automatedReportService.storeReportData(companyId, 'monthly', reportData, new Date(year, month - 1, 1));
      console.log(`💾 Monthly report data stored in database for company: ${companyId}`);

      // Clean up generated files
      await this.automatedReportService.cleanupFiles(filePaths);
      console.log(`🧹 Monthly report files cleaned up for company: ${companyId}`);

    } catch (error) {
      console.error(`Error processing monthly report for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Generate daily report email body
   */
  private generateDailyEmailBody(reportData: ReportData, date: Date): string {
    return `
      <html>
        <body>
          <h2>Daily Report - ${date.toDateString()}</h2>
          <p>Here is your daily business summary:</p>
          
          <h3>📦 Inventory Summary</h3>
          <ul>
            <li>Total Items: ${reportData.summary.inventorySummary.totalItems}</li>
            <li>Total Value: ₹${reportData.summary.inventorySummary.totalValue.toLocaleString()}</li>
            <li>Low Stock Items: ${reportData.summary.inventorySummary.lowStockItems}</li>
            <li>New Items: ${reportData.summary.inventorySummary.newItems}</li>
          </ul>
          
          <h3>🏭 Production Summary</h3>
          <ul>
            <li>Total Orders: ${reportData.summary.productionSummary.totalOrders}</li>
            <li>Completed Orders: ${reportData.summary.productionSummary.completedOrders}</li>
            <li>Pending Orders: ${reportData.summary.productionSummary.pendingOrders}</li>
            <li>Total Production: ${reportData.summary.productionSummary.totalProduction}</li>
            <li>Efficiency: ${reportData.summary.productionSummary.efficiency}%</li>
          </ul>
          
          <h3>💰 Sales Summary</h3>
          <ul>
            <li>Total Orders: ${reportData.summary.salesSummary.totalOrders}</li>
            <li>Total Revenue: ₹${reportData.summary.salesSummary.totalRevenue.toLocaleString()}</li>
            <li>New Customers: ${reportData.summary.salesSummary.newCustomers}</li>
            <li>Pending Payments: ${reportData.summary.salesSummary.pendingPayments}</li>
          </ul>
          
          <h3>💳 Financial Summary</h3>
          <ul>
            <li>Total Income: ₹${reportData.summary.financialSummary.totalIncome.toLocaleString()}</li>
            <li>Total Expenses: ₹${reportData.summary.financialSummary.totalExpenses.toLocaleString()}</li>
            <li>Net Profit: ₹${reportData.summary.financialSummary.netProfit.toLocaleString()}</li>
          </ul>
          
          <h3>🚚 Logistics Summary</h3>
          <ul>
            <li>Total Dispatch: ${reportData.summary.logisticsSummary.totalDispatch}</li>
            <li>Total Deliveries: ${reportData.summary.logisticsSummary.totalDeliveries}</li>
            <li>Pending Deliveries: ${reportData.summary.logisticsSummary.pendingDeliveries}</li>
            <li>RTO Count: ${reportData.summary.logisticsSummary.rtoCount}</li>
          </ul>
          
          <p>Please find the detailed reports attached.</p>
          <p>Best regards,<br>ERP System</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate weekly report email body
   */
  private generateWeeklyEmailBody(reportData: ReportData, weekStart: Date): string {
    return `
      <html>
        <body>
          <h2>Weekly Report - Week ${this.getWeekNumber(weekStart)}</h2>
          <p>Period: ${weekStart.toDateString()} to ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toDateString()}</p>
          
          <p>Here is your weekly business summary:</p>
          
          <h3>📊 Weekly Overview</h3>
          <ul>
            <li>Week Number: ${this.getWeekNumber(weekStart)}</li>
            <li>Trends: ${JSON.stringify(reportData.summary.trends)}</li>
          </ul>
          
          <p>Please find the detailed weekly reports attached.</p>
          <p>Best regards,<br>ERP System</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate monthly report email body
   */
  private generateMonthlyEmailBody(reportData: ReportData, month: number, year: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `
      <html>
        <body>
          <h2>Monthly Report - ${monthNames[month - 1]} ${year}</h2>
          
          <p>Here is your monthly business summary:</p>
          
          <h3>📈 Monthly Totals</h3>
          <ul>
            <li>Inventory: ${JSON.stringify(reportData.summary.monthlyTotals.inventory)}</li>
            <li>Production: ${JSON.stringify(reportData.summary.monthlyTotals.production)}</li>
            <li>Sales: ${JSON.stringify(reportData.summary.monthlyTotals.sales)}</li>
            <li>Financial: ${JSON.stringify(reportData.summary.monthlyTotals.financial)}</li>
            <li>Logistics: ${JSON.stringify(reportData.summary.monthlyTotals.logistics)}</li>
          </ul>
          
          <h3>📊 Monthly Averages</h3>
          <ul>
            <li>Daily Production: ${reportData.summary.monthlyAverages.dailyProduction}</li>
            <li>Daily Sales: ₹${reportData.summary.monthlyAverages.dailySales.toLocaleString()}</li>
            <li>Daily Expenses: ₹${reportData.summary.monthlyAverages.dailyExpenses.toLocaleString()}</li>
          </ul>
          
          <p>Please find the detailed monthly reports attached.</p>
          <p>Best regards,<br>ERP System</p>
        </body>
      </html>
    `;
  }

  /**
   * Helper methods
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get cron job status
   */
  getStatus(): { isRunning: boolean; tasks: any } {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(cron.getTasks().entries()).map(([name, task]) => ({ name, task }))
    };
  }

  /**
   * Manually trigger a report generation
   */
  async manualTrigger(companyId: string, reportType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const now = new Date();
    
    switch (reportType) {
      case 'daily':
        await this.processDailyReport(companyId, now);
        break;
      case 'weekly':
        await this.processWeeklyReport(companyId, this.getWeekStart(now));
        break;
      case 'monthly':
        await this.processMonthlyReport(companyId, now.getMonth() + 1, now.getFullYear());
        break;
    }
  }
}
