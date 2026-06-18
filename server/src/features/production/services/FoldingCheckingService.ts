import { BaseService } from '../../../services/BaseService';
import FoldingChecking, { IFoldingChecking } from '../models/FoldingChecking';
import Packing from '../models/Packing';
import RejectionStock from '../models/RejectionStock';
import Felt from '../models/Felt';
import Finishing from '../models/Finishing';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class FoldingCheckingService extends BaseService<any> {
  constructor() {
    super(FoldingChecking);
  }

  /**
   * Create a new folding + checking entry
   */
  async createFoldingChecking(data: Partial<IFoldingChecking>, createdBy?: string): Promise<IFoldingChecking> {
    try {
      const foldingData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const folding = await this.create(foldingData, createdBy);
      logger.info('Folding + Checking entry created', { foldingId: folding._id });
      return folding;
    } catch (error: any) {
      logger.error('Error creating folding + checking entry', { error, data });
      throw new AppError('Failed to create folding + checking entry', 500, error);
    }
  }

  /**
   * Update QC results - moves checked meter to Packing, rejected to Rejection Stock
   * Automatically moves:
   * - Checked Meter → Packing Module
   * - Rejected Meter → Rejection Stock
   * - Pending Meter → Remains in Folding+Checking WIP (auto-calculated)
   */
  async updateQC(
    foldingId: string,
    checkedMeter: number,
    rejectedMeter: number,
    qcStatus: 'pass' | 'fail' | 'partial',
    checkerName: string,
    updatedBy?: string
  ): Promise<{ folding: IFoldingChecking; packing?: any; rejectionStock?: any }> {
    try {
      // Validate input parameters
      if (!foldingId) {
        throw new AppError('Folding+Checking ID is required', 400);
      }
      
      if (checkedMeter < 0 || rejectedMeter < 0) {
        throw new AppError('Checked and rejected meters must be non-negative', 400);
      }

      if (!checkerName || checkerName.trim() === '') {
        throw new AppError('Checker name is required', 400);
      }

      const folding = await this.findById(foldingId);
      if (!folding) {
        throw new AppError('Folding + Checking entry not found', 404);
      }

      // Validate meter values
      const totalOutput = checkedMeter + rejectedMeter;
      if (totalOutput > folding.inputMeter) {
        throw new AppError(
          `Total output (${totalOutput}m) cannot exceed input meter (${folding.inputMeter}m)`, 
          400
        );
      }

      logger.info('Updating folding+checking QC', {
        foldingId,
        inputMeter: folding.inputMeter,
        checkedMeter,
        rejectedMeter,
        qcStatus,
        checkerName,
        pendingMeter: folding.inputMeter - totalOutput
      });

      // Update folding record
      const updatedFolding = await this.update(foldingId, {
        checkedMeter,
        rejectedMeter,
        qcStatus,
        checkerName,
        updatedBy: updatedBy || folding.createdBy
      }, updatedBy);

      if (!updatedFolding) {
        throw new AppError('Failed to update folding + checking record', 500);
      }

      // 1. Create Rejection Stock for rejected meter
      let rejectionStock = null;
      if (rejectedMeter > 0) {
        try {
          rejectionStock = await RejectionStock.create({
            companyId: folding.companyId,
            lotNumber: folding.lotNumber,
            partyName: folding.partyName,
            sourceModule: 'folding_checking',
            sourceId: folding._id,
            meter: rejectedMeter,
            reason: 'QC rejection',
            createdBy: updatedBy || folding.createdBy
          });

          logger.info('Rejected meter moved to rejection stock', {
            foldingId,
            rejectedMeter,
            rejectionStockId: rejectionStock._id
          });
        } catch (rejectionError: any) {
          logger.error('Failed to create rejection stock', { error: rejectionError, foldingId });
          throw new AppError('Failed to create rejection stock entry', 500, rejectionError);
        }
      }

      // 2. Create Packing entry if checked meter > 0
      let packing = null;
      if (checkedMeter > 0) {
        try {
          // Get quality by tracing back through the production chain
          let quality = 'Standard'; // Default fallback
          
          if (folding.feltId) {
            try {
              // Trace: FoldingChecking → Felt → Finishing (has quality)
              const feltEntry = await Felt.findById(folding.feltId).lean();
              if (feltEntry && feltEntry.finishingId) {
                const finishingEntry = await Finishing.findById(feltEntry.finishingId).lean();
                if (finishingEntry && finishingEntry.quality) {
                  quality = finishingEntry.quality;
                }
              }
            } catch (qualityError) {
              logger.warn('Could not retrieve quality from production chain, using default', { 
                foldingId, 
                feltId: folding.feltId,
                error: qualityError 
              });
            }
          }

          packing = await Packing.create({
            companyId: folding.companyId,
            lotNumber: folding.lotNumber,
            partyName: folding.partyName,
            customerId: folding.customerId,
            quality: quality,
            inputMeter: checkedMeter,
            foldingCheckingId: folding._id,
            packingType: 'bale', // Default
            date: new Date(),
            createdBy: updatedBy || folding.createdBy
          });

          logger.info('Checked meter moved to packing', {
            foldingId,
            checkedMeter,
            packingId: packing._id,
            quality
          });
        } catch (packingError: any) {
          logger.error('Failed to create packing entry', { error: packingError, foldingId });
          throw new AppError('Failed to create packing entry', 500, packingError);
        }
      }

      // 3. Pending meter remains in Folding+Checking WIP (auto-calculated by pre-save middleware)
      const pendingMeter = folding.inputMeter - checkedMeter - rejectedMeter;
      if (pendingMeter > 0) {
        logger.info('Pending meter remains in Folding+Checking WIP', {
          foldingId,
          pendingMeter
        });
      }

      logger.info('Folding+Checking QC updated with automatic movements', { 
        foldingId, 
        checkedMeter, 
        rejectedMeter,
        qcStatus,
        pendingMeter,
        rejectionStockCreated: !!rejectionStock,
        packingCreated: !!packing
      });

      return { 
        folding: updatedFolding, 
        packing, 
        rejectionStock 
      };
    } catch (error: any) {
      logger.error('Error updating folding + checking QC', { 
        error: error.message || error, 
        stack: error.stack,
        foldingId, 
        checkedMeter, 
        rejectedMeter,
        qcStatus 
      });
      
      // Re-throw AppError as-is, wrap other errors
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update folding + checking QC', 500, error);
    }
  }

  /**
   * Get all folding + checking entries
   */
  async getAllFoldings(companyId: string, options?: { qcStatus?: string; status?: string }): Promise<IFoldingChecking[]> {
    try {
      const filter: any = { companyId };
      if (options?.qcStatus) {
        filter.qcStatus = options.qcStatus;
      }
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { date: -1 } });
    } catch (error: any) {
      logger.error('Error fetching folding + checking entries', { error, companyId });
      throw new AppError('Failed to fetch folding + checking entries', 500, error);
    }
  }
}

