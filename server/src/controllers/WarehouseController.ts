import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { WarehouseService } from '../services/WarehouseService';
import { IWarehouse } from '../types/models';

export class WarehouseController extends BaseController<IWarehouse> {
  private warehouseService: WarehouseService;

  constructor() {
    const warehouseService = new WarehouseService();
    super(warehouseService, 'Warehouse');
    this.warehouseService = warehouseService;
  }

  /**
   * Create a new warehouse
   */
  async createWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const warehouseData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const warehouse = await this.warehouseService.createWarehouse(warehouseData, createdBy);

      this.sendSuccess(res, warehouse, 'Warehouse created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create warehouse');
    }
  }

  /**
   * Get warehouse by code
   */
  async getWarehouseByCode(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseCode } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const warehouse = await this.warehouseService.getWarehouseByCode(warehouseCode, companyId.toString());

      if (!warehouse) {
        this.sendError(res, new Error('Warehouse not found'), 'Warehouse not found', 404);
        return;
      }

      this.sendSuccess(res, warehouse, 'Warehouse retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouse');
    }
  }

  /**
   * Get warehouses by company
   */
  async getWarehousesByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, search, warehouseType } = req.query;

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

      if (warehouseType) {
        options.warehouseType = warehouseType;
      }

      const warehouses = await this.warehouseService.getWarehousesByCompany(companyId.toString(), options);

      this.sendSuccess(res, warehouses, 'Warehouses retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouses');
    }
  }

  /**
   * Get warehouses by type
   */
  async getWarehousesByType(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseType } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const warehouses = await this.warehouseService.getWarehousesByType(companyId.toString(), warehouseType);

      this.sendSuccess(res, warehouses, 'Warehouses retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouses');
    }
  }

  /**
   * Update warehouse capacity
   */
  async updateWarehouseCapacity(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const capacity = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const warehouse = await this.warehouseService.updateWarehouseCapacity(warehouseId, capacity, updatedBy);

      this.sendSuccess(res, warehouse, 'Warehouse capacity updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update warehouse capacity');
    }
  }

  /**
   * Add storage zone
   */
  async addStorageZone(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const zoneData = req.body;
      const addedBy = (req.user?.userId || req.user?._id)?.toString();

      const warehouse = await this.warehouseService.addStorageZone(warehouseId, zoneData, addedBy);

      this.sendSuccess(res, warehouse, 'Storage zone added successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to add storage zone');
    }
  }

  /**
   * Get warehouse utilization
   */
  async getWarehouseUtilization(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;

      const utilization = await this.warehouseService.getWarehouseUtilization(warehouseId);

      this.sendSuccess(res, utilization, 'Warehouse utilization retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouse utilization');
    }
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.warehouseService.getWarehouseStats(companyId.toString());

      this.sendSuccess(res, stats, 'Warehouse statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouse statistics');
    }
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const warehouse = await this.warehouseService.update(id, updateData, updatedBy);

      if (!warehouse) {
        this.sendError(res, new Error('Warehouse not found'), 'Warehouse not found', 404);
        return;
      }

      this.sendSuccess(res, warehouse, 'Warehouse updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update warehouse');
    }
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const warehouse = await this.warehouseService.findById(id);

      if (!warehouse) {
        this.sendError(res, new Error('Warehouse not found'), 'Warehouse not found', 404);
        return;
      }

      this.sendSuccess(res, warehouse, 'Warehouse retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get warehouse');
    }
  }

  /**
   * Delete warehouse (soft delete)
   */
  async deleteWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const warehouse = await this.warehouseService.update(id, {
        isActive: false,
        deletedAt: new Date()
      }, deletedBy);

      if (!warehouse) {
        this.sendError(res, new Error('Warehouse not found'), 'Warehouse not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Warehouse deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete warehouse');
    }
  }

  /**
   * Search warehouses
   */
  async searchWarehouses(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { q: searchTerm, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!searchTerm) {
        this.sendError(res, new Error('Search term is required'), 'Search term is required', 400);
        return;
      }

      const warehouses = await this.warehouseService.findMany({
        companyId,
        $or: [
          { warehouseName: { $regex: searchTerm, $options: 'i' } },
          { warehouseCode: { $regex: searchTerm, $options: 'i' } },
          { 'address.city': { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, warehouses, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search warehouses');
    }
  }
}
