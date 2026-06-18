import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { VisitorServiceSimple } from '@/services/VisitorServiceSimple';
import { IVisitor } from '@/types/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class VisitorControllerSimple extends BaseController<IVisitor> {
  private visitorService: VisitorServiceSimple;

  constructor() {
    const visitorService = new VisitorServiceSimple();
    super(visitorService, 'Visitor');
    this.visitorService = visitorService;
  }

  /**
   * Create a new visitor
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId, companyId } = this.getUserInfo(req);
      const visitorData = { ...req.body, companyId };

      logger.info('Creating visitor', { visitorData, userId, companyId });

      const visitor = await this.visitorService.createVisitor(visitorData, userId);
      
      this.sendSuccess(res, visitor, 'Visitor created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check-in visitor
   */
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const entryData = req.body;

      logger.info('Checking in visitor', { visitorId: id, entryData, userId });

      const visitor = await this.visitorService.checkInVisitor(id, entryData, userId);
      
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      this.sendSuccess(res, visitor, 'Visitor checked in successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check-out visitor
   */
  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const exitData = req.body;

      logger.info('Checking out visitor', { visitorId: id, exitData, userId });

      const visitor = await this.visitorService.checkOutVisitor(id, exitData, userId);
      
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      this.sendSuccess(res, visitor, 'Visitor checked out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get visitors currently inside
   */
  async getCurrentlyInside(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      logger.info('Getting currently inside visitors', { companyId });

      const visitors = await this.visitorService.getCurrentlyInside(companyId);
      
      this.sendSuccess(res, visitors, 'Currently inside visitors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scheduled visitors for today
   */
  async getScheduledToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      logger.info('Getting scheduled visitors for today', { companyId });

      const visitors = await this.visitorService.getScheduledToday(companyId);
      
      this.sendSuccess(res, visitors, 'Scheduled visitors for today retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search visitors
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const { companyId } = this.getUserInfo(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      logger.info('Searching visitors', { searchTerm, companyId, page, limit });

      const result = await this.visitorService.searchVisitors(
        companyId, 
        searchTerm as string, 
        page, 
        limit
      );
      
      this.sendPaginatedResponse(res, result, 'Visitor search results retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all visitors with company filtering
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort || { createdAt: -1 };
      const populate = req.query.populate as string[];

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }
      
      // Build filter from query parameters and add company filter
      const filter = {
        ...this.buildVisitorFilter(req.query),
        companyId
      };

      logger.info('Getting visitors with filter', { page, limit, filter });

      const result = await this.visitorService.paginate(filter, page, limit, sort, populate);
      
      this.sendPaginatedResponse(res, result, 'Visitors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get visitor dashboard data
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      logger.info('Getting visitor dashboard data', { companyId });

      const [
        currentlyInside,
        scheduledToday
      ] = await Promise.all([
        this.visitorService.getCurrentlyInside(companyId),
        this.visitorService.getScheduledToday(companyId)
      ]);

      const dashboardData = {
        statistics: {
          currentlyInside: currentlyInside.length,
          scheduledToday: scheduledToday.length
        },
        currentlyInside: currentlyInside.slice(0, 10), // Latest 10
        scheduledToday: scheduledToday.slice(0, 10), // Next 10
        lastUpdated: new Date().toISOString()
      };

      this.sendSuccess(res, dashboardData, 'Visitor dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build visitor-specific filter from query parameters
   */
  private buildVisitorFilter(query: any): any {
    const filter = this.buildFilterFromQuery(query);

    // Visitor-specific filters
    if (query.visitorNumber) {
      filter.visitorNumber = new RegExp(query.visitorNumber, 'i');
    }

    if (query.firstName) {
      filter['personalInfo.firstName'] = new RegExp(query.firstName, 'i');
    }

    if (query.lastName) {
      filter['personalInfo.lastName'] = new RegExp(query.lastName, 'i');
    }

    if (query.phone) {
      filter['contactInfo.primaryPhone'] = new RegExp(query.phone, 'i');
    }

    if (query.email) {
      filter['contactInfo.email'] = new RegExp(query.email, 'i');
    }

    if (query.company) {
      filter['organizationInfo.companyName'] = new RegExp(query.company, 'i');
    }

    if (query.purpose) {
      filter['visitInfo.visitPurpose'] = new RegExp(query.purpose, 'i');
    }

    if (query.currentStatus) {
      filter.currentStatus = query.currentStatus;
    }

    if (query.overallApprovalStatus) {
      filter.overallApprovalStatus = query.overallApprovalStatus;
    }

    if (query.hostId) {
      filter['hostInfo.hostId'] = query.hostId;
    }

    if (query.visitType) {
      filter['visitInfo.visitType'] = query.visitType;
    }

    if (query.scheduledFrom || query.scheduledTo) {
      filter['visitInfo.scheduledDateTime'] = {};
      if (query.scheduledFrom) {
        filter['visitInfo.scheduledDateTime'].$gte = new Date(query.scheduledFrom);
      }
      if (query.scheduledTo) {
        filter['visitInfo.scheduledDateTime'].$lte = new Date(query.scheduledTo);
      }
    }

    return filter;
  }
}
