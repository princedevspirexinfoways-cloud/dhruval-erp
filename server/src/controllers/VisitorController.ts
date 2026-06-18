import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { VisitorService } from '@/services/VisitorService';
import { IVisitor } from '@/types/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import S3Service from '@/services/S3Service';

export class VisitorController extends BaseController<IVisitor> {
  private visitorService: VisitorService;

  constructor() {
    const visitorService = new VisitorService();
    super(visitorService, 'Visitor');
    this.visitorService = visitorService;
  }

  /**
   * Create a new visitor with file uploads
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);

      const { userId, companyId } = this.getUserInfo(req);
      const visitorData = { ...req.body, companyId };

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (files) {
        // Handle entry photo
        if (files.entryPhoto && files.entryPhoto[0]) {
          visitorData.entries = [{
            ...visitorData.entries?.[0],
            entryPhoto: (files.entryPhoto[0] as any).location
          }];
        }

        // Handle documents
        if (files.documents && files.documents.length > 0) {
          visitorData.documents = files.documents.map((file: any) => ({
            documentType: 'other',
            documentNumber: `DOC-${Date.now()}`,
            documentUrl: file.location,
            isVerified: false
          }));
        }

        // Handle attachments
        if (files.attachments && files.attachments.length > 0) {
          visitorData.attachments = files.attachments.map((file: any) => file.location);
        }
      }

      logger.info('Creating visitor with files', {
        visitorData: { ...visitorData, documents: visitorData.documents?.length || 0 },
        userId,
        companyId,
        filesUploaded: files ? Object.keys(files).length : 0
      });

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
   * Approve visitor
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const { approvalNotes, conditions } = req.body;

      logger.info('Approving visitor', { visitorId: id, userId });

      const visitor = await this.visitorService.approveVisitor(id, {
        approvedBy: userId!,
        approvalNotes,
        conditions
      });
      
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      this.sendSuccess(res, visitor, 'Visitor approved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject visitor
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const { rejectionReason, rejectionNotes } = req.body;

      if (!rejectionReason) {
        throw new AppError('Rejection reason is required', 400);
      }

      logger.info('Rejecting visitor', { visitorId: id, rejectionReason, userId });

      const visitor = await this.visitorService.rejectVisitor(id, {
        rejectedBy: userId!,
        rejectionReason,
        rejectionNotes
      });
      
      if (!visitor) {
        throw new AppError('Visitor not found', 404);
      }

      this.sendSuccess(res, visitor, 'Visitor rejected successfully');
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
   * Get overstaying visitors
   */
  async getOverstaying(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      logger.info('Getting overstaying visitors', { companyId });

      const visitors = await this.visitorService.getOverstayingVisitors(companyId);
      
      this.sendSuccess(res, visitors, 'Overstaying visitors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get visitor statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { startDate, endDate } = req.query;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      logger.info('Getting visitor statistics', { companyId, startDate: start, endDate: end });

      const stats = await this.visitorService.getVisitorStats(companyId, start, end);
      
      this.sendSuccess(res, stats, 'Visitor statistics retrieved successfully');
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
        stats,
        currentlyInside,
        scheduledToday,
        overstaying
      ] = await Promise.all([
        this.visitorService.getVisitorStats(companyId),
        this.visitorService.getCurrentlyInside(companyId),
        this.visitorService.getScheduledToday(companyId),
        this.visitorService.getOverstayingVisitors(companyId)
      ]);

      const dashboardData = {
        statistics: stats,
        currentlyInside: currentlyInside.slice(0, 10), // Latest 10
        scheduledToday: scheduledToday.slice(0, 10), // Next 10
        overstaying: overstaying.slice(0, 10), // Top 10
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
      filter['companyInfo.companyName'] = new RegExp(query.company, 'i');
    }

    if (query.purpose) {
      filter['visitInfo.purpose'] = new RegExp(query.purpose, 'i');
    }

    if (query.currentStatus) {
      filter.currentStatus = query.currentStatus;
    }

    if (query.approvalStatus) {
      filter.approvalStatus = query.approvalStatus;
    }

    if (query.hostId) {
      filter['hostInfo.hostId'] = query.hostId;
    }

    if (query.visitType) {
      filter['visitInfo.visitType'] = query.visitType;
    }

    if (query.scheduledFrom || query.scheduledTo) {
      filter['visitInfo.scheduledArrivalTime'] = {};
      if (query.scheduledFrom) {
        filter['visitInfo.scheduledArrivalTime'].$gte = new Date(query.scheduledFrom);
      }
      if (query.scheduledTo) {
        filter['visitInfo.scheduledArrivalTime'].$lte = new Date(query.scheduledTo);
      }
    }

    return filter;
  }

