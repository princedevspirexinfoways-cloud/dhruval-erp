import { JobWork, IJobWorkDocument } from '../models/JobWork';
import { Types } from 'mongoose';
import Category from '../features/category/models/Category';
import Subcategory from '../features/subcategory/models/Subcategory';
import { InventoryService } from './InventoryService';
import { StockMovementService } from './StockMovementService';
import InventoryItem from '../models/InventoryItem';
import Warehouse from '../models/Warehouse';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export interface CreateJobWorkData {
  companyId: string;
  jobWorkerId: string;
  jobWorkerName: string;
  jobWorkerRate: number;
  expectedDelivery: Date;
  jobWorkType: string;
  quantity: number;
  unit: string;
  productionOrderId?: string;
  batchId?: string;
  // Challan Information
  challanNumber?: string;
  challanDate?: Date;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  itemName?: string;
  attributeName?: string;
  price?: number;
  lotNumber?: string;
  // Party Details
  partyName?: string;
  partyGstNumber?: string;
  partyAddress?: string;
  materialProvided?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
  qualityAgreement?: string;
  remarks?: string;
  createdBy: string;
}

export interface UpdateJobWorkData {
  status?: string;
  actualDelivery?: Date;
  jobWorkCost?: number;
  outputQuantity?: number;
  wasteQuantity?: number;
  qualityStatus?: string;
  qualityNotes?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentDate?: Date;
  // Challan Information
  challanNumber?: string;
  challanDate?: Date;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  itemName?: string;
  attributeName?: string;
  price?: number;
  lotNumber?: string;
  // Party Details
  partyName?: string;
  partyGstNumber?: string;
  partyAddress?: string;
  materialReturned?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
  materialUsed?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
  remarks?: string;
  updatedBy: string;
}

