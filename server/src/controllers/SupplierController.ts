import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SupplierService } from '../services/SupplierService';

export class SupplierController extends BaseController<any> {
  private supplierService: SupplierService;

  constructor() {
    const supplierService = new SupplierService();
    super(supplierService, 'Supplier');
    this.supplierService = supplierService;
  }

  /**
   * Create a new supplier
   */
  async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const supplierData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const supplier = await this.supplierService.createSupplier({
        ...supplierData,
        companyId
      }, createdBy);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      this.sendError(res, error, 'Operation failed');
    }
  }

  /**
   * Get supplier by code
   */
  async getSupplierByCode(req: Request, res: Response): Promise<void> {
    try {
      const { supplierCode } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const supplier = await this.supplierService.getSupplierByCode(supplierCode);

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
        return;
      }

      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get supplier');
    }
  }

  /**
   * Get suppliers by company
   */
  async getSuppliersByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, search, category, status } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (search) {
        options.search = search;
      }

      if (category) {
        options.category = category;
      }

      if (status) {
        options.status = status;
      }

      const result = await this.supplierService.getSuppliersByCompany(companyId.toString(), options);

      this.sendSuccess(res, result, 'Suppliers retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get suppliers');
    }
  }

  /**
   * Get suppliers by category
   */
  async getSuppliersByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const suppliers = await this.supplierService.findMany({
        companyId,
        'relationship.supplierCategory': category
      });

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Search suppliers
   */
  async searchSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const suppliers = await this.supplierService.searchSuppliers(q as string, companyId.toString());

      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const supplier = await this.supplierService.update(id, updateData, updatedBy);

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update supplier rating
   */
  async updateSupplierRating(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const ratedBy = (req.user?.userId || req.user?._id)?.toString();

      const supplier = await this.supplierService.updateSupplierRating(id, rating, ratedBy);

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Supplier rating updated successfully',
        data: supplier
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const stats = await this.supplierService.getSupplierStats(companyId.toString());

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const supplier = await this.supplierService.update(id, { 
        isActive: false,
        deletedAt: new Date()
      }, deletedBy);

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const supplier = await this.supplierService.findById(id);

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
        return;
      }

      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get supplier orders
   */
  async getSupplierOrders(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // For now, return empty array since we don't have orders implemented yet
      // TODO: Implement actual order fetching logic
      const orders = [];

      res.json({
        success: true,
        data: orders,
        message: 'Supplier orders retrieved successfully'
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get supplier orders');
    }
  }

}
