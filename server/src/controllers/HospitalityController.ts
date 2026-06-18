import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { HospitalityService } from '../services/HospitalityService';
import { IHospitality } from '../types/models';

export class HospitalityController extends BaseController<IHospitality> {
  private hospitalityService: HospitalityService;

  constructor() {
    const hospitalityService = new HospitalityService();
    super(hospitalityService, 'Hospitality');
    this.hospitalityService = hospitalityService;
  }

  /**
   * Create a new hospitality entry
   */
  async createHospitalityEntry(req: Request, res: Response): Promise<void> {
    try {
      const hospitalityData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const hospitality = await this.hospitalityService.createHospitalityFacility(hospitalityData, createdBy);

      this.sendSuccess(res, hospitality, 'Hospitality entry created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create hospitality entry');
    }
  }

  /**
   * Get hospitality entries by company
   */
  async getHospitalityByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, guestName, visitPurpose, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (guestName) {
        options.guestName = guestName;
      }

      if (visitPurpose) {
        options.visitPurpose = visitPurpose;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const hospitality = await this.hospitalityService.getHospitalityByCompany(companyId.toString(), options);

      this.sendSuccess(res, hospitality, 'Hospitality entries retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get hospitality entries');
    }
  }

  /**
   * Get hospitality statistics
   */
  async getHospitalityStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.hospitalityService.getHospitalityStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Hospitality statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get hospitality statistics');
    }
  }

  /**
   * Get monthly hospitality report
   */
  async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { year, month } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!year || !month) {
        this.sendError(res, new Error('Year and month are required'), 'Year and month are required', 400);
        return;
      }

      const report = await this.hospitalityService.getMonthlyReport(
        companyId.toString(), 
        parseInt(year as string), 
        parseInt(month as string)
      );

      this.sendSuccess(res, report, 'Monthly hospitality report retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get monthly hospitality report');
    }
  }

  /**
   * Get hospitality entry by ID
   */
  async getHospitalityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hospitality = await this.hospitalityService.findById(id);

      if (!hospitality) {
        this.sendError(res, new Error('Hospitality entry not found'), 'Hospitality entry not found', 404);
        return;
      }

      this.sendSuccess(res, hospitality, 'Hospitality entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get hospitality entry');
    }
  }

  /**
   * Update hospitality entry
   */
  async updateHospitality(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const hospitality = await this.hospitalityService.update(id, updateData, updatedBy);

      if (!hospitality) {
        this.sendError(res, new Error('Hospitality entry not found'), 'Hospitality entry not found', 404);
        return;
      }

      this.sendSuccess(res, hospitality, 'Hospitality entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update hospitality entry');
    }
  }
}
