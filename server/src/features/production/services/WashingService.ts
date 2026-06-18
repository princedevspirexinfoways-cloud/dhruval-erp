import { BaseService } from '../../../services/BaseService';
import Washing, { IWashing } from '../models/Washing';
import Finishing from '../models/Finishing';
import HazerSilicateCuring from '../models/HazerSilicateCuring';
import LongationStock from '../models/LongationStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class WashingService extends BaseService<any> {
  constructor() {
    super(Washing);
  }

  /**
   * Create a new washing entry
   */
  async createWashing(data: Partial<IWashing>, createdBy?: string): Promise<IWashing> {
    try {
      const washingData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const washing = await this.create(washingData, createdBy);
      logger.info('Washing entry created', { washingId: washing._id });
      return washing;
    } catch (error: any) {
      logger.error('Error creating washing entry', { error, data });
      throw new AppError('Failed to create washing entry', 500, error);
    }
  }

  /**
   * Update washing output - moves washed meter to Finishing, shrinkage to Longation
   * Automatically moves:
   * - Washed Meter → Finishing Module
   * - Shrinkage Meter → Longation Stock
   * - Pending Meter → Remains in Washing WIP (auto-calculated)
   */
  async updateOutput(
    washingId: string,
    washedMeter: number,
    shrinkageMeter: number,
    updatedBy?: string
  ): Promise<{ washing: IWashing; finishing?: any; longationStock?: any }> {
    try {
      // Validate input parameters
      if (!washingId) {
        throw new AppError('Washing ID is required', 400);
      }
      
      if (washedMeter < 0 || shrinkageMeter < 0) {
        throw new AppError('Washed and shrinkage meters must be non-negative', 400);
      }

      const washing = await this.findById(washingId);
      if (!washing) {
        throw new AppError('Washing entry not found', 404);
      }

      // Validate meter values
      const totalOutput = washedMeter + shrinkageMeter;
      if (totalOutput > washing.inputMeter) {
        throw new AppError(
          `Total output (${totalOutput}m) cannot exceed input meter (${washing.inputMeter}m)`, 
          400
        );
      }

      logger.info('Updating washing output', {
        washingId,
        inputMeter: washing.inputMeter,
        washedMeter,
        shrinkageMeter,
        pendingMeter: washing.inputMeter - totalOutput
      });

      // Update washing record
      const updatedWashing = await this.update(washingId, {
        washedMeter,
        shrinkageMeter,
        updatedBy: updatedBy || washing.createdBy
      }, updatedBy);

      if (!updatedWashing) {
        throw new AppError('Failed to update washing record', 500);
      }

      // 1. Create Longation Stock for shrinkage
      let longationStock = null;
      if (shrinkageMeter > 0) {
        try {
          longationStock = await LongationStock.create({
            companyId: washing.companyId,
            lotNumber: washing.lotNumber,
            partyName: washing.partyName,
            sourceModule: 'washing',
            sourceId: washing._id,
            meter: shrinkageMeter,
            reason: 'Washing shrinkage',
            createdBy: updatedBy || washing.createdBy
          });

          logger.info('Shrinkage moved to longation stock', {
            washingId,
            shrinkageMeter,
            longationStockId: longationStock._id
          });
        } catch (longationError: any) {
          logger.error('Failed to create longation stock', { error: longationError, washingId });
          throw new AppError('Failed to create longation stock entry', 500, longationError);
        }
      }

      // 2. Create Finishing entry if washed meter > 0
      let finishing = null;
      if (washedMeter > 0) {
        try {
          // Get quality from linked HazerSilicateCuring entry
          let quality = 'Standard'; // Default fallback
          
          if (washing.hazerSilicateCuringId) {
            try {
              const hazerEntry = await HazerSilicateCuring.findById(washing.hazerSilicateCuringId).lean();
              if (hazerEntry && hazerEntry.quality) {
                quality = hazerEntry.quality;
              }
            } catch (qualityError) {
              logger.warn('Could not retrieve quality from hazer entry, using default', { 
                washingId, 
                hazerSilicateCuringId: washing.hazerSilicateCuringId,
                error: qualityError 
              });
            }
          }

          finishing = await Finishing.create({
            companyId: washing.companyId,
            lotNumber: washing.lotNumber,
            partyName: washing.partyName,
            customerId: washing.customerId,
            quality: quality,
            inputMeter: washedMeter,
            washingId: washing._id,
            finishingType: 'soft', // Default
            date: new Date(),
            createdBy: updatedBy || washing.createdBy
          });

          logger.info('Washed meter moved to finishing', {
            washingId,
            washedMeter,
            finishingId: finishing._id,
            quality
          });
        } catch (finishingError: any) {
          logger.error('Failed to create finishing entry', { error: finishingError, washingId });
          throw new AppError('Failed to create finishing entry', 500, finishingError);
        }
      }

      // 3. Pending meter remains in Washing WIP (auto-calculated by pre-save middleware)
      const pendingMeter = washing.inputMeter - washedMeter - shrinkageMeter;
      if (pendingMeter > 0) {
        logger.info('Pending meter remains in Washing WIP', {
          washingId,
          pendingMeter
        });
      }

      logger.info('Washing output updated with automatic movements', { 
        washingId, 
        washedMeter, 
        shrinkageMeter,
        pendingMeter,
        longationStockCreated: !!longationStock,
        finishingCreated: !!finishing
      });

      return { 
        washing: updatedWashing, 
        finishing, 
        longationStock 
      };
    } catch (error: any) {
      logger.error('Error updating washing output', { 
        error: error.message || error, 
        stack: error.stack,
        washingId, 
        washedMeter, 
        shrinkageMeter 
      });
      
      // Re-throw AppError as-is, wrap other errors
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update washing output', 500, error);
    }
  }

  /**
   * Get all washing entries
   */
  async getAllWashings(companyId: string, options?: { washingType?: string; status?: string }): Promise<IWashing[]> {
    try {
      const filter: any = { companyId };
      if (options?.washingType) {
        filter.washingType = options.washingType;
      }
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { date: -1 } });
    } catch (error: any) {
      logger.error('Error fetching washing entries', { error, companyId });
      throw new AppError('Failed to fetch washing entries', 500, error);
    }
  }

  /**
   * Get WIP (Work In Progress) - entries with pending meter > 0
   */
  async getWIP(companyId: string): Promise<IWashing[]> {
    try {
      // First, try to fix any documents with invalid pendingMeter values
      await this.fixPendingMeterValues(companyId);

      // Use direct MongoDB query to avoid BaseService filter processing issues
      const documents = await this.model.find({
        companyId,
        pendingMeter: { $gt: 0 }
      })
      .sort({ date: -1 })
      .exec();

      return documents;
    } catch (error: any) {
      logger.error('Error fetching washing WIP', { error, companyId });
      
      // Fallback: try without pendingMeter filter and filter in memory
      try {
        logger.info('Attempting fallback WIP query without pendingMeter filter');
        const allDocuments = await this.findMany({ companyId }, { sort: { date: -1 } });
        
        // Filter in memory for documents with pendingMeter > 0
        const wipDocuments = allDocuments.filter(doc => {
          const pendingMeter = doc.pendingMeter || 0;
          return typeof pendingMeter === 'number' && pendingMeter > 0;
        });
        
        logger.info(`Fallback WIP query returned ${wipDocuments.length} documents`);
        return wipDocuments;
      } catch (fallbackError: any) {
        logger.error('Fallback WIP query also failed', { fallbackError, companyId });
        throw new AppError('Failed to fetch washing WIP', 500, error);
      }
    }
  }

  /**
   * Fix any documents with invalid pendingMeter values
   */
  private async fixPendingMeterValues(companyId: string): Promise<void> {
    try {
      // Find documents where pendingMeter is not a number or doesn't exist
      const documentsToFix = await this.model.find({
        companyId,
        $or: [
          { pendingMeter: { $exists: false } },
          { pendingMeter: { $type: { $ne: 'number' } } },
          { pendingMeter: null }
        ]
      }).exec();

      if (documentsToFix.length > 0) {
        logger.info(`Fixing ${documentsToFix.length} washing documents with invalid pendingMeter values`);

        // Update each document to recalculate pendingMeter
        for (const doc of documentsToFix) {
          const inputMeter = doc.inputMeter || 0;
          const washedMeter = doc.washedMeter || 0;
          const shrinkageMeter = doc.shrinkageMeter || 0;
          const calculatedPendingMeter = inputMeter - washedMeter - shrinkageMeter;

          await this.model.updateOne(
            { _id: doc._id },
            { $set: { pendingMeter: Math.max(0, calculatedPendingMeter) } }
          ).exec();
        }

        logger.info(`Fixed ${documentsToFix.length} washing documents`);
      }
    } catch (error: any) {
      logger.warn('Error fixing pendingMeter values', { error, companyId });
      // Don't throw error here, just log warning and continue
    }
  }
}

