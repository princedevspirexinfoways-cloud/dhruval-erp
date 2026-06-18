import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';
import { InventoryBatch } from '../models/InventoryBatch';

export class EnhancedInventoryController {

  private sendError(res: Response, error: any, message: string = 'Internal server error', statusCode: number = 500) {
    console.error(error);
    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }

  /**
   * Get inventory summary by category (Raw Material, Semi-Finished, Finished Goods)
   */
  async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const summary = await InventoryItem.aggregate([
        { $match: { companyId, 'status.isActive': true } },
        {
          $group: {
            _id: '$category.primary',
            totalItems: { $sum: 1 },
            totalValue: { $sum: '$stock.totalValue' },
            totalQuantity: { $sum: '$stock.currentStock' },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lte: ['$stock.currentStock', '$stock.reorderLevel'] },
                  1,
                  0
                ]
              }
            },
            outOfStockItems: {
              $sum: {
                $cond: [
                  { $eq: ['$stock.currentStock', 0] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            totalItems: 1,
            totalValue: 1,
            totalQuantity: 1,
            lowStockItems: 1,
            outOfStockItems: 1,
            _id: 0
          }
        }
      ]);

      res.status(200).json({
        data: summary,
        total: summary.length
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get inventory summary');
    }
  }

  /**
   * Get product-wise summary (Saree, African, Garment, Digital)
   */
  async getProductSummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const summary = await InventoryItem.aggregate([
        { $match: { companyId, 'status.isActive': true, productType: { $exists: true } } },
        {
          $group: {
            _id: '$productType',
            totalItems: { $sum: 1 },
            totalValue: { $sum: '$stock.totalValue' },
            totalQuantity: { $sum: '$stock.currentStock' },
            avgGSM: { $avg: '$specifications.gsm' },
            uniqueColors: { $addToSet: '$specifications.color' },
            uniqueDesigns: { $addToSet: '$designInfo.designNumber' },
            qualityDistribution: {
              $push: '$qualityControl.qualityGrade'
            }
          }
        },
        {
          $project: {
            productType: '$_id',
            totalItems: 1,
            totalValue: 1,
            totalQuantity: 1,
            avgGSM: { $round: ['$avgGSM', 2] },
            uniqueColorsCount: { $size: { $filter: { input: '$uniqueColors', cond: { $ne: ['$$this', null] } } } },
            uniqueDesignsCount: { $size: { $filter: { input: '$uniqueDesigns', cond: { $ne: ['$$this', null] } } } },
            qualityDistribution: 1,
            _id: 0
          }
        }
      ]);

      res.status(200).json({
        data: summary,
        total: summary.length
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get product summary');
    }
  }

  /**
   * Get location-wise inventory
   */
  async getLocationWiseInventory(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const { warehouseId, zone, rack } = req.query;

      const matchStage: any = { companyId, 'status.isActive': true };
      
      const pipeline = [
        { $match: matchStage },
        { $unwind: '$locations' },
        {
          $match: {
            'locations.isActive': true,
            ...(warehouseId && { 'locations.warehouseId': warehouseId }),
            ...(zone && { 'locations.zone': zone }),
            ...(rack && { 'locations.rack': rack })
          }
        },
        {
          $group: {
            _id: {
              warehouseId: '$locations.warehouseId',
              warehouseName: '$locations.warehouseName',
              zone: '$locations.zone',
              rack: '$locations.rack'
            },
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: '$locations.quantity' },
            items: {
              $push: {
                itemId: '$_id',
                itemCode: '$itemCode',
                itemName: '$itemName',
                productType: '$productType',
                quantity: '$locations.quantity',
                unit: '$stock.unit',
                bin: '$locations.bin',
                lastUpdated: '$locations.lastUpdated'
              }
            }
          }
        },
        {
          $project: {
            location: '$_id',
            totalItems: 1,
            totalQuantity: 1,
            items: 1,
            _id: 0
          }
        },
        { $sort: { 'location.warehouseName': 1, 'location.zone': 1, 'location.rack': 1 } }
      ];

