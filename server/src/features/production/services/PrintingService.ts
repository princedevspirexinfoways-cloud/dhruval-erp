import { BaseService } from '../../../services/BaseService';
import Printing, { IPrinting } from '../models/Printing';
import HazerSilicateCuring from '../models/HazerSilicateCuring';
import RejectionStock from '../models/RejectionStock';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { cleanObjectIdFields } from '../../../utils/cleanData';

export class PrintingService extends BaseService<any> {
  constructor() {
    super(Printing);
  }

  /**
   * Create a new printing entry
   */
  async createPrinting(data: Partial<IPrinting>, createdBy?: string): Promise<IPrinting> {
    try {
      // Clean up empty strings - convert to undefined for optional ObjectId fields
      const cleanedData = cleanObjectIdFields(
        {
          ...data,
          createdBy: createdBy || data.createdBy
        },
        ['customerId', 'sourceId']
      );

      const printing = await this.create(cleanedData, createdBy);
      logger.info('Printing entry created', { printingId: printing._id });
      return printing;
    } catch (error: any) {
      logger.error('Error creating printing entry', { error, data, errorMessage: error.message, errorName: error.name });
      
      // If it's a Mongoose validation error, extract field errors
      if (error.name === 'ValidationError' && error.errors) {
        const fieldErrors = Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }));
        const errorMessage = `Validation failed: ${fieldErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
        throw new AppError(errorMessage, 400, error);
      }
      
      // If it's a duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new AppError(`${field} already exists`, 400, error);
      }
      
      throw new AppError(error.message || 'Failed to create printing entry', 500, error);
    }
  }

  /**
   * Update printing output (printed, rejected meters)
   * Automatically moves:
   * - Printed Meter → Hazer/Silicate/Curing Module
   * - Rejected Meter → Rejection/Waste Stock
   * - Pending Meter → Remains in Printing WIP (auto-calculated)
   */
  async updateOutput(
    printingId: string,
    printedMeter: number,
    rejectedMeter: number,
    updatedBy?: string
  ): Promise<{ printing: IPrinting; rejectionStock?: any; hazerSilicateCuring?: any }> {
    try {
      const printing = await this.findById(printingId);
      if (!printing) {
        throw new AppError('Printing entry not found', 404);
      }

      // Validate
      if (printedMeter + rejectedMeter > printing.totalMeterReceived) {
        throw new AppError('Printed + Rejected meter cannot exceed received meter', 400);
      }

      // Calculate status based on output
      const pendingMeter = printing.totalMeterReceived - printedMeter - rejectedMeter;
      let status: 'pending' | 'in_progress' | 'completed' | 'on_hold' = 'pending';
      
      if (printedMeter === 0 && rejectedMeter === 0) {
        status = 'pending';
      } else if (pendingMeter > 0) {
        status = 'in_progress';
      } else if (pendingMeter === 0) {
        status = 'completed';
      }

      // Update printing - use findById and save to trigger pre-save middleware
      const printingDoc = await this.model.findById(printingId);
      if (!printingDoc) {
        throw new AppError('Printing entry not found', 404);
      }

      // Update the fields
      printingDoc.printedMeter = printedMeter;
      printingDoc.rejectedMeter = rejectedMeter;
      printingDoc.updatedBy = updatedBy || printing.createdBy;
      printingDoc.updatedAt = new Date();

      // Save to trigger pre-save middleware (this will auto-calculate pendingMeter and status)
      const updatedPrinting = await printingDoc.save();

      if (!updatedPrinting) {
        throw new AppError('Failed to update printing', 500);
      }

      // 1. Create rejection stock if rejected meter > 0
      let rejectionStock = null;
      if (rejectedMeter > 0) {
        rejectionStock = await RejectionStock.create({
          companyId: printing.companyId,
          lotNumber: printing.lotNumber,
          partyName: printing.partyName,
          sourceModule: 'printing',
          sourceId: printing._id,
          meter: rejectedMeter,
          reason: 'Printing rejection',
          createdBy: updatedBy || printing.createdBy
        });
        
        logger.info('Rejected meter moved to rejection stock', {
          printingId,
          rejectedMeter,
          rejectionStockId: rejectionStock._id
        });
      }

      // 2. Automatically create Hazer/Silicate/Curing entry if printed meter > 0
      let hazerSilicateCuring = null;
      if (printedMeter > 0) {
        hazerSilicateCuring = await HazerSilicateCuring.create({
          companyId: printing.companyId,
          printingId: printing._id,
          lotNumber: printing.lotNumber,
          partyName: printing.partyName,
          customerId: printing.customerId,
          quality: printing.quality,
          inputMeter: printedMeter, // Printed meter becomes input for hazer
          processType: 'hazer', // Default to hazer process
          date: new Date(),
          createdBy: updatedBy || printing.createdBy
        });

        logger.info('Printed meter automatically moved to Hazer/Silicate/Curing', {
          printingId,
          printedMeter,
          hazerSilicateCuringId: hazerSilicateCuring._id
        });
      }

      // 3. Pending meter remains in Printing WIP (auto-calculated by pre-save middleware)
      if (pendingMeter > 0) {
        logger.info('Pending meter remains in Printing WIP', {
          printingId,
          pendingMeter
        });
      }

      logger.info('Printing output updated with automatic movements', { 
        printingId, 
        printedMeter, 
        rejectedMeter,
        pendingMeter,
        status,
        rejectionStockCreated: !!rejectionStock,
        hazerSilicateCuringCreated: !!hazerSilicateCuring
      });

      return { 
        printing: updatedPrinting, 
        rejectionStock,
        hazerSilicateCuring
      };
    } catch (error: any) {
      logger.error('Error updating printing output', { error, printingId });
      throw new AppError('Failed to update printing output', 500, error);
    }
  }

  /**
   * Get all printing entries
   */
  async getAllPrintings(companyId: string, options?: { status?: string; lotNumber?: string; page?: number; limit?: number }): Promise<any> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }
      if (options?.lotNumber) {
        filter.lotNumber = options.lotNumber;
      }

      const page = options?.page || 1;
      const limit = Math.min(options?.limit || 20, 100); // Max 100, default 20
      const skip = (page - 1) * limit;

      // Optimize query with field selection and lean
      const [data, total] = await Promise.all([
        this.model
          .find(filter)
          .select('-__v') // Exclude version key
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter).exec()
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching printing entries', { error, companyId });
      throw new AppError('Failed to fetch printing entries', 500, error);
    }
  }

  /**
   * Get WIP (Work In Progress) - pending meter > 0
   */
  /**
   * Get WIP (Work In Progress) - entries with pending meter > 0
   */
  async getWIP(companyId: string): Promise<IPrinting[]> {
    try {
      // Use direct MongoDB query to avoid BaseService filter processing issues
      const documents = await this.model.find({
        companyId,
        pendingMeter: { $gt: 0 }
      })
      .sort({ date: -1 })
      .exec();

      return documents;
    } catch (error: any) {
      logger.error('Error fetching printing WIP', { error, companyId });
      
      // Fallback: try without pendingMeter filter and filter in memory
      try {
        logger.info('Attempting fallback printing WIP query');
        const allDocuments = await this.findMany({ companyId }, { sort: { date: -1 } });
        
        const wipDocuments = allDocuments.filter(doc => {
          const pendingMeter = doc.pendingMeter || 0;
          return typeof pendingMeter === 'number' && pendingMeter > 0;
        });
        
        return wipDocuments;
      } catch (fallbackError: any) {
        logger.error('Fallback printing WIP query failed', { fallbackError, companyId });
        throw new AppError('Failed to fetch printing WIP', 500, error);
      }
    }
  }
}

