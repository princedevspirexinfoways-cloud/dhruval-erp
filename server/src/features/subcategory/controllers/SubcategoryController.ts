import { Request, Response } from 'express';
import { SubcategoryService } from '../services/SubcategoryService';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class SubcategoryController {
    private subcategoryService: SubcategoryService;

    constructor() {
        this.subcategoryService = new SubcategoryService();
    }

    /**
     * Create a new subcategory
     */
    createSubcategory = async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract and validate request body fields - ensure they are primitives, not objects
            const { categoryId, name, description, icon, color, companyId } = req.body;
            
            // Validate name is a string primitive, not an object
            if (name != null && typeof name !== 'string') {
                throw new AppError('Subcategory name must be a string', 400);
            }
            
            // Validate categoryId is a string primitive, not an object
            if (categoryId != null && typeof categoryId !== 'string') {
                throw new AppError('Category ID must be a string', 400);
            }
            
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
            const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            // Use companyId from request body, or fallback to user's companyId, or null
            const effectiveCompanyId = companyId || userCompanyId || null;

            // Build subcategory data with explicit primitive values
            const subcategoryData: any = {
                categoryId: typeof categoryId === 'string' ? categoryId : undefined,
                companyId: effectiveCompanyId,
                name: typeof name === 'string' ? name : undefined,
                description: typeof description === 'string' ? description : undefined,
                icon: typeof icon === 'string' ? icon : undefined,
                color: typeof color === 'string' ? color : undefined,
            };

            logger.info('Creating subcategory', { subcategoryData, userId });

            const subcategory = await this.subcategoryService.createSubcategory(
                subcategoryData,
                userId
            );

            if (!subcategory) {
                throw new AppError('Failed to create subcategory', 500);
            }

            res.status(201).json({
                success: true,
                message: 'Subcategory created successfully',
                data: subcategory,
            });
        } catch (error: any) {
            logger.error('Error in createSubcategory controller', { 
                error: error.message || error, 
                stack: error.stack,
                body: req.body 
            });
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to create subcategory',
                error: error.message,
            });
        }
    };

    /**
     * Get all subcategories with optional filters
     */
    getSubcategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const { categoryId, companyId, search, isActive } = req.query;

            const query: any = {};

            if (categoryId) {
                query.categoryId = categoryId;
            }

            if (companyId) {
                query.companyId = companyId;
            } else if ((req as any).user?.companyId) {
                query.companyId = (req as any).user.companyId;
            }

            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }

            const subcategories = await this.subcategoryService.findMany(query);

            res.json({
                success: true,
                message: 'Subcategories retrieved successfully',
                data: subcategories,
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve subcategories',
                error: error.message,
            });
        }
    };

    /**
     * Get subcategories by category ID
     */
    getSubcategoriesByCategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { categoryId } = req.params;

            if (!categoryId) {
                throw new AppError('Category ID is required', 400);
            }

            const subcategories = await this.subcategoryService.getSubcategoriesByCategory(categoryId);

            res.json({
                success: true,
                message: 'Subcategories retrieved successfully',
                data: subcategories,
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve subcategories',
                error: error.message,
            });
        }
    };

    /**
     * Get subcategory by ID
     */
    getSubcategoryById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const subcategory = await this.subcategoryService.findById(id);

            if (!subcategory) {
                throw new AppError('Subcategory not found', 404);
            }

            res.json({
                success: true,
                message: 'Subcategory retrieved successfully',
                data: subcategory,
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve subcategory',
                error: error.message,
            });
        }
    };

    /**
     * Update subcategory
     */
    updateSubcategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { categoryId, name, description, icon, color, isActive } = req.body;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            const subcategory = await this.subcategoryService.updateSubcategory(
                id,
                {
                    categoryId,
                    name,
                    description,
                    icon,
                    color,
                    isActive,
                },
                userId
            );

            if (!subcategory) {
                throw new AppError('Subcategory not found', 404);
            }

            res.json({
                success: true,
                message: 'Subcategory updated successfully',
                data: subcategory,
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to update subcategory',
                error: error.message,
            });
        }
    };

    /**
     * Delete subcategory (soft delete)
     */
    deleteSubcategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            await this.subcategoryService.delete(id, userId);

            res.json({
                success: true,
                message: 'Subcategory deleted successfully',
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to delete subcategory',
                error: error.message,
            });
        }
    };
}

