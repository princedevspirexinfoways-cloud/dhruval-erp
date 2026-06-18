import { BaseService } from '../../../services/BaseService';
import Packing, { IPacking } from '../models/Packing';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class PackingService extends BaseService<any> {
  constructor() {
    super(Packing);
  }

  /**
   * Create a new packing entry
   */
  async createPacking(data: Partial<IPacking>, createdBy?: string): Promise<IPacking> {
    try {
      const packingData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const packing = await this.create(packingData, createdBy);
      logger.info('Packing entry created', { packingId: packing._id });
      return packing;
    } catch (error: any) {
      logger.error('Error creating packing entry', { error, data });
      throw new AppError('Failed to create packing entry', 500, error);
    }
  }

  /**
   * Update packing - marks as dispatch ready and links to Finished Goods Inventory
   */
  async updatePacking(
    packingId: string,
    totalPackedBale: number,
    totalPackedMeter: number,
    finishedGoodsInventoryId?: string,
    updatedBy?: string
  ): Promise<IPacking> {
    try {
      const packing = await this.findById(packingId);
      if (!packing) {
        throw new AppError('Packing entry not found', 404);
      }

      // Validate
      if (totalPackedMeter > packing.inputMeter) {
        throw new AppError('Packed meter cannot exceed input meter', 400);
      }

      // Update packing
      const updatedPacking = await this.update(packingId, {
        totalPackedBale,
        totalPackedMeter,
        finishedGoodsInventoryId: finishedGoodsInventoryId || packing.finishedGoodsInventoryId,
        isDispatchReady: totalPackedMeter === packing.inputMeter,
        status: totalPackedMeter === packing.inputMeter ? 'dispatch_ready' : 'completed',
        updatedBy: updatedBy || packing.createdBy
      }, updatedBy);

      if (!updatedPacking) {
        throw new AppError('Failed to update packing', 500);
      }

      // TODO: Link to Finished Goods Inventory and Dispatch Module
      logger.info('Packing updated, ready for dispatch', { packingId, totalPackedMeter });
      return updatedPacking;
    } catch (error: any) {
      logger.error('Error updating packing', { error, packingId });
      throw new AppError('Failed to update packing', 500, error);
    }
  }

  /**
   * Get all packing entries
   */
  async getAllPackings(companyId: string, options?: { status?: string; isDispatchReady?: boolean }): Promise<IPacking[]> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }
      if (options?.isDispatchReady !== undefined) {
        filter.isDispatchReady = options.isDispatchReady;
      }

      return await this.findMany(filter, { sort: { date: -1 } });
    } catch (error: any) {
      logger.error('Error fetching packing entries', { error, companyId });
      throw new AppError('Failed to fetch packing entries', 500, error);
    }
  }

  /**
   * Get dispatch ready packings
   */
  async getDispatchReady(companyId: string): Promise<IPacking[]> {
    try {
      return await this.findMany(
        { companyId, isDispatchReady: true },
        { sort: { date: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching dispatch ready packings', { error, companyId });
      throw new AppError('Failed to fetch dispatch ready packings', 500, error);
    }
  }
}

