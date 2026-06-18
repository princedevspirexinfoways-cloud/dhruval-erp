import { Request, Response } from 'express';
import PreProcessing from '../models/PreProcessing';
import { logger } from '../utils/logger';
import { ProductionLogService } from '../services/ProductionLogService';

export class PreProcessingController {
  // Get all pre-processing batches
  static async getAllPreProcessingBatches(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, processType } = req.query;
      
      const filter: any = {};
      if (status) filter.status = status;
      if (processType) filter.processType = processType;

      const batches = await PreProcessing.find(filter)
        .populate('productionOrderId', 'orderNumber customerName')
        .populate('greyFabricInwardId', 'grnNumber')
        .populate('workerAssignment.supervisorId', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await PreProcessing.countDocuments(filter);

      logger.info('Pre-processing batches retrieved successfully', {
        userId: req.user?.id,
        count: batches.length,
        filter
      });

      res.json({
        success: true,
        data: batches,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      });
    } catch (error) {
      logger.error('Error retrieving pre-processing batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pre-processing batches'
      });
    }
  }

  // Get single pre-processing batch
  static async getPreProcessingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const batch = await PreProcessing.findById(id)
        .populate('productionOrderId', 'orderNumber customerName')
        .populate('greyFabricInwardId', 'grnNumber')
        .populate('workerAssignment.supervisorId', 'name')
        .populate('workerAssignment.workers.workerId', 'name');

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Pre-processing batch not found'
        });
      }

      logger.info('Pre-processing batch retrieved successfully', {
        userId: req.user?.id,
        batchId: id
      });

      res.json({
        success: true,
        data: batch
      });
    } catch (error) {
      logger.error('Error retrieving pre-processing batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pre-processing batch'
      });
    }
  }

  // Create new pre-processing batch
  static async createPreProcessingBatch(req: Request, res: Response) {
    try {
      // Clean up empty string ObjectIds and generate batch number
      const cleanedData = PreProcessingController.cleanBatchData(req.body);
      
      const batchData = {
        ...cleanedData,
        batchNumber: await PreProcessingController.generateBatchNumber(),
        createdBy: req.user?.id,
        createdByName: req.user?.name
      };

      const batch = new PreProcessing(batchData);
      await batch.save();

      logger.info('Pre-processing batch created successfully', {
        userId: req.user?.id,
        batchId: batch._id,
        batchNumber: batch.batchNumber
      });

      res.status(201).json({
        success: true,
        data: batch,
        message: 'Pre-processing batch created successfully'
      });
    } catch (error) {
      logger.error('Error creating pre-processing batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pre-processing batch'
      });
    }
  }

  // Update pre-processing batch status
  static async updatePreProcessingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes, changeReason } = req.body;

      const validStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'quality_hold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status provided'
        });
      }

      const batch = await PreProcessing.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Pre-processing batch not found'
        });
      }

      const oldStatus = batch.status;
      const updateData: any = {
        status,
        updatedBy: req.user?.id,
        updatedByName: req.user?.name,
        updatedAt: new Date()
      };

      // Set timing based on status change
      if (status === 'in_progress' && oldStatus === 'pending') {
        updateData['timing.actualStartTime'] = new Date();
      } else if (status === 'completed' && oldStatus === 'in_progress') {
        updateData['timing.actualEndTime'] = new Date();
        updateData.progress = 100;
      } else if (status === 'on_hold') {
        updateData['timing.downtime'] = (batch.timing.downtime || 0) + 1;
      }

      // Create detailed status change log
      const statusChangeLog = {
        fromStatus: oldStatus,
        toStatus: status,
        changedBy: req.user?.id,
        changedByName: req.user?.name || 'Unknown User',
        changedByEmail: req.user?.email || 'unknown@example.com',
        changeDate: new Date(),
        changeReason: changeReason || 'Status updated via toggle',
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        sessionId: req.sessionID || 'Unknown'
      };

      // Add to notes if provided
      if (notes) {
        updateData.notes = batch.notes ? `${batch.notes}\n[${new Date().toISOString()}] ${notes}` : `[${new Date().toISOString()}] ${notes}`;
      }

      const updatedBatch = await PreProcessing.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          $push: { statusChangeLog: statusChangeLog }
        },
        { new: true }
      );

      // Create production log entry
      await ProductionLogService.createStatusChangeLog({
        productionStage: 'pre_processing',
        entityType: 'PreProcessing',
        entityId: id,
        entityName: batch.batchNumber,
        userId: req.user?.id || 'unknown',
        userName: req.user?.name || 'Unknown User',
        userEmail: req.user?.email || 'unknown@example.com',
        userRole: req.user?.role,
        fromStatus: oldStatus,
        toStatus: status,
        changeReason: changeReason || 'Status updated via toggle',
        notes,
        productionData: {
          batchNumber: batch.batchNumber,
          productionOrderNumber: batch.productionOrderNumber,
          fabricType: batch.inputMaterials?.[0]?.fabricType || 'Mixed',
          fabricColor: batch.inputMaterials?.[0]?.color || 'Mixed',
          quantity: batch.inputMaterials?.reduce((total, material) => total + material.quantity, 0) || 0,
          unit: batch.inputMaterials?.[0]?.unit || 'meters',
          machineName: batch.machineAssignment?.machineName,
          temperature: batch.processParameters?.temperature?.actual,
          efficiency: batch.machineAssignment?.efficiency
        },
        requestInfo: {
          ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          userAgent: req.get('User-Agent') || 'Unknown',
          sessionId: req.sessionID,
          method: req.method,
          url: req.url
        },
        metadata: {
          controller: 'PreProcessingController',
          action: 'updatePreProcessingStatus'
        }
      });

      // Detailed logging for audit trail
      logger.info('Pre-processing batch status updated successfully', {
        userId: req.user?.id,
        userName: req.user?.name,
        userEmail: req.user?.email,
        batchId: id,
        batchNumber: batch.batchNumber,
        oldStatus,
        newStatus: status,
        changeReason: changeReason || 'Status updated via toggle',
        notes,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: updatedBatch,
        message: `Status updated from ${oldStatus} to ${status} successfully`,
        logEntry: statusChangeLog
      });
    } catch (error) {
      logger.error('Error updating pre-processing batch status:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        batchId: req.params.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update pre-processing batch status'
      });
    }
  }

  // Update pre-processing batch
  static async updatePreProcessingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id,
        updatedByName: req.user?.name,
        updatedAt: new Date()
      };

      const batch = await PreProcessing.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Pre-processing batch not found'
        });
      }

      logger.info('Pre-processing batch updated successfully', {
        userId: req.user?.id,
        batchId: id,
        batchNumber: batch.batchNumber
      });

      res.json({
        success: true,
        data: batch,
        message: 'Pre-processing batch updated successfully'
      });
    } catch (error) {
      logger.error('Error updating pre-processing batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pre-processing batch'
      });
    }
  }

  // Delete pre-processing batch
  static async deletePreProcessingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const batch = await PreProcessing.findByIdAndDelete(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Pre-processing batch not found'
        });
      }

      logger.info('Pre-processing batch deleted successfully', {
        userId: req.user?.id,
        batchId: id,
        batchNumber: batch.batchNumber
      });

      res.json({
        success: true,
        message: 'Pre-processing batch deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting pre-processing batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete pre-processing batch'
      });
    }
  }

  // Get pre-processing analytics
  static async getPreProcessingAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const filter: any = {};
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const analytics = await PreProcessing.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgEfficiency: { $avg: '$machineAssignment.efficiency' },
            avgProgress: { $avg: '$progress' }
          }
        }
      ]);

      const totalBatches = await PreProcessing.countDocuments(filter);
      const completedBatches = await PreProcessing.countDocuments({ ...filter, status: 'completed' });
      const inProgressBatches = await PreProcessing.countDocuments({ ...filter, status: 'in_progress' });

      logger.info('Pre-processing analytics retrieved successfully', {
        userId: req.user?.id,
        totalBatches,
        completedBatches,
        inProgressBatches
      });

      res.json({
        success: true,
        data: {
          totalBatches,
          completedBatches,
          inProgressBatches,
          completionRate: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
          statusBreakdown: analytics
        }
      });
    } catch (error) {
      logger.error('Error retrieving pre-processing analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pre-processing analytics'
      });
    }
  }

  // Helper method to clean batch data
  static cleanBatchData(data: any): any {
    const cleaned = { ...data };

    // Helper function to check if a value is a valid ObjectId
    const isValidObjectId = (value: any): boolean => {
      if (!value || value === '') return false;
      if (typeof value !== 'string') return false;
      return /^[0-9a-fA-F]{24}$/.test(value);
    };

    // Helper function to clean ObjectId field
    const cleanObjectIdField = (obj: any, fieldPath: string) => {
      const fields = fieldPath.split('.');
      let current = obj;
      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) {
          current[fields[i]] = {};
        }
        current = current[fields[i]];
      }
      const field = fields[fields.length - 1];
      if (current[field] !== undefined && !isValidObjectId(current[field])) {
        current[field] = null;
      }
    };

    // Clean top-level ObjectIds
    if (!isValidObjectId(cleaned.productionOrderId)) {
      delete cleaned.productionOrderId;
    }
    if (!isValidObjectId(cleaned.greyFabricInwardId)) {
      delete cleaned.greyFabricInwardId;
    }

    // Clean nested ObjectIds using the helper function
    cleanObjectIdField(cleaned, 'machineAssignment.machineId');
    cleanObjectIdField(cleaned, 'workerAssignment.supervisorId');
    cleanObjectIdField(cleaned, 'qualityControl.preProcessCheck.checkedBy');
    cleanObjectIdField(cleaned, 'qualityControl.inProcessCheck.checkedBy');
    cleanObjectIdField(cleaned, 'qualityControl.postProcessCheck.checkedBy');
    cleanObjectIdField(cleaned, 'outputMaterial.location.warehouseId');

    // Clean chemical recipe ObjectIds
    if (cleaned.chemicalRecipe?.chemicals) {
      cleaned.chemicalRecipe.chemicals = cleaned.chemicalRecipe.chemicals.map((chemical: any) => {
        if (chemical.chemicalId && !isValidObjectId(chemical.chemicalId)) {
          chemical.chemicalId = null;
        }
        return chemical;
      });
    }

    // Clean worker assignment ObjectIds
    if (cleaned.workerAssignment?.workers) {
      cleaned.workerAssignment.workers = cleaned.workerAssignment.workers.map((worker: any) => {
        if (worker.workerId && !isValidObjectId(worker.workerId)) {
          worker.workerId = null;
        }
        return worker;
      });
    }

    // Clean status change log ObjectIds - remove invalid entries entirely
    if (cleaned.statusChangeLog) {
      cleaned.statusChangeLog = cleaned.statusChangeLog.filter((log: any) => {
        // Only keep logs with valid changedBy ObjectId
        return log.changedBy && isValidObjectId(log.changedBy);
      });
    }

    // Clean approvedBy ObjectId - remove if invalid
    if (cleaned.approvedBy && !isValidObjectId(cleaned.approvedBy)) {
      delete cleaned.approvedBy;
    }

    // Clean chemical recipe units - convert to valid enum values
    if (cleaned.chemicalRecipe?.chemicals) {
      cleaned.chemicalRecipe.chemicals = cleaned.chemicalRecipe.chemicals.map((chemical: any) => {
        const validUnits = ['kg', 'liters', 'grams', 'ml'];
        let unit = chemical.unit;
        
        // Convert common units to valid enum values
        if (unit === 'meters' || unit === 'pieces' || unit === 'boxes' || unit === 'units') {
          unit = 'kg'; // Default to kg for non-liquid items
        } else if (unit === 'liters' || unit === 'l') {
          unit = 'liters';
        } else if (unit === 'grams' || unit === 'g') {
          unit = 'grams';
        } else if (unit === 'ml' || unit === 'milliliters') {
          unit = 'ml';
        } else if (!validUnits.includes(unit)) {
          unit = 'kg'; // Default fallback
        }
        
        return {
          ...chemical,
          unit: unit
        };
      });
    }

    // Set default values for required fields that might be missing
    cleaned.status = cleaned.status || 'pending';
    cleaned.progress = cleaned.progress || 0;
    
    // Initialize arrays if they don't exist
    cleaned.images = cleaned.images || [];
    cleaned.documents = cleaned.documents || [];
    cleaned.tags = cleaned.tags || [];
    cleaned.statusChangeLog = cleaned.statusChangeLog || [];

    // Ensure inputMaterials is properly initialized
    if (!cleaned.inputMaterials || !Array.isArray(cleaned.inputMaterials)) {
      cleaned.inputMaterials = [];
    }

    // Ensure chemicalRecipe is properly initialized
    if (!cleaned.chemicalRecipe) {
      cleaned.chemicalRecipe = {
        recipeName: '',
        recipeVersion: '1.0',
        chemicals: [],
        totalRecipeCost: 0
      };
    }

    // Ensure processParameters is properly initialized
    if (!cleaned.processParameters) {
      cleaned.processParameters = {
        temperature: { min: 0, max: 0, actual: 0, unit: 'celsius' },
        pressure: { min: 0, max: 0, actual: 0, unit: 'bar' },
        ph: { min: 0, max: 14, actual: 7 },
        time: { planned: 0, actual: 0, unit: 'minutes' },
        speed: { planned: 0, actual: 0, unit: 'm/min' }
      };
    }

    // Initialize waste management if not provided
    if (!cleaned.wasteManagement) {
      cleaned.wasteManagement = {
        wasteGenerated: [],
        totalWasteCost: 0,
        environmentalCompliance: true
      };
    }

    // Initialize costs if not provided
    if (!cleaned.costs) {
      cleaned.costs = {
        chemicalCost: 0,
        laborCost: 0,
        machineCost: 0,
        utilityCost: 0,
        wasteDisposalCost: 0,
        totalCost: 0,
        costPerUnit: 0
      };
    }

    return cleaned;
  }

  // Helper method to generate batch number
  static async generateBatchNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Count existing batches for today
    const startOfDay = new Date(year, today.getMonth(), today.getDate());
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1);
    
    const count = await PreProcessing.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    
    const sequence = String(count + 1).padStart(3, '0');
    return `PP-${year}${month}${day}-${sequence}`;
  }
}
