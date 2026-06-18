import { BaseService } from '../../../services/BaseService';
import Felt, { IFelt } from '../models/Felt';
import FoldingChecking from '../models/FoldingChecking';
import LongationStock from '../models/LongationStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class FeltService extends BaseService<any> {
  constructor() {
    super(Felt);
  }

  /**
   * Create a new felt entry
   */
  async createFelt(data: Partial<IFelt>, createdBy?: string): Promise<IFelt> {
    try {
      const feltData: any = {
        ...data,
        dateIn: data.dateIn || new Date(),
        createdBy: createdBy || data.createdBy
      };

      const felt = await this.create(feltData, createdBy);
      logger.info('Felt entry created', { feltId: felt._id });
      return felt;
    } catch (error: any) {
      logger.error('Error creating felt entry', { error, data });
      throw new AppError('Failed to create felt entry', 500, error);
    }
  }

  /**
   * Complete felt process - moves felt meter to Folding, loss to Longation
   */
  async completeFelt(
    feltId: string,
    feltMeter: number,
    lossMeter: number,
    dateOut: Date,
    updatedBy?: string
  ): Promise<{ felt: IFelt; foldingChecking?: any; longationStock?: any }> {
    try {
      const felt = await this.findById(feltId);
      if (!felt) {
        throw new AppError('Felt entry not found', 404);
      }

      // Validate
      if (feltMeter + lossMeter > felt.inputMeter) {
        throw new AppError('Felt + Loss meter cannot exceed input meter', 400);
      }

      // Update felt
      const updatedFelt = await this.update(feltId, {
        feltMeter,
        lossMeter,
        dateOut,
        status: 'completed',
        updatedBy: updatedBy || felt.createdBy
      }, updatedBy);

      if (!updatedFelt) {
        throw new AppError('Failed to update felt', 500);
      }

      // Create Longation Stock for loss meter
      let longationStock = null;
      if (lossMeter > 0) {
        longationStock = await LongationStock.create({
          companyId: felt.companyId,
          lotNumber: felt.lotNumber,
          partyName: felt.partyName,
          sourceModule: 'felt',
          sourceId: felt._id,
          meter: lossMeter,
          reason: 'Felt loss',
          createdBy: updatedBy || felt.createdBy
        });
      }

      // Create Folding + Checking entry if felt meter > 0
      let foldingChecking = null;
      if (feltMeter > 0) {
        foldingChecking = await FoldingChecking.create({
          companyId: felt.companyId,
          lotNumber: felt.lotNumber,
          partyName: felt.partyName,
          inputMeter: feltMeter,
          feltId: felt._id,
          createdBy: updatedBy || felt.createdBy
        });
      }

      logger.info('Felt completed', { feltId, feltMeter, lossMeter });
      return { felt: updatedFelt, foldingChecking, longationStock };
    } catch (error: any) {
      logger.error('Error completing felt', { error, feltId });
      throw new AppError('Failed to complete felt', 500, error);
    }
  }

  /**
   * Get all felt entries
   */
  async getAllFelts(companyId: string, options?: { status?: string }): Promise<IFelt[]> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { dateIn: -1 } });
    } catch (error: any) {
      logger.error('Error fetching felt entries', { error, companyId });
      throw new AppError('Failed to fetch felt entries', 500, error);
    }
  }

  /**
   * Get active felts (in_felt status)
   */
  async getActiveFelts(companyId: string): Promise<IFelt[]> {
    try {
      return await this.findMany(
        { companyId, status: 'in_felt' },
        { sort: { dateIn: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching active felts', { error, companyId });
      throw new AppError('Failed to fetch active felts', 500, error);
    }
  }
}

