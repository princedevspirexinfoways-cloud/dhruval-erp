import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/errors';
import AfterBleaching from '../models/AfterBleaching';
import BatchCenter from '../models/BatchCenter';
import Printing from '../models/Printing';
import HazerSilicateCuring from '../models/HazerSilicateCuring';
import Washing from '../models/Washing';
import Finishing from '../models/Finishing';
import Felt from '../models/Felt';
import FoldingChecking from '../models/FoldingChecking';
import Packing from '../models/Packing';
import BleachingProcess from '../models/BleachingProcess';
import { Types } from 'mongoose';

export interface LotDetails {
  lotNumber: string;
  partyName: string | null;
  customerId: string | null;
  quality: string | null;
  availableMeter?: number;
  sourceModule?: string;
}

export class LotService {
  /**
   * Get lot details from any production module
   * Searches in order: AfterBleaching, BatchCenter, BleachingProcess, Printing, etc.
   */
  async getLotDetails(companyId: string, lotNumber: string): Promise<LotDetails | null> {
    try {
      // Search in After Bleaching (highest priority for printing workflow)
      const afterBleaching = await AfterBleaching.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (afterBleaching) {
        // Get customerId from afterBleaching or fetch from referenced bleachingProcess
        let customerId = afterBleaching.customerId?.toString() || null;
        if (!customerId && afterBleaching.bleachingProcessId) {
          const bleachingProcess = await BleachingProcess.findById(afterBleaching.bleachingProcessId).lean();
          customerId = bleachingProcess?.customerId?.toString() || null;
        }

        return {
          lotNumber,
          partyName: afterBleaching.partyName || null,
          customerId: customerId,
          quality: null, // After Bleaching doesn't have quality
          availableMeter: afterBleaching.availableMeter,
          sourceModule: 'after_bleaching'
        };
      }

      // Search in Batch Center
      const batchCenter = await BatchCenter.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (batchCenter) {
        return {
          lotNumber,
          partyName: batchCenter.partyName || null,
          customerId: batchCenter.customerId?.toString() || null,
          quality: batchCenter.quality || null,
          availableMeter: batchCenter.pendingMeter || batchCenter.totalMeter - batchCenter.receivedMeter,
          sourceModule: 'batch_center'
        };
      }

      // Search in Bleaching Process
      const bleachingProcess = await BleachingProcess.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (bleachingProcess) {
        return {
          lotNumber,
          partyName: bleachingProcess.partyName || null,
          customerId: bleachingProcess.customerId?.toString() || null,
          quality: null,
          availableMeter: null,
          sourceModule: 'bleaching'
        };
      }

      // Search in Printing
      const printing = await Printing.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (printing) {
        return {
          lotNumber,
          partyName: printing.partyName || null,
          customerId: printing.customerId?.toString() || null,
          quality: printing.quality || null,
          availableMeter: printing.pendingMeter || printing.printedMeter,
          sourceModule: 'printing'
        };
      }

      // Search in Hazer/Silicate/Curing
      const hazer = await HazerSilicateCuring.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (hazer) {
        return {
          lotNumber,
          partyName: hazer.partyName || null,
          customerId: hazer.customerId?.toString() || null,
          quality: hazer.quality || null,
          availableMeter: hazer.pendingMeter || hazer.processedMeter,
          sourceModule: 'hazer_silicate_curing'
        };
      }

      // Search in Washing
      const washing = await Washing.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (washing) {
        return {
          lotNumber,
          partyName: washing.partyName || null,
          customerId: washing.customerId?.toString() || null,
          quality: null,
          availableMeter: washing.pendingMeter || washing.washedMeter,
          sourceModule: 'washing'
        };
      }

      // Search in Finishing
      const finishing = await Finishing.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (finishing) {
        return {
          lotNumber,
          partyName: finishing.partyName || null,
          customerId: finishing.customerId?.toString() || null,
          quality: finishing.quality || null,
          availableMeter: finishing.pendingMeter || finishing.finishedMeter,
          sourceModule: 'finishing'
        };
      }

      // Search in Felt
      const felt = await Felt.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (felt) {
        return {
          lotNumber,
          partyName: felt.partyName || null,
          customerId: felt.customerId?.toString() || null,
          quality: null,
          availableMeter: felt.feltMeter || felt.inputMeter,
          sourceModule: 'felt'
        };
      }

      // Search in Folding Checking
      const folding = await FoldingChecking.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (folding) {
        return {
          lotNumber,
          partyName: folding.partyName || null,
          customerId: folding.customerId?.toString() || null,
          quality: null,
          availableMeter: folding.checkedMeter || folding.inputMeter,
          sourceModule: 'folding_checking'
        };
      }

      // Search in Packing
      const packing = await Packing.findOne({
        companyId: new Types.ObjectId(companyId),
        lotNumber
      }).lean();

      if (packing) {
        return {
          lotNumber,
          partyName: packing.partyName || null,
          customerId: packing.customerId?.toString() || null,
          quality: packing.quality || null,
          availableMeter: packing.totalPackedMeter || packing.inputMeter,
          sourceModule: 'packing'
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Error fetching lot details', { error, companyId, lotNumber });
      throw new AppError('Failed to fetch lot details', 500, error);
    }
  }

  /**
   * Get available input meter from previous module in workflow
   */
  async getAvailableInputMeter(
    companyId: string,
    lotNumber: string,
    targetModule: 'printing' | 'hazer' | 'washing' | 'finishing' | 'felt' | 'folding' | 'packing'
  ): Promise<number | null> {
    try {
      switch (targetModule) {
        case 'printing':
          // Get from After Bleaching or Batch Center
          const afterBleaching = await AfterBleaching.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber
          }).lean();
          if (afterBleaching && afterBleaching.availableMeter > 0) {
            return afterBleaching.availableMeter;
          }
          const batchCenter = await BatchCenter.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber
          }).lean();
          if (batchCenter) {
            return batchCenter.pendingMeter || (batchCenter.totalMeter - batchCenter.receivedMeter);
          }
          break;

        case 'hazer':
          // Get from Printing (printed meter - output from printing)
          const printing = await Printing.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: { $in: ['in_progress', 'completed'] }
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (printing && printing.printedMeter > 0) {
            return printing.printedMeter;
          }
          break;

        case 'washing':
          // Get from Hazer/Silicate (processed meter - output from hazer)
          const hazer = await HazerSilicateCuring.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: { $in: ['in_progress', 'completed'] }
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (hazer && hazer.processedMeter > 0) {
            return hazer.processedMeter;
          }
          break;

        case 'finishing':
          // Get from Washing (washed meter - output from washing)
          const washing = await Washing.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: { $in: ['in_progress', 'completed'] }
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (washing && washing.washedMeter > 0) {
            return washing.washedMeter;
          }
          break;

        case 'felt':
          // Get from Finishing (finished meter - output from finishing)
          const finishing = await Finishing.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: { $in: ['in_progress', 'completed'] }
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (finishing && finishing.finishedMeter > 0) {
            return finishing.finishedMeter;
          }
          break;

        case 'folding':
          // Get from Felt (felt meter - output from felt, only if completed)
          const felt = await Felt.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: 'completed'
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (felt && felt.feltMeter > 0) {
            return felt.feltMeter;
          }
          break;

        case 'packing':
          // Get from Folding Checking (checked meter - output from folding)
          const folding = await FoldingChecking.findOne({
            companyId: new Types.ObjectId(companyId),
            lotNumber,
            status: { $in: ['in_progress', 'completed'] }
          })
          .sort({ updatedAt: -1 })
          .lean();
          if (folding && folding.checkedMeter > 0) {
            return folding.checkedMeter;
          }
          break;
      }

      return null;
    } catch (error: any) {
      logger.error('Error fetching available input meter', { error, companyId, lotNumber, targetModule });
      return null;
    }
  }
}

