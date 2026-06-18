import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import Warehouse from '../models/Warehouse';
import { IWarehouse } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class WarehouseService extends BaseService<IWarehouse> {
  constructor() {
    super(Warehouse);
  }

  /**
   * Create a new warehouse
   */
  async createWarehouse(warehouseData: Partial<IWarehouse>, createdBy?: string): Promise<IWarehouse> {
    try {
      // Validate warehouse data
      this.validateWarehouseData(warehouseData);

      // Check if warehouse code already exists
      if (warehouseData.warehouseCode) {
        const existingWarehouse = await this.findOne({ 
          warehouseCode: warehouseData.warehouseCode.toUpperCase(),
          companyId: warehouseData.companyId 
        });

        if (existingWarehouse) {
          throw new AppError('Warehouse code already exists', 400);
        }
      }

      // Generate warehouse code if not provided
      if (!warehouseData.warehouseCode) {
        warehouseData.warehouseCode = await this.generateWarehouseCode(warehouseData.companyId!.toString());
      }

      const warehouse = await this.create({
        ...warehouseData,
        warehouseCode: warehouseData.warehouseCode.toUpperCase(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Warehouse created successfully', { 
        warehouseId: warehouse._id, 
        warehouseCode: warehouse.warehouseCode,
        warehouseName: warehouse.warehouseName,
        companyId: warehouseData.companyId,
        createdBy 
      });

      return warehouse;
    } catch (error) {
      logger.error('Error creating warehouse', { error, warehouseData, createdBy });
      throw error;
    }
  }

  /**
   * Get warehouse by code
   */
  async getWarehouseByCode(warehouseCode: string, companyId: string): Promise<IWarehouse | null> {
    try {
      return await this.findOne({ 
        warehouseCode: warehouseCode.toUpperCase(),
        companyId: new Types.ObjectId(companyId)
      });
    } catch (error) {
      logger.error('Error getting warehouse by code', { error, warehouseCode, companyId });
      throw error;
    }
  }

  /**
   * Get warehouses by company
   */
  async getWarehousesByCompany(companyId: string, options: any = {}): Promise<IWarehouse[]> {
    try {
      const query = { 
        companyId: new Types.ObjectId(companyId),
        isActive: true
      };

      return await this.findMany(query, options);
    } catch (error) {
      logger.error('Error getting warehouses by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Get warehouses by type
   */
  async getWarehousesByType(companyId: string, warehouseType: string): Promise<IWarehouse[]> {
    try {
      return await this.findMany({ 
        companyId: new Types.ObjectId(companyId),
        warehouseType,
        isActive: true
      });
    } catch (error) {
      logger.error('Error getting warehouses by type', { error, companyId, warehouseType });
      throw error;
    }
  }

  /**
   * Update warehouse capacity
   */
  async updateWarehouseCapacity(
    warehouseId: string, 
    capacity: { totalArea?: number; storageCapacity?: number; maxWeight?: number },
    updatedBy?: string
  ): Promise<IWarehouse | null> {
    try {
      const warehouse = await this.findById(warehouseId);
      if (!warehouse) {
        throw new AppError('Warehouse not found', 404);
      }

      const updateData: any = {};
      if (capacity.totalArea !== undefined) {
        updateData['capacity.totalArea'] = capacity.totalArea;
      }
      if (capacity.storageCapacity !== undefined) {
        updateData['capacity.storageCapacity'] = capacity.storageCapacity;
      }
      if (capacity.maxWeight !== undefined) {
        updateData['capacity.maxWeight'] = capacity.maxWeight;
      }

      const updatedWarehouse = await this.update(warehouseId, updateData, updatedBy);

      logger.info('Warehouse capacity updated', { 
        warehouseId, 
        capacity,
        updatedBy 
      });

      return updatedWarehouse;
    } catch (error) {
      logger.error('Error updating warehouse capacity', { error, warehouseId, capacity, updatedBy });
      throw error;
    }
  }

  /**
   * Add storage zone to warehouse
   */
  async addStorageZone(
    warehouseId: string, 
    zoneData: any,
    addedBy?: string
  ): Promise<IWarehouse | null> {
    try {
      const warehouse = await this.findById(warehouseId);
      if (!warehouse) {
        throw new AppError('Warehouse not found', 404);
      }

      // Check if zone code already exists
      const existingZone = warehouse.zones?.find(
        zone => zone.zoneCode === zoneData.zoneCode
      );

      if (existingZone) {
        throw new AppError('Zone code already exists in this warehouse', 400);
      }

      const newZone = {
        ...zoneData,
        zoneId: new Types.ObjectId(),
        isActive: true,
        createdAt: new Date()
      };

      const updatedWarehouse = await this.update(warehouseId, {
        $push: { zones: newZone }
      }, addedBy);

      logger.info('Storage zone added to warehouse', { 
        warehouseId, 
        zoneCode: zoneData.zoneCode,
        addedBy 
      });

      return updatedWarehouse;
    } catch (error) {
      logger.error('Error adding storage zone', { error, warehouseId, zoneData, addedBy });
      throw error;
    }
  }

  /**
   * Get warehouse utilization
   */
  async getWarehouseUtilization(warehouseId: string): Promise<any> {
    try {
      const warehouse = await this.findById(warehouseId);
      if (!warehouse) {
        throw new AppError('Warehouse not found', 404);
      }

      // This would typically involve aggregating inventory data
      // For now, returning basic capacity information
      const totalCapacity = warehouse.capacity?.maxVolume || 0;
      const usedCapacity = warehouse.currentUtilization?.currentVolume || 0;
      const utilizationPercentage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

      return {
        warehouseId,
        warehouseName: warehouse.warehouseName,
        totalCapacity,
        usedCapacity,
        availableCapacity: totalCapacity - usedCapacity,
        utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2)),
        storageZones: warehouse.zones?.length || 0,
        activeZones: warehouse.zones?.filter(zone => zone.isActive).length || 0
      };
    } catch (error) {
      logger.error('Error getting warehouse utilization', { error, warehouseId });
      throw error;
    }
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(companyId: string): Promise<any> {
    try {
      const [
        totalWarehouses,
        activeWarehouses,
        warehousesByType,
        totalCapacity,
        totalUtilization
      ] = await Promise.all([
        this.count({ companyId: new Types.ObjectId(companyId) }),
        this.count({ companyId: new Types.ObjectId(companyId), isActive: true }),
        this.model.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), isActive: true } },
          { $group: { _id: '$warehouseType', count: { $sum: 1 } } }
        ]),
        this.model.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), isActive: true } },
          { $group: { _id: null, totalCapacity: { $sum: '$capacity.storageCapacity' } } }
        ]),
        this.model.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), isActive: true } },
          { $group: { _id: null, totalUtilization: { $sum: '$currentUtilization.usedCapacity' } } }
        ])
      ]);

      const capacity = totalCapacity[0]?.totalCapacity || 0;
      const utilization = totalUtilization[0]?.totalUtilization || 0;
      const utilizationPercentage = capacity > 0 ? (utilization / capacity) * 100 : 0;

      return {
        totalWarehouses,
        activeWarehouses,
        warehousesByType,
        totalCapacity: capacity,
        totalUtilization: utilization,
        availableCapacity: capacity - utilization,
        overallUtilizationPercentage: parseFloat(utilizationPercentage.toFixed(2))
      };
    } catch (error) {
      logger.error('Error getting warehouse statistics', { error, companyId });
      throw error;
    }
  }

  /**
   * Generate warehouse code
   */
  private async generateWarehouseCode(companyId: string): Promise<string> {
    const count = await this.count({ companyId: new Types.ObjectId(companyId) });
    return `WH${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Validate warehouse data
   */
  private validateWarehouseData(warehouseData: Partial<IWarehouse>): void {
    if (!warehouseData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!warehouseData.warehouseName) {
      throw new AppError('Warehouse name is required', 400);
    }

    if (!warehouseData.warehouseType) {
      throw new AppError('Warehouse type is required', 400);
    }

    if (!warehouseData.address) {
      throw new AppError('Warehouse address is required', 400);
    }

    if (warehouseData.specifications?.totalArea && warehouseData.specifications.totalArea <= 0) {
      throw new AppError('Total area must be greater than 0', 400);
    }

    if (warehouseData.capacity?.maxVolume && warehouseData.capacity.maxVolume <= 0) {
      throw new AppError('Storage capacity must be greater than 0', 400);
    }
  }
}
