import { Request, Response } from 'express';
import { JobWorkTypeService } from '../services/JobWorkTypeService';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class JobWorkTypeController {
    private jobWorkTypeService: JobWorkTypeService;

    constructor() {
        this.jobWorkTypeService = new JobWorkTypeService();
    }

    /**
     * Create a new job work type
     */
    createJobWorkType = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, icon, color, companyId } = req.body;
            
            if (name != null && typeof name !== 'string') {
                throw new AppError('Job work type name must be a string', 400);
            }
            
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
            const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            const effectiveCompanyId = companyId || userCompanyId || null;

            const jobWorkTypeData: any = {
                name: typeof name === 'string' ? name : undefined,
                description: typeof description === 'string' ? description : undefined,
                icon: typeof icon === 'string' ? icon : undefined,
                color: typeof color === 'string' ? color : undefined,
                companyId: effectiveCompanyId,
            };

            logger.info('Creating job work type', { jobWorkTypeData, userId });

            const jobWorkType = await this.jobWorkTypeService.createJobWorkType(
                jobWorkTypeData,
                userId
            );

            if (!jobWorkType) {
                throw new AppError('Failed to create job work type', 500);
            }

            res.status(201).json({
                success: true,
                message: 'Job work type created successfully',
                data: jobWorkType,
            });
        } catch (error: any) {
            logger.error('Error in createJobWorkType controller', { 
                error: error.message || error, 
                stack: error.stack,
                body: req.body 
            });
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to create job work type',
                error: error.message,
            });
        }
    };

    /**
     * Get all job work types with optional filters
     */
    getJobWorkTypes = async (req: Request, res: Response): Promise<void> => {
        try {
            const { companyId, search, isActive } = req.query;
            const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

            const query: any = {};

            if (companyId) {
                query.companyId = companyId;
            } else if (userCompanyId) {
                query.companyId = userCompanyId;
            } else {
                query.companyId = null;
            }

            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            } else {
                query.isActive = true;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }

            const jobWorkTypes = await this.jobWorkTypeService.findMany(query, { sort: { name: 1 } });

            res.json({
                success: true,
                message: 'Job work types retrieved successfully',
                data: jobWorkTypes,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve job work types',
                error: error.message,
            });
        }
    };

    /**
     * Get job work type by ID
     */
    getJobWorkTypeById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const jobWorkType = await this.jobWorkTypeService.findById(id);

            if (!jobWorkType) {
                throw new AppError('Job work type not found', 404);
            }

            res.json({
                success: true,
                message: 'Job work type retrieved successfully',
                data: jobWorkType,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve job work type',
                error: error.message,
            });
        }
    };

    /**
     * Update job work type
     */
    updateJobWorkType = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, description, icon, color, isActive } = req.body;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            const jobWorkType = await this.jobWorkTypeService.updateJobWorkType(
                id,
                {
                    name,
                    description,
                    icon,
                    color,
                    isActive,
                },
                userId
            );

            if (!jobWorkType) {
                throw new AppError('Job work type not found', 404);
            }

            res.json({
                success: true,
                message: 'Job work type updated successfully',
                data: jobWorkType,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to update job work type',
                error: error.message,
            });
        }
    };

    /**
     * Delete job work type (soft delete)
     */
    deleteJobWorkType = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            await this.jobWorkTypeService.delete(id, userId);

            res.json({
                success: true,
                message: 'Job work type deleted successfully',
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to delete job work type',
                error: error.message,
            });
        }
    };
}















