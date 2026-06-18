import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { CompanyService } from '@/services/CompanyService';
import { ICompany } from '@/types/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class CompanyController extends BaseController<ICompany> {
  private companyService: CompanyService;

  constructor() {
    const companyService = new CompanyService();
    super(companyService, 'Company');
    this.companyService = companyService;
  }

  /**
   * Create a new company (SuperAdmin only)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);

      const user = (req as any).user;

      // Check if user is SuperAdmin
      if (!user.isSuperAdmin) {
        res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
        return;
      }

      const { userId } = this.getUserInfo(req);
      const companyData = req.body;

      logger.info('Creating company', { companyData, userId });

      const company = await this.companyService.createCompany(companyData, userId);

      this.sendSuccess(res, company, 'Company created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company by code
   */
  async getByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      logger.info('Getting company by code', { code });

      const company = await this.companyService.findByCode(code);
      
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      this.sendSuccess(res, company, 'Company retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active companies
   */
  async getActiveCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      logger.info('Getting active companies', { page, limit });

      const result = await this.companyService.getActiveCompanies(page, limit);
      
      this.sendPaginatedResponse(res, result, 'Active companies retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update company settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const settings = req.body;

      logger.info('Updating company settings', { id, settings, userId });

      const company = await this.companyService.updateSettings(id, settings, userId);
      
      this.sendSuccess(res, company, 'Company settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add branch to company
   */
  async addBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const branchData = req.body;

      logger.info('Adding branch to company', { id, branchData, userId });

      const company = await this.companyService.addBranch(id, branchData, userId);
      
      this.sendSuccess(res, company, 'Branch added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info('Getting company statistics', { id });

      const stats = await this.companyService.getCompanyStats(id);
      
      this.sendSuccess(res, stats, 'Company statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search companies
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      logger.info('Searching companies', { searchTerm, page, limit });

      const result = await this.companyService.searchCompanies(searchTerm as string, page, limit);
      
      this.sendPaginatedResponse(res, result, 'Company search results retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate company
   */
  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);

      logger.info('Deactivating company', { id, userId });

      const success = await this.companyService.deactivateCompany(id, userId);
      
      if (!success) {
        throw new AppError('Company not found', 404);
      }

      this.sendSuccess(res, null, 'Company deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate company
   */
  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);

      logger.info('Reactivating company', { id, userId });

      const success = await this.companyService.reactivateCompany(id, userId);
      
      if (!success) {
        throw new AppError('Company not found', 404);
      }

      this.sendSuccess(res, null, 'Company reactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get companies with advanced filtering
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort || { companyName: 1 };
      const populate = req.query.populate as string[];
      
      // Build filter from query parameters
      const filter = this.buildCompanyFilter(req.query);

      logger.info('Getting companies with filter', { page, limit, filter });

      const result = await this.companyService.paginate(filter, page, limit, sort, populate);
      
      this.sendPaginatedResponse(res, result, 'Companies retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build company-specific filter from query parameters
   */
  private buildCompanyFilter(query: any): any {
    const filter = this.buildFilterFromQuery(query);

    // Company-specific filters
    if (query.companyType) {
      filter.companyType = query.companyType;
    }

    if (query.industry) {
      filter.industry = new RegExp(query.industry, 'i');
    }

    if (query.country) {
      filter['address.country'] = query.country;
    }

    if (query.state) {
      filter['address.state'] = new RegExp(query.state, 'i');
    }

    if (query.city) {
      filter['address.city'] = new RegExp(query.city, 'i');
    }

    if (query.establishedFrom || query.establishedTo) {
      filter.establishedYear = {};
      if (query.establishedFrom) {
        filter.establishedYear.$gte = parseInt(query.establishedFrom);
      }
      if (query.establishedTo) {
        filter.establishedYear.$lte = parseInt(query.establishedTo);
      }
    }

    if (query.employeeCountMin || query.employeeCountMax) {
      filter.employeeCount = {};
      if (query.employeeCountMin) {
        filter.employeeCount.$gte = parseInt(query.employeeCountMin);
      }
      if (query.employeeCountMax) {
        filter.employeeCount.$lte = parseInt(query.employeeCountMax);
      }
    }

    return filter;
  }

  /**
   * Get company dashboard data
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info('Getting company dashboard data', { id });

      // Get company details and statistics
      const [company, stats] = await Promise.all([
        this.companyService.findById(id),
        this.companyService.getCompanyStats(id)
      ]);

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      const dashboardData = {
        company,
        statistics: stats,
        lastUpdated: new Date().toISOString()
      };

      this.sendSuccess(res, dashboardData, 'Company dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get companies for invoice selection (minimal data)
   */
  async getCompaniesForInvoiceSelection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Getting companies for invoice selection');

      const companies = await this.companyService.findMany(
        { isActive: true },
        {
          sort: { companyName: 1 }
        }
      );

      this.sendSuccess(res, companies, 'Companies for invoice selection retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company details for invoice auto-fill
   */
  async getCompanyInvoiceDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      logger.info('Getting company invoice details', { id });

      const company = await this.companyService.findById(id);

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // Filter only active bank accounts
      const companyData = company.toObject();
      companyData.bankAccounts = companyData.bankAccounts?.filter((account: any) => account.isActive) || [];

      this.sendSuccess(res, companyData, 'Company invoice details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate company access for operations
   */
  protected validateCompanyAccess(req: Request, documentCompanyId: string): void {
    const user = (req as any).user;

    // Super admin can access all companies
    if (user?.isSuperAdmin) {
      return;
    }

    // For company operations, users can only access their own company data
    const userCompanyAccess = user?.companyAccess?.find((access: any) => 
      access.companyId.toString() === documentCompanyId && access.isActive
    );

    if (!userCompanyAccess) {
      throw new AppError('Access denied: Insufficient company permissions', 403);
    }
  }
}
