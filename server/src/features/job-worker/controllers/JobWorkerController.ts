import { Request, Response } from 'express';
import { JobWorkerService, JobWorkerAssignmentService } from '../services/JobWorkerService';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { JobWorkService } from '../../../services/JobWorkService';

export class JobWorkerController {
  private workerService: JobWorkerService;
  private assignmentService: JobWorkerAssignmentService;
  private jobWorkService: JobWorkService;

  constructor() {
    this.workerService = new JobWorkerService();
    this.assignmentService = new JobWorkerAssignmentService();
    this.jobWorkService = new JobWorkService();
  }

  // =============================================
  // WORKER CRUD OPERATIONS
  // =============================================

  /**
   * Create a new job worker
   */
  createWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
      const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { companyId, ...workerData } = req.body;
      const effectiveCompanyId = companyId || userCompanyId;

      if (!effectiveCompanyId) {
        throw new AppError('Company ID is required', 400);
      }

      const worker = await this.workerService.createWorker(
        {
          ...workerData,
          companyId: effectiveCompanyId
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Job worker created successfully',
        data: worker
      });
    } catch (error) {
      logger.error('Error in createWorker controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create job worker'
      });
    }
  };

  /**
   * Get all workers by company
   */
  getWorkersByCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get companyId from query param, header (req.company), or user object
      const companyId = (req.query.companyId as string) 
        || (req as any).company?._id?.toString() 
        || (req as any).company?.toString()
        || (req as any).user?.companyId?.toString()
        || (req as any).user?.companyAccess?.[0]?.companyId?.toString();
      const status = req.query.status as string;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const specialization = req.query.specialization as string;
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = req.query.sortBy as string || 'name';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const result = await this.workerService.getWorkersByCompany(companyId, {
        status,
        isActive,
        specialization,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        data: result.workers,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      logger.error('Error in getWorkersByCompany controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get workers'
      });
    }
  };

  /**
   * Get worker by ID
   */
  getWorkerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeSummary = req.query.includeSummary === 'true';

      if (includeSummary) {
        const result = await this.workerService.getWorkerWithSummary(id);
        res.status(200).json({
          success: true,
          data: result
        });
      } else {
        const worker = await this.workerService.findById(id);
        if (!worker) {
          throw new AppError('Worker not found', 404);
        }
        res.status(200).json({
          success: true,
          data: worker
        });
      }
    } catch (error) {
      logger.error('Error in getWorkerById controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get worker'
      });
    }
  };

  /**
   * Update worker
   */
  updateWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const worker = await this.workerService.updateWorker(
        id,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Worker updated successfully',
        data: worker
      });
    } catch (error) {
      logger.error('Error in updateWorker controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update worker'
      });
    }
  };

  /**
   * Delete worker
   */
  deleteWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await this.workerService.deleteWorker(id, userId);

      res.status(200).json({
        success: true,
        message: 'Worker deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteWorker controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to delete worker'
      });
    }
  };

  // =============================================
  // ASSIGNMENT OPERATIONS
  // =============================================

  /**
   * Create a new assignment
   */
  createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
      const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { companyId, ...assignmentData } = req.body;
      const effectiveCompanyId = companyId || userCompanyId;

      if (!effectiveCompanyId) {
        throw new AppError('Company ID is required', 400);
      }

      const assignment = await this.assignmentService.createAssignment(
        {
          ...assignmentData,
          companyId: effectiveCompanyId
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Error in createAssignment controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create assignment'
      });
    }
  };

  /**
   * Get all assignments by company
   */
  getAssignmentsByCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.query.companyId as string || (req as any).user?.companyId;
      const workerId = req.query.workerId as string;
      const status = req.query.status as string;
      const jobType = req.query.jobType as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      const search = req.query.search as string;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const assignments = await this.assignmentService.getAssignmentsByCompany(companyId, {
        workerId,
        status,
        jobType,
        dateFrom,
        dateTo,
        search
      });

      res.status(200).json({
        success: true,
        data: assignments,
        total: assignments.length
      });
    } catch (error) {
      logger.error('Error in getAssignmentsByCompany controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get assignments'
      });
    }
  };

  /**
   * Get assignments by worker
   *
   * NOTE: As per latest requirement, this endpoint should fetch data
   * from JobWork model instead of JobWorkerAssignment model.
   */
  getAssignmentsByWorker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workerId } = req.params;
      const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;
      const companyId = req.query.companyId as string || userCompanyId;
      const status = req.query.status as string;
      const jobType = req.query.jobType as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      // Verify worker exists and belongs to company
      const worker = await this.workerService.findById(workerId);
      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // If companyId is provided, verify worker belongs to that company
      if (companyId && worker.companyId?.toString() !== companyId) {
        throw new AppError('Worker does not belong to this company', 403);
      }

      // Fetch job works for this worker from JobWork model instead of assignment model
      const filters: any = {
        companyId: (companyId || worker.companyId?.toString()) as string,
        jobWorkerId: workerId,
      };

      // Map filters to JobWorkService filters
      if (status) {
        // Map assignment-style status to job work status where possible
        // 'assigned' → 'pending', others pass through
        filters.status = status === 'assigned' ? 'pending' : status;
      }

      if (jobType) {
        filters.jobWorkType = jobType;
      }

      if (dateFrom) {
        filters.startDate = dateFrom.toISOString();
      }

      if (dateTo) {
        filters.endDate = dateTo.toISOString();
      }

      // Use a reasonably high limit since frontend expects all assignments
      filters.page = 1;
      filters.limit = 1000;

      const jobWorksResult = await this.jobWorkService.getJobWorks(filters);
      const jobWorks = jobWorksResult.data as any[];

      // Shape job works into assignment-like objects for backward compatibility
      const assignments = jobWorks.map((jw) => {
        // Build material tracking per item from job work materials
        const provided = jw.materialProvided || [];
        const used = jw.materialUsed || [];
        const returned = jw.materialReturned || [];
        const wasted = jw.materialWasted || [];

        const materials = provided.map((p: any) => {
          const idStr = (p.itemId && p.itemId.toString()) || '';
          const usedEntry = used.find(
            (u: any) => (u.itemId && u.itemId.toString()) === idStr,
          );
          const returnedEntry = returned.find(
            (r: any) => (r.itemId && r.itemId.toString()) === idStr,
          );
          const wastedEntry = wasted.find(
            (w: any) => (w.itemId && w.itemId.toString()) === idStr,
          );

          const quantityGiven = p.quantity || 0;
          const quantityUsed = usedEntry?.quantity || 0;
          const quantityReturned = returnedEntry?.quantity || 0;
          const quantityWasted = wastedEntry?.quantity || 0;
          const quantityRemaining = Math.max(
            0,
            quantityGiven - quantityUsed - quantityReturned - quantityWasted,
          );

          return {
            itemId: p.itemId,
            itemName: p.itemName,
            unit: p.unit,
            quantityGiven,
            quantityUsed,
            quantityReturned,
            quantityRemaining,
            quantityWasted,
            // Optional extras
            rate: jw.jobWorkerRate,
            totalValue: jw.jobWorkCost,
          };
        });

        // Map job work status to assignment status
        let assignmentStatus: string = 'assigned';
        if (jw.status === 'in_progress') assignmentStatus = 'in_progress';
        else if (jw.status === 'completed') assignmentStatus = 'completed';
        else if (jw.status === 'on_hold') assignmentStatus = 'on_hold';
        else if (jw.status === 'cancelled') assignmentStatus = 'cancelled';

        const assignedDate =
          jw.challanDate || jw.expectedDelivery || jw.createdAt;

        return {
          _id: jw._id,
          companyId: jw.companyId,
          workerId: jw.jobWorkerId,
          workerName: jw.jobWorkerName,
          workerCode: worker.workerCode,
          assignmentNumber:
            jw.challanNumber || `JW-${jw._id.toString().slice(-6)}`,
          jobWorkId: jw._id,
          jobType: jw.jobWorkType,
          jobDescription: jw.itemName,
          status: assignmentStatus,
          assignedDate,
          expectedCompletionDate: jw.expectedDelivery,
          actualCompletionDate: jw.actualDelivery,
          materials,
          jobRate: jw.jobWorkerRate,
          totalAmount: jw.jobWorkCost,
          advancePaid: 0,
          balanceAmount: jw.jobWorkCost,
          paymentStatus: jw.paymentStatus || 'pending',
          paymentDate: jw.paymentDate,
          remarks: jw.remarks,
          createdBy: jw.createdBy,
          updatedBy: jw.updatedBy,
          createdAt: jw.createdAt,
          updatedAt: jw.updatedAt,
        };
      });

      res.status(200).json({
        success: true,
        data: assignments,
        total: assignments.length,
      });
    } catch (error) {
      logger.error('Error in getAssignmentsByWorker controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get assignments'
      });
    }
  };

  /**
   * Get assignment by ID
   */
  getAssignmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeSummary = req.query.includeSummary === 'true';

      if (includeSummary) {
        const result = await this.assignmentService.getAssignmentWithSummary(id);
        res.status(200).json({
          success: true,
          data: result
        });
      } else {
        const assignment = await this.assignmentService.findById(id, ['workerId', 'jobWorkId']);
        if (!assignment) {
          throw new AppError('Assignment not found', 404);
        }
        res.status(200).json({
          success: true,
          data: assignment
        });
      }
    } catch (error) {
      logger.error('Error in getAssignmentById controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get assignment'
      });
    }
  };

  /**
   * Update assignment
   */
  updateAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const assignment = await this.assignmentService.updateAssignment(
        id,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Error in updateAssignment controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update assignment'
      });
    }
  };

  /**
   * Update assignment status
   */
  updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const assignment = await this.assignmentService.updateStatus(
        id,
        status,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Assignment status updated successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Error in updateAssignmentStatus controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update assignment status'
      });
    }
  };

  // =============================================
  // MATERIAL TRACKING OPERATIONS
  // =============================================

  /**
   * Add material to assignment
   */
  addMaterial = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const assignment = await this.assignmentService.addMaterial(
        id,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Material added successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Error in addMaterial controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to add material'
      });
    }
  };

  /**
   * Update material tracking
   */
  updateMaterialTracking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, materialIndex } = req.params;
      const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const index = parseInt(materialIndex, 10);
      if (isNaN(index)) {
        throw new AppError('Invalid material index', 400);
      }

      const assignment = await this.assignmentService.updateMaterialTracking(
        id,
        index,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Material tracking updated successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('Error in updateMaterialTracking controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update material tracking'
      });
    }
  };

  /**
   * Get material tracking report for a worker
   */
  getMaterialTrackingReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workerId } = req.params;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const report = await this.assignmentService.getMaterialTrackingReport(
        workerId,
        dateFrom,
        dateTo
      );

      res.status(200).json({
        success: true,
        data: report,
        total: report.length
      });
    } catch (error) {
      logger.error('Error in getMaterialTrackingReport controller', { error });
      const err = error as AppError;
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to get material tracking report'
      });
    }
  };
}

