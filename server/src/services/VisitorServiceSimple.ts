import { BaseService } from './BaseService';
import Visitor from '../models/Visitor';
import User from '../models/User';
import { IVisitor } from '@/types/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';

export class VisitorServiceSimple extends BaseService<IVisitor> {
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
      }

      const visitor = await this.create({
        ...visitorData,
        visitorNumber,
        currentStatus: 'scheduled',
        overallApprovalStatus: 'pending',
        isActive: true,
        entries: [],
        exits: [],
        approvals: [],
        documents: [],
        tags: [],
        attachments: []
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
    entryData: {
      entryGate?: string;
      securityGuardId?: string;
      securityGuardName?: string;
      entryMethod?: 'manual' | 'qr_code' | 'rfid' | 'biometric' | 'face_recognition';
      temperatureCheck?: number;
      belongingsList?: string[];
      entryNotes?: string;
    },
    checkedInBy?: string
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      // Check if visitor is already inside
      if (visitor.currentStatus === 'checked_in' || visitor.currentStatus === 'inside') {
        throw new AppError('Visitor is already checked in', 400);
      }

      // Check if visitor has approval (if required)
      if (visitor.approvals && visitor.approvals.length > 0) {
        const hasApproval = visitor.approvals.some(approval => approval.isActive);
        if (!hasApproval) {
          throw new AppError('Visitor approval is required before check-in', 400);
        }
      }

      const entry = {
        entryDateTime: new Date(),
        entryGate: entryData.entryGate || 'Main Gate',
        securityGuardId: checkedInBy ? new Types.ObjectId(checkedInBy) : new Types.ObjectId(),
        securityGuardName: entryData.securityGuardName || 'Security Guard',
        entryMethod: entryData.entryMethod || 'manual',
        temperatureCheck: entryData.temperatureCheck,
        healthDeclaration: true,
        belongingsChecked: true,
        belongingsList: entryData.belongingsList || [],
        escortRequired: false,
        entryNotes: entryData.entryNotes
      };

      const updatedVisitor = await this.update(visitorId, {
        $push: { entries: entry },
        currentStatus: 'checked_in'
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
    exitData: {
      exitGate?: string;
      securityGuardId?: string;
      securityGuardName?: string;
      exitMethod?: 'manual' | 'qr_code' | 'rfid' | 'biometric' | 'face_recognition';
      exitNotes?: string;
      feedback?: {
        overallRating?: number;
        comments?: string;
      };
    },
    checkedOutBy?: string
  ): Promise<IVisitor | null> {
    try {
      const visitor = await this.findById(visitorId);
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      // Check if visitor is currently inside
      if (visitor.currentStatus !== 'checked_in' && visitor.currentStatus !== 'inside') {
        throw new AppError('Visitor is not currently checked in', 400);
      }

      const exit = {
        exitDateTime: new Date(),
        exitGate: exitData.exitGate || 'Main Gate',
        securityGuardId: checkedOutBy ? new Types.ObjectId(checkedOutBy) : new Types.ObjectId(),
        securityGuardName: exitData.securityGuardName || 'Security Guard',
        exitMethod: exitData.exitMethod || 'manual',
        belongingsReturned: true,
        exitNotes: exitData.exitNotes
      };

      const updateData: any = {
        $push: { exits: exit },
        currentStatus: 'checked_out'
      };

      // Add feedback if provided
      if (exitData.feedback) {
        updateData.feedback = exitData.feedback;
      }

      const updatedVisitor = await this.update(visitorId, updateData);

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
   * Get visitors currently inside
   */
  async getCurrentlyInside(companyId: string) {
    try {
      const visitors = await this.findMany({
        companyId: new Types.ObjectId(companyId),
        currentStatus: { $in: ['checked_in', 'inside'] },
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
        'visitInfo.scheduledDateTime': {
          $gte: startOfDay,
          $lt: endOfDay
        },
        isActive: true
      }, { sort: { 'visitInfo.scheduledDateTime': 1 } }, ['hostInfo.hostId']);

      return visitors;
    } catch (error) {
      logger.error('Error getting scheduled visitors for today', { error, companyId });
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
          { 'organizationInfo.companyName': searchRegex },
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
