import { Request, Response } from 'express';
import { UnitService } from '../services/UnitService';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class UnitController {
    private unitService: UnitService;

    constructor() {
        this.unitService = new UnitService();
    }

    /**
     * Create a new unit
     */
    createUnit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { companyId, name, symbol, description, baseUnit, conversionFactor } = req.body;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;
            const userCompanyId = (req as any).user?.companyId || (req as any).user?.companyAccess?.[0]?.companyId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            // Use companyId from request body, or fallback to user's companyId, or null
            const effectiveCompanyId = companyId || userCompanyId || null;

            const unit = await this.unitService.createUnit(
                {
                    companyId: effectiveCompanyId,
                    name,
                    symbol,
                    description,
                    baseUnit,
                    conversionFactor: conversionFactor || 1,
                },
                userId
            );

            res.status(201).json({
                success: true,
                message: 'Unit created successfully',
                data: unit,
            });
        } catch (error) {
            logger.error('Error in createUnit controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to create unit',
            });
        }
    };

    /**
     * Get all units by company
     */
    getUnitsByCompany = async (req: Request, res: Response): Promise<void> => {
        try {
            const companyId = req.query.companyId as string || (req as any).user?.companyId;
            const includeInactive = req.query.includeInactive === 'true';

            if (!companyId) {
                throw new AppError('Company ID is required', 400);
            }

            const units = await this.unitService.getUnitsByCompany(companyId, includeInactive);

            res.status(200).json({
                success: true,
                data: units,
                total: units.length,
            });
        } catch (error) {
            logger.error('Error in getUnitsByCompany controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to get units',
            });
        }
    };

    /**
     * Get unit by ID
     */
    getUnitById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const unit = await this.unitService.findById(id);

            if (!unit) {
                throw new AppError('Unit not found', 404);
            }

            res.status(200).json({
                success: true,
                data: unit,
            });
        } catch (error) {
            logger.error('Error in getUnitById controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to get unit',
            });
        }
    };

    /**
     * Update unit
     */
    updateUnit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, symbol, description, baseUnit, conversionFactor, isActive } = req.body;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            const unit = await this.unitService.updateUnit(
                id,
                { name, symbol, description, baseUnit, conversionFactor, isActive },
                userId
            );

            res.status(200).json({
                success: true,
                message: 'Unit updated successfully',
                data: unit,
            });
        } catch (error) {
            logger.error('Error in updateUnit controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to update unit',
            });
        }
    };

    /**
     * Delete unit (soft delete)
     */
    deleteUnit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }

            await this.unitService.deleteUnit(id, userId);

            res.status(200).json({
                success: true,
                message: 'Unit deleted successfully',
            });
        } catch (error) {
            logger.error('Error in deleteUnit controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to delete unit',
            });
        }
    };

    /**
     * Convert quantity between units
     */
    convertQuantity = async (req: Request, res: Response): Promise<void> => {
        try {
            const { quantity, fromUnitId, toUnitId } = req.body;

            if (!quantity || !fromUnitId || !toUnitId) {
                throw new AppError('Quantity, fromUnitId, and toUnitId are required', 400);
            }

            const convertedQuantity = await this.unitService.convertQuantity(
                quantity,
                fromUnitId,
                toUnitId
            );

            res.status(200).json({
                success: true,
                data: {
                    originalQuantity: quantity,
                    convertedQuantity,
                    fromUnitId,
                    toUnitId,
                },
            });
        } catch (error) {
            logger.error('Error in convertQuantity controller', { error });
            const err = error as AppError;
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message || 'Failed to convert quantity',
            });
        }
    };
}
