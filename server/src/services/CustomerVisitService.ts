import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import CustomerVisit from '../models/CustomerVisit';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Simplified CustomerVisit interface for service
interface ICustomerVisit {
  _id: string;
  partyName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  visitDate: Date;
  purpose: 'business_meeting' | 'product_demo' | 'negotiation' | 'follow_up' | 'site_visit' | 'other';
  purposeDescription: string;
  travelType: 'local' | 'outstation' | 'international';
  travelDetails: any;
  accommodation?: any;
  foodExpenses: any[];
  giftsGiven: any[];
  transportationExpenses: any[];
  otherExpenses: any[];
  visitOutcome: any;
  totalExpenses: {
    accommodation: number;
    food: number;
    transportation: number;
    gifts: number;
    other: number;
    total: number;
  };
  attachments?: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  reimbursementAmount?: number;
  reimbursedAt?: Date;
  companyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerVisitService {
  constructor() {
    // Simple service without BaseService inheritance
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<any> {
    try {
      return await CustomerVisit.findById(id)
        .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
        .populate('companyId', 'companyName companyCode')
        .lean();
    } catch (error) {
      logger.error('Error finding customer visit by ID', { error, id });
      throw error;
    }
  }

  /**
   * Create new customer visit
   */
  async create(data: any): Promise<any> {
    try {
      const visit = new CustomerVisit(data);
      return await visit.save();
    } catch (error) {
      logger.error('Error creating customer visit', { error, data });
      throw error;
    }
  }

  /**
   * Update customer visit
   */
  async update(id: string, data: any, updatedBy?: string): Promise<any> {
    try {
      return await CustomerVisit.findByIdAndUpdate(
        id,
        { ...data, lastModifiedBy: updatedBy },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      logger.error('Error updating customer visit', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete customer visit
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await CustomerVisit.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting customer visit', { error, id });
      throw error;
    }
  }

  /**
   * Find many customer visits
   */
  async findMany(query: any, options?: any): Promise<any[]> {
    try {
      return await CustomerVisit.find(query)
        .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
        .populate('companyId', 'companyName companyCode')
        .sort(options?.sort || { createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Error finding customer visits', { error, query });
      throw error;
    }
  }

  /**
   * Create a new customer visit
   */
  async createCustomerVisit(visitData: Partial<ICustomerVisit>, createdBy?: string): Promise<ICustomerVisit> {
    try {
      // Validate required fields
      if (!visitData.partyName) {
        throw new AppError('Party name is required', 400);
      }
      if (!visitData.contactPerson) {
        throw new AppError('Contact person is required', 400);
      }
      if (!visitData.contactPhone) {
        throw new AppError('Contact phone is required', 400);
      }
      if (!visitData.visitDate) {
        throw new AppError('Visit date is required', 400);
      }
      if (!visitData.purpose) {
        throw new AppError('Purpose is required', 400);
      }
      if (!visitData.purposeDescription) {
        throw new AppError('Purpose description is required', 400);
      }
      if (!visitData.travelType) {
        throw new AppError('Travel type is required', 400);
      }
      if (!visitData.companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const visit = await this.create({
        ...visitData,
        createdBy,
        approvalStatus: 'pending',
        visitOutcome: {
          status: visitData.visitOutcome?.status || 'pending',
          notes: visitData.visitOutcome?.notes || 'Visit scheduled',
          ...visitData.visitOutcome
        },
        totalExpenses: {
          accommodation: 0,
          food: 0,
          transportation: 0,
          gifts: 0,
          other: 0,
          total: 0
        }
      });

      logger.info('Customer visit created successfully', { 
        visitId: visit._id, 
        partyName: visit.partyName,
        purpose: visit.purpose,
        companyId: visitData.companyId,
        createdBy 
      });

      return visit;
    } catch (error) {
      logger.error('Error creating customer visit', { error, visitData, createdBy });
      throw error;
    }
  }

  /**
   * Get customer visits by company
   */
  async getVisitsByCompany(companyId: string, options: any = {}): Promise<ICustomerVisit[]> {
    try {
      const query = { 
        companyId: new Types.ObjectId(companyId)
      };

      return await this.findMany(query, options);
    } catch (error) {
      logger.error('Error getting visits by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Get visits by date range
   */
  async getVisitsByDateRange(companyId: string, startDate: Date, endDate: Date): Promise<ICustomerVisit[]> {
    try {
      return await this.findMany({ 
        companyId: new Types.ObjectId(companyId),
        visitDate: { $gte: startDate, $lte: endDate }
      });
    } catch (error) {
      logger.error('Error getting visits by date range', { error, companyId, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(companyId: string | null): Promise<ICustomerVisit[]> {
    try {
      const query: any = { approvalStatus: 'pending' };
      
      // If companyId is provided, filter by company
      if (companyId) {
        query.companyId = new Types.ObjectId(companyId);
      }
      // If companyId is null (super admin), don't filter by company
      
      return await this.findMany(query);
    } catch (error) {
      logger.error('Error getting pending approvals', { error, companyId });
      throw error;
    }
  }

  /**
   * Approve a visit
   */
  async approveVisit(visitId: string, approvedBy: string, reimbursementAmount?: number): Promise<any> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      if (visit.approvalStatus !== 'pending') {
        throw new AppError('Visit is not pending approval', 400);
      }

      const updatedVisit = await this.update(visitId, {
        approvalStatus: 'approved',
        approvedBy: new Types.ObjectId(approvedBy),
        approvedAt: new Date(),
        reimbursementAmount: reimbursementAmount || visit.totalExpenses.total
      }, approvedBy);

      logger.info('Visit approved', { 
        visitId, 
        partyName: visit.partyName,
        approvedBy,
        reimbursementAmount 
      });

      return updatedVisit;
    } catch (error) {
      logger.error('Error approving visit', { error, visitId, approvedBy });
      throw error;
    }
  }

  /**
   * Reject a visit
   */
  async rejectVisit(visitId: string, rejectedBy: string, reason?: string): Promise<any> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      if (visit.approvalStatus !== 'pending') {
        throw new AppError('Visit is not pending approval', 400);
      }

      const updatedVisit = await this.update(visitId, {
        approvalStatus: 'rejected',
        approvedBy: new Types.ObjectId(rejectedBy),
        approvedAt: new Date(),
        ...(reason && { 'visitOutcome.notes': `${visit.visitOutcome?.notes || ''}\n\nRejection Reason: ${reason}` })
      }, rejectedBy);

      logger.info('Visit rejected', { 
        visitId, 
        partyName: visit.partyName,
        rejectedBy,
        reason 
      });

      return updatedVisit;
    } catch (error) {
      logger.error('Error rejecting visit', { error, visitId, rejectedBy });
      throw error;
    }
  }

  /**
   * Mark visit as reimbursed
   */
  async markAsReimbursed(visitId: string, reimbursedBy: string): Promise<ICustomerVisit | null> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      if (visit.approvalStatus !== 'approved') {
        throw new AppError('Visit must be approved before reimbursement', 400);
      }

      const updatedVisit = await this.update(visitId, {
        approvalStatus: 'reimbursed',
        reimbursedAt: new Date()
      }, reimbursedBy);

      logger.info('Visit marked as reimbursed', { 
        visitId, 
        partyName: visit.partyName,
        reimbursedBy 
      });

      return updatedVisit;
    } catch (error) {
      logger.error('Error marking visit as reimbursed', { error, visitId, reimbursedBy });
      throw error;
    }
  }

  /**
   * Recalculate total expenses for a visit
   */
  private async recalculateTotalExpenses(visitId: string): Promise<void> {
    try {
      const visit = await CustomerVisit.findById(visitId);
      if (!visit) return;

      // Calculate accommodation total
      let accommodationTotal = 0;
      if (visit.accommodation && visit.accommodation.checkInDate && visit.accommodation.checkOutDate) {
        const checkIn = new Date(visit.accommodation.checkInDate);
        const checkOut = new Date(visit.accommodation.checkOutDate);
        
        // Handle same-day check-in/check-out
        let totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (totalNights <= 0) totalNights = 1; // Minimum 1 night for same day
        
        const totalCost = totalNights * (visit.accommodation.numberOfRooms || 1) * (visit.accommodation.costPerNight || 0);
        
        // Update accommodation totals
        await CustomerVisit.findByIdAndUpdate(visitId, {
          'accommodation.totalNights': totalNights,
          'accommodation.totalCost': totalCost
        });
        
        accommodationTotal = totalCost;
      }

      // Calculate food expenses total
      const foodTotal = visit.foodExpenses.reduce((sum, expense) => {
        // Use existing totalCost if available, otherwise calculate
        return sum + (expense.totalCost || (expense.numberOfPeople * expense.costPerPerson));
      }, 0);

      // Calculate gifts total
      const giftsTotal = visit.giftsGiven.reduce((sum, gift) => {
        // Use existing totalCost if available, otherwise calculate
        return sum + (gift.totalCost || (gift.quantity * gift.unitCost));
      }, 0);

      // Calculate transportation total
      const transportationTotal = visit.transportationExpenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);

      // Calculate other expenses total
      const otherTotal = visit.otherExpenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);

      // Calculate grand total
      const grandTotal = accommodationTotal + foodTotal + transportationTotal + giftsTotal + otherTotal;

      // Update totalExpenses
      await CustomerVisit.findByIdAndUpdate(visitId, {
        'totalExpenses.accommodation': accommodationTotal,
        'totalExpenses.food': foodTotal,
        'totalExpenses.transportation': transportationTotal,
        'totalExpenses.gifts': giftsTotal,
        'totalExpenses.other': otherTotal,
        'totalExpenses.total': grandTotal
      });

      logger.info('Total expenses recalculated', { 
        visitId, 
        accommodationTotal, 
        foodTotal, 
        transportationTotal, 
        giftsTotal, 
        otherTotal,
        grandTotal
      });
    } catch (error) {
      logger.error('Error recalculating total expenses', { error, visitId });
      throw error;
    }
  }

  /**
   * Add food expense to visit
   */
  async addFoodExpense(visitId: string, expenseData: any, updatedBy: string): Promise<ICustomerVisit | null> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      // Calculate total cost
      expenseData.totalCost = expenseData.costPerPerson * expenseData.numberOfPeople;

      const updatedVisit = await CustomerVisit.findByIdAndUpdate(
        visitId,
        { 
          $push: { foodExpenses: expenseData },
          lastModifiedBy: new Types.ObjectId(updatedBy),
          updatedAt: new Date()
        },
        { new: true }
      );

      // Recalculate total expenses
      await this.recalculateTotalExpenses(visitId);

      logger.info('Food expense added', { visitId, expenseData, updatedBy });
      return updatedVisit as any;
    } catch (error) {
      logger.error('Error adding food expense', { error, visitId, expenseData, updatedBy });
      throw error;
    }
  }

  /**
   * Add gift/sample to visit
   */
  async addGift(visitId: string, giftData: any, updatedBy: string): Promise<ICustomerVisit | null> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      // Calculate total cost
      giftData.totalCost = giftData.unitCost * giftData.quantity;

      const updatedVisit = await CustomerVisit.findByIdAndUpdate(
        visitId,
        { 
          $push: { giftsGiven: giftData },
          lastModifiedBy: new Types.ObjectId(updatedBy),
          updatedAt: new Date()
        },
        { new: true }
      );

      // Recalculate total expenses
      await this.recalculateTotalExpenses(visitId);

      logger.info('Gift added', { visitId, giftData, updatedBy });
      return updatedVisit as any;
    } catch (error) {
      logger.error('Error adding gift', { error, visitId, giftData, updatedBy });
      throw error;
    }
  }

  /**
   * Add transportation expense to visit
   */
  async addTransportationExpense(visitId: string, expenseData: any, updatedBy: string): Promise<ICustomerVisit | null> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      const updatedVisit = await CustomerVisit.findByIdAndUpdate(
        visitId,
        { 
          $push: { transportationExpenses: expenseData },
          lastModifiedBy: new Types.ObjectId(updatedBy),
          updatedAt: new Date()
        },
        { new: true }
      );

      // Recalculate total expenses
      await this.recalculateTotalExpenses(visitId);

      logger.info('Transportation expense added', { visitId, expenseData, updatedBy });
      return updatedVisit as any;
    } catch (error) {
      logger.error('Error adding transportation expense', { error, visitId, expenseData, updatedBy });
      throw error;
    }
  }

