import { BaseService } from '../../../services/BaseService';
import Unit, { IUnit } from '../models/Unit';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { Types } from 'mongoose';

export class UnitService extends BaseService<IUnit> {
    constructor() {
        super(Unit);
    }

    /**
     * Create a new unit with validation
     */
    async createUnit(unitData: Partial<IUnit>, createdBy: string): Promise<IUnit> {
        try {
            // Validate unit data
            this.validateUnitData(unitData);

            // Convert companyId to ObjectId if it's a string
            let companyId: Types.ObjectId | null = null;
            if (unitData.companyId) {
                try {
                    companyId = typeof unitData.companyId === 'string'
                        ? new Types.ObjectId(unitData.companyId)
                        : (unitData.companyId as Types.ObjectId);
                } catch (error) {
                    throw new AppError('Invalid company ID format', 400);
                }
            }

            // Check if unit name or symbol already exists (for the same company or globally if no companyId)
            const findQuery: any = {
                $or: [
                    { name: { $regex: new RegExp(`^${unitData.name}$`, 'i') } },
                    { symbol: { $regex: new RegExp(`^${unitData.symbol}$`, 'i') } },
                ],
            };
            if (companyId) {
                findQuery.companyId = companyId;
            } else {
                findQuery.companyId = null;
            }
            
            let existingUnit = null;
            try {
                existingUnit = await this.findOne(findQuery);
            } catch (error: any) {
                // If findOne throws an error, log it but don't fail - the unique index will catch duplicates
                logger.warn('Error checking for existing unit', { error: error.message });
            }

            if (existingUnit) {
                throw new AppError(
                    'Unit with this name or symbol already exists in the company',
                    400
                );
            }

            // Prepare data with proper ObjectId conversions
            const dataToCreate: any = {
                ...unitData,
                companyId: companyId,
                createdBy: new Types.ObjectId(createdBy),
                lastModifiedBy: new Types.ObjectId(createdBy),
            };

            let unit: IUnit;
            try {
                unit = await this.create(
                    dataToCreate,
                    createdBy
                );
            } catch (err: any) {
                // Handle duplicate key error from MongoDB (race conditions or index violations)
                if (err && (err.code === 11000 || err.code === 11001)) {
                    // Check which field caused the duplicate
                    const keyPattern = err.keyPattern || {};
                    const keyValue = err.keyValue || {};
                    
                    if (keyPattern.symbol || (err.message && err.message.includes('symbol'))) {
                        throw new AppError(
                            `Unit with symbol "${keyValue.symbol || unitData.symbol}" already exists for this company`,
                            400
                        );
                    }
                    if (keyPattern.name || (err.message && err.message.includes('name'))) {
                        throw new AppError(
                            `Unit with name "${keyValue.name || unitData.name}" already exists for this company`,
                            400
                        );
                    }
                    throw new AppError(
                        'Unit with this name or symbol already exists for this company',
                        400
                    );
                }
                throw err;
            }

            logger.info('Unit created successfully', {
                unitId: unit._id,
                name: unit.name,
                symbol: unit.symbol,
                companyId: unitData.companyId,
                createdBy,
            });

            return unit;
        } catch (error: any) {
            logger.error('Error creating unit', { error, unitData, createdBy });
            
            // Re-throw AppError as-is
            if (error instanceof AppError) {
                throw error;
            }
            
            // Wrap other errors
            throw new AppError(
                error.message || 'Failed to create unit',
                error.statusCode || 500,
                error
            );
        }
    }

    /**
     * Update unit
     */
    async updateUnit(
        unitId: string,
        unitData: Partial<IUnit>,
        updatedBy: string
    ): Promise<IUnit | null> {
        try {
            const unit = await this.findById(unitId);
            if (!unit) {
                throw new AppError('Unit not found', 404);
            }

            // If name or symbol is being updated, check for duplicates
            if (
                (unitData.name && unitData.name !== unit.name) ||
                (unitData.symbol && unitData.symbol !== unit.symbol)
            ) {
                const existingUnit = await this.findOne({
                    companyId: unit.companyId,
                    $or: [
                        { name: { $regex: new RegExp(`^${unitData.name || unit.name}$`, 'i') } },
                        { symbol: { $regex: new RegExp(`^${unitData.symbol || unit.symbol}$`, 'i') } },
                    ],
                    _id: { $ne: unitId },
                });

                if (existingUnit) {
                    throw new AppError(
                        'Unit with this name or symbol already exists in the company',
                        400
                    );
                }
            }

            const updatedUnit = await this.update(
                unitId,
                {
                    ...unitData,
                    lastModifiedBy: new Types.ObjectId(updatedBy),
                },
                updatedBy
            );

            logger.info('Unit updated successfully', {
                unitId,
                updatedBy,
            });

            return updatedUnit;
        } catch (error) {
            logger.error('Error updating unit', { error, unitId, unitData });
            throw error;
        }
    }

