import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { AdvancedReport } from '../models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AdvancedReportService extends BaseService<any> {
  constructor() {
    super(AdvancedReport);
  }

  /**
   * Create a new advanced report
   */
  async createAdvancedReport(reportData: any, createdBy?: string): Promise<any> {
    try {
      // Validate report data
      this.validateReportData(reportData);

      // Check if report name already exists for the company
      if (reportData.reportName && reportData.companyId) {
        const existingReport = await this.findOne({ 
          reportName: reportData.reportName,
          companyId: reportData.companyId 
        });

        if (existingReport) {
          throw new AppError('Report name already exists for this company', 400);
        }
      }

      // Generate report ID if not provided
      if (!reportData.reportId) {
        reportData.reportId = await this.generateReportId(reportData.companyId!);
      }

      // Set created by
      if (createdBy) {
        reportData.createdBy = new Types.ObjectId(createdBy);
        // reportData.updatedBy = new Types.ObjectId(createdBy);
      }

      const report = await this.create(reportData);
      logger.info('Advanced report created successfully', { reportId: report.reportId });
      
      return report;
    } catch (error) {
      logger.error('Error creating advanced report:', error);
      throw error;
    }
  }

  /**
   * Update an advanced report
   */
  async updateAdvancedReport(
    reportId: string,
    updateData: any,
    updatedBy?: string
  ): Promise<any> {
    try {
      // Set updated by
      if (updatedBy) {
        // updateData.updatedBy = new Types.ObjectId(updatedBy);
      }

      const report = await this.update(reportId, updateData);
      if (!report) {
        throw new AppError('Advanced report not found', 404);
      }

      logger.info('Advanced report updated successfully', { reportId: report.reportId });
      return report;
    } catch (error) {
      logger.error('Error updating advanced report:', error);
      throw error;
    }
  }

  /**
   * Get reports by company
   */
  async getReportsByCompany(companyId: string, options: any = {}): Promise<any[]> {
    try {
      const filter = { companyId: new Types.ObjectId(companyId) };
      
      // Add category filter if provided
      if (options.category) {
        (filter as any).reportCategory = options.category;
      }

      // Add status filter if provided
      if (options.status) {
        (filter as any).status = options.status;
      }

      const reports = await this.findMany(filter, {
        sort: { createdAt: -1 },
        populate: [
          { path: 'createdBy', select: 'name email' },
          { path: 'updatedBy', select: 'name email' }
        ]
      });

      return reports;
    } catch (error) {
      logger.error('Error getting reports by company:', error);
      throw error;
    }
  }

  /**
   * Generate report data
   */
  async generateReportData(reportId: string, parameters: any): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Advanced report not found', 404);
      }

      // This would contain the actual report generation logic
      // For now, returning a placeholder
      const reportData = {
        reportId,
        reportName: report.reportName,
        category: (report as any).reportCategory || 'general',
        generatedAt: new Date(),
        parameters,
        data: {
          summary: 'Report generated successfully',
          metrics: {},
          charts: [],
          tables: []
        }
      };

      logger.info('Report data generated successfully', { reportId });
      return reportData;
    } catch (error) {
      logger.error('Error generating report data:', error);
      throw error;
    }
  }

  /**
   * Schedule report
   */
  async scheduleReport(reportId: string, schedule: any, scheduledBy?: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Advanced report not found', 404);
      }

      // This would contain the actual scheduling logic
      // For now, returning a placeholder
      const scheduleData = {
        reportId,
        schedule,
        scheduledBy,
        scheduledAt: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
      };

      logger.info('Report scheduled successfully', { reportId });
      return scheduleData;
    } catch (error) {
      logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  /**
   * Validate report data
   */
  private validateReportData(reportData: any): void {
    if (!reportData.reportName) {
      throw new AppError('Report name is required', 400);
    }

    if (!reportData.reportCategory) {
      throw new AppError('Report category is required', 400);
    }

    if (!reportData.companyId) {
      throw new AppError('Company ID is required', 400);
    }
  }

  /**
   * Generate unique report ID
   */
  private async generateReportId(companyId: Types.ObjectId): Promise<string> {
    const prefix = 'RPT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    let reportId = `${prefix}-${timestamp}-${random}`;
    
    // Ensure uniqueness
    let counter = 1;
    while (await this.findOne({ reportId, companyId })) {
      reportId = `${prefix}-${timestamp}-${random}-${counter}`;
      counter++;
    }
    
    return reportId;
  }

  /**
   * Get report statistics
   */
  async getReportStatistics(companyId: string): Promise<any> {
    try {
      const reports = await this.getReportsByCompany(companyId);
      
      return {
        totalReports: reports.length,
        activeReports: reports.filter(r => r.isActive === true).length,
        draftReports: reports.filter(r => r.status === 'draft').length,
        scheduledReports: reports.filter(r => r.schedules && r.schedules.some(s => s.isActive)).length,
        categories: this.groupByCategory(reports, 'reportCategory')
      };
    } catch (error) {
      logger.error('Error getting report statistics:', error);
      throw error;
    }
  }

  // Add missing methods that are called by the controller
  async getScheduledReports(companyId: string): Promise<any[]> {
    try {
      const reports = await this.getReportsByCompany(companyId);
      return reports.filter(r => r.schedules && r.schedules.some(s => s.isActive));
    } catch (error) {
      logger.error('Error getting scheduled reports:', error);
      throw error;
    }
  }

  async getReportTemplates(companyId: string): Promise<any[]> {
    try {
      const reports = await this.getReportsByCompany(companyId);
      return reports.filter(r => r.isTemplate === true);
    } catch (error) {
      logger.error('Error getting report templates:', error);
      throw error;
    }
  }

  async getPublicReports(companyId: string): Promise<any[]> {
    try {
      const reports = await this.getReportsByCompany(companyId);
      return reports.filter(r => r.accessControl?.isPublic === true);
    } catch (error) {
      logger.error('Error getting public reports:', error);
      throw error;
    }
  }

  async cloneReport(reportId: string, userId: string): Promise<any> {
    try {
      const originalReport = await this.findById(reportId);
      if (!originalReport) {
        throw new AppError('Report not found', 404);
      }

      const clonedData = {
        ...originalReport.toObject(),
        _id: undefined,
        reportId: await this.generateReportId(originalReport.companyId),
        reportName: `${originalReport.reportName} (Copy)`,
        isTemplate: false,
        createdBy: new Types.ObjectId(userId),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const clonedReport = await this.create(clonedData);
      logger.info('Report cloned successfully', { originalId: reportId, newId: clonedReport._id });
      
      return clonedReport;
    } catch (error) {
      logger.error('Error cloning report:', error);
      throw error;
    }
  }

  async getReportStatus(reportId: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      return {
        reportId,
        status: report.status,
        lastExecuted: report.lastExecuted,
        nextScheduledRun: report.schedules?.find(s => s.isActive)?.nextExecution,
        isActive: report.schedules?.some(s => s.isActive) || false
      };
    } catch (error) {
      logger.error('Error getting report status:', error);
      throw error;
    }
  }

  async updateSchedule(reportId: string, schedule: any, userId: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const updatedReport = await this.update(reportId, {
        schedules: [
          ...(report.schedules || []),
          {
            ...schedule,
            updatedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
          }
        ]
      });

      logger.info('Report schedule updated successfully', { reportId });
      return updatedReport;
    } catch (error) {
      logger.error('Error updating report schedule:', error);
      throw error;
    }
  }

  async updateDistribution(reportId: string, distribution: any, userId: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const updatedReport = await this.update(reportId, {
        customFields: {
          ...report.customFields,
          distribution: {
            ...distribution,
            updatedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
          }
        }
      });

      logger.info('Report distribution updated successfully', { reportId });
      return updatedReport;
    } catch (error) {
      logger.error('Error updating report distribution:', error);
      throw error;
    }
  }

  async updateAccessControl(reportId: string, accessControl: any, userId: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const updatedReport = await this.update(reportId, {
        accessControl: {
          ...report.accessControl,
          ...accessControl,
          updatedBy: new Types.ObjectId(userId),
          updatedAt: new Date()
        }
      });

      logger.info('Report access control updated successfully', { reportId });
      return updatedReport;
    } catch (error) {
      logger.error('Error updating report access control:', error);
      throw error;
    }
  }

  async getReportAnalytics(reportId: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      return {
        reportId,
        totalExecutions: report.totalExecutions || 0,
        lastExecuted: report.lastExecuted,
        performance: report.performance || {},
        executions: report.executions || []
      };
    } catch (error) {
      logger.error('Error getting report analytics:', error);
      throw error;
    }
  }

  async grantAccess(reportId: string, targetUserId: string, permissions: string[], grantedBy: string): Promise<any> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const accessControl = report.accessControl || {};
      const allowedUsers = (accessControl as any).allowedUsers || [];
      
      // Remove existing access for this user
      const filteredUsers = allowedUsers.filter(
        (userId: Types.ObjectId) => userId.toString() !== targetUserId
      );

      // Add new access
      filteredUsers.push(new Types.ObjectId(targetUserId));

      const updatedReport = await this.update(reportId, { 
        accessControl: {
          ...accessControl,
          allowedUsers: filteredUsers
        }
      });
      
      logger.info('Access granted successfully', { reportId, targetUserId, permissions });
      
      return updatedReport;
    } catch (error) {
      logger.error('Error granting access:', error);
      throw error;
    }
  }

  async revokeAccess(reportId: string, targetUserId: string, revokedBy: string): Promise<void> {
    try {
      const report = await this.findById(reportId);
      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const accessControl = report.accessControl || {};
      if ((accessControl as any).allowedUsers) {
        (accessControl as any).allowedUsers = (accessControl as any).allowedUsers.filter(
          (userId: Types.ObjectId) => userId.toString() !== targetUserId
        );
      }

      await this.update(reportId, { accessControl });
      logger.info('Access revoked successfully', { reportId, targetUserId });
    } catch (error) {
      logger.error('Error revoking access:', error);
      throw error;
    }
  }

  async searchReports(companyId: string, query: string, filters: any = {}): Promise<any[]> {
    try {
      const searchFilter: any = { companyId: new Types.ObjectId(companyId) };
      
      if (query) {
        searchFilter.$or = [
          { reportName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { reportCategory: { $regex: query, $options: 'i' } }
        ];
      }

      // Apply additional filters
      if (filters.status) searchFilter.status = filters.status;
      if (filters.category) searchFilter.reportCategory = filters.category;
      if (filters.dateFrom || filters.dateTo) {
        searchFilter.createdAt = {};
        if (filters.dateFrom) searchFilter.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) searchFilter.createdAt.$lte = new Date(filters.dateTo);
      }

      const reports = await this.findMany(searchFilter, {
        sort: { createdAt: -1 }
      });

      return reports;
    } catch (error) {
      logger.error('Error searching reports:', error);
      throw error;
    }
  }

  /**
   * Group items by a specific field
   */
  private groupByCategory(items: any[], field: string): any {
    return items.reduce((acc: any, item: any) => {
      const category = item[field] || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }
}
