import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { InvoiceService } from '../services/InvoiceService';
import { IInvoice } from '../types/models';

export class InvoiceController extends BaseController<IInvoice> {
  private invoiceService: InvoiceService;

  constructor() {
    const invoiceService = new InvoiceService();
    super(invoiceService, 'Invoice');
    this.invoiceService = invoiceService;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const invoice = await this.invoiceService.createInvoice(invoiceData, createdBy);

      this.sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create invoice');
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const invoice = await this.invoiceService.updateInvoiceStatus(invoiceId, status, updatedBy);

      this.sendSuccess(res, invoice, 'Invoice status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update invoice status');
    }
  }

  /**
   * Record payment (spec: payment mode, reference no)
   */
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const { paymentAmount, amount, paymentMethod, paymentDate, reference, notes } = req.body;
      const recordedBy = (req.user?.userId || req.user?._id)?.toString();
      const paymentAmt = paymentAmount ?? amount;

      const invoice = await this.invoiceService.recordPayment(
        invoiceId,
        paymentAmt,
        paymentMethod,
        paymentDate ? new Date(paymentDate) : undefined,
        recordedBy,
        { reference, notes }
      );

      this.sendSuccess(res, invoice, 'Payment recorded successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to record payment');
    }
  }

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(req: Request, res: Response): Promise<void> {
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

      const invoices = await this.invoiceService.getInvoicesByCustomer(customerId, companyId.toString(), options);

      this.sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get invoices');
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const invoices = await this.invoiceService.getOverdueInvoices(companyId.toString());

      this.sendSuccess(res, invoices, 'Overdue invoices retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get overdue invoices');
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.invoiceService.getInvoiceStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Invoice statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get invoice statistics');
    }
  }

  /**
   * Get all invoices by company
   */
  async getInvoicesByCompany(req: Request, res: Response): Promise<void> {
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
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { 'customer.customerName': { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { createdAt: -1 }
      };

      const invoices = await this.invoiceService.findMany(query, options);

      this.sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get invoices');
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const invoice = await this.invoiceService.update(id, updateData, updatedBy);

      if (!invoice) {
        this.sendError(res, new Error('Invoice not found'), 'Invoice not found', 404);
        return;
      }

      this.sendSuccess(res, invoice, 'Invoice updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.invoiceService.findById(id);

      if (!invoice) {
        this.sendError(res, new Error('Invoice not found'), 'Invoice not found', 404);
        return;
      }

      this.sendSuccess(res, invoice, 'Invoice retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get invoice');
    }
  }

  /**
   * Delete invoice (soft delete)
   */
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const invoice = await this.invoiceService.update(id, {
        status: 'cancelled',
        cancelledAt: new Date()
      }, deletedBy);

      if (!invoice) {
        this.sendError(res, new Error('Invoice not found'), 'Invoice not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Invoice cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel invoice');
    }
  }

  /**
   * Generate invoice number for a company
   */
  async generateInvoiceNumber(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, invoiceType, financialYear } = req.body;

      if (!companyId || !invoiceType) {
        this.sendError(res, new Error('Company ID and invoice type are required'), 'Missing required fields', 400);
        return;
      }

      const invoiceNumber = await this.invoiceService.generateInvoiceNumber(companyId, invoiceType, financialYear);

      this.sendSuccess(res, {
        invoiceNumber,
        financialYear: financialYear || this.getCurrentFinancialYear()
      }, 'Invoice number generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate invoice number');
    }
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.invoiceService.findById(id);
      if (!invoice) {
        this.sendError(res, new Error('Invoice not found'), 'Invoice not found', 404);
        return;
      }

      // For now, return a simple response - PDF generation would need a proper PDF library
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);

      // This is a placeholder - you would implement actual PDF generation here
      const pdfContent = `PDF content for invoice ${invoice.invoiceNumber}`;
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      this.sendError(res, error, 'Failed to generate PDF');
    }
  }

  /**
   * Preview invoice before saving
   */
  async previewInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoiceData = req.body;

      // Validate and calculate invoice amounts
      const previewData = await this.invoiceService.calculateInvoiceAmounts(invoiceData);

      this.sendSuccess(res, previewData, 'Invoice preview generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate invoice preview');
    }
  }

  /**
   * Get current financial year
   */
  private getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    // Financial year starts from April (month 4)
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }
}
