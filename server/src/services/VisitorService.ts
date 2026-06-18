import { BaseService } from './BaseService';
import Visitor from '../models/Visitor';
import User from '../models/User';
import { IVisitor, IVisitorEntry, IVisitorExit } from '@/types/models';
import { AppError } from '../utils/errors';

import { logger } from '@/utils/logger';
import { Types } from 'mongoose';

export class VisitorService extends BaseService<IVisitor> {
  constructor() {
    super(Visitor);
  }

  /**
   * Create a new visitor with validation
   */
  async createVisitor(visitorData: Partial<IVisitor>, createdBy?: string): Promise<IVisitor> {
    try {
      // Validate visitor data
      this.validateVisitorData(visitorData);

      // Generate visitor number
      const visitorNumber = await this.generateVisitorNumber(visitorData.companyId!.toString());

      // Check if host exists
      if (visitorData.hostInfo?.hostId) {
        const host = await User.findById(visitorData.hostInfo.hostId);
        if (!host) {
          throw new AppError('Host not found', 404);
        }
        visitorData.hostInfo.hostName = `${host.personalInfo?.firstName} ${host.personalInfo?.lastName}`;
      }

      const visitor = await this.create({
        ...visitorData,
        visitorNumber,
        currentStatus: 'scheduled',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Visitor created successfully', { 
        visitorId: visitor._id, 
        visitorNumber,
        companyId: visitorData.companyId,
        createdBy 
      });

      return visitor;
    } catch (error) {
      logger.error('Error creating visitor', { error, visitorData, createdBy });
      throw error;
    }
  }

