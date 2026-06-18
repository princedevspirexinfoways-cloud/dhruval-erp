import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { Quotation } from '../models';
import { IQuotation } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class QuotationService extends BaseService<IQuotation> {
  constructor() {
    super(Quotation);
  }

  /**
   * Create a new quotation
   */
  async createQuotation(quotationData: Partial<IQuotation>, createdBy?: string): Promise<IQuotation> {
    try {
      // Validate quotation data
      this.validateQuotationData(quotationData);

      // Generate quotation number if not provided
      if (!quotationData.quotationNumber) {
        quotationData.quotationNumber = await this.generateQuotationNumber(quotationData.companyId!.toString());
      }

      // Calculate totals
      const totals = this.calculateQuotationTotals(quotationData.items || []);

      const quotation = await this.create({
        ...quotationData,
        quotationNumber: quotationData.quotationNumber,
        status: 'draft',
        amounts: {
          subtotal: totals.subtotal,
          totalTaxAmount: totals.totalTax,
          grandTotal: totals.totalAmount,
          totalDiscount: 0,
          taxableAmount: totals.subtotal,
          roundingAdjustment: 0,
          freightCharges: 0,
          packingCharges: 0,
          installationCharges: 0,
          otherCharges: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Quotation created successfully', { 
        quotationId: quotation._id, 
        quotationNumber: quotation.quotationNumber,
        customerId: quotation.party?.partyId,
        totalAmount: quotation.amounts?.grandTotal,
        createdBy 
      });

      return quotation;
    } catch (error) {
      logger.error('Error creating quotation', { error, quotationData, createdBy });
      throw error;
    }
  }

  /**
   * Update quotation status
   */
  async updateQuotationStatus(quotationId: string, status: string, updatedBy?: string): Promise<IQuotation | null> {
    try {
      const quotation = await this.findById(quotationId);
      if (!quotation) {
        throw new AppError('Quotation not found', 404);
      }

      // Validate status transition
      this.validateStatusTransition(quotation.status, status);

      const updateData: any = { status };

      // Set specific dates based on status
      if (status === 'sent') {
        updateData.sentAt = new Date();
      } else if (status === 'accepted') {
        updateData.acceptedAt = new Date();
      } else if (status === 'rejected') {
        updateData.rejectedAt = new Date();
      } else if (status === 'expired') {
        updateData.expiredAt = new Date();
      }

      const updatedQuotation = await this.update(quotationId, updateData, updatedBy);

      logger.info('Quotation status updated', { 
        quotationId, 
        oldStatus: quotation.status,
        newStatus: status,
        updatedBy 
      });

      return updatedQuotation;
    } catch (error) {
      logger.error('Error updating quotation status', { error, quotationId, status, updatedBy });
      throw error;
    }
  }

  /**
   * Convert quotation to order
   */
  async convertToOrder(quotationId: string, convertedBy?: string): Promise<any> {
    try {
      const quotation = await this.findById(quotationId);
      if (!quotation) {
        throw new AppError('Quotation not found', 404);
      }

      if (quotation.status !== 'accepted') {
        throw new AppError('Only accepted quotations can be converted to orders', 400);
      }

      // Update quotation status
      await this.update(quotationId, {
        status: 'converted',
        convertedAt: new Date()
      }, convertedBy);

      // Return order data structure (would typically create actual order)
      const orderData = {
        customerId: quotation.party?.partyId,
        companyId: quotation.companyId,
        items: quotation.items,
        totalAmount: quotation.amounts?.grandTotal,
        quotationReference: quotation.quotationNumber,
        convertedFrom: quotationId
      };

      logger.info('Quotation converted to order', { 
        quotationId, 
        quotationNumber: quotation.quotationNumber,
        convertedBy 
      });

      return orderData;
    } catch (error) {
      logger.error('Error converting quotation to order', { error, quotationId, convertedBy });
      throw error;
    }
  }

  /**
   * Get quotations by customer
   */
  async getQuotationsByCustomer(customerId: string, companyId: string, options: any = {}): Promise<IQuotation[]> {
    try {
      const query = { 
        customerId: new Types.ObjectId(customerId),
        companyId: new Types.ObjectId(companyId)
      };

      return await this.findMany(query, { 
        sort: { createdAt: -1 },
        ...options 
      });
    } catch (error) {
      logger.error('Error getting quotations by customer', { error, customerId, companyId });
      throw error;
    }
  }

  /**
   * Get expired quotations
   */
  async getExpiredQuotations(companyId: string): Promise<IQuotation[]> {
    try {
      const today = new Date();
      const query = { 
        companyId: new Types.ObjectId(companyId),
        status: { $in: ['sent', 'draft'] },
        validUntil: { $lt: today }
      };

      return await this.findMany(query, { sort: { validUntil: 1 } });
    } catch (error) {
      logger.error('Error getting expired quotations', { error, companyId });
      throw error;
    }
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(companyId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };
      
      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const [
        totalQuotations,
        quotationsByStatus,
        totalValue,
        acceptanceRate,
        averageQuotationValue
      ] = await Promise.all([
        this.count(matchQuery),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalValue: { $sum: '$totalAmount' } } }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { 
            $group: { 
              _id: null, 
              total: { $sum: 1 },
              accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
            }
          }
        ]),
        this.model.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, avgValue: { $avg: '$totalAmount' } } }
        ])
      ]);

      const acceptance = acceptanceRate[0];
      const rate = acceptance ? (acceptance.accepted / acceptance.total) * 100 : 0;

      return {
        totalQuotations,
        quotationsByStatus,
        totalValue: totalValue[0]?.totalValue || 0,
        acceptanceRate: parseFloat(rate.toFixed(2)),
        averageQuotationValue: averageQuotationValue[0]?.avgValue || 0
      };
    } catch (error) {
      logger.error('Error getting quotation statistics', { error, companyId, dateRange });
      throw error;
    }
  }

  /**
   * Calculate quotation totals
   */
  private calculateQuotationTotals(items: any[]): { subtotal: number; totalTax: number; totalAmount: number } {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const itemTotal = item.quantity * item.rate;
      const itemTax = itemTotal * (item.taxBreakup?.[0]?.rate || 0) / 100;

      subtotal += itemTotal;
      totalTax += itemTax;
    });

    const totalAmount = subtotal + totalTax;

    return { subtotal, totalTax, totalAmount };
  }

  /**
   * Generate quotation number
   */
  private async generateQuotationNumber(companyId: string): Promise<string> {
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

    return `QUO${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: { [key: string]: string[] } = {
      'draft': ['sent', 'cancelled'],
      'sent': ['accepted', 'rejected', 'expired', 'cancelled'],
      'accepted': ['converted'],
      'rejected': [],
      'expired': [],
      'converted': [],
      'cancelled': []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
    }
  }

  /**
   * Validate quotation data
   */
  private validateQuotationData(quotationData: Partial<IQuotation>): void {
    if (!quotationData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!quotationData.party?.partyId) {
      throw new AppError('Party ID is required', 400);
    }

    if (!quotationData.items || quotationData.items.length === 0) {
      throw new AppError('Quotation must have at least one item', 400);
    }

    if (!quotationData.validUntil) {
      throw new AppError('Valid until date is required', 400);
    }

    // Validate each item
    quotationData.items.forEach((item, index) => {
      if (!item.description) {
        throw new AppError(`Item ${index + 1}: Description is required`, 400);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new AppError(`Item ${index + 1}: Quantity must be greater than 0`, 400);
      }
      if (!item.rate || item.rate < 0) {
        throw new AppError(`Item ${index + 1}: Rate must be non-negative`, 400);
      }
    });
  }
}
