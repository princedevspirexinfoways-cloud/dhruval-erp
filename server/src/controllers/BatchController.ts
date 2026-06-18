import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { InventoryBatch } from '../models/InventoryBatch';
import InventoryItem from '../models/InventoryItem';

export class BatchController {

  private sendError(res: Response, error: any, message: string = 'Internal server error', statusCode: number = 500) {
    console.error(error);
    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }

  /**
   * Get all batches with filters
   */
  async getAllBatches(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const {
        itemId,
        processStage,
        qualityGrade,
        status,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const matchStage: any = { companyId, isActive: true };

      if (itemId) matchStage.itemId = itemId;
      if (processStage) matchStage.processStage = processStage;
      if (qualityGrade) matchStage.qualityGrade = qualityGrade;
      if (status) matchStage.status = status;
      if (search) {
        matchStage.$or = [
          { batchNumber: { $regex: search, $options: 'i' } },
          { lotNumber: { $regex: search, $options: 'i' } },
          { 'specifications.color': { $regex: search, $options: 'i' } },
          { 'specifications.design': { $regex: search, $options: 'i' } }
        ];
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'inventory_items',
            localField: 'itemId',
            foreignField: '_id',
            as: 'item'
          }
        },
        { $unwind: '$item' },
        {
          $lookup: {
            from: 'suppliers',
            localField: 'supplierId',
            foreignField: '_id',
            as: 'supplier'
          }
        },
        {
          $addFields: {
            supplier: { $arrayElemAt: ['$supplier', 0] },
            ageInDays: {
              $divide: [
                { $subtract: [new Date(), '$receivedDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $sort: sortOrder === 'desc' ? { [sortBy as string]: -1 } : { [sortBy as string]: 1 }
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

      const result = await InventoryBatch.aggregate(pipeline as any);
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
      this.sendError(res, error, 'Failed to get batches');
    }
  }

  /**
   * Get batch by ID
   */
  async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      const batch = await InventoryBatch.findOne({ _id: id, companyId })
        .populate('itemId', 'itemCode itemName productType category')
        .populate('supplierId', 'supplierName supplierCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName email');

      if (!batch) {
        this.sendError(res, new Error('Batch not found'), 'Batch not found', 404);
        return;
      }

      res.status(200).json({ data: batch });
    } catch (error) {
      this.sendError(res, error, 'Failed to get batch');
    }
  }

  /**
   * Create new batch
   */
  async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const userId = (req.user?.userId || req.user?._id)?.toString();

      if (!companyId || !userId) {
        this.sendError(res, new Error('User context not found'), 'Authentication required', 401);
        return;
      }

      const batchData = {
        ...req.body,
        companyId,
        createdBy: userId,
        totalCost: req.body.initialQuantity * req.body.costPerUnit
      };

      const batch = new InventoryBatch(batchData);
      await batch.save();

      // Update item stock
      await this.updateItemStock(batch.itemId.toString(), batch.initialQuantity, 'add');

      res.status(201).json({
        data: batch,
        message: 'Batch created successfully'
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to create batch');
    }
  }

  /**
   * Update batch
   */
  async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = (req.user?.userId || req.user?._id)?.toString();

      const batch = await InventoryBatch.findOne({ _id: id, companyId });
      if (!batch) {
        this.sendError(res, new Error('Batch not found'), 'Batch not found', 404);
        return;
      }

      const oldQuantity = batch.currentQuantity;
      const newQuantity = req.body.currentQuantity || oldQuantity;

      Object.assign(batch, req.body, {
        lastModifiedBy: userId,
        totalCost: newQuantity * (req.body.costPerUnit || batch.costPerUnit)
      });

      await batch.save();

      // Update item stock if quantity changed
      if (oldQuantity !== newQuantity) {
        const difference = newQuantity - oldQuantity;
        await this.updateItemStock(batch.itemId.toString(), Math.abs(difference), difference > 0 ? 'add' : 'subtract');
      }

      res.status(200).json({
        data: batch,
        message: 'Batch updated successfully'
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to update batch');
    }
  }

  /**
   * Get batch summary by process stage
   */
  async getBatchSummaryByStage(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        this.sendError(res, new Error('Company ID not found'), 'Company ID is required', 400);
        return;
      }

      const summary = await InventoryBatch.aggregate([
        { $match: { companyId, isActive: true } },
        {
          $group: {
            _id: '$processStage',
            totalBatches: { $sum: 1 },
            totalQuantity: { $sum: '$currentQuantity' },
            totalValue: { $sum: '$totalCost' },
            avgQualityScore: { $avg: '$qualityScore' },
            qualityDistribution: {
              $push: '$qualityGrade'
            }
          }
        },
        {
          $project: {
            processStage: '$_id',
            totalBatches: 1,
            totalQuantity: 1,
            totalValue: 1,
            avgQualityScore: { $round: ['$avgQualityScore', 2] },
            qualityDistribution: 1,
            _id: 0
          }
        },
        { $sort: { processStage: 1 } }
      ]);

      res.status(200).json({
        data: summary,
        total: summary.length
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get batch summary');
    }
  }

  /**
   * Update process stage
   */
  async updateProcessStage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stage, operator, machineId, notes, qualityCheck } = req.body;
      const companyId = req.user?.companyId;
      const userId = (req.user?.userId || req.user?._id)?.toString();

      const batch = await InventoryBatch.findOne({ _id: id, companyId });
      if (!batch) {
        this.sendError(res, new Error('Batch not found'), 'Batch not found', 404);
        return;
      }

      // End current process if exists
      if (batch.processHistory.length > 0) {
        const currentProcess = batch.processHistory[batch.processHistory.length - 1];
        if (!currentProcess.endDate) {
          currentProcess.endDate = new Date();
        }
      }

      // Add new process stage
      batch.processHistory.push({
        stage,
        startDate: new Date(),
        operator,
        machineId,
        notes,
        qualityCheck
      });

      batch.processStage = stage;
      batch.lastModifiedBy = userId as any;

      // Update quality if provided
      if (qualityCheck) {
        batch.qualityGrade = qualityCheck.grade;
        batch.qualityScore = qualityCheck.score;
        batch.qualityCheckDate = new Date();
        batch.qualityCheckedBy = qualityCheck.checkedBy;
      }

      await batch.save();

      res.status(200).json({
        data: batch,
        message: 'Process stage updated successfully'
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to update process stage');
    }
  }

  /**
   * Helper method to update item stock
   */
  private async updateItemStock(itemId: string, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    const item = await InventoryItem.findById(itemId);
    if (item) {
      if (operation === 'add') {
        item.stock.currentStock += quantity;
        item.stock.availableStock += quantity;
      } else {
        item.stock.currentStock = Math.max(0, item.stock.currentStock - quantity);
        item.stock.availableStock = Math.max(0, item.stock.availableStock - quantity);
      }
      
      item.stock.totalValue = item.stock.currentStock * item.stock.averageCost;
      await item.save();
    }
  }
}
