import { BaseService } from '../../../services/BaseService';
import BatchCenter, { IBatchCenter } from '../models/BatchCenter';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { LotService } from './LotService';

export class BatchCenterService extends BaseService<any> {
  private lotService: LotService;

  constructor() {
    super(BatchCenter);
    this.lotService = new LotService();
  }

  /**
   * Create a new batch center entry
   */
  async createBatchEntry(data: Partial<IBatchCenter>, createdBy?: string): Promise<IBatchCenter> {
    try {
      const batchData: any = {
        ...data,
        receivedMeter: data.receivedMeter || 0,
        createdBy: createdBy || data.createdBy
      };

      const batch = await this.create(batchData, createdBy);
      logger.info('Batch entry created', { batchId: batch._id });
      return batch;
    } catch (error: any) {
      logger.error('Error creating batch entry', { error, data });
      throw new AppError('Failed to create batch entry', 500, error);
    }
  }

  /**
   * Update received meter
   */
  async updateReceivedMeter(
    batchId: string,
    receivedMeter: number,
    updatedBy?: string
  ): Promise<IBatchCenter> {
    try {
      const batch = await this.findById(batchId);
      if (!batch) {
        throw new AppError('Batch entry not found', 404);
      }

      if (receivedMeter > batch.totalMeter) {
        throw new AppError('Received meter cannot exceed total meter', 400);
      }

      // Use findById and save to trigger pre-save middleware
      const batchDoc = await this.model.findById(batchId);
      if (!batchDoc) {
        throw new AppError('Batch entry not found', 404);
      }

      if (receivedMeter > batchDoc.totalMeter) {
        throw new AppError('Received meter cannot exceed total meter', 400);
      }

      // Update the fields
      batchDoc.receivedMeter = receivedMeter;
      batchDoc.updatedBy = updatedBy || batchDoc.createdBy;
      batchDoc.updatedAt = new Date();

      // Save to trigger pre-save middleware (this will auto-calculate pendingMeter and status)
      const updatedBatch = await batchDoc.save();

      if (!updatedBatch) {
        throw new AppError('Failed to update batch entry', 500);
      }

      logger.info('Batch received meter updated', { batchId, receivedMeter, status: updatedBatch.status });
      return updatedBatch;
    } catch (error: any) {
      logger.error('Error updating received meter', { error, batchId, receivedMeter });
      throw new AppError('Failed to update received meter', 500, error);
    }
  }

  /**
   * Get batch entries by lot number
   */
  async getByLotNumber(companyId: string, lotNumber: string): Promise<IBatchCenter[]> {
    try {
      return await this.findMany(
        { companyId, lotNumber },
        { sort: { date: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching batch by lot number', { error, companyId, lotNumber });
      throw new AppError('Failed to fetch batch entries', 500, error);
    }
  }

  /**
   * Get all batch entries for a company
   */
  async getAllBatches(companyId: string, options?: { status?: string; page?: number; limit?: number }): Promise<any> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }

      const page = options?.page || 1;
      const limit = Math.min(options?.limit || 20, 100); // Max 100, default 20
      const skip = (page - 1) * limit;

      // Optimize query with field selection and lean
      const [data, total] = await Promise.all([
        this.model
          .find(filter)
          .select('-__v') // Exclude version key
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter).exec()
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching batch entries', { error, companyId });
      throw new AppError('Failed to fetch batch entries', 500, error);
    }
  }

  /**
   * Get comprehensive lot details including customer information
   * Returns party name, customer ID, and other relevant details
   */
  async getLotDetailsWithCustomer(companyId: string, lotNumber: string): Promise<{
    partyName: string | null;
    customerId: string | null;
    quality: string | null;
    availableMeter?: number;
    sourceModule?: string;
  } | null> {
    try {
      const lotDetails = await this.lotService.getLotDetails(companyId, lotNumber);
      
      if (lotDetails) {
        return {
          partyName: lotDetails.partyName,
          customerId: lotDetails.customerId,
          quality: lotDetails.quality,
          availableMeter: lotDetails.availableMeter,
          sourceModule: lotDetails.sourceModule
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Error fetching lot details with customer', { error, companyId, lotNumber });
      return null;
    }
  }
  async getPartyNameByLot(companyId: string, lotNumber: string): Promise<string | null> {
    try {
      // Use LotService to search across all production modules
      const lotDetails = await this.lotService.getLotDetails(companyId, lotNumber);
      
      if (lotDetails && lotDetails.partyName) {
        logger.info('Party name found for lot', { 
          companyId, 
          lotNumber, 
          partyName: lotDetails.partyName,
          sourceModule: lotDetails.sourceModule 
        });
        return lotDetails.partyName;
      }

      // Fallback: search only in BatchCenter (original behavior)
      const batch = await this.findOne({ companyId, lotNumber });
      const partyName = batch?.partyName || null;
      
      logger.info('Party name search result', { 
        companyId, 
        lotNumber, 
        partyName,
        sourceModule: partyName ? 'batch_center' : 'not_found'
      });
      
      return partyName;
    } catch (error: any) {
      logger.error('Error fetching party name by lot', { error, companyId, lotNumber });
      return null;
    }
  }
}