    /**
     * Get all units for a company
     */
    async getUnitsByCompany(
        companyId: string,
        includeInactive: boolean = false
    ): Promise<IUnit[]> {
        try {
            const filter: any = { companyId: new Types.ObjectId(companyId) };
            if (!includeInactive) {
                filter.isActive = true;
            }

            const units = await this.findMany(filter, { sort: { name: 1 } });

            logger.info(`Found ${units.length} units for company ${companyId}`);
            return units;
        } catch (error) {
            logger.error('Error getting units by company', { error, companyId });
            throw error;
        }
    }

    /**
     * Delete unit (soft delete)
     */
    async deleteUnit(unitId: string, deletedBy: string): Promise<IUnit | null> {
        try {
            // Check if unit is in use by any inventory items
            const InventoryItem = (await import('../../../models/InventoryItem')).default;
            const itemsUsingUnit = await InventoryItem.countDocuments({
                'stock.unit': (await this.findById(unitId))?.symbol,
            });

            if (itemsUsingUnit > 0) {
                throw new AppError(
                    `Cannot delete unit. It is being used by ${itemsUsingUnit} inventory item(s)`,
                    400
                );
            }

            const deletedUnit = await this.update(
                unitId,
                {
                    isActive: false,
                    lastModifiedBy: new Types.ObjectId(deletedBy),
                },
                deletedBy
            );

            logger.info('Unit deleted successfully', {
                unitId,
                deletedBy,
            });

            return deletedUnit;
        } catch (error) {
            logger.error('Error deleting unit', { error, unitId });
            throw error;
        }
    }

    /**
     * Convert quantity from one unit to another
     */
    async convertQuantity(
        quantity: number,
        fromUnitId: string,
        toUnitId: string
    ): Promise<number> {
        try {
            const fromUnit = await this.findById(fromUnitId);
            const toUnit = await this.findById(toUnitId);

            if (!fromUnit || !toUnit) {
                throw new AppError('Unit not found', 404);
            }

            // Check if units have the same base unit
            if (fromUnit.baseUnit !== toUnit.baseUnit) {
                throw new AppError('Cannot convert between units with different base units', 400);
            }

            // Convert to base unit first, then to target unit
            const baseQuantity = quantity * fromUnit.conversionFactor;
            const convertedQuantity = baseQuantity / toUnit.conversionFactor;

            return convertedQuantity;
        } catch (error) {
            logger.error('Error converting quantity', {
                error,
                quantity,
                fromUnitId,
                toUnitId,
            });
            throw error;
        }
    }

    /**
     * Validate unit data
     */
    private validateUnitData(unitData: Partial<IUnit>): void {
        if (!unitData.companyId) {
            throw new AppError('Company ID is required', 400);
        }

        if (!unitData.name) {
            throw new AppError('Unit name is required', 400);
        }

        if (!unitData.symbol) {
            throw new AppError('Unit symbol is required', 400);
        }

        if (unitData.name.length > 100) {
            throw new AppError('Unit name cannot exceed 100 characters', 400);
        }

        if (unitData.symbol.length > 20) {
            throw new AppError('Unit symbol cannot exceed 20 characters', 400);
        }

        if (unitData.description && unitData.description.length > 500) {
            throw new AppError('Description cannot exceed 500 characters', 400);
        }

        if (
            unitData.conversionFactor !== undefined &&
            (unitData.conversionFactor <= 0 || isNaN(unitData.conversionFactor))
        ) {
            throw new AppError('Conversion factor must be a positive number', 400);
        }
    }
}