      const result = await InventoryItem.aggregate(pipeline as any);

      res.status(200).json({
        data: result,
        total: result.length
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get location-wise inventory');
    }
  }

  /**
   * Get ageing stock analysis
   */
  async getAgeingAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const ageingAnalysis = await InventoryItem.aggregate([
        { $match: { companyId, 'status.isActive': true } },
        {
          $addFields: {
            ageInDays: {
              $divide: [
                { $subtract: [new Date(), '$ageing.lastMovementDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $addFields: {
            ageCategory: {
              $switch: {
                branches: [
                  { case: { $lte: ['$ageInDays', 30] }, then: 'fresh' },
                  { case: { $lte: ['$ageInDays', 90] }, then: 'good' },
                  { case: { $lte: ['$ageInDays', 180] }, then: 'aging' },
                  { case: { $lte: ['$ageInDays', 365] }, then: 'old' }
                ],
                default: 'obsolete'
              }
            }
          }
        },
        {
          $group: {
            _id: '$ageCategory',
            count: { $sum: 1 },
            totalValue: { $sum: '$stock.totalValue' },
            totalQuantity: { $sum: '$stock.currentStock' },
            avgAge: { $avg: '$ageInDays' },
            items: {
              $push: {
                itemId: '$_id',
                itemCode: '$itemCode',
                itemName: '$itemName',
                productType: '$productType',
                ageInDays: '$ageInDays',
                currentStock: '$stock.currentStock',
                totalValue: '$stock.totalValue'
              }
            }
          }
        },
        {
          $project: {
            ageCategory: '$_id',
            count: 1,
            totalValue: 1,
            totalQuantity: 1,
            avgAge: { $round: ['$avgAge', 1] },
            items: { $slice: ['$items', 10] }, // Limit to 10 items per category
            _id: 0
          }
        },
        { $sort: { ageCategory: 1 } }
      ]);

      res.status(200).json({
        data: ageingAnalysis,
        total: ageingAnalysis.length
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get ageing analysis');
    }
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const {
        search,
        category,
        productType,
        designNumber,
        gsm,
        color,
        batchNumber,
        qualityGrade,
        ageCategory,
        location,
        page = 1,
        limit = 20,
        sortBy = 'itemName',
        sortOrder = 'asc'
      } = req.query;

      const matchStage: any = { companyId, 'status.isActive': true };

      // Text search
      if (search) {
        matchStage.$text = { $search: search };
      }

      // Filters
      if (category) matchStage['category.primary'] = category;
      if (productType) matchStage.productType = productType;
      if (designNumber) matchStage['designInfo.designNumber'] = new RegExp(designNumber as string, 'i');
      if (gsm) matchStage['specifications.gsm'] = parseInt(gsm as string);
      if (color) matchStage['specifications.color'] = new RegExp(color as string, 'i');
      if (batchNumber) matchStage['specifications.batchNumber'] = new RegExp(batchNumber as string, 'i');
      if (qualityGrade) matchStage['qualityControl.qualityGrade'] = qualityGrade;
      if (ageCategory) matchStage['ageing.ageCategory'] = ageCategory;

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            score: search ? { $meta: 'textScore' } : 1
          }
        },
        {
          $sort: {
            ...(search && { score: { $meta: 'textScore' } }),
            [sortBy as string]: sortOrder === 'desc' ? -1 : 1
          }
        },
        {
          $facet: {
            data: [
              { $skip: (parseInt(page as string) - 1) * parseInt(limit as string) },
              { $limit: parseInt(limit as string) }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const result = await InventoryItem.aggregate(pipeline as any);
      const data = result[0].data;
      const total = result[0].totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / parseInt(limit as string));

      res.status(200).json({
        data,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages
        }
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to perform advanced search');
    }
  }
}
