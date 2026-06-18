import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { LotService } from '../services/LotService';

export class LotController extends BaseController<any> {
  private lotService: LotService;

  constructor() {
    super(null as any, 'Lot');
    this.lotService = new LotService();
  }

  /**
   * Get lot details (party name, quality, customerId) from any production module
   * @route GET /api/v1/production/lot/:lotNumber/details
   */
  async getLotDetails(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!lotNumber) {
        this.sendError(res, new Error('Lot number is required'), 'Lot number is required', 400);
        return;
      }

      const lotDetails = await this.lotService.getLotDetails(companyId, lotNumber);
      
      if (!lotDetails) {
        this.sendSuccess(res, { lotDetails: null }, 'No lot details found');
        return;
      }

      this.sendSuccess(res, { lotDetails }, 'Lot details retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get lot details');
    }
  }

  /**
   * Get available input meter from previous module
   * @route GET /api/v1/production/lot/:lotNumber/input-meter/:targetModule
   */
  async getAvailableInputMeter(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { lotNumber, targetModule } = req.params;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!lotNumber || !targetModule) {
        this.sendError(res, new Error('Lot number and target module are required'), 'Lot number and target module are required', 400);
        return;
      }

      const validModules = ['printing', 'hazer', 'washing', 'finishing', 'felt', 'folding', 'packing'];
      if (!validModules.includes(targetModule)) {
        this.sendError(res, new Error('Invalid target module'), 'Invalid target module', 400);
        return;
      }

      const availableMeter = await this.lotService.getAvailableInputMeter(
        companyId,
        lotNumber,
        targetModule as any
      );

      this.sendSuccess(
        res,
        { availableMeter: availableMeter || 0 },
        'Available input meter retrieved successfully'
      );
    } catch (error) {
      this.sendError(res, error, 'Failed to get available input meter');
    }
  }
}

