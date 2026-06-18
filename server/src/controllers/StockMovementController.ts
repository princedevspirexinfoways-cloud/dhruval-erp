import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { StockMovementService } from '../services/StockMovementService';
import { IStockMovement } from '../types/models';

export class StockMovementController extends BaseController<IStockMovement> {
  private stockMovementService: StockMovementService;

  constructor() {
    const stockMovementService = new StockMovementService();
    super(stockMovementService, 'StockMovement');
    this.stockMovementService = stockMovementService;
  }

  /**
   * Create a new stock movement
   */
  async createStockMovement(req: Request, res: Response): Promise<void> {
    try {
      const movementData = req.body;
      const createdBy = req.user?._id; // Use _id instead of id
      
      if (!createdBy) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }
      
      // Auto-detect company ID and unit from warehouse or item
      let companyId = movementData.companyId || req.company?._id || req.user?.primaryCompanyId;
      let unit = movementData.unit;
      
      // If companyId is already provided in the request, use it
      if (movementData.companyId) {
        companyId = movementData.companyId;
        console.log('StockMovementController: Using companyId from request:', companyId);
      } else {
        // If user doesn't have company ID (super admin), extract from warehouse or item
        if (!companyId) {
          if (movementData.warehouseId) {
            // Get company ID from warehouse
            const Warehouse = require('@/models/Warehouse').default;
            const warehouse = await Warehouse.findById(movementData.warehouseId).select('companyId');
            if (warehouse?.companyId) {
              companyId = warehouse.companyId.toString();
              console.log('StockMovementController: Company ID extracted from warehouse:', companyId);
            }
          }
          
          if (!companyId && movementData.itemId) {
            // Get company ID from item
            const InventoryItem = require('@/models/InventoryItem').default;
            const item = await InventoryItem.findById(movementData.itemId).select('companyId');
            if (item?.companyId) {
              companyId = item.companyId.toString();
              console.log('StockMovementController: Company ID extracted from item:', companyId);
            }
          }
        }
      }
      
      if (!companyId) {
        this.sendError(res, new Error('Company ID could not be determined from warehouse, item, or user profile'), 'Company ID is required', 400);
        return;
      }

      // Auto-extract unit from item if not provided
      if (!unit && movementData.itemId) {
        const InventoryItem = require('@/models/InventoryItem').default;
        const item = await InventoryItem.findById(movementData.itemId).select('stock.unit');
        if (item?.stock?.unit) {
          unit = item.stock.unit;
          console.log('StockMovementController: Unit extracted from item:', unit);
        }
      }
      
      if (!unit) {
        this.sendError(res, new Error('Unit could not be determined from item'), 'Unit is required', 400);
        return;
      }

      // Convert string locations to proper object structure if needed
      let fromLocation = movementData.fromLocation;
      let toLocation = movementData.toLocation;
      
      // Helper function to find warehouse by name
      const findWarehouseByName = async (warehouseName: string, companyId: string) => {
        try {
          const Warehouse = require('../models/Warehouse').default;
          const warehouse = await Warehouse.findOne({ 
            warehouseName: warehouseName, 
            companyId: companyId,
            isActive: true 
          });
          return warehouse;
        } catch (error) {
          console.log('Error finding warehouse:', error);
          return null;
        }
      };
      
      // If locations are strings, convert them to proper objects with warehouse IDs
      if (typeof fromLocation === 'string') {
        const isExternal = ['Supplier', 'Production', 'Customer', 'Scrap/Disposal'].includes(fromLocation);
        if (!isExternal) {
          // Try to find the warehouse ID for internal warehouses
          const warehouse = await findWarehouseByName(fromLocation, companyId.toString());
          fromLocation = {
            warehouseId: warehouse?._id,
            warehouseName: fromLocation,
            isExternal: false
          };
        } else {
          fromLocation = {
            warehouseName: fromLocation,
            isExternal: true
          };
        }
      }
      
      if (typeof toLocation === 'string') {
        const isExternal = ['Supplier', 'Production', 'Customer', 'Scrap/Disposal'].includes(toLocation);
        if (!isExternal) {
          // Try to find the warehouse ID for internal warehouses
          const warehouse = await findWarehouseByName(toLocation, companyId.toString());
          toLocation = {
            warehouseId: warehouse?._id,
            warehouseName: toLocation,
            isExternal: false
          };
        } else {
          toLocation = {
            warehouseName: toLocation,
            isExternal: true
          };
        }
      }

      // Fix reference document structure if needed
      let referenceDocument = movementData.referenceDocument;
      if (referenceDocument && referenceDocument.type && !referenceDocument.documentType) {
        // Map old 'adjustment' value to 'adjustment_note' for backward compatibility
        let documentType = referenceDocument.type;
        if (documentType === 'adjustment') {
          documentType = 'adjustment_note';
        }
        
        referenceDocument = {
          ...referenceDocument,
          documentType: documentType,
          documentNumber: referenceDocument.number
        };
      }

      // Ensure company ID and unit are set in the movement data
      const enrichedMovementData = {
        ...movementData,
        companyId: companyId.toString(),
        unit: unit,
        fromLocation: fromLocation,
        toLocation: toLocation,
        referenceDocument: referenceDocument,
        // Ensure quantity is a number
        quantity: Number(movementData.quantity) || 0,
        // Ensure movementDate is a valid date
        movementDate: movementData.movementDate ? new Date(movementData.movementDate) : new Date()
      };

      console.log('StockMovementController: Creating movement with company ID:', companyId);
      console.log('StockMovementController: Original movement data:', movementData);
      console.log('StockMovementController: Enriched movement data:', enrichedMovementData);
      console.log('StockMovementController: CreatedBy:', createdBy);
      console.log('StockMovementController: Unit:', unit);
      console.log('StockMovementController: Quantity type:', typeof enrichedMovementData.quantity);
      console.log('StockMovementController: MovementDate type:', typeof enrichedMovementData.movementDate);

      const movement = await this.stockMovementService.createStockMovement(enrichedMovementData, createdBy.toString());

      this.sendSuccess(res, movement, 'Stock movement created successfully', 201);
    } catch (error) {
      console.error('StockMovementController: Error creating stock movement:', error);
      console.error('StockMovementController: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      this.sendError(res, error, 'Failed to create stock movement');
    }
  }

