import { BaseService } from '../../../services/BaseService';
import { JobWorker, IJobWorker } from '../models/JobWorker';
import { JobWorkerAssignment, IJobWorkerAssignment, IMaterialTracking } from '../models/JobWorkerAssignment';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class JobWorkerService extends BaseService<IJobWorker> {
  constructor() {
    super(JobWorker);
  }

  /**
   * Create a new job worker
   */
  async createWorker(
    workerData: Partial<IJobWorker>,
    createdBy: string
  ): Promise<IJobWorker> {
    try {
      const userId = new Types.ObjectId(createdBy);
      
      // Validate required fields
      if (!workerData.name || !workerData.phoneNumber) {
        throw new AppError('Name and phone number are required', 400);
      }

      // Check if worker with same phone number exists
      if (workerData.companyId) {
        const existingWorker = await JobWorker.findOne({
          companyId: new Types.ObjectId(workerData.companyId.toString()),
          phoneNumber: workerData.phoneNumber
        });

        if (existingWorker) {
          throw new AppError('Worker with this phone number already exists', 400);
        }
      }

      const worker = await this.create(
        {
          ...workerData,
          createdBy: userId
        },
        createdBy
      );

      logger.info('Job worker created successfully', {
        workerId: worker._id,
        workerCode: worker.workerCode,
        createdBy
      });

      return worker;
    } catch (error) {
      logger.error('Error creating job worker', { error, workerData, createdBy });
      throw error;
    }
  }

  /**
   * Update job worker
   */
  async updateWorker(
    workerId: string,
    workerData: Partial<IJobWorker>,
    updatedBy: string
  ): Promise<IJobWorker | null> {
    try {
      const worker = await this.findById(workerId);
      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Check phone number uniqueness if being updated
      if (workerData.phoneNumber && workerData.phoneNumber !== worker.phoneNumber) {
        const existingWorker = await JobWorker.findOne({
          companyId: worker.companyId,
          phoneNumber: workerData.phoneNumber,
          _id: { $ne: new Types.ObjectId(workerId) }
        });

        if (existingWorker) {
          throw new AppError('Worker with this phone number already exists', 400);
        }
      }

      const updatedWorker = await this.update(
        workerId,
        {
          ...workerData,
          updatedBy: new Types.ObjectId(updatedBy)
        },
        updatedBy
      );

      logger.info('Job worker updated successfully', {
        workerId,
        updatedBy
      });

      return updatedWorker;
    } catch (error) {
      logger.error('Error updating job worker', { error, workerId, workerData });
      throw error;
    }
  }

  /**
   * Get all workers for a company with pagination and sorting
   */
  async getWorkersByCompany(
    companyId: string,
    filters?: {
      status?: string;
      isActive?: boolean;
      specialization?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    workers: IJobWorker[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const filter: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (filters?.status) {
        filter.status = filters.status;
      }

      if (filters?.isActive !== undefined) {
        filter.isActive = filters.isActive;
      }

      if (filters?.specialization) {
        filter.specialization = filters.specialization;
      }

      if (filters?.search) {
        filter.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { workerCode: { $regex: filters.search, $options: 'i' } },
          { phoneNumber: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Build sort object
      const sort: any = {};
      const sortBy = filters?.sortBy || 'name';
      const sortOrder = filters?.sortOrder === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;

      // Get total count
      const total = await this.count(filter);

      // Get workers with pagination
      const workers = await this.findMany(filter, { 
        skip, 
        limit, 
        sort 
      });

      const totalPages = Math.ceil(total / limit);

      return {
        workers,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting workers by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Get worker with assignments summary
   */
  async getWorkerWithSummary(workerId: string): Promise<any> {
    try {
      const worker = await this.findById(workerId, ['createdBy', 'updatedBy']);
      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Get assignments summary
      const assignments = await JobWorkerAssignment.find({
        workerId: new Types.ObjectId(workerId)
      }).lean();

      const summary = {
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter(a => ['assigned', 'in_progress'].includes(a.status)).length,
        completedAssignments: assignments.filter(a => a.status === 'completed').length,
        totalMaterialsGiven: 0,
        totalMaterialsUsed: 0,
        totalMaterialsReturned: 0,
        totalMaterialsRemaining: 0,
        totalAmountEarned: 0,
        totalAmountPending: 0
      };

      assignments.forEach((assignment: any) => {
        assignment.materials?.forEach((material: IMaterialTracking) => {
          summary.totalMaterialsGiven += material.quantityGiven || 0;
          summary.totalMaterialsUsed += material.quantityUsed || 0;
          summary.totalMaterialsReturned += material.quantityReturned || 0;
          summary.totalMaterialsRemaining += material.quantityRemaining || 0;
        });

        if (assignment.totalAmount) {
          if (assignment.paymentStatus === 'paid') {
            summary.totalAmountEarned += assignment.totalAmount;
          } else {
            summary.totalAmountPending += assignment.balanceAmount || assignment.totalAmount;
          }
        }
      });

      return {
        worker,
        summary
      };
    } catch (error) {
      logger.error('Error getting worker with summary', { error, workerId });
      throw error;
    }
  }

  /**
   * Delete worker (soft delete)
   */
  async deleteWorker(workerId: string, deletedBy: string): Promise<IJobWorker | null> {
    try {
      // Check if worker has active assignments
      const activeAssignments = await JobWorkerAssignment.countDocuments({
        workerId: new Types.ObjectId(workerId),
        status: { $in: ['assigned', 'in_progress'] }
      });

      if (activeAssignments > 0) {
        throw new AppError(
          `Cannot delete worker. There are ${activeAssignments} active assignment(s)`,
          400
        );
      }

      const deletedWorker = await this.update(
        workerId,
        {
          isActive: false,
          status: 'inactive',
          updatedBy: new Types.ObjectId(deletedBy)
        },
        deletedBy
      );

      logger.info('Worker deleted successfully', {
        workerId,
        deletedBy
      });

      return deletedWorker;
    } catch (error) {
      logger.error('Error deleting worker', { error, workerId });
      throw error;
    }
  }
}

export class JobWorkerAssignmentService extends BaseService<IJobWorkerAssignment> {
  constructor() {
    super(JobWorkerAssignment);
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    assignmentData: Partial<IJobWorkerAssignment>,
    createdBy: string
  ): Promise<IJobWorkerAssignment> {
    try {
      const userId = new Types.ObjectId(createdBy);

      // Validate worker exists
      const worker = await JobWorker.findById(assignmentData.workerId);
      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Set worker details
      assignmentData.workerName = worker.name;
      assignmentData.workerCode = worker.workerCode;

      const assignment = await this.create(
        {
          ...assignmentData,
          createdBy: userId
        },
        createdBy
      );

      logger.info('Job worker assignment created successfully', {
        assignmentId: assignment._id,
        assignmentNumber: assignment.assignmentNumber,
        workerId: assignment.workerId,
        createdBy
      });

      return assignment;
    } catch (error) {
      logger.error('Error creating assignment', { error, assignmentData, createdBy });
      throw error;
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string,
    assignmentData: Partial<IJobWorkerAssignment>,
    updatedBy: string
  ): Promise<IJobWorkerAssignment | null> {
    try {
      const assignment = await this.findById(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      // If materials are being updated, recalculate remaining quantities
      if (assignmentData.materials) {
        assignmentData.materials = assignmentData.materials.map((material: IMaterialTracking) => {
          material.quantityRemaining = Math.max(0,
            (material.quantityGiven || 0) -
            (material.quantityUsed || 0) -
            (material.quantityReturned || 0) -
            (material.quantityWasted || 0)
          );
          return material;
        });
      }

      const updatedAssignment = await this.update(
        assignmentId,
        {
          ...assignmentData,
          updatedBy: new Types.ObjectId(updatedBy)
        },
        updatedBy
      );

      logger.info('Assignment updated successfully', {
        assignmentId,
        updatedBy
      });

      return updatedAssignment;
    } catch (error) {
      logger.error('Error updating assignment', { error, assignmentId, assignmentData });
      throw error;
    }
  }

  /**
   * Add material to assignment
   */
  async addMaterial(
    assignmentId: string,
    material: IMaterialTracking,
    updatedBy: string
  ): Promise<IJobWorkerAssignment | null> {
    try {
      const assignment = await this.findById(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      // Calculate remaining quantity
      material.quantityRemaining = Math.max(0,
        (material.quantityGiven || 0) -
        (material.quantityUsed || 0) -
        (material.quantityReturned || 0) -
        (material.quantityWasted || 0)
      );

      // Calculate total value if rate is provided
      if (material.rate && material.quantityGiven) {
        material.totalValue = material.rate * material.quantityGiven;
      }

      assignment.materials.push(material);
      await assignment.save();

      logger.info('Material added to assignment', {
        assignmentId,
        materialItem: material.itemName,
        updatedBy
      });

      return assignment;
    } catch (error) {
      logger.error('Error adding material', { error, assignmentId, material });
      throw error;
    }
  }

  /**
   * Update material tracking
   */
  async updateMaterialTracking(
    assignmentId: string,
    materialIndex: number,
    materialData: Partial<IMaterialTracking>,
    updatedBy: string
  ): Promise<IJobWorkerAssignment | null> {
    try {
      const assignment = await this.findById(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      if (materialIndex < 0 || materialIndex >= assignment.materials.length) {
        throw new AppError('Invalid material index', 400);
      }

      // Update material
      const material = assignment.materials[materialIndex];
      Object.assign(material, materialData);

      // Recalculate remaining quantity
      material.quantityRemaining = Math.max(0,
        (material.quantityGiven || 0) -
        (material.quantityUsed || 0) -
        (material.quantityReturned || 0) -
        (material.quantityWasted || 0)
      );

      // Recalculate total value
      if (material.rate && material.quantityGiven) {
        material.totalValue = material.rate * material.quantityGiven;
      }

      await assignment.save();

      logger.info('Material tracking updated', {
        assignmentId,
        materialIndex,
        updatedBy
      });

      return assignment;
    } catch (error) {
      logger.error('Error updating material tracking', { error, assignmentId, materialIndex });
      throw error;
    }
  }

  /**
   * Get assignments by worker
   */
  async getAssignmentsByWorker(
    workerId: string,
    filters?: {
      companyId?: string;
      status?: string;
      jobType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<IJobWorkerAssignment[]> {
    try {
      const filter: any = {
        workerId: new Types.ObjectId(workerId)
      };

      // Add companyId filter if provided
      if (filters?.companyId) {
        filter.companyId = new Types.ObjectId(filters.companyId);
      }

      if (filters?.status) {
        filter.status = filters.status;
      }

      if (filters?.jobType) {
        filter.jobType = filters.jobType;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        filter.assignedDate = {};
        if (filters.dateFrom) {
          filter.assignedDate.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          filter.assignedDate.$lte = filters.dateTo;
        }
      }

      logger.info('Getting assignments by worker', { workerId, filter });

      const assignments = await this.findMany(filter, {
        sort: { assignedDate: -1 }
      }, ['workerId', 'jobWorkId']);

      logger.info('Found assignments', { workerId, count: assignments.length });

      return assignments;
    } catch (error) {
      logger.error('Error getting assignments by worker', { error, workerId, filters });
      throw error;
    }
  }

  /**
   * Get assignments by company with filters
   */
  async getAssignmentsByCompany(
    companyId: string,
    filters?: {
      workerId?: string;
      status?: string;
      jobType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    }
  ): Promise<IJobWorkerAssignment[]> {
    try {
      const filter: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (filters?.workerId) {
        filter.workerId = new Types.ObjectId(filters.workerId);
      }

      if (filters?.status) {
        filter.status = filters.status;
      }

      if (filters?.jobType) {
        filter.jobType = filters.jobType;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        filter.assignedDate = {};
        if (filters.dateFrom) {
          filter.assignedDate.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          filter.assignedDate.$lte = filters.dateTo;
        }
      }

      if (filters?.search) {
        filter.$or = [
          { assignmentNumber: { $regex: filters.search, $options: 'i' } },
          { workerName: { $regex: filters.search, $options: 'i' } },
          { workerCode: { $regex: filters.search, $options: 'i' } },
          { jobDescription: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const assignments = await this.findMany(filter, {
        sort: { assignedDate: -1 }
      }, ['workerId', 'jobWorkId']);

      return assignments;
    } catch (error) {
      logger.error('Error getting assignments by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Get assignment with material summary
   */
  async getAssignmentWithSummary(assignmentId: string): Promise<any> {
    try {
      const assignment = await this.findById(assignmentId, ['workerId', 'jobWorkId', 'createdBy', 'updatedBy']);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      const summary = {
        totalMaterials: assignment.materials.length,
        totalGiven: 0,
        totalUsed: 0,
        totalReturned: 0,
        totalRemaining: 0,
        totalWasted: 0,
        totalValue: 0
      };

      assignment.materials.forEach((material: IMaterialTracking) => {
        summary.totalGiven += material.quantityGiven || 0;
        summary.totalUsed += material.quantityUsed || 0;
        summary.totalReturned += material.quantityReturned || 0;
        summary.totalRemaining += material.quantityRemaining || 0;
        summary.totalWasted += material.quantityWasted || 0;
        summary.totalValue += material.totalValue || 0;
      });

      return {
        assignment,
        summary
      };
    } catch (error) {
      logger.error('Error getting assignment with summary', { error, assignmentId });
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  async updateStatus(
    assignmentId: string,
    status: string,
    updatedBy: string
  ): Promise<IJobWorkerAssignment | null> {
    try {
      const assignment = await this.findById(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      // Set completion date if status is completed
      if (status === 'completed' && !assignment.actualCompletionDate) {
        assignment.actualCompletionDate = new Date();
      }

      // Set start date if status is in_progress
      if (status === 'in_progress' && !assignment.startDate) {
        assignment.startDate = new Date();
      }

      const updatedAssignment = await this.update(
        assignmentId,
        {
          status,
          actualCompletionDate: status === 'completed' ? new Date() : assignment.actualCompletionDate,
          startDate: status === 'in_progress' ? new Date() : assignment.startDate,
          updatedBy: new Types.ObjectId(updatedBy)
        },
        updatedBy
      );

      logger.info('Assignment status updated', {
        assignmentId,
        status,
        updatedBy
      });

      return updatedAssignment;
    } catch (error) {
      logger.error('Error updating assignment status', { error, assignmentId, status });
      throw error;
    }
  }

  /**
   * Get material tracking report for a worker
   */
  async getMaterialTrackingReport(
    workerId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<any> {
    try {
      const filter: any = {
        workerId: new Types.ObjectId(workerId)
      };

      if (dateFrom || dateTo) {
        filter.assignedDate = {};
        if (dateFrom) {
          filter.assignedDate.$gte = dateFrom;
        }
        if (dateTo) {
          filter.assignedDate.$lte = dateTo;
        }
      }

      const assignments = await JobWorkerAssignment.find(filter).lean();

      // Aggregate material data
      const materialMap = new Map<string, any>();

      assignments.forEach((assignment: any) => {
        assignment.materials?.forEach((material: IMaterialTracking) => {
          const key = material.itemId.toString();
          if (!materialMap.has(key)) {
            materialMap.set(key, {
              itemId: material.itemId,
              itemName: material.itemName,
              itemCode: material.itemCode,
              unit: material.unit,
              totalGiven: 0,
              totalUsed: 0,
              totalReturned: 0,
              totalRemaining: 0,
              totalWasted: 0,
              totalValue: 0
            });
          }

          const aggregated = materialMap.get(key)!;
          aggregated.totalGiven += material.quantityGiven || 0;
          aggregated.totalUsed += material.quantityUsed || 0;
          aggregated.totalReturned += material.quantityReturned || 0;
          aggregated.totalRemaining += material.quantityRemaining || 0;
          aggregated.totalWasted += material.quantityWasted || 0;
          aggregated.totalValue += material.totalValue || 0;
        });
      });

      return Array.from(materialMap.values());
    } catch (error) {
      logger.error('Error getting material tracking report', { error, workerId });
      throw error;
    }
  }
}

