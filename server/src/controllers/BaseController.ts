import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Document } from 'mongoose';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { BaseService } from '@/services/BaseService';
import QueryOptimizer, { OptimizedQueryOptions } from '../utils/query-optimizer';

export interface IBaseController {
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  getById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export abstract class BaseController<T extends Document> implements IBaseController {
  protected service: BaseService<T>;
  protected modelName: string;

  constructor(service: BaseService<T>, modelName: string) {
    this.service = service;
    this.modelName = modelName;
  }

  /**
   * Handle validation errors
   */
  protected handleValidationErrors(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
    }
  }

  /**
   * Get user info from request
   */
  protected getUserInfo(req: Request): { userId?: string; companyId?: string } {
    const user = (req as any).user;
    console.log('BaseController.getUserInfo - Request user object:', user);
    console.log('BaseController.getUserInfo - User keys:', user ? Object.keys(user) : 'No user object');
    
    const result = {
      userId: user?.userId?.toString() || user?._id?.toString(),
      companyId: user?.companyId?.toString()
    };
    
    console.log('BaseController.getUserInfo - Extracted info:', result);
    return result;
  }

  /**
   * Send success response
   */
  protected sendSuccess(
    res: Response, 
    data: any, 
    message: string = 'Operation successful', 
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send paginated response
   */
  protected sendPaginatedResponse(
    res: Response,
    result: { documents: any[]; pagination: any },
    message: string = 'Data retrieved successfully'
  ): void {
    res.status(200).json({
      success: true,
      message,
      data: result.documents,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response
   */
  protected sendError(
    res: Response, 
    error: any, 
    message: string = 'Operation failed', 
    statusCode: number = 500
  ): void {
    logger.error(`${this.modelName} controller error`, { error, message });
    
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Create new document
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId } = this.getUserInfo(req);
      const data = req.body;

      logger.info(`Creating ${this.modelName}`, { data, userId });

      const document = await this.service.create(data, userId);
      
      this.sendSuccess(res, document, `${this.modelName} created successfully`, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const populate = req.query.populate as string[];

      logger.info(`Getting ${this.modelName} by ID`, { id });

      const document = await this.service.findById(id, populate);
      
      if (!document) {
        throw new AppError(`${this.modelName} not found`, 404);
      }

      this.sendSuccess(res, document, `${this.modelName} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all documents with pagination
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort || { createdAt: -1 };
      const populate = req.query.populate as string[];
      
      // Build filter from query parameters
      const filter = this.buildFilterFromQuery(req.query);

      logger.info(`Getting ${this.modelName} list`, { page, limit, filter });

      const result = await this.service.paginate(filter, page, limit, sort, populate);
      
      this.sendPaginatedResponse(res, result, `${this.modelName} list retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document by ID
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const data = req.body;

      logger.info(`Updating ${this.modelName}`, { id, data, userId });

      const document = await this.service.update(id, data, userId);
      
      if (!document) {
        throw new AppError(`${this.modelName} not found`, 404);
      }

      this.sendSuccess(res, document, `${this.modelName} updated successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document by ID
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);

      logger.info(`Deleting ${this.modelName}`, { id, userId });

      const success = await this.service.delete(id, userId);
      
      if (!success) {
        throw new AppError(`${this.modelName} not found`, 404);
      }

      this.sendSuccess(res, null, `${this.modelName} deleted successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search documents
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      logger.info(`Searching ${this.modelName}`, { searchTerm, page, limit });

      // This should be implemented in child controllers with specific search logic
      throw new AppError('Search not implemented for this resource', 501);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document count
   */
  async count(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = this.buildFilterFromQuery(req.query);

      logger.info(`Counting ${this.modelName}`, { filter });

      const count = await this.service.count(filter);
      
      this.sendSuccess(res, { count }, `${this.modelName} count retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create documents
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId } = this.getUserInfo(req);
      const { documents } = req.body;

      if (!Array.isArray(documents) || documents.length === 0) {
        throw new AppError('Documents array is required and cannot be empty', 400);
      }

      logger.info(`Bulk creating ${this.modelName}`, { count: documents.length, userId });

      const result = await this.service.bulkCreate(documents, userId);
      
      this.sendSuccess(res, result, `${documents.length} ${this.modelName} documents created successfully`, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export documents
   */
  async export(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const format = req.query.format as string || 'json';
      const filter = this.buildFilterFromQuery(req.query);

      logger.info(`Exporting ${this.modelName}`, { format, filter });

      const documents = await this.service.findMany(filter);

      if (format === 'csv') {
        // Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.modelName.toLowerCase()}_export.csv`);
        // CSV conversion logic would go here
        res.send('CSV export not implemented');
      } else {
        // JSON export
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${this.modelName.toLowerCase()}_export.json`);
        res.json(documents);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = this.buildFilterFromQuery(req.query);

      logger.info(`Getting ${this.modelName} statistics`, { filter });

      const total = await this.service.count(filter);
      const active = await this.service.count({ ...filter, isActive: true });
      const inactive = await this.service.count({ ...filter, isActive: false });

      const stats = {
        total,
        active,
        inactive,
        activePercentage: total > 0 ? ((active / total) * 100).toFixed(2) : 0
      };

      this.sendSuccess(res, stats, `${this.modelName} statistics retrieved successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build filter object from query parameters
   * Override this method in child controllers for specific filtering logic
   */
  protected buildFilterFromQuery(query: any): any {
    const filter: any = {};

    // Common filters
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) {
        filter.createdAt.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo) {
        filter.createdAt.$lte = new Date(query.createdTo);
      }
    }

    if (query.updatedFrom || query.updatedTo) {
      filter.updatedAt = {};
      if (query.updatedFrom) {
        filter.updatedAt.$gte = new Date(query.updatedFrom);
      }
      if (query.updatedTo) {
        filter.updatedAt.$lte = new Date(query.updatedTo);
      }
    }

    return filter;
  }

  /**
   * Validate company access for multi-tenant operations
   */
  protected validateCompanyAccess(req: Request, documentCompanyId: string): void {
    const { companyId } = this.getUserInfo(req);
    const user = (req as any).user;

    // Super admin can access all companies
    if (user?.isSuperAdmin) {
      return;
    }

    // Check if user has access to the document's company
    if (!companyId || companyId !== documentCompanyId) {
      throw new AppError('Access denied: Insufficient company permissions', 403);
    }
  }

  /**
   * Parse and optimize query parameters
   */
  protected parseQueryOptions(req: Request): OptimizedQueryOptions {
    const { page = 1, limit = 10, sort, search, ...filters } = req.query;

    const paginationOptions = QueryOptimizer.createPaginationOptions(Number(page), Number(limit));
    const options = QueryOptimizer.optimizeFindOptions({
      skip: paginationOptions.skip,
      limit: paginationOptions.limit,
      lean: true,
      sort: sort ? this.parseSortParam(sort as string) : { createdAt: -1 }
    }) as OptimizedQueryOptions;

    // Add search filter if provided
    if (search && typeof search === 'string') {
      const searchFields = this.getSearchFields();
      const searchFilter = QueryOptimizer.createTextSearchFilter(search, searchFields);
      Object.assign(filters, searchFilter);
    }

    return { ...options, filters: QueryOptimizer.sanitizeFilter(filters) };
  }

  /**
   * Parse sort parameter
   */
  protected parseSortParam(sortParam: string): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};

    sortParam.split(',').forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });

    return sort;
  }

  /**
   * Get searchable fields for text search (override in child classes)
   */
  protected getSearchFields(): string[] {
    return ['name', 'description', 'code'];
  }

  /**
   * Send optimized paginated response
   */
  protected sendOptimizedPaginatedResponse<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully'
  ): void {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    this.sendSuccess(res, {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    }, message);
  }

  /**
   * Validate request with performance tracking
   */
  protected validateRequestWithTracking(req: Request): void {
    const startTime = Date.now();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg).join(', ');
      throw new AppError(`Validation failed: ${errorMessages}`, 400);
    }

    const duration = Date.now() - startTime;
    if (duration > 100) { // Log slow validations
      logger.warn('Slow validation detected', {
        duration: `${duration}ms`,
        path: req.path,
        method: req.method
      });
    }
  }

  /**
   * Cache response data
   */
  protected setCacheHeaders(res: Response, maxAge: number = 300): void {
    res.set({
      'Cache-Control': `public, max-age=${maxAge}`,
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });
  }

  /**
   * Log controller performance
   */
  protected logControllerPerformance(
    operation: string,
    startTime: number,
    req: Request,
    resultCount?: number
  ): void {
    const duration = Date.now() - startTime;

    if (duration > 2000) { // Log slow operations (> 2 seconds)
      logger.warn('Slow controller operation', {
        operation,
        duration: `${duration}ms`,
        path: req.path,
        method: req.method,
        resultCount,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Controller performance', {
        operation,
        duration: `${duration}ms`,
        resultCount
      });
    }
  }
}
