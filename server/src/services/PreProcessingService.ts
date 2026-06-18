import PreProcessing, { IPreProcessing } from '../models/PreProcessing';
import { logger } from '../utils/logger';

export class PreProcessingService {
  // Generate unique batch number
  static async generateBatchNumber(): Promise<string> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const prefix = `PRE-${year}${month}${day}`;
      
      const lastBatch = await PreProcessing.findOne({
        batchNumber: { $regex: `^${prefix}` }
      }).sort({ batchNumber: -1 });

      let sequence = 1;
      if (lastBatch) {
        const lastSequence = parseInt(lastBatch.batchNumber.split('-')[1].slice(-3));
        sequence = lastSequence + 1;
      }

      return `${prefix}-${String(sequence).padStart(3, '0')}`;
    } catch (error) {
      logger.error('Error generating batch number:', error);
      throw error;
    }
  }

  // Create new pre-processing batch
  static async createPreProcessingBatch(batchData: Partial<IPreProcessing>): Promise<IPreProcessing> {
    try {
      const batchNumber = await this.generateBatchNumber();
      
      const batch = new PreProcessing({
        ...batchData,
        batchNumber
      });

      await batch.save();

      logger.info('Pre-processing batch created successfully', {
        batchId: batch._id,
        batchNumber: batch.batchNumber
      });

      return batch;
    } catch (error) {
      logger.error('Error creating pre-processing batch:', error);
      throw error;
    }
  }

  // Update batch status with detailed logging
  static async updateBatchStatus(
    batchId: string, 
    newStatus: string, 
    userId: string, 
    userName: string, 
    userEmail: string,
    notes?: string,
    changeReason?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<IPreProcessing> {
    try {
      const batch = await PreProcessing.findById(batchId);
      if (!batch) {
        throw new Error('Pre-processing batch not found');
      }

      const oldStatus = batch.status;
      const updateData: any = {
        status: newStatus,
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: new Date()
      };

      // Set timing based on status change
      if (newStatus === 'in_progress' && oldStatus === 'pending') {
        updateData['timing.actualStartTime'] = new Date();
      } else if (newStatus === 'completed' && oldStatus === 'in_progress') {
        updateData['timing.actualEndTime'] = new Date();
        updateData.progress = 100;
      } else if (newStatus === 'on_hold') {
        updateData['timing.downtime'] = (batch.timing.downtime || 0) + 1;
      }

      // Create detailed status change log
      const statusChangeLog = {
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedBy: userId,
        changedByName: userName,
        changedByEmail: userEmail,
        changeDate: new Date(),
        changeReason: changeReason || 'Status updated via service',
        notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown',
        sessionId: sessionId || 'Unknown'
      };

      // Add to notes if provided
      if (notes) {
        updateData.notes = batch.notes ? `${batch.notes}\n[${new Date().toISOString()}] ${notes}` : `[${new Date().toISOString()}] ${notes}`;
      }

      const updatedBatch = await PreProcessing.findByIdAndUpdate(
        batchId,
        { 
          ...updateData,
          $push: { statusChangeLog: statusChangeLog }
        },
        { new: true }
      );

      // Detailed logging for audit trail
      logger.info('Pre-processing batch status updated successfully via service', {
        batchId,
        batchNumber: batch.batchNumber,
        oldStatus,
        newStatus,
        userId,
        userName,
        userEmail,
        changeReason: changeReason || 'Status updated via service',
        notes,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown',
        sessionId: sessionId || 'Unknown',
        timestamp: new Date().toISOString()
      });

      return updatedBatch!;
    } catch (error) {
      logger.error('Error updating pre-processing batch status via service:', {
        error: error.message,
        stack: error.stack,
        batchId,
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Get batch by ID
  static async getBatchById(batchId: string): Promise<IPreProcessing | null> {
    try {
      return await PreProcessing.findById(batchId)
        .populate('productionOrderId', 'orderNumber customerName')
        .populate('greyFabricInwardId', 'grnNumber')
        .populate('machineAssignment.machineId', 'name type')
        .populate('workerAssignment.supervisorId', 'name');
    } catch (error) {
      logger.error('Error retrieving pre-processing batch:', error);
      throw error;
    }
  }

  // Get all batches with filters
  static async getAllBatches(filters: any = {}): Promise<IPreProcessing[]> {
    try {
      return await PreProcessing.find(filters)
        .populate('productionOrderId', 'orderNumber customerName')
        .populate('greyFabricInwardId', 'grnNumber')
        .populate('machineAssignment.machineId', 'name type')
        .populate('workerAssignment.supervisorId', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error retrieving pre-processing batches:', error);
      throw error;
    }
  }

  // Update batch progress
  static async updateBatchProgress(
    batchId: string, 
    progress: number, 
    userId: string, 
    userName: string
  ): Promise<IPreProcessing> {
    try {
      const batch = await PreProcessing.findByIdAndUpdate(
        batchId,
        {
          progress: Math.min(100, Math.max(0, progress)),
          updatedBy: userId,
          updatedByName: userName,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!batch) {
        throw new Error('Pre-processing batch not found');
      }

      logger.info('Pre-processing batch progress updated successfully', {
        batchId,
        batchNumber: batch.batchNumber,
        progress,
        userId,
        userName
      });

      return batch;
    } catch (error) {
      logger.error('Error updating pre-processing batch progress:', error);
      throw error;
    }
  }

  // Get analytics data
  static async getAnalytics(startDate?: Date, endDate?: Date) {
    try {
      const filter: any = {};
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const analytics = await PreProcessing.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgEfficiency: { $avg: '$machineAssignment.efficiency' },
            avgProgress: { $avg: '$progress' },
            avgCost: { $avg: '$costs.totalCost' }
          }
        }
      ]);

      const totalBatches = await PreProcessing.countDocuments(filter);
      const completedBatches = await PreProcessing.countDocuments({ ...filter, status: 'completed' });
      const inProgressBatches = await PreProcessing.countDocuments({ ...filter, status: 'in_progress' });

      return {
        totalBatches,
        completedBatches,
        inProgressBatches,
        completionRate: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
        statusBreakdown: analytics
      };
    } catch (error) {
      logger.error('Error retrieving pre-processing analytics:', error);
      throw error;
    }
  }
}
