import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AdvancedReportService } from '../services/AdvancedReportService';
import { IReport } from '../types/models';

export class AdvancedReportController extends BaseController<IReport> {
  private advancedReportService: AdvancedReportService;

  constructor() {
    const advancedReportService = new AdvancedReportService();
    super(advancedReportService, 'AdvancedReport');
    this.advancedReportService = advancedReportService;
  }
  /**
   * Get advanced reports by company
   */
  async getReportsByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;

      const reports = await this.advancedReportService.getReportsByCompany(companyId.toString());

      res.status(200).json({
        success: true,
        message: 'Advanced reports retrieved successfully',
        data: reports,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting advanced reports:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Create new advanced report
   */
  async createReport(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;

      const reportData = {
        ...req.body,
        companyId
      };

      const report = await this.advancedReportService.createAdvancedReport(reportData, userId.toString());

      res.status(201).json({
        success: true,
        message: 'Advanced report created successfully',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating advanced report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get advanced report by ID
   */
  async getReportById(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const report = await this.advancedReportService.findById(id);

      if (!report || report.companyId.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Advanced report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Advanced report retrieved successfully',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting advanced report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update advanced report
   */
  async updateReport(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;

      const report = await this.advancedReportService.updateAdvancedReport(
        id,
        req.body,
        userId.toString()
      );

      if (!report || report.companyId.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Advanced report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Advanced report updated successfully',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating advanced report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete advanced report
   */
  async deleteReport(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const report = await this.advancedReportService.findById(id);

      if (!report || report.companyId.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Advanced report not found'
        });
      }

      await this.advancedReportService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Advanced report deleted successfully',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting advanced report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Generate report data
   */
  async generateReport(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { reportType, dateRange, filters } = req.body;
      
      // This would contain the actual report generation logic
      // For now, returning a placeholder response
      const reportData = {
        reportType,
        dateRange,
        filters,
        generatedAt: new Date(),
        data: {
          summary: 'Report generated successfully',
          metrics: {},
          charts: [],
          tables: []
        }
      };
      
      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: reportData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while generating report'
      });
    }
  }

  /**
   * Export report
   */
  async exportReport(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const { format = 'pdf' } = req.query;

      const report = await this.advancedReportService.findById(id);

      if (!report || report.companyId.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Advanced report not found'
        });
      }

      // This would contain the actual export logic
      // For now, returning a placeholder response
      const exportData = {
        reportId: id,
        format,
        exportedAt: new Date(),
        downloadUrl: `/api/v1/advanced-reports/${id}/download?format=${format}`
      };

      res.status(200).json({
        success: true,
        message: 'Report export initiated successfully',
        data: exportData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Schedule report
   */
  async scheduleReport(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { reportId, schedule } = req.body;

      const report = await this.advancedReportService.findById(reportId);

      if (!report || report.companyId.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Advanced report not found'
        });
      }

      const scheduleData = await this.advancedReportService.scheduleReport(
        reportId,
        schedule,
        userId.toString()
      );

      res.status(200).json({
        success: true,
        message: 'Report scheduled successfully',
        data: scheduleData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const scheduledReports = await this.advancedReportService.getScheduledReports(companyId.toString());
      res.status(200).json({
        success: true,
        message: 'Scheduled reports retrieved successfully',
        data: scheduledReports,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get report templates
   */
  async getReportTemplates(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const templates = await this.advancedReportService.getReportTemplates(companyId.toString());
      res.status(200).json({
        success: true,
        message: 'Report templates retrieved successfully',
        data: templates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting report templates:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get public reports
   */
  async getPublicReports(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const publicReports = await this.advancedReportService.getPublicReports(companyId.toString());
      res.status(200).json({
        success: true,
        message: 'Public reports retrieved successfully',
        data: publicReports,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting public reports:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clone report
   */
  async cloneReport(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const clonedReport = await this.advancedReportService.cloneReport(id, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Report cloned successfully',
        data: clonedReport,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cloning report:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get report status
   */
  async getReportStatus(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const status = await this.advancedReportService.getReportStatus(id);
      res.status(200).json({
        success: true,
        message: 'Report status retrieved successfully',
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting report status:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const { schedule } = req.body;
      const updatedSchedule = await this.advancedReportService.updateSchedule(id, schedule, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: updatedSchedule,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update distribution
   */
  async updateDistribution(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const { distribution } = req.body;
      const updatedDistribution = await this.advancedReportService.updateDistribution(id, distribution, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Distribution updated successfully',
        data: updatedDistribution,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating distribution:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update access control
   */
  async updateAccessControl(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const { accessControl } = req.body;
      const updatedAccessControl = await this.advancedReportService.updateAccessControl(id, accessControl, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Access control updated successfully',
        data: updatedAccessControl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating access control:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get report analytics
   */
  async getReportAnalytics(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const analytics = await this.advancedReportService.getReportAnalytics(id);
      res.status(200).json({
        success: true,
        message: 'Report analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting report analytics:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Grant access
   */
  async grantAccess(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id } = req.params;
      const { targetUserId, permissions } = req.body;
      const accessGranted = await this.advancedReportService.grantAccess(id, targetUserId, permissions, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Access granted successfully',
        data: accessGranted,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error granting access:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Revoke access
   */
  async revokeAccess(req: Request, res: Response) {
    try {
      const { companyId, userId } = req.user!;
      const { id, userId: targetUserId } = req.params;
      await this.advancedReportService.revokeAccess(id, targetUserId, userId.toString());
      res.status(200).json({
        success: true,
        message: 'Access revoked successfully',
        data: null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Search reports
   */
  async searchReports(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { query, filters } = req.query;
      const searchResults = await this.advancedReportService.searchReports(companyId.toString(), query as string, filters as any);
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: searchResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching reports:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get reports by category
   */
  async getReportsByCategory(req: Request, res: Response) {
    try {
      const { companyId } = req.user!;
      const { category } = req.params;
      const reports = await this.advancedReportService.getReportsByCompany(companyId.toString(), { category });
      res.status(200).json({
        success: true,
        message: 'Reports by category retrieved successfully',
        data: reports,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting reports by category:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  }
}
