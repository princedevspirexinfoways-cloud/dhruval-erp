import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { PrintingService } from '../services/PrintingService';
import { IPrinting } from '../models/Printing';
import { cleanObjectIdFields } from '../../../utils/cleanData';

export class PrintingController extends BaseController<any> {
  private printingService: PrintingService;

  constructor() {
    const service = new PrintingService();
    super(service, 'Printing');
    this.printingService = service;
  }

  /**
   * Create a new printing entry
   */
  async create(req: Request, res: Response): Promise<void> {
    // Declare printingData outside try block so it's accessible in catch block
    let printingData: any = null;
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // Clean up empty strings - convert to undefined for optional ObjectId fields
      printingData = {
        ...req.body,
        companyId
      };

      // Validate required fields
      if (!printingData.partyName || printingData.partyName.trim() === '') {
        this.sendError(res, new Error('Party Name is required'), 'Party Name is required', 400);
        return;
      }
      if (!printingData.lotNumber || printingData.lotNumber.trim() === '') {
        this.sendError(res, new Error('Lot Number is required'), 'Lot Number is required', 400);
        return;
      }
      if (!printingData.designNumber || printingData.designNumber.trim() === '') {
        this.sendError(res, new Error('Design Number is required'), 'Design Number is required', 400);
        return;
      }
      if (!printingData.quality || printingData.quality.trim() === '') {
        this.sendError(res, new Error('Quality is required'), 'Quality is required', 400);
        return;
      }
      if (!printingData.totalMeterReceived || printingData.totalMeterReceived <= 0) {
        this.sendError(res, new Error('Total Meter Received must be greater than 0'), 'Total Meter Received must be greater than 0', 400);
        return;
      }
      if (!printingData.source || !['after_bleaching', 'batch_center'].includes(printingData.source)) {
        this.sendError(res, new Error('Valid source is required'), 'Source must be either "after_bleaching" or "batch_center"', 400);
        return;
      }
      if (!printingData.printingType || !['reactive', 'pigment', 'digital', 'kitenge'].includes(printingData.printingType)) {
        this.sendError(res, new Error('Valid printing type is required'), 'Printing Type must be one of: reactive, pigment, digital, kitenge', 400);
        return;
      }

      // Convert empty strings to undefined for optional fields
      if (printingData.customerId === '' || printingData.customerId === null) {
        printingData.customerId = undefined;
      }
      if (printingData.sourceId === '' || printingData.sourceId === null) {
        printingData.sourceId = undefined;
      }

      const printing = await this.printingService.createPrinting(printingData, userId);
      this.sendSuccess(res, printing, 'Printing entry created successfully', 201);
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Printing creation error:', {
        error: error.message,
        stack: error.stack,
        data: printingData,
        validationErrors: error.errors || error.message
      });
      this.sendError(res, error, error.message || 'Failed to create printing entry');
    }
  }

  /**
   * Update printing output
   */
  async updateOutput(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { printedMeter, rejectedMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!printedMeter && !rejectedMeter) {
        this.sendError(res, new Error('Invalid data'), 'Printed or rejected meter is required', 400);
        return;
      }

      const result = await this.printingService.updateOutput(
        id,
        printedMeter || 0,
        rejectedMeter || 0,
        userId
      );
      
      // Create descriptive message based on what was moved
      let message = 'Printing output updated successfully';
      const movements = [];
      
      if (result.hazerSilicateCuring) {
        movements.push(`${printedMeter}m moved to Hazer/Silicate/Curing`);
      }
      if (result.rejectionStock) {
        movements.push(`${rejectedMeter}m moved to Rejection Stock`);
      }
      
      const pendingMeter = (result.printing.totalMeterReceived || 0) - (printedMeter || 0) - (rejectedMeter || 0);
      if (pendingMeter > 0) {
        movements.push(`${pendingMeter}m remains in Printing WIP`);
      }
      
      if (movements.length > 0) {
        message += ` - ${movements.join(', ')}`;
      }
      
      this.sendSuccess(res, result, message);
    } catch (error) {
      this.sendError(res, error, 'Failed to update printing output');
    }
  }

  /**
   * Get all printing entries
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const { status, lotNumber, page, limit } = req.query;
      const result = await this.printingService.getAllPrintings(companyId, {
        status: status as string,
        lotNumber: lotNumber as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Printing entries retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get printing entries');
    }
  }

  /**
   * Get WIP (Work In Progress)
   */
  async getWIP(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const wip = await this.printingService.getWIP(companyId);
      this.sendSuccess(res, wip, 'Printing WIP retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get printing WIP');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const printing = await this.printingService.findById(id);

      if (!printing) {
        this.sendError(res, new Error('Not found'), 'Printing entry not found', 404);
        return;
      }

      this.sendSuccess(res, printing, 'Printing entry retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get printing entry');
    }
  }

  /**
   * Update printing entry
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const printing = await this.printingService.update(id, updateData, userId);
      if (!printing) {
        this.sendError(res, new Error('Not found'), 'Printing entry not found', 404);
        return;
      }

      this.sendSuccess(res, printing, 'Printing entry updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update printing entry');
    }
  }
}

