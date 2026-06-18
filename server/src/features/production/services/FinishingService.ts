import { BaseService } from '../../../services/BaseService';
import Finishing, { IFinishing } from '../models/Finishing';
import Felt from '../models/Felt';
import RejectionStock from '../models/RejectionStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class FinishingService extends BaseService<any> {
  constructor() {
    super(Finishing);
  }

  /**
   * Create a new finishing entry
   */
  async createFinishing(data: Partial<IFinishing>, createdBy?: string): Promise<IFinishing> {
    try {
      const finishingData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const finishing = await this.create(finishingData, createdBy);
      logger.info('Finishing entry created', { finishingId: finishing._id });
      return finishing;
    } catch (error: any) {
      logger.error('Error creating finishing entry', { error, data });
      throw new AppError('Failed to create finishing entry', 500, error);
    }
  }

  /**
   * Update finishing output - moves finished meter to Felt, rejected to Rejection Stock
   */
  async updateOutput(
    finishingId: string,
    finishedMeter: number,
    rejectedMeter: number,
    updatedBy?: string
  ): Promise<{ finishing: IFinishing; felt?: any; rejectionStock?: any }> {
    try {
      const finishing = await this.findById(finishingId);
      if (!finishing) {
        throw new AppError('Finishing entry not found', 404);
      }

      // Validate
      if (finishedMeter + rejectedMeter > finishing.inputMeter) {
        throw new AppError('Finished + Rejected meter cannot exceed input meter', 400);
      }

      // Update finishing
      const updatedFinishing = await this.update(finishingId, {
        finishedMeter,
        rejectedMeter,
        updatedBy: updatedBy || finishing.createdBy
      }, updatedBy);

      if (!updatedFinishing) {
        throw new AppError('Failed to update finishing', 500);
      }

      // Create Rejection Stock for rejected meter
      let rejectionStock = null;
      if (rejectedMeter > 0) {
        rejectionStock = await RejectionStock.create({
          companyId: finishing.companyId,
          lotNumber: finishing.lotNumber,
          partyName: finishing.partyName,
          sourceModule: 'finishing',
          sourceId: finishing._id,
          meter: rejectedMeter,
          reason: 'Finishing rejection',
          createdBy: updatedBy || finishing.createdBy
        });
      }

      // Create Felt entry if finished meter > 0
      let felt = null;
      if (finishedMeter > 0) {
        felt = await Felt.create({
          companyId: finishing.companyId,
          lotNumber: finishing.lotNumber,
          partyName: finishing.partyName,
          inputMeter: finishedMeter,
          finishingId: finishing._id,
          dateIn: new Date(),
          createdBy: updatedBy || finishing.createdBy
        });
      }

      logger.info('Finishing output updated', { finishingId, finishedMeter, rejectedMeter });
      return { finishing: updatedFinishing, felt, rejectionStock };
    } catch (error: any) {
      logger.error('Error updating finishing output', { error, finishingId });
      throw new AppError('Failed to update finishing output', 500, error);
    }
  }

  /**
   * Get all finishing entries
   */
  async getAllFinishings(companyId: string, options?: { finishingType?: string; status?: string }): Promise<IFinishing[]> {
    try {
      const filter: any = { companyId };
      if (options?.finishingType) {
        filter.finishingType = options.finishingType;
      }
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { date: -1 } });
    } catch (error: any) {
      logger.error('Error fetching finishing entries', { error, companyId });
      throw new AppError('Failed to fetch finishing entries', 500, error);
    }
  }

  /**
   * Get WIP (Work In Progress) - entries with pending meter > 0
   */
  async getWIP(companyId: string): Promise<IFinishing[]> {
    try {
      // Use direct MongoDB query to avoid BaseService filter processing issues
      const documents = await this.model.find({
        companyId,
        pendingMeter: { $gt: 0 }
      })
      .sort({ date: -1 })
      .exec();

      return documents;
    } catch (error: any) {
      logger.error('Error fetching finishing WIP', { error, companyId });
      
      // Fallback: try without pendingMeter filter and filter in memory
      try {
        logger.info('Attempting fallback finishing WIP query');
        const allDocuments = await this.findMany({ companyId }, { sort: { date: -1 } });
        
        const wipDocuments = allDocuments.filter(doc => {
          const pendingMeter = doc.pendingMeter || 0;
          return typeof pendingMeter === 'number' && pendingMeter > 0;
        });
        
        return wipDocuments;
      } catch (fallbackError: any) {
        logger.error('Fallback finishing WIP query failed', { fallbackError, companyId });
        throw new AppError('Failed to fetch finishing WIP', 500, error);
      }
    }
  }
}