  /**
   * Validate visitor access for operations
   */
  protected validateVisitorAccess(req: Request, visitor: IVisitor): void {
    const { companyId } = this.getUserInfo(req);

    if (!companyId) {
      throw new AppError('Company ID is required', 400);
    }

    // Check if visitor belongs to user's company
    if (visitor.companyId.toString() !== companyId) {
      throw new AppError('Access denied: Visitor belongs to different company', 403);
    }
  }

  /**
   * Upload entry photo for visitor
   */
  async uploadEntryPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      if (!req.file) {
        throw new AppError('Entry photo is required', 400);
      }

      const photoUrl = (req.file as any).location;

      const visitor = await this.visitorService.findById(id);
      if (!visitor || visitor.companyId.toString() !== companyId) {
        throw new AppError('Visitor not found', 404);
      }

      // Update visitor with entry photo
      const updatedVisitor = await this.visitorService.update(id, {
        $push: {
          entries: {
            entryDateTime: new Date(),
            entryPhoto: photoUrl,
            entryBy: userId,
            deviceId: req.headers['user-agent'] || 'unknown',
            ipAddress: req.ip
          }
        },
        currentStatus: 'checked_in'
      }, userId);

      logger.info('Entry photo uploaded', { visitorId: id, photoUrl, userId });

      this.sendSuccess(res, { photoUrl, visitor: updatedVisitor }, 'Entry photo uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload exit photo for visitor
   */
  async uploadExitPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      if (!req.file) {
        throw new AppError('Exit photo is required', 400);
      }

      const photoUrl = (req.file as any).location;

      const visitor = await this.visitorService.findById(id);
      if (!visitor || visitor.companyId.toString() !== companyId) {
        throw new AppError('Visitor not found', 404);
      }

      // Update visitor with exit photo
      const updatedVisitor = await this.visitorService.update(id, {
        $push: {
          exits: {
            exitDateTime: new Date(),
            exitPhoto: photoUrl,
            exitBy: userId,
            deviceId: req.headers['user-agent'] || 'unknown',
            ipAddress: req.ip
          }
        },
        currentStatus: 'checked_out'
      }, userId);

      logger.info('Exit photo uploaded', { visitorId: id, photoUrl, userId });

      this.sendSuccess(res, { photoUrl, visitor: updatedVisitor }, 'Exit photo uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned URL for file upload
   */
  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName, contentType, fileType } = req.body;
      const { companyId } = this.getUserInfo(req);

      if (!fileName || !contentType) {
        throw new AppError('fileName and contentType are required', 400);
      }

      const folder = `visitors/${companyId}/${fileType || 'general'}`;

      const { uploadUrl, key, expiresAt } = await S3Service.getPresignedUploadUrl(
        fileName,
        contentType,
        folder,
        { expiresIn: 3600 } // 1 hour
      );

      logger.info('Generated upload URL for visitor file', {
        fileName,
        contentType,
        folder,
        key,
        expiresAt: expiresAt.toISOString()
      });

      this.sendSuccess(res, { 
        uploadUrl, 
        key, 
        expiresAt: expiresAt.toISOString(),
        expiresIn: 3600
      }, 'Upload URL generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned URL for file download
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { companyId } = this.getUserInfo(req);

      // Verify the file belongs to the company
      if (!key.includes(companyId)) {
        throw new AppError('Access denied', 403);
      }

      const { downloadUrl, expiresAt } = await S3Service.getPresignedDownloadUrl(key, 3600); // 1 hour

      logger.info('Generated download URL for visitor file', { 
        key, 
        companyId,
        expiresAt: expiresAt.toISOString()
      });

      this.sendSuccess(res, { 
        downloadUrl, 
        expiresAt: expiresAt.toISOString(),
        expiresIn: 3600
      }, 'Download URL generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