  /**
   * Get stock movements by item
   */
  async getMovementsByItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const { page = 1, limit = 10, movementType, startDate, endDate } = req.query;

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (movementType) {
        options.movementType = movementType;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const movements = await this.stockMovementService.getMovementsByItem(itemId, options);

      this.sendSuccess(res, movements, 'Stock movements retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movements');
    }
  }

  /**
   * Get stock movements by warehouse
   */
  async getMovementsByWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const { page = 1, limit = 10, movementType, startDate, endDate } = req.query;

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (movementType) {
        options.movementType = movementType;
      }

      if (startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const movements = await this.stockMovementService.getMovementsByWarehouse(warehouseId, options);

      this.sendSuccess(res, movements, 'Stock movements retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movements');
    }
  }

  /**
   * Get stock movements by company
   */
  async getMovementsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;
      const user = (req as any).user;
      const isSuperAdmin = user?.isSuperAdmin;
      const { page = 1, limit = 10, movementType, type, startDate, endDate, search, status } = req.query;

      // For regular users, companyId is required. Super admins can see all companies.
      if (!companyId && !isSuperAdmin) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // Base query
      const query: any = {};

      // Apply company filter only for non-super-admins, or when an explicit company is requested
      const explicitCompanyId = (req.query as any).companyId;
      if (!isSuperAdmin) {
        query.companyId = companyId.toString();
      } else if (explicitCompanyId) {
        // Super admin can optionally filter by a specific company via query param
        query.companyId = explicitCompanyId;
      }

      // Handle both 'movementType' and 'type' query parameters
      const movementTypeFilter = movementType || type;
      if (movementTypeFilter) {
        query.movementType = movementTypeFilter;
      }

      // Handle status filter
      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.movementDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      if (search) {
        query.$or = [
          { movementNumber: { $regex: search, $options: 'i' } },
          { 'referenceDocument.documentNumber': { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page as string) || 1,
        limit: Math.min(parseInt(limit as string) || 20, 100), // Max 100 per page
        sort: { movementDate: -1, createdAt: -1 },
        populate: [
          {
            path: 'itemId',
            select: 'itemName itemCode description category stock.unit pricing.costPrice pricing.sellingPrice'
          },
          {
            path: 'createdBy',
            select: 'personalInfo.firstName personalInfo.lastName username'
          },
          {
            path: 'toLocation.warehouseId',
            select: 'warehouseName'
          },
          {
            path: 'fromLocation.warehouseId',
            select: 'warehouseName'
          }
        ]
      };

      const result = await this.stockMovementService.findManyWithPagination(query, options);

      // Return data in the expected format for the frontend
      res.status(200).json({
        success: true,
        message: 'Stock movements retrieved successfully',
        data: {
          data: result.documents,  // Main data array
          spares: result.documents,  // Keep for backward compatibility
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNext: result.pagination.page < result.pagination.totalPages,
            hasPrev: result.pagination.page > 1
          },
          // Also include flat structure for compatibility
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movements');
    }
  }

  /**
   * Get stock movement statistics
   */
  async getMovementStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const stats = await this.stockMovementService.getMovementStats(companyId.toString(), dateRange);

      this.sendSuccess(res, stats, 'Stock movement statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movement statistics');
    }
  }

  /**
   * Get stock movement by ID
   */
  async getStockMovementById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const movement = await this.stockMovementService.findById(id);

      if (!movement) {
        this.sendError(res, new Error('Stock movement not found'), 'Stock movement not found', 404);
        return;
      }

      this.sendSuccess(res, movement, 'Stock movement retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movement');
    }
  }

  /**
   * Update stock movement
   */
  async updateStockMovement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const movement = await this.stockMovementService.update(id, updateData, updatedBy);

      if (!movement) {
        this.sendError(res, new Error('Stock movement not found'), 'Stock movement not found', 404);
        return;
      }

      this.sendSuccess(res, movement, 'Stock movement updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update stock movement');
    }
  }

  /**
   * Get movements by reference
   */
  async getMovementsByReference(req: Request, res: Response): Promise<void> {
    try {
      const { referenceNumber } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const movements = await this.stockMovementService.findMany({
        companyId,
        referenceNumber
      }, { sort: { movementDate: -1 } });

      this.sendSuccess(res, movements, 'Stock movements retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get stock movements');
    }
  }

  /**
   * Get recent movements
   */
  async getRecentMovements(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { limit = 20 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const movements = await this.stockMovementService.findMany({
        companyId
      }, { 
        limit: parseInt(limit as string),
        sort: { movementDate: -1 }
      });

      this.sendSuccess(res, movements, 'Recent stock movements retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get recent stock movements');
    }
  }

  /**
   * Search stock movements
   */
  async searchMovements(req: Request, res: Response): Promise<void> {
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

      const movements = await this.stockMovementService.findMany({
        companyId,
        $or: [
          { referenceNumber: { $regex: searchTerm, $options: 'i' } },
          { 'item.itemName': { $regex: searchTerm, $options: 'i' } },
          { 'item.itemCode': { $regex: searchTerm, $options: 'i' } },
          { notes: { $regex: searchTerm, $options: 'i' } }
        ]
      }, {
        limit: parseInt(limit as string),
        sort: { movementDate: -1 }
      });

      this.sendSuccess(res, movements, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search stock movements');
    }
  }

  /**
   * Get current inventory levels
   */
  async getInventoryLevels(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { warehouseId, category, status, page = 1, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      // This would typically be handled by InventoryService
      // For now, we'll return a placeholder response
      const inventoryLevels = await this.stockMovementService.findMany({
        companyId
      }, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { updatedAt: -1 }
      });

      this.sendSuccess(res, inventoryLevels, 'Inventory levels retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get inventory levels');
    }
  }

  /**
   * Generate movement number
   */
  async generateMovementNumber(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, movementType } = req.body;

      if (!companyId || !movementType) {
        this.sendError(res, new Error('Company ID and movement type are required'), 'Missing required fields', 400);
        return;
      }

      // Generate movement number based on type and company
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');

      const count = await this.stockMovementService.count({
        companyId,
        createdAt: {
          $gte: new Date(year, today.getMonth(), 1),
          $lt: new Date(year, today.getMonth() + 1, 1)
        }
      });

      const movementNumber = `${movementType.toUpperCase()}${year}${month}${(count + 1).toString().padStart(4, '0')}`;

      this.sendSuccess(res, { movementNumber }, 'Movement number generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate movement number');
    }
  }
}
