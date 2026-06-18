import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import FinancialTransaction from '../models/FinancialTransaction';
import { IFinancialTransaction } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class FinancialTransactionService extends BaseService<IFinancialTransaction> {
  constructor() {
    super(FinancialTransaction);
  }

  /**
   * Create a new financial transaction
   */
  async createTransaction(transactionData: Partial<IFinancialTransaction>, createdBy?: string): Promise<IFinancialTransaction> {
    try {
      // Validate transaction data
      this.validateTransactionData(transactionData);

      // Generate transaction number if not provided
      if (!transactionData.transactionNumber) {
        transactionData.transactionNumber = await this.generateTransactionNumber(transactionData.companyId!.toString());
      }

      const transaction = await this.create({
        ...transactionData,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined
      }, createdBy);

      logger.info('Financial transaction created successfully', {
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber,
        amount: transaction.amount,
        type: transaction.transactionType,
        createdBy
      });

      return transaction;
    } catch (error) {
      logger.error('Error creating financial transaction', { error, transactionData, createdBy });
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId: string, status: string, updatedBy?: string): Promise<IFinancialTransaction | null> {
    try {
      const transaction = await this.findById(transactionId);
      if (!transaction) {
        throw new AppError('Financial transaction not found', 404);
      }

      const updateData: any = {
        'paymentDetails.paymentStatus': status,
        lastModifiedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined
      };

      const updatedTransaction = await this.update(transactionId, updateData, updatedBy);

      logger.info('Financial transaction status updated', {
        transactionId,
        oldStatus: transaction.paymentDetails?.paymentStatus,
        newStatus: status,
        updatedBy
      });

      return updatedTransaction;
    } catch (error) {
      logger.error('Error updating transaction status', { error, transactionId, status, updatedBy });
      throw error;
    }
  }

  /**
   * Get transactions by company
   */
  async getTransactionsByCompany(companyId: string, options: any = {}): Promise<IFinancialTransaction[]> {
    try {
      let query: any = { 
        companyId: new Types.ObjectId(companyId)
      };

      if (options.transactionType) {
        query.transactionType = options.transactionType;
      }

      if (options.status) {
        query['paymentDetails.paymentStatus'] = options.status;
      }

      if (options.dateRange) {
        query.transactionDate = {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        };
      }

      if (options.search) {
        query.$or = [
          { transactionNumber: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } },
          { 'partyDetails.partyName': { $regex: options.search, $options: 'i' } }
        ];
      }

      return await this.findMany(query, { 
        sort: { transactionDate: -1 },
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Error getting transactions by company', { error, companyId, options });
      throw error;
    }
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(companyId: string, transactionType: string, options: any = {}): Promise<IFinancialTransaction[]> {
    try {
      const query = { 
        companyId: new Types.ObjectId(companyId),
        transactionType
      };

      return await this.findMany(query, { 
        sort: { transactionDate: -1 },
        ...options 
      });
    } catch (error) {
      logger.error('Error getting transactions by type', { error, companyId, transactionType });
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };
      
      if (dateRange) {
        matchQuery.transactionDate = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalTransactions,
        transactionsByType,
        transactionsByStatus,
        totalAmount,
        averageAmount
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$transactionType', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$paymentDetails.paymentStatus', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, avgAmount: { $avg: '$amount' } } }
        ])
      ]);

      return {
        totalTransactions,
        transactionsByType,
        transactionsByStatus,
        totalAmount: totalAmount[0]?.totalAmount || 0,
        averageAmount: averageAmount[0]?.avgAmount || 0
      };
    } catch (error) {
      logger.error('Error getting transaction statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Generate transaction number
   */
  private async generateTransactionNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.count({ 
      companyId: new Types.ObjectId(companyId),
      createdAt: {
        $gte: new Date(year, today.getMonth(), 1),
        $lt: new Date(year, today.getMonth() + 1, 1)
      }
    });

    return `TXN${year}${month}${(count + 1).toString().padStart(6, '0')}`;
  }



  /**
   * Validate transaction data
   */
  private validateTransactionData(transactionData: Partial<IFinancialTransaction>): void {
    if (!transactionData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      throw new AppError('Valid amount is required', 400);
    }

    if (!transactionData.transactionType) {
      throw new AppError('Transaction type is required', 400);
    }

    if (!transactionData.transactionDate) {
      throw new AppError('Transaction date is required', 400);
    }

    if (!transactionData.description) {
      throw new AppError('Transaction description is required', 400);
    }
  }
}
