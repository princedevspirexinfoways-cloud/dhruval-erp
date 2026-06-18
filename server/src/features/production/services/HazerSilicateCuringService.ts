import { BaseService } from '../../../services/BaseService';
import HazerSilicateCuring, { IHazerSilicateCuring } from '../models/HazerSilicateCuring';
import Washing from '../models/Washing';
import LongationStock from '../models/LongationStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class HazerSilicateCuringService extends BaseService<any> {
  constructor() {
    super(HazerSilicateCuring);
  }

  /**
   * Create a new Hazer/Silicate/Curing entry
   */
  async createProcess(data: Partial<IHazerSilicateCuring>, createdBy?: string): Promise<IHazerSilicateCuring> {
    try {
      const processData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const process = await this.create(processData, createdBy);
      logger.info('Hazer/Silicate/Curing entry created', { processId: process._id });
      return process;
    } catch (error: any) {
      logger.error('Error creating Hazer/Silicate/Curing entry', { error, data });
      throw new AppError('Failed to create process entry', 500, error);
    }
  }

  /**
   * Update process output - moves processed meter to Washing, loss to Longation
   */
  async updateOutput(
    processId: string,
    processedMeter: number,
    lossMeter: number,
    updatedBy?: string
  ): Promise<{ process: IHazerSilicateCuring; washing?: any; longationStock?: any }> {
    try {
      const process = await this.findById(processId);
      if (!process) {
        throw new AppError('Process entry not found', 404);
      }

      // Validate
      if (processedMeter + lossMeter > process.inputMeter) {
        throw new AppError('Processed + Loss meter cannot exceed input meter', 400);
      }

      // Use findById and save to trigger pre-save middleware
      const processDoc = await this.model.findById(processId);
      if (!processDoc) {
        throw new AppError('Process entry not found', 404);
      }

      // Update the fields
      processDoc.processedMeter = processedMeter;
      processDoc.lossMeter = lossMeter;
      processDoc.updatedBy = updatedBy || process.createdBy;
      processDoc.updatedAt = new Date();

      // Save to trigger pre-save middleware (this will auto-calculate pendingMeter and status)
      const updatedProcess = await processDoc.save();

      if (!updatedProcess) {
        throw new AppError('Failed to update process', 500);
      }

      // Create Longation Stock for loss meter
      let longationStock = null;
      if (lossMeter > 0) {
        longationStock = await LongationStock.create({
          companyId: process.companyId,
          lotNumber: process.lotNumber,
          partyName: process.partyName,
          sourceModule: 'hazer_silicate_curing',
          sourceId: process._id,
          meter: lossMeter,
          reason: `${process.processType} loss/shrinkage`,
          createdBy: updatedBy || process.createdBy
        });
      }

      // Create Washing entry if processed meter > 0
      let washing = null;
      if (processedMeter > 0) {
        washing = await Washing.create({
          companyId: process.companyId,
          lotNumber: process.lotNumber,
          partyName: process.partyName,
          inputMeter: processedMeter,
          hazerSilicateCuringId: process._id,
          washingType: 'normal', // Default, can be updated
          createdBy: updatedBy || process.createdBy
        });
      }

      logger.info('Process output updated', { processId, processedMeter, lossMeter });
      return { process: updatedProcess, washing, longationStock };
    } catch (error: any) {
      logger.error('Error updating process output', { error, processId });
      throw new AppError('Failed to update process output', 500, error);
    }
  }

  /**
   * Get all processes
   */
  async getAllProcesses(companyId: string, options?: { processType?: string; status?: string }): Promise<IHazerSilicateCuring[]> {
    try {
      const filter: any = { companyId };
      if (options?.processType) {
        filter.processType = options.processType;
      }
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { date: -1 } });
    } catch (error: any) {
      logger.error('Error fetching processes', { error, companyId });
      throw new AppError('Failed to fetch processes', 500, error);
    }
  }

  /**
   * Get WIP (Work In Progress) - entries with pending meter > 0
   */
  async getWIP(companyId: string): Promise<IHazerSilicateCuring[]> {
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
      logger.error('Error fetching hazer/silicate/curing WIP', { error, companyId });
      
      // Fallback: try without pendingMeter filter and filter in memory
      try {
        logger.info('Attempting fallback hazer WIP query');
        const allDocuments = await this.findMany({ companyId }, { sort: { date: -1 } });
        
        const wipDocuments = allDocuments.filter(doc => {
          const pendingMeter = doc.pendingMeter || 0;
          return typeof pendingMeter === 'number' && pendingMeter > 0;
        });
        
        return wipDocuments;
      } catch (fallbackError: any) {
        logger.error('Fallback hazer WIP query failed', { fallbackError, companyId });
        throw new AppError('Failed to fetch process WIP', 500, error);
      }
    }
  }
}

