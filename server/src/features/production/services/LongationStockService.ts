import { BaseService } from '../../../services/BaseService';
import LongationStock, { ILongationStock } from '../models/LongationStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class LongationStockService extends BaseService<any> {
  constructor() {
    super(LongationStock);
  }

  /**
   * Create longation stock entry
   */
  async createLongationStock(data: Partial<ILongationStock>, createdBy?: string): Promise<any> {
    try {
      const stockData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const stock = await this.create(stockData, createdBy);
      logger.info('Longation stock created', { stockId: stock._id });
      return stock;
    } catch (error: any) {
      logger.error('Error creating longation stock', { error, data });
      throw new AppError('Failed to create longation stock', 500, error);
    }
  }

  /**
   * Get total longation stock for company
   */
  async getTotalLongationStock(companyId: string): Promise<number> {
    try {
      const stocks = await this.findMany({ companyId, status: 'available' });
      return stocks.reduce((sum, stock) => sum + stock.meter, 0);
    } catch (error: any) {
      logger.error('Error calculating total longation stock', { error, companyId });
      throw new AppError('Failed to calculate total longation stock', 500, error);
    }
  }

  /**
   * Get all longation stocks
   */
  async getAllStocks(companyId: string, options?: { sourceModule?: string; status?: string }): Promise<ILongationStock[]> {
    try {
      const filter: any = { companyId };
      if (options?.sourceModule) {
        filter.sourceModule = options.sourceModule;
      }
      if (options?.status) {
        filter.status = options.status;
      }

      return await this.findMany(filter, { sort: { createdAt: -1 } });
    } catch (error: any) {
      logger.error('Error fetching longation stocks', { error, companyId });
      throw new AppError('Failed to fetch longation stocks', 500, error);
    }
  }

  /**
   * Get longation stock by lot number
   */
  async getByLotNumber(companyId: string, lotNumber: string): Promise<ILongationStock[]> {
    try {
      return await this.findMany(
        { companyId, lotNumber },
        { sort: { createdAt: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching longation stock by lot', { error, companyId, lotNumber });
      throw new AppError('Failed to fetch longation stock', 500, error);
    }
  }
}