export interface JobWorkFilters {
  companyId?: string;
  jobWorkerId?: string;
  status?: string;
  jobWorkType?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  qualityStatus?: string;
  challanNumber?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export class JobWorkService {
  private inventoryService: InventoryService;
  private stockMovementService: StockMovementService;

  constructor() {
    this.inventoryService = new InventoryService();
    this.stockMovementService = new StockMovementService();
  }

  async createJobWork(data: CreateJobWorkData): Promise<IJobWorkDocument> {
    // Parse challan data from remarks if stored as JSON
    let challanData: any = {};
    let partyData: any = {};
    let originalRemarks = data.remarks || '';

    if (data.remarks) {
      try {
        const parsed = JSON.parse(data.remarks);
        const categoryId = parsed.category ? new Types.ObjectId(parsed.category) : undefined;
        const subcategoryId = parsed.subcategory ? new Types.ObjectId(parsed.subcategory) : undefined;

        // Fetch category and subcategory names
        let categoryName = parsed.categoryName;
        let subcategoryName = parsed.subcategoryName;

        if (categoryId && !categoryName) {
          const category = await Category.findById(categoryId);
          categoryName = category?.name;
        }

        if (subcategoryId && !subcategoryName) {
          const subcategory = await Subcategory.findById(subcategoryId);
          subcategoryName = subcategory?.name;
        }

        challanData = {
          challanNumber: parsed.challanNumber,
          challanDate: parsed.challanDate ? new Date(parsed.challanDate) : undefined,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName,
          itemName: parsed.itemName,
          attributeName: parsed.attributeName,
          price: parsed.price,
          lotNumber: parsed.lotNumber
        };
        partyData = {
          partyName: parsed.partyName,
          partyGstNumber: parsed.partyGstNumber,
          partyAddress: parsed.partyAddress
        };
        originalRemarks = parsed.originalRemarks || '';
      } catch (e) {
        // If not JSON, keep remarks as is
      }
    }

    // Validate stock availability for materials provided (but don't reduce yet)
    const materialStockInfo: Array<{
      material: typeof data.materialProvided[0];
      inventoryItem: any;
      warehouseId: string;
      warehouse: any;
      stockBefore: number;
      availableBefore: number;
    }> = [];

    if (data.materialProvided && data.materialProvided.length > 0) {
      for (const material of data.materialProvided) {
        if (!material.itemId || !material.quantity || material.quantity <= 0) {
          continue; // Skip invalid materials
        }

        try {
          // Get inventory item to check stock
          const inventoryItem = await InventoryItem.findById(material.itemId);
          if (!inventoryItem) {
            throw new AppError(`Inventory item ${material.itemId} not found`, 404);
          }

          // Check if sufficient stock is available
          const availableStock = inventoryItem.stock?.availableStock || 0;
          if (availableStock < material.quantity) {
            throw new AppError(
              `Insufficient stock for ${inventoryItem.itemName || material.itemName || 'item'}. Available: ${availableStock} ${material.unit || ''}, Required: ${material.quantity} ${material.unit || ''}`,
              400
            );
          }

          // Get warehouse ID from item locations
          let warehouseId = inventoryItem.locations?.[0]?.warehouseId?.toString();
          
          // If no warehouse found in locations, try to get default warehouse for company
          if (!warehouseId) {
            const defaultWarehouse = await Warehouse.findOne({ 
              companyId: new Types.ObjectId(data.companyId),
              isActive: true 
            }).sort({ createdAt: 1 }); // Get first active warehouse
            
            if (defaultWarehouse) {
              warehouseId = defaultWarehouse._id.toString();
            } else {
              throw new AppError(
                `No warehouse found for item ${inventoryItem.itemName || material.itemName}. Please assign a warehouse to the item or create a warehouse for the company.`,
                400
              );
            }
          }

          // Get warehouse details
          const warehouse = await Warehouse.findById(warehouseId);
          if (!warehouse) {
            throw new AppError('Warehouse not found', 404);
          }

          // Store info for later stock reduction and movement creation
          materialStockInfo.push({
            material,
            inventoryItem,
            warehouseId,
            warehouse,
            stockBefore: inventoryItem.stock?.currentStock || 0,
            availableBefore: inventoryItem.stock?.availableStock || 0
          });
        } catch (error: any) {
          logger.error('Error validating stock for job work material', {
            error: error.message,
            material,
            jobWorkerId: data.jobWorkerId
          });
          throw error; // Re-throw to prevent job work creation if stock validation fails
        }
      }
    }

    const jobWork = new JobWork({
      ...data,
      companyId: new Types.ObjectId(data.companyId),
      jobWorkerId: new Types.ObjectId(data.jobWorkerId),
      createdBy: new Types.ObjectId(data.createdBy),
      productionOrderId: data.productionOrderId ? new Types.ObjectId(data.productionOrderId) : undefined,
      batchId: data.batchId ? new Types.ObjectId(data.batchId) : undefined,
      ...challanData,
      ...partyData,
      remarks: originalRemarks,
      materialProvided: data.materialProvided?.map(m => ({
        ...m,
        itemId: new Types.ObjectId(m.itemId)
      }))
    });

    const savedJobWork = await jobWork.save();

    // Reduce stock and create stock movements for materials provided after job work is saved
    if (materialStockInfo.length > 0) {
      for (const stockInfo of materialStockInfo) {
        const { material, inventoryItem, warehouseId, warehouse, stockBefore, availableBefore } = stockInfo;

        try {
          // Calculate new stock levels
          const newCurrentStock = stockBefore - material.quantity;
          const newAvailableStock = availableBefore - material.quantity;

          // Update inventory item stock directly
          await InventoryItem.findByIdAndUpdate(
            material.itemId,
            {
              $set: {
                'stock.currentStock': newCurrentStock,
                'stock.availableStock': newAvailableStock,
                'stock.totalValue': newCurrentStock * (inventoryItem.pricing?.costPrice || 0)
              }
            }
          );

          // Create stock movement record with job work reference
          await this.stockMovementService.createStockMovement({
            companyId: new Types.ObjectId(data.companyId),
            itemId: new Types.ObjectId(material.itemId),
            itemCode: inventoryItem.itemCode,
            itemName: material.itemName || inventoryItem.itemName,
            movementType: 'outward',
            quantity: material.quantity,
            unit: material.unit || inventoryItem.stock?.unit || 'pcs',
            rate: inventoryItem.pricing?.costPrice || 0,
            totalValue: (inventoryItem.pricing?.costPrice || 0) * material.quantity,
            fromLocation: {
              warehouseId: new Types.ObjectId(warehouseId),
              warehouseName: warehouse.warehouseName,
              isExternal: false
            },
            referenceDocument: {
              documentType: 'production_order', // Using production_order as job work is a type of production
              documentId: savedJobWork._id,
              documentNumber: `JOB-WORK-${savedJobWork._id.toString()}`
            },
            notes: `Material provided to job worker for job work. Worker: ${data.jobWorkerName || 'N/A'}, Job Work ID: ${savedJobWork._id}`,
            stockImpact: {
              stockBefore,
              stockAfter: newCurrentStock,
              availableBefore,
              availableAfter: newAvailableStock
            }
          }, data.createdBy);

          logger.info('Stock reduced and movement created for job work material', {
            itemId: material.itemId,
            itemName: material.itemName,
            quantity: material.quantity,
            unit: material.unit,
            jobWorkId: savedJobWork._id,
            jobWorkerId: data.jobWorkerId,
            stockBefore,
            stockAfter: newCurrentStock
          });
        } catch (error: any) {
          logger.error('Error reducing stock and creating movement for job work material', {
            error: error.message,
            material,
            jobWorkId: savedJobWork._id,
            jobWorkerId: data.jobWorkerId
          });
          // If stock reduction fails after job work is saved, we have a problem
          // For now, log the error but don't throw to avoid breaking the flow
          // In production, you might want to implement a rollback mechanism
        }
      }
    }

    return savedJobWork;
  }

  async getJobWorks(filters: JobWorkFilters) {
    const {
      companyId,
      jobWorkerId,
      status,
      jobWorkType,
      startDate,
      endDate,
      paymentStatus,
      qualityStatus,
      challanNumber,
      categoryId,
      page = 1,
      limit = 10
    } = filters;

    const query: any = {};

    if (companyId) {
      query.companyId = new Types.ObjectId(companyId);
    }

    if (jobWorkerId) {
      query.jobWorkerId = new Types.ObjectId(jobWorkerId);
    }

    if (status) {
      query.status = status;
    }

    if (jobWorkType) {
      query.jobWorkType = jobWorkType;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (qualityStatus) {
      query.qualityStatus = qualityStatus;
    }

    if (challanNumber) {
      query.challanNumber = { $regex: challanNumber, $options: 'i' };
    }

    if (categoryId) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    if (startDate || endDate) {
      query.expectedDelivery = {};
      if (startDate) {
        query.expectedDelivery.$gte = new Date(startDate);
      }
      if (endDate) {
        query.expectedDelivery.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [jobWorks, total] = await Promise.all([
      JobWork.find(query)
        .populate('jobWorkerId', 'supplierName contactInfo')
        .populate('categoryId', 'name')
        .populate('subcategoryId', 'name')
        .populate('productionOrderId', 'orderNumber')
        .populate('batchId', 'batchNumber')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobWork.countDocuments(query)
    ]);

    return {
      data: jobWorks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getJobWorkById(jobWorkId: string, companyId?: string): Promise<IJobWorkDocument | null> {
    const query: any = { _id: new Types.ObjectId(jobWorkId) };
    if (companyId) {
      query.companyId = new Types.ObjectId(companyId);
    }

    return await JobWork.findOne(query)
      .populate('jobWorkerId', 'supplierName contactInfo')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('productionOrderId', 'orderNumber')
      .populate('batchId', 'batchNumber')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
  }

  async updateJobWork(jobWorkId: string, data: UpdateJobWorkData, companyId?: string): Promise<IJobWorkDocument | null> {
    // Handle material return - increase stock when materials are returned
    if (data.materialReturned && data.materialReturned.length > 0) {
      try {
        // Get existing job work to compare returned materials
        const existingJobWork = await JobWork.findById(jobWorkId);
        if (!existingJobWork) {
          throw new AppError('Job work not found', 404);
        }

        // Process each returned material
        for (const returnedMaterial of data.materialReturned) {
          // Find existing returned material (handle both ObjectId and string comparison)
          const existingReturned = existingJobWork.materialReturned?.find(
            (m: any) => {
              const existingId = m.itemId?.toString() || m.itemId;
              const newId = returnedMaterial.itemId?.toString() || returnedMaterial.itemId;
              return existingId === newId;
            }
          );
          
          // Calculate new return quantity (difference)
          const previousReturnedQty = existingReturned?.quantity || 0;
          const newReturnedQty = returnedMaterial.quantity;
          const additionalReturned = newReturnedQty - previousReturnedQty;

          // Only process if there's an increase in returned quantity
          if (additionalReturned > 0) {
            logger.info('Processing material return - stock increase', {
              itemId: returnedMaterial.itemId,
              itemName: returnedMaterial.itemName,
              previousReturned: previousReturnedQty,
              newReturned: newReturnedQty,
              additionalReturned,
              jobWorkId
            });
            // Get inventory item
            const inventoryItem = await InventoryItem.findById(returnedMaterial.itemId);
            if (!inventoryItem) {
              logger.warn('Inventory item not found for returned material', {
                itemId: returnedMaterial.itemId,
                jobWorkId
              });
              continue;
            }

            // Get warehouse ID
            let warehouseId = inventoryItem.locations?.[0]?.warehouseId?.toString();
            if (!warehouseId) {
              const defaultWarehouse = await Warehouse.findOne({
                companyId: existingJobWork.companyId,
                isActive: true
              }).sort({ createdAt: 1 });

              if (defaultWarehouse) {
                warehouseId = defaultWarehouse._id.toString();
              } else {
                logger.warn('No warehouse found for returned material', {
                  itemId: returnedMaterial.itemId,
                  jobWorkId
                });
                continue;
              }
            }

            // Increase stock (in movement) for returned materials
            // Note: updateStock creates stock movement record automatically
            await this.inventoryService.updateStock(
              returnedMaterial.itemId,
              warehouseId,
              additionalReturned,
              'in',
              `JOB-WORK-${jobWorkId}-RETURN`,
              `Material returned from job work. Worker: ${existingJobWork.jobWorkerName || 'N/A'}`,
              data.updatedBy
            );

            logger.info('Stock movement created for returned material', {
              itemId: returnedMaterial.itemId,
              itemName: returnedMaterial.itemName,
              quantity: additionalReturned,
              reference: `JOB-WORK-${jobWorkId}-RETURN`,
              jobWorkId
            });

            logger.info('Stock increased for returned material', {
              itemId: returnedMaterial.itemId,
              itemName: returnedMaterial.itemName,
              quantity: additionalReturned,
              jobWorkId
            });
          }
        }
      } catch (error: any) {
        logger.error('Error processing material return', {
          error: error.message,
          jobWorkId,
          materials: data.materialReturned
        });
        // Throw error to prevent job work update if stock update fails
        // This ensures stock consistency
        throw new AppError(
          `Failed to update stock for returned materials: ${error.message}`,
          500,
          error
        );
      }
    }
    const query: any = { _id: new Types.ObjectId(jobWorkId) };
    if (companyId) {
      query.companyId = new Types.ObjectId(companyId);
    }

    // Parse challan data from remarks if stored as JSON
    let challanData: any = {};
    let partyData: any = {};
    let originalRemarks = data.remarks;

    if (data.remarks) {
      try {
        const parsed = JSON.parse(data.remarks);
        const categoryId = parsed.category ? new Types.ObjectId(parsed.category) : undefined;
        const subcategoryId = parsed.subcategory ? new Types.ObjectId(parsed.subcategory) : undefined;

        // Fetch category and subcategory names
        let categoryName = parsed.categoryName;
        let subcategoryName = parsed.subcategoryName;

        if (categoryId && !categoryName) {
          const category = await Category.findById(categoryId);
          categoryName = category?.name;
        }

        if (subcategoryId && !subcategoryName) {
          const subcategory = await Subcategory.findById(subcategoryId);
          subcategoryName = subcategory?.name;
        }

        challanData = {
          challanNumber: parsed.challanNumber,
          challanDate: parsed.challanDate ? new Date(parsed.challanDate) : undefined,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName,
          itemName: parsed.itemName,
          attributeName: parsed.attributeName,
          price: parsed.price,
          lotNumber: parsed.lotNumber
        };
        partyData = {
          partyName: parsed.partyName,
          partyGstNumber: parsed.partyGstNumber,
          partyAddress: parsed.partyAddress
        };
        originalRemarks = parsed.originalRemarks || '';
      } catch (e) {
        // If not JSON, keep remarks as is
      }
    }

    const updateData: any = {
      ...data,
      ...challanData,
      ...partyData,
      remarks: originalRemarks,
      updatedBy: new Types.ObjectId(data.updatedBy)
    };

    if (data.materialReturned) {
      updateData.materialReturned = data.materialReturned.map(m => ({
        ...m,
        itemId: new Types.ObjectId(String(m.itemId))
      }));
    }

    if (data.materialUsed) {
      updateData.materialUsed = data.materialUsed.map(m => ({
        ...m,
        itemId: new Types.ObjectId(String(m.itemId))
      }));
    }

    // Convert ObjectIds for category and subcategory if they exist
    if (updateData.categoryId && typeof updateData.categoryId === 'string') {
      updateData.categoryId = new Types.ObjectId(updateData.categoryId);
    }
    if (updateData.subcategoryId && typeof updateData.subcategoryId === 'string') {
      updateData.subcategoryId = new Types.ObjectId(updateData.subcategoryId);
    }

    return await JobWork.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    )
      .populate('jobWorkerId', 'supplierName contactInfo')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('productionOrderId', 'orderNumber')
      .populate('batchId', 'batchNumber');
  }

  async deleteJobWork(jobWorkId: string, companyId?: string): Promise<boolean> {
    const query: any = { _id: new Types.ObjectId(jobWorkId) };
    if (companyId) {
      query.companyId = new Types.ObjectId(companyId);
    }

    const result = await JobWork.deleteOne(query);
    return result.deletedCount > 0;
  }

  async getJobWorkStats(companyId: string, startDate?: string, endDate?: string) {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const [
      totalJobWorks,
      pendingJobWorks,
      inProgressJobWorks,
      completedJobWorks,
      totalCost,
      pendingPayments
    ] = await Promise.all([
      JobWork.countDocuments(query),
      JobWork.countDocuments({ ...query, status: 'pending' }),
      JobWork.countDocuments({ ...query, status: 'in_progress' }),
      JobWork.countDocuments({ ...query, status: 'completed' }),
      JobWork.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$jobWorkCost' } } }
      ]),
      JobWork.aggregate([
        { $match: { ...query, paymentStatus: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$jobWorkCost' } } }
      ])
    ]);

    return {
      totalJobWorks,
      pendingJobWorks,
      inProgressJobWorks,
      completedJobWorks,
      totalCost: totalCost[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0
    };
  }

  async getJobWorkByWorker(jobWorkerId: string, companyId?: string) {
    const query: any = { jobWorkerId: new Types.ObjectId(jobWorkerId) };
    if (companyId) {
      query.companyId = new Types.ObjectId(companyId);
    }

    return await JobWork.find(query)
      .populate('productionOrderId', 'orderNumber')
      .populate('batchId', 'batchNumber')
      .sort({ createdAt: -1 })
      .lean();
  }
}

