import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ScrapService } from '../services/ScrapService';
import { IScrap } from '../types/models';
import { AppError } from '../utils/errors';

export class ScrapController extends BaseController<IScrap> {
  private scrapService: ScrapService;

  constructor() {
    const scrapService = new ScrapService();
    super(scrapService, 'Scrap');
    this.scrapService = scrapService;
  }

  /**
   * Move inventory item to scrap
   */
  async moveToScrap(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryItemId } = req.params;
      const scrapData = req.body;
      const userId = req.user?._id;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!userId) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!inventoryItemId) {
        this.sendError(res, new Error('Inventory item ID is required'), 'Inventory item ID is required', 400);
        return;
      }

      const scrap = await this.scrapService.moveToScrap(
        inventoryItemId,
        scrapData,
        userId.toString(),
        companyId.toString()
      );

      this.sendSuccess(res, scrap, 'Inventory moved to scrap successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to move inventory to scrap');
    }
  }

  /**
   * Get scrap items by company
   */
  async getScrapByCompany(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // Parse query parameters
      const filters: any = {};
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.scrapReason) {
        filters.scrapReason = req.query.scrapReason;
      }
      if (req.query.inventoryItemId) {
        filters.inventoryItemId = req.query.inventoryItemId;
      }
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }
      if (req.query.disposed !== undefined) {
        filters.disposed = req.query.disposed === 'true';
      }

      const pagination: any = {};
      if (req.query.page) {
        pagination.page = parseInt(req.query.page as string, 10);
      }
      if (req.query.limit) {
        pagination.limit = parseInt(req.query.limit as string, 10);
      }
      if (req.query.sortBy) {
        pagination.sortBy = req.query.sortBy;
      }
      if (req.query.sortOrder) {
        pagination.sortOrder = req.query.sortOrder;
      }

      const result = await this.scrapService.getScrapByCompany(
        companyId.toString(),
        filters,
        pagination
      );

      this.sendSuccess(res, result, 'Scrap items retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get scrap items');
    }
  }

  /**
   * Get scrap by ID
   */
  async getScrapById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const scrap = await this.scrapService.findById(id);

      if (!scrap) {
        this.sendError(res, new Error('Scrap not found'), 'Scrap not found', 404);
        return;
      }

      // Verify company ownership
      if (scrap.companyId.toString() !== companyId.toString()) {
        this.sendError(res, new Error('Unauthorized'), 'Scrap does not belong to this company', 403);
        return;
      }

      this.sendSuccess(res, scrap, 'Scrap retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get scrap');
    }
  }

  /**
   * Get scrap summary/statistics
   */
  async getScrapSummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const summary = await this.scrapService.getScrapSummary(
        companyId.toString(),
        dateFrom,
        dateTo
      );

      this.sendSuccess(res, summary, 'Scrap summary retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get scrap summary');
    }
  }

  /**
   * Mark scrap as disposed
   */
  async markAsDisposed(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const disposalData = req.body;
      const userId = req.user?._id;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!userId) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!disposalData.disposalMethod) {
        this.sendError(
          res,
          new Error('Disposal method is required'),
          'Disposal method is required',
          400
        );
        return;
      }

      const scrap = await this.scrapService.markAsDisposed(
        id,
        disposalData,
        userId.toString(),
        companyId.toString()
      );

      this.sendSuccess(res, scrap, 'Scrap marked as disposed successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to mark scrap as disposed');
    }
  }

  /**
   * Get scrap items by inventory item
   */
  async getScrapByInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { inventoryItemId } = req.params;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const result = await this.scrapService.getScrapByCompany(companyId.toString(), {
        inventoryItemId
      });

      this.sendSuccess(res, result.scraps, 'Scrap items retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get scrap items for inventory item');
    }
  }

  /**
   * Update scrap record
   */
  async updateScrap(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?._id;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!userId) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // Don't allow updating quantity or inventory item after creation
      delete updateData.quantity;
      delete updateData.inventoryItemId;
      delete updateData.stockImpact;

      updateData.lastModifiedBy = userId;

      const scrap = await this.scrapService.update(id, updateData, userId.toString());

      if (!scrap) {
        this.sendError(res, new Error('Scrap not found'), 'Scrap not found', 404);
        return;
      }

      // Verify company ownership
      if (scrap.companyId.toString() !== companyId.toString()) {
        this.sendError(res, new Error('Unauthorized'), 'Scrap does not belong to this company', 403);
        return;
      }

      this.sendSuccess(res, scrap, 'Scrap updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update scrap');
    }
  }

  /**
   * Delete scrap record (soft delete)
   */
  async deleteScrap(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.company?._id || req.user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const scrap = await this.scrapService.findById(id);

      if (!scrap) {
        this.sendError(res, new Error('Scrap not found'), 'Scrap not found', 404);
        return;
      }

      // Verify company ownership
      if (scrap.companyId.toString() !== companyId.toString()) {
        this.sendError(res, new Error('Unauthorized'), 'Scrap does not belong to this company', 403);
        return;
      }

      // Cancel scrap - restore inventory stock
      if (scrap.status === 'active' && !scrap.disposal?.disposed) {
        // Restore inventory stock
        const InventoryItem = (await import('../models/InventoryItem')).default;
        const inventoryItem = await InventoryItem.findById(scrap.inventoryItemId);

        if (inventoryItem) {
          inventoryItem.stock!.currentStock = (inventoryItem.stock?.currentStock || 0) + scrap.quantity;
          inventoryItem.stock!.availableStock =
            (inventoryItem.stock?.currentStock || 0) - (inventoryItem.stock?.reservedStock || 0);
          inventoryItem.stock!.totalValue =
            inventoryItem.stock!.currentStock * (inventoryItem.stock?.averageCost || 0);
          inventoryItem.tracking!.lastStockUpdate = new Date();
          inventoryItem.tracking!.totalOutward = Math.max(
            0,
            (inventoryItem.tracking?.totalOutward || 0) - scrap.quantity
          );
          await inventoryItem.save();
        }
      }

      // Mark as cancelled
      scrap.status = 'cancelled';
      await scrap.save();

      this.sendSuccess(res, scrap, 'Scrap cancelled successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to cancel scrap');
    }
  }
}














