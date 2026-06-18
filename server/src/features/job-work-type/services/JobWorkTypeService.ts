import { BaseService } from '../../../services/BaseService';
import JobWorkType, { IJobWorkType } from '../models/JobWorkType';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class JobWorkTypeService extends BaseService<IJobWorkType> {
    constructor() {
        super(JobWorkType);
    }

    /**
     * Create a new job work type with validation
     */
    async createJobWorkType(
        jobWorkTypeData: Partial<IJobWorkType>,
        createdBy: string
    ): Promise<IJobWorkType> {
        try {
            // Validate job work type data
            this.validateJobWorkTypeData(jobWorkTypeData);

            // Convert companyId to ObjectId if it's a string
            let companyId: Types.ObjectId | null = null;
            if (jobWorkTypeData.companyId) {
                try {
                    companyId = typeof jobWorkTypeData.companyId === 'string'
                        ? new Types.ObjectId(jobWorkTypeData.companyId)
                        : (jobWorkTypeData.companyId as Types.ObjectId);
                } catch (error) {
                    throw new AppError('Invalid company ID format', 400);
                }
            }

            // Check if job work type name already exists for this company
            const findQuery: any = {
                name: { $regex: new RegExp(`^${jobWorkTypeData.name}$`, 'i') },
            };
            if (companyId) {
                findQuery.companyId = companyId;
            } else {
                findQuery.companyId = null;
            }

            let existingJobWorkType = null;
            try {
                existingJobWorkType = await this.findOne(findQuery);
            } catch (error: any) {
                logger.warn('Error checking for existing job work type', { error: error.message });
            }

            if (existingJobWorkType) {
                throw new AppError(
                    'Job work type with this name already exists in the company',
                    400
                );
            }

            // Prepare data with proper ObjectId conversions
            const dataToCreate: any = {
                ...jobWorkTypeData,
                companyId: companyId,
                createdBy: new Types.ObjectId(createdBy),
                lastModifiedBy: new Types.ObjectId(createdBy),
            };

            let jobWorkType: IJobWorkType;
            try {
                jobWorkType = await this.create(
                    dataToCreate,
                    createdBy
                );
            } catch (err: any) {
                // Handle duplicate key error from MongoDB
                if (err && (err.code === 11000 || err.code === 11001)) {
                    const keyPattern = err.keyPattern || {};
                    if (keyPattern.name || (err.message && err.message.includes('name'))) {
                        throw new AppError(
                            `Job work type with name "${jobWorkTypeData.name}" already exists for this company`,
                            400
                        );
                    }
                    throw new AppError(
                        'Job work type with this name already exists for this company',
                        400
                    );
                }
                throw err;
            }

            logger.info('Job work type created successfully', {
                jobWorkTypeId: jobWorkType._id,
                name: jobWorkType.name,
                companyId: companyId,
                createdBy,
            });

            return jobWorkType;
        } catch (error: any) {
            logger.error('Error creating job work type', { 
                error: error.message || error, 
                stack: error.stack,
                jobWorkTypeData 
            });
            
            if (error instanceof AppError) {
                throw error;
            }
            
            throw new AppError(
                error.message || 'Failed to create job work type',
                error.statusCode || 500,
                error
            );
        }
    }

    /**
     * Update job work type
     */
    async updateJobWorkType(
        id: string,
        jobWorkTypeData: Partial<IJobWorkType>,
        updatedBy: string
    ): Promise<IJobWorkType | null> {
        try {
            this.validateJobWorkTypeData(jobWorkTypeData, true);

            // Check if name is being updated and if it conflicts
            if (jobWorkTypeData.name) {
                const existing = await this.findById(id);
                if (!existing) {
                    throw new AppError('Job work type not found', 404);
                }

                const findQuery: any = {
                    _id: { $ne: id },
                    name: { $regex: new RegExp(`^${jobWorkTypeData.name}$`, 'i') },
                };
                
                if (existing.companyId) {
                    findQuery.companyId = existing.companyId;
                } else {
                    findQuery.companyId = null;
                }

                const existingJobWorkType = await this.findOne(findQuery);

                if (existingJobWorkType) {
                    throw new AppError(
                        'Job work type with this name already exists in the company',
                        400
                    );
                }
            }

            const updated = await this.update(
                id,
                {
                    ...jobWorkTypeData,
                    lastModifiedBy: new Types.ObjectId(updatedBy),
                },
                updatedBy
            );

            logger.info('Job work type updated successfully', { jobWorkTypeId: id });
            return updated;
        } catch (error) {
            logger.error('Error updating job work type', { error, id, jobWorkTypeData });
            throw error;
        }
    }

    /**
     * Get job work types by company
     */
    async getJobWorkTypesByCompany(companyId?: string): Promise<IJobWorkType[]> {
        try {
            const filter: any = {};
            if (companyId) {
                filter.companyId = new Types.ObjectId(companyId);
            } else {
                filter.companyId = null;
            }
            filter.isActive = true;

            return await this.findMany(filter, { sort: { name: 1 } });
        } catch (error) {
            logger.error('Error fetching job work types by company', { error, companyId });
            throw error;
        }
    }

    /**
     * Validate job work type data
     */
    private validateJobWorkTypeData(
        jobWorkTypeData: Partial<IJobWorkType>,
        isUpdate: boolean = false
    ): void {
        if (!isUpdate && !jobWorkTypeData.name) {
            throw new AppError('Job work type name is required', 400);
        }

        if (jobWorkTypeData.name && jobWorkTypeData.name.length > 100) {
            throw new AppError('Job work type name must be less than 100 characters', 400);
        }

        if (jobWorkTypeData.description && jobWorkTypeData.description.length > 500) {
            throw new AppError('Description must be less than 500 characters', 400);
        }
    }
}















