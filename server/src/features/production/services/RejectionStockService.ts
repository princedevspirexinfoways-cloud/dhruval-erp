import { BaseService } from '../../../services/BaseService';
import RejectionStock, { IRejectionStock } from '../models/RejectionStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class RejectionStockService extends BaseService<any> {
  constructor() {
    super(RejectionStock);
  }

  /**
   * Create rejection stock entry
   */
  async createRejectionStock(data: Partial<IRejectionStock>, createdBy?: string): Promise<any> {
    try {
      const stockData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      const stock = await this.create(stockData, createdBy);
      logger.info('Rejection stock created', { stockId: stock._id });
      return stock;
    } catch (error: any) {
      logger.error('Error creating rejection stock', { error, data });
      throw new AppError('Failed to create rejection stock', 500, error);
    }
  }

  /**
   * Get total rejection stock for company
   */
  async getTotalRejectionStock(companyId: string): Promise<number> {
    try {
      const stocks = await this.findMany({ companyId, status: 'pending' });
      return stocks.reduce((sum, stock) => sum + stock.meter, 0);
    } catch (error: any) {
      logger.error('Error calculating total rejection stock', { error, companyId });
      throw new AppError('Failed to calculate total rejection stock', 500, error);
    }
  }

  /**
   * Get all rejection stocks
   */
  async getAllStocks(companyId: string, options?: { sourceModule?: string; status?: string }): Promise<IRejectionStock[]> {
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
      logger.error('Error fetching rejection stocks', { error, companyId });
      throw new AppError('Failed to fetch rejection stocks', 500, error);
    }
  }

  /**
   * Get rejection stock by lot number
   */
  async getByLotNumber(companyId: string, lotNumber: string): Promise<IRejectionStock[]> {
    try {
      return await this.findMany(
        { companyId, lotNumber },
        { sort: { createdAt: -1 } }
      );
    } catch (error: any) {
      logger.error('Error fetching rejection stock by lot', { error, companyId, lotNumber });
      throw new AppError('Failed to fetch rejection stock', 500, error);
    }
  }

  /**
   * Update rejection stock status (dispose or rework)
   */
  async updateStatus(
    stockId: string,
    status: 'disposed' | 'reworked',
    updatedBy?: string
  ): Promise<IRejectionStock> {
    try {
      const stock = await this.findById(stockId);
      if (!stock) {
        throw new AppError('Rejection stock not found', 404);
      }

      const updatedStock = await this.update(stockId, {
        status,
        updatedBy: updatedBy || stock.createdBy
      }, updatedBy);

      if (!updatedStock) {
        throw new AppError('Failed to update rejection stock', 500);
      }

      logger.info('Rejection stock status updated', { stockId, status });
      return updatedStock;
    } catch (error: any) {
      logger.error('Error updating rejection stock status', { error, stockId });
      throw new AppError('Failed to update rejection stock status', 500, error);
    }
  }
}

