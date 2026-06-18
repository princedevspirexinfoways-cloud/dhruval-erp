import { BaseService } from '../../../services/BaseService';
import BleachingProcess, { IBleachingProcess } from '../models/BleachingProcess';
import AfterBleaching from '../models/AfterBleaching';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class BleachingProcessService extends BaseService<any> {
  constructor() {
    super(BleachingProcess);
  }

  /**
   * Create a new bleaching process entry
   */
  async createBleachingProcess(data: Partial<IBleachingProcess>, createdBy?: string): Promise<IBleachingProcess> {
    try {
      const processData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const process = await this.create(processData, createdBy);
      logger.info('Bleaching process created', { processId: process._id });
      return process;
    } catch (error: any) {
      logger.error('Error creating bleaching process', { error, data });
      throw new AppError('Failed to create bleaching process', 500, error);
    }
  }

  /**
   * Complete bleaching process - updates meter and creates After Bleaching entry
   */
  async completeProcess(
    processId: string,
    updatedMeter: number,
    completedBy?: string
  ): Promise<{ process: IBleachingProcess; afterBleaching: any }> {
    try {
      const process = await this.findById(processId);
      if (!process) {
        throw new AppError('Bleaching process not found', 404);
      }

      // Update process with completed meter
      const updatedProcess = await this.update(processId, {
        completedMeter: updatedMeter,
        isCompleted: true,
        status: 'completed',
        completedAt: new Date(),
        completedBy: completedBy || process.createdBy,
        updatedBy: completedBy || process.createdBy
      }, completedBy);

      if (!updatedProcess) {
        throw new AppError('Failed to update bleaching process', 500);
      }

      // Create or update After Bleaching stock
      let afterBleaching = await AfterBleaching.findOne({
        companyId: process.companyId,
        bleachingProcessId: process._id
      });

      if (afterBleaching) {
        // Update existing entry
        afterBleaching.totalMeter = updatedMeter;
        // Update customerId if missing and available from process
        if (!afterBleaching.customerId && process.customerId) {
          afterBleaching.customerId = process.customerId;
        }
        await afterBleaching.save();
      } else {
        // Create new entry
        afterBleaching = await AfterBleaching.create({
          companyId: process.companyId,
          bleachingProcessId: process._id,
          lotNumber: process.lotNumber,
          partyName: process.partyName,
          customerId: process.customerId, // Include customerId from bleaching process
          totalMeter: updatedMeter,
          availableMeter: updatedMeter,
          createdBy: completedBy || process.createdBy
        });
      }

      logger.info('Bleaching process completed', { processId, updatedMeter });
      return { process: updatedProcess, afterBleaching };
    } catch (error: any) {
      logger.error('Error completing bleaching process', { error, processId });
      throw new AppError('Failed to complete bleaching process', 500, error);
    }
  }

  /**
   * Get all bleaching processes for dashboard
   */
  async getDashboard(companyId: string): Promise<IBleachingProcess[]> {
    try {
      return await this.findMany(
        { companyId },
        { sort: { date: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching bleaching dashboard', { error, companyId });
      throw new AppError('Failed to fetch bleaching dashboard', 500, error);
    }
  }

  /**
   * Generate challan for bleaching process
   */
  async generateChallan(processId: string): Promise<string> {
    try {
      const process = await this.findById(processId);
      if (!process) {
        throw new AppError('Bleaching process not found', 404);
      }

      // TODO: Implement actual challan generation (PDF)
      // For now, return a placeholder URL
      const challanUrl = `/api/v1/production/bleaching/${processId}/challan.pdf`;

      await this.update(processId, {
        challanGenerated: true,
        challanUrl
      });

      return challanUrl;
    } catch (error: any) {
      logger.error('Error generating challan', { error, processId });
      throw new AppError('Failed to generate challan', 500, error);
    }
  }
}

