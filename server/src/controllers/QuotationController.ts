import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { QuotationService } from '../services/QuotationService';
import { IQuotation } from '../types/models';

export class QuotationController extends BaseController<IQuotation> {
  private quotationService: QuotationService;

  constructor() {
    const quotationService = new QuotationService();
    super(quotationService, 'Quotation');
    this.quotationService = quotationService;
  }

  /**
   * Create a new quotation
   */
  async createQuotation(req: Request, res: Response): Promise<void> {
    try {
      const quotationData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const quotation = await this.quotationService.createQuotation(quotationData, createdBy);

      this.sendSuccess(res, quotation, 'Quotation created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create quotation');
    }
  }

  /**
   * Update quotation status
   */
  async updateQuotationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { quotationId } = req.params;
      const { status } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const quotation = await this.quotationService.updateQuotationStatus(quotationId, status, updatedBy);

      this.sendSuccess(res, quotation, 'Quotation status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update quotation status');
    }
  }

  /**
   * Convert quotation to order
   */
  async convertToOrder(req: Request, res: Response): Promise<void> {
    try {
      const { quotationId } = req.params;
      const convertedBy = (req.user?.userId || req.user?._id)?.toString();

      const orderData = await this.quotationService.convertToOrder(quotationId, convertedBy);

      this.sendSuccess(res, orderData, 'Quotation converted to order successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to convert quotation to order');
    }
  }

  /**
   * Get quotations by customer
   */
  async getQuotationsByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const quotations = await this.quotationService.getQuotationsByCustomer(customerId, companyId.toString(), options);

      this.sendSuccess(res, quotations, 'Quotations retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get quotations');
    }
  }

  /**
   * Get expired quotations
   */
  async getExpiredQuotations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const quotations = await this.quotationService.getExpiredQuotations(companyId.toString());

      this.sendSuccess(res, quotations, 'Expired quotations retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get expired quotations');
    }
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.quotationService.getQuotationStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Quotation statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get quotation statistics');
    }
  }

  /**
   * Get all quotations by company
   */
  async getQuotationsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, status, search } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      let query: any = { companyId };

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { quotationNumber: { $regex: search, $options: 'i' } },
          { 'party.partyName': { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { createdAt: -1 }
      };

      const quotations = await this.quotationService.findMany(query, options);

      this.sendSuccess(res, quotations, 'Quotations retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get quotations');
    }
  }

  /**
   * Update quotation
   */
  async updateQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const quotation = await this.quotationService.update(id, updateData, updatedBy);

      if (!quotation) {
        this.sendError(res, new Error('Quotation not found'), 'Quotation not found', 404);
        return;
      }

      this.sendSuccess(res, quotation, 'Quotation updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update quotation');
    }
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const quotation = await this.quotationService.findById(id);

      if (!quotation) {
        this.sendError(res, new Error('Quotation not found'), 'Quotation not found', 404);
        return;
      }

      this.sendSuccess(res, quotation, 'Quotation retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get quotation');
    }
  }

  /**
   * Delete quotation (soft delete)
   */
  async deleteQuotation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const quotation = await this.quotationService.update(id, {
        status: 'cancelled',
        cancelledAt: new Date()
      }, deletedBy);

      if (!quotation) {
        this.sendError(res, new Error('Quotation not found'), 'Quotation not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Quotation cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel quotation');
    }
  }
}
