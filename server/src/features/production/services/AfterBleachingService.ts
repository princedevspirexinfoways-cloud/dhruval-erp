import { BaseService } from '../../../services/BaseService';
import AfterBleaching, { IAfterBleaching } from '../models/AfterBleaching';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class AfterBleachingService extends BaseService<any> {
  constructor() {
    super(AfterBleaching);
  }

  /**
   * Create after bleaching stock entry (usually called from bleaching completion)
   */
  async createAfterBleaching(data: Partial<IAfterBleaching>, createdBy?: string): Promise<IAfterBleaching> {
    try {
      const stockData: any = {
        ...data,
        availableMeter: data.totalMeter || 0,
        createdBy: createdBy || data.createdBy
      };

      const stock = await this.create(stockData, createdBy);
      logger.info('After bleaching stock created', { stockId: stock._id });
      return stock;
    } catch (error: any) {
      logger.error('Error creating after bleaching stock', { error, data });
      throw new AppError('Failed to create after bleaching stock', 500, error);
    }
  }

  /**
   * Send meter to printing - handles longation automatically
   */
  async sendToPrinting(
    stockId: string,
    meterToSend: number,
    sentBy?: string
  ): Promise<IAfterBleaching> {
    try {
      const stock = await this.findById(stockId);
      if (!stock) {
        throw new AppError('After bleaching stock not found', 404);
      }

      if (meterToSend > stock.availableMeter) {
        throw new AppError('Insufficient meter available', 400);
      }

      // Calculate new values after sending to printing
      const newSentToPrinting = stock.sentToPrinting + meterToSend;
      const remainingMeter = stock.totalMeter - newSentToPrinting;
      const newLongationStock = remainingMeter > 0 ? remainingMeter : 0;
      const newAvailableMeter = stock.totalMeter - newSentToPrinting - newLongationStock;

      // Update stock with all calculated values
      const updatedStock = await this.update(stockId, {
        $set: {
          sentToPrinting: newSentToPrinting,
          longationStock: newLongationStock,
          availableMeter: newAvailableMeter,
          status: newSentToPrinting === 0 
            ? 'available' 
            : newSentToPrinting < stock.totalMeter 
              ? 'partially_allocated' 
              : 'fully_allocated'
        },
        $push: {
          printingEntries: {
            date: new Date(),
            meter: meterToSend,
            sentBy: sentBy || stock.createdBy
          }
        },
        updatedBy: sentBy || stock.createdBy
      }, sentBy);

      if (!updatedStock) {
        throw new AppError('Failed to update after bleaching stock', 500);
      }

      logger.info('Meter sent to printing', { stockId, meterToSend, remainingMeter });
      return updatedStock;
    } catch (error: any) {
      logger.error('Error sending to printing', { error, stockId, meterToSend });
      throw new AppError('Failed to send to printing', 500, error);
    }
  }

  /**
   * Get all after bleaching stocks
   */
  async getAllStocks(companyId: string, options?: { status?: string }): Promise<IAfterBleaching[]> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { createdAt: -1 } });
    } catch (error: any) {
      logger.error('Error fetching after bleaching stocks', { error, companyId });
      throw new AppError('Failed to fetch after bleaching stocks', 500, error);
    }
  }

  /**
   * Get longation stock (remaining meters)
   */
  async getLongationStock(companyId: string): Promise<number> {
    try {
      const stocks = await this.findMany({ companyId });
      return stocks.reduce((sum, stock) => sum + (stock.longationStock || 0), 0);
    } catch (error: any) {
      logger.error('Error calculating longation stock', { error, companyId });
      throw new AppError('Failed to calculate longation stock', 500, error);
    }
  }
}

