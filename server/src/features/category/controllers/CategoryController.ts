import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    /**
     * Create a new category
     */
    createCategory = async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract and validate request body fields - ensure they are primitives, not objects
            const { companyId, name, description, icon, color } = req.body;
            
            // Validate name is a string primitive, not an object
            if (name != null && typeof name !== 'string') {
                logger.error('Invalid name type in request', {
                    name,
                    type: typeof name,
                    isObject: typeof name === 'object',
                    constructor: name?.constructor?.name
                });
                throw new AppError('Category name must be a string', 400);
            }
            
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
            const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            // Use companyId from request body, or fallback to user's companyId, or null
            const effectiveCompanyId = companyId || userCompanyId || null;

            // Build category data with explicit primitive values
            const categoryData: any = {
                companyId: effectiveCompanyId,
                name: typeof name === 'string' ? name : undefined,
                description: typeof description === 'string' ? description : undefined,
                icon: typeof icon === 'string' ? icon : undefined,
                color: typeof color === 'string' ? color : undefined,
            };

            const category = await this.categoryService.createCategory(
                categoryData,
                userId
            );

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category,
            });
        } catch (error) {
            logger.error('Error in createCategory controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to create category',
            });
        }
    };

    /**
     * Get all categories by company
     */
    getCategoriesByCompany = async (req: Request, res: Response): Promise<void> => {
        try {
            const companyId = req.query.companyId as string || (req as any).user?.companyId;
            const includeInactive = req.query.includeInactive === 'true';

            if (!companyId) {
                throw new AppError('Company ID is required', 400);
            }

            const categories = await this.categoryService.getCategoriesByCompany(
                companyId,
                includeInactive
            );

            res.status(200).json({
                success: true,
                data: categories,
                total: categories.length,
            });
        } catch (error) {
            logger.error('Error in getCategoriesByCompany controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to get categories',
            });
        }
    };

    /**
     * Get category by ID
     */
    getCategoryById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const category = await this.categoryService.findById(id);

            if (!category) {
                throw new AppError('Category not found', 404);
            }

            res.status(200).json({
                success: true,
                data: category,
            });
        } catch (error) {
            logger.error('Error in getCategoryById controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to get category',
            });
        }
    };

    /**
     * Update category
     */
    updateCategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, description, icon, color, isActive } = req.body;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            const category = await this.categoryService.updateCategory(
                id,
                { name, description, icon, color, isActive },
                userId
            );

            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: category,
            });
        } catch (error) {
            logger.error('Error in updateCategory controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to update category',
            });
        }
    };

    /**
     * Delete category (soft delete)
     */
    deleteCategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            await this.categoryService.deleteCategory(id, userId);

            res.status(200).json({
                success: true,
                message: 'Category deleted successfully',
            });
        } catch (error) {
            logger.error('Error in deleteCategory controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to delete category',
            });
        }
    };
}