  /**
   * Add other expense to visit
   */
  async addOtherExpense(visitId: string, expenseData: any, updatedBy: string): Promise<ICustomerVisit | null> {
    try {
      const visit = await this.findById(visitId);
      if (!visit) {
        throw new AppError('Visit not found', 404);
      }

      const updatedVisit = await CustomerVisit.findByIdAndUpdate(
        visitId,
        { 
          $push: { otherExpenses: expenseData },
          lastModifiedBy: new Types.ObjectId(updatedBy),
          updatedAt: new Date()
        },
        { new: true }
      );

      // Recalculate total expenses
      await this.recalculateTotalExpenses(visitId);

      logger.info('Other expense added', { visitId, expenseData, updatedBy });
      return updatedVisit as any;
    } catch (error) {
      logger.error('Error adding other expense', { error, visitId, expenseData, updatedBy });
      throw error;
    }
  }

  /**
   * Update customer visit and recalculate totals
   */
  async updateCustomerVisit(visitId: string, updateData: any, updatedBy: string): Promise<ICustomerVisit | null> {
    try {
      const updatedVisit = await CustomerVisit.findByIdAndUpdate(
        visitId,
        { 
          ...updateData,
          lastModifiedBy: new Types.ObjectId(updatedBy),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedVisit) {
        throw new AppError('Visit not found', 404);
      }

      // Recalculate total expenses
      await this.recalculateTotalExpenses(visitId);

      logger.info('Customer visit updated', { visitId, updateData, updatedBy });
      return updatedVisit as any;
    } catch (error) {
      logger.error('Error updating customer visit', { error, visitId, updateData, updatedBy });
      throw error;
    }
  }

  /**
   * Manually recalculate totals for a visit (public method)
   */
  async recalculateVisitTotals(visitId: string): Promise<ICustomerVisit | null> {
    try {
      await this.recalculateTotalExpenses(visitId);
      const updatedVisit = await this.findById(visitId);
      logger.info('Visit totals recalculated manually', { visitId });
      return updatedVisit;
    } catch (error) {
      logger.error('Error manually recalculating visit totals', { error, visitId });
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStats(companyId: string | null, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const matchQuery: any = {};
      
      // If companyId is provided, filter by company
      if (companyId) {
        matchQuery.companyId = new Types.ObjectId(companyId);
      }
      // If companyId is null (super admin), don't filter by company
      
      if (startDate && endDate) {
        matchQuery.visitDate = { $gte: startDate, $lte: endDate };
      }

      const stats = await CustomerVisit.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            totalExpenses: { $sum: '$totalExpenses.total' },
            avgExpensePerVisit: { $avg: '$totalExpenses.total' },
            accommodationTotal: { $sum: '$totalExpenses.accommodation' },
            foodTotal: { $sum: '$totalExpenses.food' },
            transportationTotal: { $sum: '$totalExpenses.transportation' },
            giftsTotal: { $sum: '$totalExpenses.gifts' },
            otherTotal: { $sum: '$totalExpenses.other' },
            pendingApprovals: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
            },
            approvedVisits: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
            },
            reimbursedVisits: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'reimbursed'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalVisits: 0,
        totalExpenses: 0,
        avgExpensePerVisit: 0,
        accommodationTotal: 0,
        foodTotal: 0,
        transportationTotal: 0,
        giftsTotal: 0,
        otherTotal: 0,
        pendingApprovals: 0,
        approvedVisits: 0,
        reimbursedVisits: 0
      };
    } catch (error) {
      logger.error('Error getting expense stats', { error, companyId });
      throw error;
    }
  }

  /**
   * Find many with pagination
   */
  async findManyWithPagination(query: any, options: any): Promise<any> {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 }, populate = [] } = options;
      const skip = (page - 1) * limit;

      console.log('CustomerVisitService.findManyWithPagination - Input:', {
        query,
        options,
        skip,
        limit,
        mongooseConnectionState: CustomerVisit.db.readyState
      });

      let queryBuilder = CustomerVisit.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Apply populate options if provided
      if (populate && populate.length > 0) {
        populate.forEach((populateOption: any) => {
          queryBuilder = queryBuilder.populate(populateOption.path, populateOption.select);
        });
      } else {
        // Default populate if no options provided
        queryBuilder = queryBuilder
          .populate('createdBy', 'username email personalInfo.firstName personalInfo.lastName')
          .populate('companyId', 'companyName companyCode');
      }

      const [data, total] = await Promise.all([
        queryBuilder.lean(),
        CustomerVisit.countDocuments(query)
      ]);

      console.log('CustomerVisitService.findManyWithPagination - Database result:', {
        total,
        dataLength: data?.length || 0,
        firstRecord: data?.[0] ? {
          _id: data[0]._id,
          partyName: data[0].partyName,
          companyId: data[0].companyId
        } : null
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error finding customer visits with pagination', { error, query, options });
      throw error;
    }
  }


}
