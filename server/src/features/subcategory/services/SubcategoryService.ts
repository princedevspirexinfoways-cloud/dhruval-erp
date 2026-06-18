import { BaseService } from '../../../services/BaseService';
import Subcategory, { ISubcategory } from '../models/Subcategory';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class SubcategoryService extends BaseService<ISubcategory> {
    constructor() {
        super(Subcategory);
    }

    /**
     * Create a new subcategory with validation
     */
    async createSubcategory(
        subcategoryData: Partial<ISubcategory>,
        createdBy: string
    ): Promise<ISubcategory> {
        try {
            // Validate subcategory data
            this.validateSubcategoryData(subcategoryData);

            // Convert categoryId to ObjectId if it's a string
            let categoryId: Types.ObjectId;
            try {
                categoryId = typeof subcategoryData.categoryId === 'string' 
                    ? new Types.ObjectId(subcategoryData.categoryId)
                    : (subcategoryData.categoryId as Types.ObjectId);
            } catch (error) {
                throw new AppError('Invalid category ID format', 400);
            }

            // Check if subcategory name already exists for this category
            let existingSubcategory = null;
            try {
                existingSubcategory = await this.findOne({
                    categoryId: categoryId,
                    name: { $regex: new RegExp(`^${subcategoryData.name}$`, 'i') },
                });
            } catch (error: any) {
                // If findOne throws an error (not just returns null), log it but don't fail
                logger.warn('Error checking for existing subcategory', { error: error.message });
                // Continue with creation - the unique index will catch duplicates
            }

            if (existingSubcategory) {
                throw new AppError(
                    'Subcategory with this name already exists for this category',
                    400
                );
            }

            // Prepare data with proper ObjectId conversions
            const dataToCreate: any = {
                ...subcategoryData,
                categoryId: categoryId,
                createdBy: new Types.ObjectId(createdBy),
                lastModifiedBy: new Types.ObjectId(createdBy),
            };

            // Convert companyId to ObjectId if provided
            if (subcategoryData.companyId) {
                dataToCreate.companyId = typeof subcategoryData.companyId === 'string'
                    ? new Types.ObjectId(subcategoryData.companyId)
                    : subcategoryData.companyId;
            }

            logger.info('Creating subcategory with data', {
                dataToCreate,
                createdBy
            });

            const subcategory = await this.create(
                dataToCreate,
                createdBy
            );

            if (!subcategory) {
                throw new AppError('Failed to create subcategory - no document returned', 500);
            }

            logger.info('Subcategory created successfully', {
                subcategoryId: subcategory._id,
                categoryId: categoryId,
            });

            return subcategory;
        } catch (error: any) {
            logger.error('Error creating subcategory', { 
                error: error.message || error, 
                stack: error.stack,
                subcategoryData 
            });
            
            // Re-throw AppError as-is
            if (error.name === 'AppError' || error instanceof AppError) {
                throw error;
            }
            
            // Wrap other errors
            throw new AppError(
                error.message || 'Failed to create subcategory',
                error.statusCode || 500,
                error
            );
        }
    }

    /**
     * Update subcategory
     */
    async updateSubcategory(
        id: string,
        subcategoryData: Partial<ISubcategory>,
        updatedBy: string
    ): Promise<ISubcategory | null> {
        try {
            this.validateSubcategoryData(subcategoryData, true);

            // Check if name is being updated and if it conflicts
            if (subcategoryData.name) {
                const existingSubcategory = await this.findOne({
                    _id: { $ne: id },
                    categoryId: subcategoryData.categoryId || (await this.findById(id))?.categoryId,
                    name: { $regex: new RegExp(`^${subcategoryData.name}$`, 'i') },
                });

                if (existingSubcategory) {
                    throw new AppError(
                        'Subcategory with this name already exists for this category',
                        400
                    );
                }
            }

            const updated = await this.update(
                id,
                {
                    ...subcategoryData,
                    lastModifiedBy: new Types.ObjectId(updatedBy),
                },
                updatedBy
            );

            logger.info('Subcategory updated successfully', { subcategoryId: id });
            return updated;
        } catch (error) {
            logger.error('Error updating subcategory', { error, id, subcategoryData });
            throw error;
        }
    }

    /**
     * Get subcategories by category ID
     */
    async getSubcategoriesByCategory(categoryId: string): Promise<ISubcategory[]> {
        try {
            return await this.findMany({
                categoryId: new Types.ObjectId(categoryId),
                isActive: true,
            });
        } catch (error) {
            logger.error('Error fetching subcategories by category', { error, categoryId });
            throw error;
        }
    }

    /**
     * Validate subcategory data
     */
    private validateSubcategoryData(
        subcategoryData: Partial<ISubcategory>,
        isUpdate: boolean = false
    ): void {
        if (!isUpdate && !subcategoryData.name) {
            throw new AppError('Subcategory name is required', 400);
        }

        if (!isUpdate && !subcategoryData.categoryId) {
            throw new AppError('Category ID is required', 400);
        }

        if (subcategoryData.name && subcategoryData.name.length > 100) {
            throw new AppError('Subcategory name must be less than 100 characters', 400);
        }

        if (subcategoryData.description && subcategoryData.description.length > 500) {
            throw new AppError('Description must be less than 500 characters', 400);
        }
    }
}

