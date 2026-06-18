import { BaseService } from '../../../services/BaseService';
import Category, { ICategory } from '../models/Category';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class CategoryService extends BaseService<ICategory> {
    constructor() {
        super(Category);
    }

    /**
     * Create a new category with validation
     */
    async createCategory(
        categoryData: Partial<ICategory>,
        createdBy: string
    ): Promise<ICategory> {
        try {
            // Immediately extract all primitive values to prevent any mutation issues
            // Create a snapshot of the input data to avoid reference problems
            const inputSnapshot = {
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
                color: categoryData.color,
                companyId: categoryData.companyId,
                isActive: categoryData.isActive,
            };
            
            // Extract and clean the name FIRST - ensure it's a string, not an object
            // Defensively extract primitive values to avoid any object reference issues
            const rawName = inputSnapshot.name;
            
            // Ensure name is a string - reject any object types (including regex objects)
            let categoryName: string;
            if (typeof rawName === 'string') {
                categoryName = rawName.trim();
            } else if (rawName == null) {
                categoryName = '';
            } else {
                // If it's an object (like a regex query), log and reject
                const rawNameObj = rawName as any;
                logger.warn('Invalid name type received', { 
                    type: typeof rawName, 
                    value: rawName,
                    isObject: typeof rawName === 'object',
                    constructor: rawNameObj?.constructor?.name
                });
                throw new AppError('Category name must be a string, not an object', 400);
            }

            if (!categoryName) {
                throw new AppError('Category name is required', 400);
            }

            // Validate category data with clean name
            this.validateCategoryData({ ...inputSnapshot, name: categoryName });

            // Extract companyId as a primitive value
            const companyIdValue = inputSnapshot.companyId;
            
            // Check if category name already exists - use simple query without regex
            // Fetch categories and do case-insensitive comparison in JavaScript to avoid regex objects
            const companyFilter: any = companyIdValue 
                ? { companyId: new Types.ObjectId(companyIdValue.toString()) }
                : { companyId: null };
            
            const existingCategories = await Category.find(companyFilter).select('name').lean().exec();
            
            // Check for duplicate name (case-insensitive) in JavaScript
            const duplicateExists = existingCategories.some(
                (cat: any) => cat.name && cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
            );

            if (duplicateExists) {
                throw new AppError(
                    'Category with this name already exists in the company',
                    400
                );
            }

            // Build the final data object using ONLY primitive variables
            // Extract all values as primitives FIRST, before creating any objects
            const nameStr: string = String(categoryName);
            const descStr: string = typeof inputSnapshot.description === 'string' 
                ? String(inputSnapshot.description).trim() 
                : '';
            const iconStr: string = typeof inputSnapshot.icon === 'string' 
                ? String(inputSnapshot.icon) 
                : '📦';
            const colorStr: string = typeof inputSnapshot.color === 'string' 
                ? String(inputSnapshot.color) 
                : '#6b7280';
            const companyIdObj = companyIdValue 
                ? new Types.ObjectId(companyIdValue.toString()) 
                : null;
            const isActiveBool: boolean = inputSnapshot.isActive !== undefined 
                ? Boolean(inputSnapshot.isActive) 
                : true;

            // Validate nameStr is definitely a string primitive
            if (typeof nameStr !== 'string' || nameStr === '[object Object]') {
                logger.error('Name string validation failed', {
                    nameStr,
                    type: typeof nameStr,
                    categoryName,
                    categoryNameType: typeof categoryName
                });
                throw new AppError('Category name must be a string', 400);
            }

            // Create final data using object literal with direct primitive values
            // This ensures no property access, getters, or references can interfere
            const finalData: any = {
                name: nameStr,  // Direct primitive assignment
                description: descStr,
                icon: iconStr,
                color: colorStr,
                companyId: companyIdObj,
                isActive: isActiveBool,
            };

            // Validate the object we just created
            if (typeof finalData.name !== 'string') {
                logger.error('Final data object name validation failed', {
                    name: finalData.name,
                    type: typeof finalData.name,
                    nameStr,
                    nameStrType: typeof nameStr
                });
                throw new AppError('Category name must be a string in final data object', 400);
            }

            // Additional safety check - ensure it's not a regex object
            if (finalData.name && typeof finalData.name === 'object') {
                logger.error('Name is an object in finalData - this should never happen', {
                    name: finalData.name,
                    keys: Object.keys(finalData.name || {})
                });
                throw new AppError('Category name cannot be an object', 400);
            }

            // Log before creation with detailed info
            logger.info('Creating category with validated data', {
                name: finalData.name,
                nameType: typeof finalData.name,
                nameValue: String(finalData.name),
                companyId: finalData.companyId,
                allKeys: Object.keys(finalData)
            });

            const category = await this.create(finalData, createdBy);

            logger.info('Category created successfully', {
                categoryId: category._id,
                name: category.name,
                companyId: companyIdValue,
                createdBy,
            });

            return category;
        } catch (error) {
            logger.error('Error creating category', { 
                error, 
                categoryData, 
                createdBy,
                errorName: (error as any)?.name,
                errorMessage: (error as any)?.message
            });
            throw error;
        }
    }

    /**
     * Update category
     */
    async updateCategory(
        categoryId: string,
        categoryData: Partial<ICategory>,
        updatedBy: string
    ): Promise<ICategory | null> {
        try {
            const category = await this.findById(categoryId);
            if (!category) {
                throw new AppError('Category not found', 404);
            }

            // If name is being updated, check for duplicates
            if (categoryData.name && categoryData.name !== category.name) {
                // Use model directly for regex queries to avoid casting issues
                const existingCategory = await Category.findOne({
                    companyId: category.companyId,
                    name: { $regex: new RegExp(`^${categoryData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    _id: { $ne: new Types.ObjectId(categoryId) },
                }).exec();

                if (existingCategory) {
                    throw new AppError(
                        'Category with this name already exists in the company',
                        400
                    );
                }
            }

            const updatedCategory = await this.update(
                categoryId,
                {
                    ...categoryData,
                    lastModifiedBy: new Types.ObjectId(updatedBy),
                },
                updatedBy
            );

            logger.info('Category updated successfully', {
                categoryId,
                updatedBy,
            });

            return updatedCategory;
        } catch (error) {
            logger.error('Error updating category', { error, categoryId, categoryData });
            throw error;
        }
    }

    /**
     * Get all categories for a company
     */
    async getCategoriesByCompany(
        companyId: string,
        includeInactive: boolean = false
    ): Promise<ICategory[]> {
        try {
            const filter: any = { companyId: new Types.ObjectId(companyId) };
            if (!includeInactive) {
                filter.isActive = true;
            }

            const categories = await this.findMany(filter, { sort: { name: 1 } });

            logger.info(`Found ${categories.length} categories for company ${companyId}`);
            return categories;
        } catch (error) {
            logger.error('Error getting categories by company', { error, companyId });
            throw error;
        }
    }

    /**
     * Delete category (soft delete)
     */
    async deleteCategory(categoryId: string, deletedBy: string): Promise<ICategory | null> {
        try {
            // Check if category is in use by any inventory items
            const InventoryItem = (await import('../../../models/InventoryItem')).default;
            const itemsUsingCategory = await InventoryItem.countDocuments({
                categoryId: new Types.ObjectId(categoryId),
            });

            if (itemsUsingCategory > 0) {
                throw new AppError(
                    `Cannot delete category. It is being used by ${itemsUsingCategory} inventory item(s)`,
                    400
                );
            }

            const deletedCategory = await this.update(
                categoryId,
                {
                    isActive: false,
                    lastModifiedBy: new Types.ObjectId(deletedBy),
                },
                deletedBy
            );

            logger.info('Category deleted successfully', {
                categoryId,
                deletedBy,
            });

            return deletedCategory;
        } catch (error) {
            logger.error('Error deleting category', { error, categoryId });
            throw error;
        }
    }

    /**
     * Validate category data
     */
    private validateCategoryData(categoryData: Partial<ICategory>): void {
        // Only name is required from user input
        if (!categoryData.name || categoryData.name.trim() === '') {
            throw new AppError('Category name is required', 400);
        }

        if (categoryData.name.length > 100) {
            throw new AppError('Category name cannot exceed 100 characters', 400);
        }

        if (categoryData.description && categoryData.description.length > 500) {
            throw new AppError('Description cannot exceed 500 characters', 400);
        }

        // CompanyId will be set from user context if not provided
        // This allows flexibility for super admins
    }
}