  /**
   * Check-in visitor
   */
  async checkInVisitor(
    visitorId: string, 
    entryData: Partial<IVisitorEntry>,
    checkedInBy?: string
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      // Check if visitor is already inside
      if (visitor.currentStatus === 'checked_in') {
        throw new AppError('Visitor is already checked in', 400);
      }

      // Check if visitor has approval (if required)
      if (visitor.approvals && visitor.approvals.length > 0) {
        const hasApproval = visitor.approvals.some((approval: any) => approval.isActive && approval.status === 'approved');
        if (!hasApproval) {
          throw new AppError('Visitor approval is required before check-in', 400);
        }
      }

      const entry: IVisitorEntry = {
        entryDateTime: new Date(),
        entryGate: entryData.entryGate || 'Main Gate',
        securityGuardId: checkedInBy ? new Types.ObjectId(checkedInBy) : new Types.ObjectId(),
        securityGuardName: entryData.securityGuardName || 'Security Guard',
        entryMethod: 'manual',
        healthDeclaration: entryData.healthDeclaration || true,
        belongingsChecked: entryData.belongingsChecked || false,
        belongingsList: entryData.belongingsList || [],
        escortRequired: entryData.escortRequired || false,
        entryNotes: (entryData as any).notes,
        temperatureCheck: entryData.temperatureCheck
      };

      const updatedVisitor = await this.update(visitorId, {
        $push: { entries: entry },
        currentStatus: 'checked_in',
        'visitInfo.actualArrivalTime': entry.entryDateTime,
        lastModifiedBy: checkedInBy ? new Types.ObjectId(checkedInBy) : undefined
      });

      logger.info('Visitor checked in successfully', {
        visitorId,
        entryTime: entry.entryDateTime,
        checkedInBy
      });

      return updatedVisitor;
    } catch (error) {
      logger.error('Error checking in visitor', { error, visitorId, entryData, checkedInBy });
      throw error;
    }
  }

  /**
   * Check-out visitor
   */
  async checkOutVisitor(
    visitorId: string, 
    exitData: Partial<IVisitorExit>,
    checkedOutBy?: string
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      // Check if visitor is currently inside
      if (visitor.currentStatus !== 'checked_in') {
        throw new AppError('Visitor is not currently checked in', 400);
      }

      const exit: IVisitorExit = {
        exitDateTime: new Date(),
        exitGate: exitData.exitGate || 'Main Gate',
        securityGuardId: checkedOutBy ? new Types.ObjectId(checkedOutBy) : new Types.ObjectId(),
        securityGuardName: exitData.securityGuardName || 'Security Guard',
        exitMethod: 'manual',
        belongingsReturned: exitData.belongingsReturned || true,
        belongingsNotes: exitData.belongingsNotes,
        feedbackRating: (exitData as any).rating,
        feedbackComments: (exitData as any).feedback,
        exitNotes: (exitData as any).notes
      };

      const updatedVisitor = await this.update(visitorId, {
        $push: { exits: exit },
        currentStatus: 'checked_out',
        'visitInfo.actualDepartureTime': exit.exitDateTime,
        lastModifiedBy: checkedOutBy ? new Types.ObjectId(checkedOutBy) : undefined
      });

      logger.info('Visitor checked out successfully', {
        visitorId,
        exitTime: exit.exitDateTime,
        checkedOutBy
      });

      return updatedVisitor;
    } catch (error) {
      logger.error('Error checking out visitor', { error, visitorId, exitData, checkedOutBy });
      throw error;
    }
  }

  /**
   * Approve visitor
   */
  async approveVisitor(
    visitorId: string, 
    approvalData: {
      approvedBy: string;
      approvalNotes?: string;
      conditions?: string[];
    }
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      if (visitor.overallApprovalStatus === 'approved') {
        throw new AppError('Visitor is already approved', 400);
      }

      const updatedVisitor = await this.update(visitorId, {
        approvalStatus: 'approved',
        'approval.approvedBy': new Types.ObjectId(approvalData.approvedBy),
        'approval.approvedAt': new Date(),
        'approval.approvalNotes': approvalData.approvalNotes,
        'approval.conditions': approvalData.conditions || [],
        currentStatus: 'approved',
        lastModifiedBy: new Types.ObjectId(approvalData.approvedBy)
      });

      logger.info('Visitor approved successfully', { 
        visitorId, 
        approvedBy: approvalData.approvedBy 
      });

      return updatedVisitor;
    } catch (error) {
      logger.error('Error approving visitor', { error, visitorId, approvalData });
      throw error;
    }
  }

  /**
   * Reject visitor
   */
  async rejectVisitor(
    visitorId: string, 
    rejectionData: {
      rejectedBy: string;
      rejectionReason: string;
      rejectionNotes?: string;
    }
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      if (visitor.overallApprovalStatus === 'rejected') {
        throw new AppError('Visitor is already rejected', 400);
      }

      const updatedVisitor = await this.update(visitorId, {
        approvalStatus: 'rejected',
        'approval.rejectedBy': new Types.ObjectId(rejectionData.rejectedBy),
        'approval.rejectedAt': new Date(),
        'approval.rejectionReason': rejectionData.rejectionReason,
        'approval.rejectionNotes': rejectionData.rejectionNotes,
        currentStatus: 'rejected',
        lastModifiedBy: new Types.ObjectId(rejectionData.rejectedBy)
      });

      logger.info('Visitor rejected successfully', { 
        visitorId, 
        rejectedBy: rejectionData.rejectedBy,
        reason: rejectionData.rejectionReason
      });

      return updatedVisitor;
    } catch (error) {
      logger.error('Error rejecting visitor', { error, visitorId, rejectionData });
      throw error;
    }
  }

  /**
   * Get visitors currently inside
   */
  async getCurrentlyInside(companyId: string) {
    try {
      const visitors = await this.findMany({
        companyId: new Types.ObjectId(companyId),
        currentStatus: 'checked_in',
        isActive: true
      }, {}, ['hostInfo.hostId']);

      return visitors;
    } catch (error) {
      logger.error('Error getting currently inside visitors', { error, companyId });
      throw error;
    }
  }

  /**
   * Get scheduled visitors for today
   */
  async getScheduledToday(companyId: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const visitors = await this.findMany({
        companyId: new Types.ObjectId(companyId),
        'visitInfo.scheduledArrivalTime': {
          $gte: startOfDay,
          $lt: endOfDay
        },
        isActive: true
      }, { sort: { 'visitInfo.scheduledArrivalTime': 1 } }, ['hostInfo.hostId']);

      return visitors;
    } catch (error) {
      logger.error('Error getting scheduled visitors for today', { error, companyId });
      throw error;
    }
  }

  /**
   * Get overstaying visitors
   */
  async getOverstayingVisitors(companyId: string) {
    try {
      const visitors = await this.findMany({
        companyId: new Types.ObjectId(companyId),
        currentStatus: 'checked_in',
        isActive: true
      });

      // Filter overstaying visitors
      const overstayingVisitors = visitors.filter(visitor => {
        if (!visitor.visitInfo?.expectedDuration) return false;
        
        const lastEntry = visitor.entries?.[visitor.entries.length - 1];
        if (!lastEntry) return false;

        const entryTime = new Date(lastEntry.entryDateTime);
        const expectedExitTime = new Date(entryTime.getTime() + visitor.visitInfo.expectedDuration * 60 * 1000);
        
        return new Date() > expectedExitTime;
      });

      return overstayingVisitors;
    } catch (error) {
      logger.error('Error getting overstaying visitors', { error, companyId });
      throw error;
    }
  }

  /**
   * Get visitor statistics
   */
  async getVisitorStats(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter: any = { companyId: new Types.ObjectId(companyId) };
      
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const [
        totalVisitors,
        currentlyInside,
        scheduledToday,
        overstaying,
        approved,
        rejected,
        pending
      ] = await Promise.all([
        this.count(dateFilter),
        this.count({ ...dateFilter, currentStatus: 'checked_in' }),
        this.getScheduledToday(companyId).then(visitors => visitors.length),
        this.getOverstayingVisitors(companyId).then(visitors => visitors.length),
        this.count({ ...dateFilter, approvalStatus: 'approved' }),
        this.count({ ...dateFilter, approvalStatus: 'rejected' }),
        this.count({ ...dateFilter, approvalStatus: 'pending' })
      ]);

      return {
        totalVisitors,
        currentlyInside,
        scheduledToday,
        overstaying,
        approved,
        rejected,
        pending,
        approvalRate: totalVisitors > 0 ? ((approved / totalVisitors) * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Error getting visitor statistics', { error, companyId, startDate, endDate });
      throw error;
    }
  }

  /**
   * Search visitors
   */
  async searchVisitors(
    companyId: string, 
    searchTerm: string, 
    page: number = 1, 
    limit: number = 10
  ) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      
      const filter = {
        companyId: new Types.ObjectId(companyId),
        isActive: true,
        $or: [
          { visitorNumber: searchRegex },
          { 'personalInfo.firstName': searchRegex },
          { 'personalInfo.lastName': searchRegex },
          { 'contactInfo.primaryPhone': searchRegex },
          { 'contactInfo.email': searchRegex },
          { 'companyInfo.companyName': searchRegex },
          { 'hostInfo.hostName': searchRegex }
        ]
      };

      return await this.paginate(filter, page, limit, { createdAt: -1 });
    } catch (error) {
      logger.error('Error searching visitors', { error, companyId, searchTerm });
      throw error;
    }
  }

  /**
   * Generate visitor number
   */
  private async generateVisitorNumber(companyId: string): Promise<string> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Count visitors for today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayCount = await this.count({
        companyId: new Types.ObjectId(companyId),
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      const sequence = (todayCount + 1).toString().padStart(4, '0');
      return `VIS-${dateStr}-${sequence}`;
    } catch (error) {
      logger.error('Error generating visitor number', { error, companyId });
      throw new AppError('Failed to generate visitor number', 500);
    }
  }

  /**
   * Validate visitor data
   */
  private validateVisitorData(visitorData: Partial<IVisitor>): void {
    if (!visitorData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!visitorData.personalInfo?.firstName) {
      throw new AppError('First name is required', 400);
    }

    if (!visitorData.personalInfo?.lastName) {
      throw new AppError('Last name is required', 400);
    }

    if (!visitorData.contactInfo?.primaryPhone) {
      throw new AppError('Phone number is required', 400);
    }

    if (!visitorData.visitInfo?.visitPurpose) {
      throw new AppError('Visit purpose is required', 400);
    }

    if (!visitorData.visitInfo?.scheduledDateTime) {
      throw new AppError('Scheduled arrival time is required', 400);
    }

    // Validate email format if provided
    if (visitorData.contactInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(visitorData.contactInfo.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    // Validate phone format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(visitorData.contactInfo.primaryPhone.replace(/[\s\-\(\)]/g, ''))) {
      throw new AppError('Invalid phone format', 400);
    }
  }
}
