import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SpareService, SpareFilters } from '../services/SpareService';
import { ISpare } from '@/types/models';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export class SpareController extends BaseController<ISpare> {
  private spareService: SpareService;

  constructor() {
    const spareService = new SpareService();
    super(spareService, 'Spare');
    this.spareService = spareService;
  }

  /**
   * Create a new spare
   */
  async createSpare(req: Request, res: Response): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const { userId, companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const spareData = {
        ...req.body,
        companyId
      };

      // Check if spare code is unique
      const isUnique = await this.spareService.isSpareCodeUnique(
        companyId,
        spareData.spareCode
      );

      if (!isUnique) {
        throw new AppError('Spare code already exists in this company', 400);
      }

      const spare = await this.spareService.create(spareData, userId);

      logger.info(`Spare created successfully`, {
        spareId: spare._id,
        spareCode: spare.spareCode,
        userId,
        companyId
      });

      this.sendSuccess(res, spare, 'Spare created successfully', 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Get spares by company with filtering and pagination
   * Superadmin can access all spares, regular users only their company spares
   */
  async getSparesByCompany(req: Request, res: Response): Promise<void> {
    try {
      // Debug logging
      console.log('SpareController.getSparesByCompany called');
      console.log('Request user:', (req as any).user);
      console.log('Request headers:', req.headers);
      console.log('Request query:', req.query);
      
      const user = (req as any).user;
      const isSuperAdmin = user?.isSuperAdmin === true;
      console.log('Is superadmin:', isSuperAdmin);
      
      let filters: SpareFilters;
      
      if (isSuperAdmin) {
        // Superadmin can access all spares from all companies
        console.log('Superadmin access - getting all spares');
        filters = {
          // No companyId filter for superadmin
          category: req.query.category as string,
          manufacturer: req.query.manufacturer as string,
          isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
          isLowStock: req.query.isLowStock === 'true' ? true : req.query.isLowStock === 'false' ? false : undefined,
          isCritical: req.query.isCritical === 'true' ? true : req.query.isCritical === 'false' ? false : undefined,
          search: req.query.search as string,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
          sortBy: req.query.sortBy as string || 'createdAt',
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
        };
      } else {
        // Regular users can only access spares from their company
        const { companyId } = this.getUserInfo(req);
        console.log('Regular user - extracted companyId:', companyId);

        if (!companyId) {
          console.log('Company ID is missing for regular user');
          throw new AppError('Company ID is required for regular users', 400);
        }

        filters = {
          companyId,
          category: req.query.category as string,
          manufacturer: req.query.manufacturer as string,
          isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
          isLowStock: req.query.isLowStock === 'true' ? true : req.query.isLowStock === 'false' ? false : undefined,
          isCritical: req.query.isCritical === 'true' ? true : req.query.isCritical === 'false' ? false : undefined,
          search: req.query.search as string,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
          sortBy: req.query.sortBy as string || 'createdAt',
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
        };
      }

      console.log('Filters applied:', filters);

      const result = await this.spareService.getSparesByCompany(filters);
      console.log('Service result:', result);

      const accessType = isSuperAdmin ? 'all companies' : 'user company';
      logger.info(`Retrieved spares for ${accessType}`, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        isSuperAdmin,
        companyId: isSuperAdmin ? 'ALL' : filters.companyId
      });
      
      // Add response metadata to show access level
      const responseData = {
        ...result,
        accessInfo: {
          isSuperAdmin,
          accessType,
          companyId: isSuperAdmin ? 'ALL' : filters.companyId
        }
      };

      this.sendSuccess(res, responseData, 'Spares retrieved successfully');
    } catch (error) {
      console.log('Error in getSparesByCompany:', error);
      this.sendError(res, error);
    }
  }

  /**
   * Get spare statistics
   */
  async getSpareStats(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const stats = await this.spareService.getSpareStats(companyId);

      logger.info(`Retrieved spare stats for company ${companyId}`, stats);

      this.sendSuccess(res, stats, 'Spare statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Get low stock spares
   */
  async getLowStockSpares(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const spares = await this.spareService.getLowStockSpares(companyId);

      logger.info(`Retrieved ${spares.length} low stock spares for company ${companyId}`);

      this.sendSuccess(res, spares, 'Low stock spares retrieved successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Update spare stock
   */
  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const { userId } = this.getUserInfo(req);
      const { spareId } = req.params;
      const { quantity, type, reason, warehouseId } = req.body;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const stockUpdate = {
        quantity: parseFloat(quantity),
        type,
        reason,
        userId,
        warehouseId
      };

      const updatedSpare = await this.spareService.updateStock(spareId, stockUpdate);

      if (!updatedSpare) {
        throw new AppError('Spare not found', 404);
      }

      logger.info(`Stock updated for spare ${spareId}`, {
        type,
        quantity,
        newStock: updatedSpare.stock.currentStock,
        userId
      });

      this.sendSuccess(res, updatedSpare, 'Stock updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Get spare by ID
   */
  async getSpareById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = this.getUserInfo(req);

      const spare = await this.spareService.findById(id, [
        'suppliers.supplierId',
        'locations.warehouseId',
        'tracking.lastModifiedBy'
      ]);

      if (!spare) {
        throw new AppError('Spare not found', 404);
      }

      // Check if spare belongs to user's company
      if (companyId && spare.companyId.toString() !== companyId) {
        throw new AppError('Access denied', 403);
      }

      logger.info(`Retrieved spare ${id}`, { spareCode: spare.spareCode });

      this.sendSuccess(res, spare, 'Spare retrieved successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Update spare
   */
  async updateSpare(req: Request, res: Response): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const { userId, companyId } = this.getUserInfo(req);
      const { id } = req.params;

      // Check if spare code is unique (excluding current spare)
      if (req.body.spareCode && companyId) {
        const isUnique = await this.spareService.isSpareCodeUnique(
          companyId,
          req.body.spareCode,
          id
        );

        if (!isUnique) {
          throw new AppError('Spare code already exists in this company', 400);
        }
      }

      const updatedSpare = await this.spareService.update(id, req.body, userId);

      if (!updatedSpare) {
        throw new AppError('Spare not found', 404);
      }

      logger.info(`Spare updated successfully`, {
        spareId: id,
        spareCode: updatedSpare.spareCode,
        userId
      });

      this.sendSuccess(res, updatedSpare, 'Spare updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Delete spare
   */
  async deleteSpare(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = this.getUserInfo(req);
      const { id } = req.params;

      const deleted = await this.spareService.delete(id, userId);

      if (!deleted) {
        throw new AppError('Spare not found', 404);
      }

      logger.info(`Spare deleted successfully`, { spareId: id, userId });

      this.sendSuccess(res, null, 'Spare deleted successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Get spares by category
   */
  async getSparesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { category } = req.params;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const spares = await this.spareService.getSparesByCategory(companyId, category);

      logger.info(`Retrieved ${spares.length} spares for category ${category} in company ${companyId}`);

      this.sendSuccess(res, spares, 'Spares retrieved successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /**
   * Check spare code uniqueness
   */
  async checkSpareCodeUnique(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { spareCode } = req.params;
      const { excludeId } = req.query;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const isUnique = await this.spareService.isSpareCodeUnique(
        companyId,
        spareCode,
        excludeId as string
      );

      this.sendSuccess(res, { isUnique }, 'Spare code uniqueness checked');
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
