import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductionBatch, IMaterialInput } from '../models/ProductionBatch';
import { StageStatus, BatchStatus } from '../models/ProductionBatch';
import { MaterialConsumptionService } from '../services/MaterialConsumptionService';
import { InventoryService } from '../services/InventoryService';
import { logger } from '../utils/logger';

export class ProductionBatchController {
  private static materialConsumptionService = new MaterialConsumptionService();
  private static inventoryService = new InventoryService();

  // Test endpoint to verify server is working
  static async testEndpoint(req: Request, res: Response) {
    console.log('=== TEST ENDPOINT CALLED ===');
    res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
  }

  // Create a new production batch with material reservation
  static async createBatch(req: Request, res: Response) {
    console.log('=== CREATE BATCH METHOD CALLED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    try {
      const {
        companyId,
        productionOrderId,
        customerOrderId,
        productSpecifications,
        plannedQuantity,
        unit,
        plannedStartDate,
        plannedEndDate,
        totalPlannedDuration,
        priority = 'medium',
        inputMaterials = [],
        reserveMaterials = true
      } = req.body;

      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Debug logging
      console.log('Create batch request body:', {
        inputMaterials,
        inputMaterialsLength: inputMaterials?.length,
        inputMaterialsType: typeof inputMaterials
      });

      // Log the mapped input materials
      const mappedInputMaterials = inputMaterials.map((input: any) => ({
        inventoryItemId: input.itemId,
        itemName: input.itemName || 'Unknown Item',
        category: input.category || 'raw_material',
        quantity: input.quantity,
        unit: input.unit,
        costPerUnit: input.unitCost,
        totalCost: input.totalCost,
        status: 'allocated'
      }));
      console.log('Mapped input materials:', mappedInputMaterials);

      // Validate that input materials are provided
      if (!inputMaterials || inputMaterials.length === 0) {
        console.log('Validation failed: No input materials provided');
        return res.status(400).json({ 
          message: 'At least one input material is required to create a batch',
          field: 'inputMaterials'
        });
      }

      // Validate each input material
      for (const material of inputMaterials) {
        if (!material.itemId || !material.quantity || material.quantity <= 0) {
          return res.status(400).json({ 
            message: 'Invalid input material data. Each material must have itemId and quantity > 0',
            field: 'inputMaterials'
          });
        }
      }

      // Create the batch first
      const batch = new ProductionBatch({
        companyId,
        productionOrderId,
        customerOrderId,
        productSpecifications,
        plannedQuantity,
        unit,
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: new Date(plannedEndDate),
        totalPlannedDuration,
        priority,
        createdBy: userId
      });

      // Map and set input materials
      const inputMaterialsMapped: IMaterialInput[] = inputMaterials.map((input: any) => ({
        inventoryItemId: new mongoose.Types.ObjectId(input.itemId),
        itemName: input.itemName || 'Unknown Item',
        category: (input.category || 'raw_material') as IMaterialInput['category'],
        quantity: input.quantity,
        unit: input.unit,
        costPerUnit: input.unitCost,
        totalCost: input.totalCost,
        status: 'allocated' as const,
        wastePercentage: 0,
        actualConsumption: 0,
        wasteQuantity: 0,
        returnedQuantity: 0
      }));

      console.log('Creating batch with data:', {
        inputMaterials: inputMaterialsMapped,
        inputMaterialsLength: inputMaterialsMapped.length
      });

      // Set input materials on the batch
      batch.inputMaterials = inputMaterialsMapped;

      // Calculate total cost from input materials
      const totalMaterialCost = inputMaterials.reduce((total: number, input: any) => 
        total + (input.totalCost || 0), 0
      );
      
      // Update batch with calculated costs
      (batch as any).totalCost = totalMaterialCost;
      (batch as any).costPerUnit = plannedQuantity > 0 ? totalMaterialCost / plannedQuantity : 0;

      try {
        console.log('About to save batch with inputMaterials:', batch.inputMaterials);
        console.log('Batch inputMaterials length:', batch.inputMaterials?.length);
        console.log('Batch inputMaterials type:', typeof batch.inputMaterials);
        console.log('Batch schema paths:', Object.keys(batch.schema.paths));
        console.log('Batch inputMaterials field exists:', 'inputMaterials' in batch.schema.paths);
        await batch.save();
        console.log('Batch saved successfully');
      } catch (saveError) {
        console.error('Error saving batch:', saveError);
        if (saveError instanceof Error && saveError.name === 'ValidationError') {
          console.error('Validation errors:', (saveError as any).errors);
          console.error('Validation error details:', JSON.stringify((saveError as any).errors, null, 2));
        }
        throw saveError;
      }

      // Log the saved batch to verify input materials are stored
      console.log('Batch saved with input materials:', {
        batchId: batch._id,
        inputMaterialsCount: batch.inputMaterials?.length,
        inputMaterials: batch.inputMaterials
      });

      // Fetch the batch again to verify it was saved correctly
      const savedBatch = await ProductionBatch.findById(batch._id);
      console.log('Fetched batch after save:', {
        batchId: savedBatch?._id,
        inputMaterialsCount: savedBatch?.inputMaterials?.length,
        inputMaterials: savedBatch?.inputMaterials
      });
      if (reserveMaterials && inputMaterials.length > 0) {
        try {
          await ProductionBatchController.materialConsumptionService.reserveMaterialsForBatch({
            batchId: batch._id.toString(),
            materials: inputMaterials.map((input: any) => ({
              itemId: input.itemId,
              quantity: input.quantity,
              unit: input.unit
            })),
            reservedBy: userId
          });

          logger.info('Materials reserved for new batch', {
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            materialCount: inputMaterials.length
          });
        } catch (reservationError) {
          logger.warn('Failed to reserve materials for batch', {
            batchId: batch._id,
            error: reservationError
          });
          // Continue without failing the batch creation
        }
      }

      // Fetch the saved batch with all fields including inputMaterials
      const savedBatchWithMaterials = await ProductionBatch.findById(batch._id)
        .populate('createdBy', 'name email')
        .populate('companyId', 'name companyCode')
        .select('+inputMaterials +outputMaterials');

      // Update the fetched batch with calculated costs
      if (savedBatchWithMaterials) {
        (savedBatchWithMaterials as any).totalCost = totalMaterialCost;
        (savedBatchWithMaterials as any).costPerUnit = plannedQuantity > 0 ? totalMaterialCost / plannedQuantity : 0;
      }

      res.status(201).json({
        message: 'Production batch created successfully',
        data: savedBatchWithMaterials
      });
    } catch (error) {
      logger.error('Error creating production batch:', error);
      res.status(500).json({
        message: 'Error creating production batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all batches for a company or all companies (for superadmin)
  static async getBatches(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { 
        status, 
        currentStage, 
        priority, 
        page = 1, 
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const user = (req as any).user;
      const isSuperAdmin = user?.isSuperAdmin || user?.role === 'super_admin';

      // Build filter based on user role
      const filter: any = {};
      
      // Handle company filtering based on route and user role
      if (companyId) {
        // Route: /company/:companyId - specific company
        if (companyId !== 'all') {
          // Check if companyId is a company name (for superadmin filtering)
          if (isSuperAdmin && !companyId.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a company name, we need to find the company ID
            const Company = require('../models/Company').default;
            const company = await Company.findOne({ companyName: companyId });
            if (company) {
              filter.companyId = company._id;
            } else {
              // Company not found, return empty result
              filter.companyId = null;
            }
          } else {
            filter.companyId = companyId;
          }
        } else if (!isSuperAdmin) {
          // Non-superadmin users cannot access 'all' - default to their company
          filter.companyId = user?.companyId;
        }
        // For superadmin with companyId='all', no company filter is applied
      } else {
        // Route: / - no company ID in params
        if (isSuperAdmin) {
          // Super admin can see all batches across all companies
          // No company filter applied
        } else {
          // Regular user - filter by their company
          filter.companyId = user?.companyId || (req as any).companyAccess?.companyId;
        }
      }

      if (status) filter.status = status;
      if (currentStage) filter.currentStage = parseInt(currentStage as string);
      if (priority) filter.priority = priority;
      if (search) {
        filter.$or = [
          { batchNumber: { $regex: search, $options: 'i' } },
          { productionOrderId: { $regex: search, $options: 'i' } },
          { customerOrderId: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build sort object
      const sortObj: any = {};
      const validSortFields = ['createdAt', 'updatedAt', 'batchNumber', 'status', 'priority', 'progress', 'plannedQuantity', 'plannedStartDate', 'plannedEndDate'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

      const batches = await ProductionBatch.find(filter)
        .populate('createdBy', 'name email username')
        .populate('lastModifiedBy', 'name email username')
        .populate('companyId', 'companyName companyCode')
        .select('+inputMaterials +outputMaterials')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await ProductionBatch.countDocuments(filter);

      res.json({
        data: batches,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({
        message: 'Error fetching batches',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all batches with detailed stage information (for super admin)
  static async getAllBatchesWithStages(req: Request, res: Response) {
    try {
      const { 
        status, 
        currentStage, 
        priority, 
        page = 1, 
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const user = (req as any).user;
      const isSuperAdmin = user?.isSuperAdmin || user?.role === 'super_admin';

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: 'Access denied. Super admin privileges required.'
        });
      }

      // Build filter - no company restriction for super admin
      const filter: any = {};
      
      if (status) filter.status = status;
      if (currentStage) filter.currentStage = parseInt(currentStage as string);
      if (priority) filter.priority = priority;
      if (search) {
        filter.$or = [
          { batchNumber: { $regex: search, $options: 'i' } },
          { productionOrderId: { $regex: search, $options: 'i' } },
          { customerOrderId: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build sort object
      const sortObj: any = {};
      const validSortFields = ['createdAt', 'updatedAt', 'batchNumber', 'status', 'priority', 'progress', 'plannedQuantity', 'plannedStartDate', 'plannedEndDate'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

      const batches = await ProductionBatch.find(filter)
        .populate('createdBy', 'name email username')
        .populate('lastModifiedBy', 'name email username')
        .populate('companyId', 'companyName companyCode')
        .select('+inputMaterials +outputMaterials')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await ProductionBatch.countDocuments(filter);

      // Add stage management information to each batch
      const batchesWithStages = batches.map(batch => {
        const batchObj = batch.toObject();
        const stages = batchObj.stages || [];
        
        // Calculate stage completion statistics
        const completedStages = stages.filter((stage: any) => stage.status === 'completed').length;
        const totalStages = stages.length;
        const currentStageIndex = stages.findIndex((stage: any) => stage.status === 'in_progress');
        
        return {
          ...batchObj,
          stageManagement: {
            totalStages,
            completedStages,
            currentStageIndex: currentStageIndex >= 0 ? currentStageIndex + 1 : null,
            progressPercentage: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
            canManageStages: true, // Super admin can always manage stages
            stages: stages.map((stage: any, index: number) => ({
              ...stage,
              stageNumber: index + 1,
              canUpdate: true, // Super admin can update any stage
              canComplete: stage.status === 'in_progress' || stage.status === 'pending',
              canStart: stage.status === 'pending',
              inputMaterials: stage.inputMaterials || [],
              outputMaterials: stage.outputMaterials || []
            }))
          }
        };
      });

      res.json({
        data: batchesWithStages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        },
        stageManagement: {
          totalBatches: total,
          batchesInProgress: batches.filter(b => b.status === 'in_progress').length,
          batchesCompleted: batches.filter(b => b.status === 'completed').length,
          batchesPending: batches.filter(b => b.status === 'pending').length
        }
      });
    } catch (error) {
      console.error('Error fetching batches with stages:', error);
      res.status(500).json({
        message: 'Error fetching batches with stage management',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get a single batch by ID
  static async getBatchById(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      const batch = await ProductionBatch.findById(batchId)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .populate('companyId', 'name companyCode')
        .select('+inputMaterials +outputMaterials');

      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      res.json({ data: batch });
    } catch (error) {
      console.error('Error fetching batch:', error);
      res.status(500).json({
        message: 'Error fetching batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update batch basic information
  static async updateBatch(req: Request, res: Response) {
    try {
      const { batchId } = req.params;
      const updateData = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      // Don't allow updating certain fields
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.batchNumber;
      delete updateData.createdBy;

      updateData.lastModifiedBy = userId;

      const updatedBatch = await ProductionBatch.findByIdAndUpdate(
        batchId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Batch updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({
        message: 'Error updating batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update stage status
  static async updateStageStatus(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const { newStatus, reason, notes } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await (batch as any).updateStageStatus(
        parseInt(stageNumber),
        newStatus,
        userId,
        userName,
        reason,
        notes
      );

      // Check if this was the last stage and it's now completed
      if (newStatus === 'completed') {
        const totalStages = batch.stages.length;
        const completedStages = batch.stages.filter(stage => (stage as any).status === 'completed').length;
        
        // If all stages are completed, mark the batch as completed
        if (completedStages === totalStages) {
          (batch as any).status = 'completed';
          (batch as any).progress = 100;
          (batch as any).actualEndDate = new Date();
          
          // Log the batch completion
          (batch as any).statusChangeLogs.push({
            changeType: 'batch_status',
            entityType: 'batch',
            entityId: batch._id,
            previousStatus: (batch as any).status,
            newStatus: 'completed',
            changeReason: 'All stages completed',
            changedBy: userId,
            changedByName: userName,
            changedDate: new Date(),
            notes: 'Batch automatically completed when last stage was finished',
            requiresApproval: false,
            systemGenerated: true
          });
        }
      }

      // Save the batch after updating stage status
      await batch.save();

      res.json({
        message: 'Stage status updated successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error updating stage status:', error);
      res.status(500).json({
        message: 'Error updating stage status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Bulk update stages (super admin only)
  static async bulkUpdateStages(req: Request, res: Response) {
    try {
      const { batchUpdates } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      const user = (req as any).user;
      const isSuperAdmin = user?.isSuperAdmin || user?.role === 'super_admin';

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: 'Access denied. Super admin privileges required.'
        });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!Array.isArray(batchUpdates)) {
        return res.status(400).json({ message: 'batchUpdates must be an array' });
      }

      const results = [];
      const errors = [];

      for (const update of batchUpdates) {
        try {
          const { batchId, stageNumber, newStatus, reason, notes } = update;

          if (!batchId || !stageNumber || !newStatus) {
            errors.push({
              batchId,
              stageNumber,
              error: 'Missing required fields: batchId, stageNumber, newStatus'
            });
            continue;
          }

          const batch = await ProductionBatch.findById(batchId);
          if (!batch) {
            errors.push({
              batchId,
              stageNumber,
              error: 'Batch not found'
            });
            continue;
          }

          await (batch as any).updateStageStatus(
            parseInt(stageNumber),
            newStatus,
            userId,
            userName,
            reason,
            notes
          );

          // Check if this was the last stage and it's now completed
          if (newStatus === 'completed') {
            const totalStages = batch.stages.length;
            const completedStages = batch.stages.filter(stage => (stage as any).status === 'completed').length;
            
            // If all stages are completed, mark the batch as completed
            if (completedStages === totalStages) {
              (batch as any).status = 'completed';
              (batch as any).progress = 100;
              (batch as any).actualEndDate = new Date();
              
              // Log the batch completion
              (batch as any).statusChangeLogs.push({
                changeType: 'batch_status',
                entityType: 'batch',
                entityId: batch._id,
                previousStatus: (batch as any).status,
                newStatus: 'completed',
                changeReason: 'All stages completed',
                changedBy: userId,
                changedByName: userName,
                changedDate: new Date(),
                notes: 'Batch automatically completed when last stage was finished',
                requiresApproval: false,
                systemGenerated: true
              });
            }
          }

          // Save the batch after updating stage status
          await batch.save();

          results.push({
            batchId,
            stageNumber,
            status: newStatus,
            success: true
          });

        } catch (error) {
          errors.push({
            batchId: update.batchId,
            stageNumber: update.stageNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
        results,
        errors,
        summary: {
          total: batchUpdates.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Error in bulk stage update:', error);
      res.status(500).json({
        message: 'Error in bulk stage update',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add material consumption to a stage
  static async consumeMaterial(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const { materials } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      // Use the MaterialConsumptionService to handle consumption
      await ProductionBatchController.materialConsumptionService.consumeMaterialsForStage({
        batchId,
        stageNumber: parseInt(stageNumber),
        materials: materials.map((m: any) => ({
          itemId: m.itemId,
          plannedQuantity: m.plannedQuantity || m.consumedQuantity,
          actualQuantity: m.actualQuantity || m.consumedQuantity,
          wasteQuantity: m.wasteQuantity || 0,
          returnedQuantity: m.returnedQuantity || 0,
          unit: m.unit,
          notes: m.notes || ''
        })),
        consumedBy: userId,
        consumptionDate: new Date()
      });

      // Get updated batch
      const updatedBatch = await ProductionBatch.findById(batchId);

      res.json({
        message: 'Material consumption recorded successfully',
        data: updatedBatch
      });
    } catch (error) {
      logger.error('Error recording material consumption:', error);
      res.status(500).json({
        message: 'Error recording material consumption',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add material output to a stage
  static async addMaterialOutput(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const { outputs } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      // Use MaterialConsumptionService to record stage output
      const createdItemIds = await ProductionBatchController.materialConsumptionService.recordStageOutput({
        batchId,
        stageNumber: parseInt(stageNumber),
        outputs: outputs.map((output: any) => ({
          itemName: output.itemName,
          category: {
            primary: output.category?.primary || 'semi_finished',
            secondary: output.category?.secondary || 'processed',
            tertiary: output.category?.tertiary
          },
          quantity: output.quantity,
          unit: output.unit,
          qualityGrade: output.qualityGrade,
          defects: output.defects || [],
          notes: output.notes || ''
        })),
        producedBy: userId?.toString(),
        productionDate: new Date()
      }, (req.user as any)?.companyId?.toString());

      // Get updated batch
      const updatedBatch = await ProductionBatch.findById(batchId);

      res.json({
        message: 'Stage output recorded successfully',
        data: {
          batch: updatedBatch,
          createdItems: createdItemIds
        }
      });
    } catch (error) {
      logger.error('Error recording stage output:', error);
      res.status(500).json({
        message: 'Error recording stage output',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add quality check to a stage
  static async addQualityCheck(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const checkData = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      checkData.checkedBy = userId;
      checkData.checkedByName = userName;

      await (batch as any).addQualityCheck(parseInt(stageNumber), checkData);
      await batch.save();

      res.json({
        message: 'Quality check added successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error adding quality check:', error);
      res.status(500).json({
        message: 'Error adding quality check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Pass quality gate
  static async passQualityGate(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await (batch as any).passQualityGate(parseInt(stageNumber), userId, userName, notes);
      await batch.save();

      res.json({
        message: 'Quality gate passed successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error passing quality gate:', error);
      res.status(500).json({
        message: 'Error passing quality gate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Fail quality gate
  static async failQualityGate(req: Request, res: Response) {
    try {
      const { batchId, stageNumber } = req.params;
      const { rejectionReason, retestRequired = true } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await (batch as any).failQualityGate(
        parseInt(stageNumber),
        userId,
        userName,
        rejectionReason,
        retestRequired
      );
      await batch.save();

      res.json({
        message: 'Quality gate failed successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error failing quality gate:', error);
      res.status(500).json({
        message: 'Error failing quality gate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add cost to batch
  static async addCost(req: Request, res: Response) {
    try {
      const { batchId } = req.params;
      const costData = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userName = (req as any).user?.username || (req as any).user?.name || 'Unknown User';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      await (batch as any).addCost(costData, userId, userName);

      res.json({
        message: 'Cost added successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error adding cost:', error);
      res.status(500).json({
        message: 'Error adding cost',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get batch metrics
  static async getBatchMetrics(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      const metrics = (batch as any).getProductionMetrics();
      const costSummary = (batch as any).getCostSummary();
      const materialSummary = (batch as any).getMaterialConsumptionSummary();
      const statusHistory = (batch as any).getStatusHistory();

      res.json({
        data: {
          metrics,
          costSummary,
          materialSummary,
          statusHistory
        }
      });
    } catch (error) {
      console.error('Error fetching batch metrics:', error);
      res.status(500).json({
        message: 'Error fetching batch metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete batch
  static async deleteBatch(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      const batch = await ProductionBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      // Only allow deletion if batch is not in progress
      if (batch.status === BatchStatus.IN_PROGRESS) {
        return res.status(400).json({ 
          message: 'Cannot delete batch that is in progress' 
        });
      }

      await ProductionBatch.findByIdAndDelete(batchId);

      res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
      console.error('Error deleting batch:', error);
      res.status(500).json({
        message: 'Error deleting batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get batch dashboard data
  static async getBatchDashboard(req: Request, res: Response) {
    try {
      const { companyId } = req.params;

      const totalBatches = await ProductionBatch.countDocuments({ companyId });
      const inProgressBatches = await ProductionBatch.countDocuments({ 
        companyId, 
        status: BatchStatus.IN_PROGRESS 
      });
      const completedBatches = await ProductionBatch.countDocuments({ 
        companyId, 
        status: BatchStatus.COMPLETED 
      });
      const onHoldBatches = await ProductionBatch.countDocuments({ 
        companyId, 
        status: BatchStatus.ON_HOLD 
      });
      const qualityHoldBatches = await ProductionBatch.countDocuments({ 
        companyId, 
        status: BatchStatus.QUALITY_HOLD 
      });

      // Get recent batches
      const recentBatches = await ProductionBatch.find({ companyId })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('batchNumber status currentStage plannedQuantity actualQuantity createdAt');

      res.json({
        data: {
          summary: {
            total: totalBatches,
            inProgress: inProgressBatches,
            completed: completedBatches,
            onHold: onHoldBatches,
            qualityHold: qualityHoldBatches
          },
          recentBatches
        }
      });
    } catch (error) {
      console.error('Error fetching batch dashboard:', error);
      res.status(500).json({
        message: 'Error fetching batch dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
