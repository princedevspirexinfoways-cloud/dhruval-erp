import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { FinancialTransactionService } from '../services/FinancialTransactionService';
import { IFinancialTransaction } from '../types/models';

export class FinancialTransactionController extends BaseController<IFinancialTransaction> {
  private financialTransactionService: FinancialTransactionService;

  constructor() {
    const financialTransactionService = new FinancialTransactionService();
    super(financialTransactionService, 'FinancialTransaction');
    this.financialTransactionService = financialTransactionService;
  }

  /**
   * Create a new financial transaction
   */
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const transaction = await this.financialTransactionService.createTransaction(transactionData, createdBy);

      this.sendSuccess(res, transaction, 'Financial transaction created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create financial transaction');
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { status } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const transaction = await this.financialTransactionService.updateTransactionStatus(transactionId, status, updatedBy);

      this.sendSuccess(res, transaction, 'Transaction status updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update transaction status');
    }
  }

  /**
   * Get transactions by company
   */
  async getTransactionsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, transactionType, status, search, startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (transactionType) {
        options.transactionType = transactionType;
      }

      if (status) {
        options.status = status;
      }

      if (search) {
        options.search = search;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const transactions = await this.financialTransactionService.getTransactionsByCompany(companyId.toString(), options);

      this.sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get transactions');
    }
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(req: Request, res: Response): Promise<void> {
    try {
      const { transactionType } = req.params;
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

      const transactions = await this.financialTransactionService.getTransactionsByType(companyId.toString(), transactionType, options);

      this.sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get transactions');
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.financialTransactionService.getTransactionStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Transaction statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get transaction statistics');
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transaction = await this.financialTransactionService.findById(id);

      if (!transaction) {
        this.sendError(res, new Error('Transaction not found'), 'Transaction not found', 404);
        return;
      }

      this.sendSuccess(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get transaction');
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const transaction = await this.financialTransactionService.update(id, updateData, updatedBy);

      if (!transaction) {
        this.sendError(res, new Error('Transaction not found'), 'Transaction not found', 404);
        return;
      }

      this.sendSuccess(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update transaction');
    }
  }

  /**
   * Delete transaction (soft delete)
   */
  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const transaction = await this.financialTransactionService.update(id, {
        'paymentDetails.paymentStatus': 'cancelled',
        deletedAt: new Date(),
        deletedBy
      }, deletedBy);

      if (!transaction) {
        this.sendError(res, new Error('Transaction not found'), 'Transaction not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Transaction cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel transaction');
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { q: searchTerm, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!searchTerm) {
        this.sendError(res, new Error('Search term is required'), 'Search term is required', 400);
        return;
      }

      const transactions = await this.financialTransactionService.findMany({
        companyId,
        $or: [
          { transactionNumber: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'partyDetails.partyName': { $regex: searchTerm, $options: 'i' } }
        ]
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, transactions, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search transactions');
    }
  }
}
