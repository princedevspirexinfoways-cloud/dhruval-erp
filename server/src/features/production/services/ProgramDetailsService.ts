import { BaseService } from '../../../services/BaseService';
import ProgramDetails, { IProgramDetails } from '../models/ProgramDetails';
import { AppError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class ProgramDetailsService extends BaseService<any> {
  constructor() {
    super(ProgramDetails);
  }

  /**
   * Create a new program details entry
   */
  async createProgramDetails(data: Partial<IProgramDetails>, createdBy?: string): Promise<IProgramDetails> {
    try {
      const programData: any = {
        ...data,
        createdBy: createdBy || data.createdBy
      };

      // Auto-calculate meter for each design if not provided
      if (programData.designs && programData.fold) {
        programData.designs = programData.designs.map(design => ({
          ...design,
          meter: design.meter || (design.bale * 600 * programData.fold)
        }));
      }

      const program = await this.create(programData, createdBy);
      logger.info('Program details created', { programId: program._id });
      return program;
    } catch (error: any) {
      logger.error('Error creating program details', { error, data });
      throw new AppError('Failed to create program details', 500, error);
    }
  }

  /**
   * Get program details by order number
   */
  async getByOrderNumber(companyId: string, orderNumber: string): Promise<IProgramDetails | null> {
    try {
      return await this.findOne({ companyId, orderNumber });
    } catch (error: any) {
      logger.error('Error fetching program details by order number', { error, companyId, orderNumber });
      throw new AppError('Failed to fetch program details', 500, error);
    }
  }

  /**
   * Get all program details for a company
   */
  async getByCompany(companyId: string, options?: { page?: number; limit?: number; status?: string }): Promise<any> {
    try {
      const filter: any = { companyId };
      if (options?.status) {
        filter.status = options.status;
      }

      const page = options?.page || 1;
      const limit = Math.min(options?.limit || 20, 100); // Max 100, default 20
      const skip = (page - 1) * limit;

      // Fast path: Check if any documents exist first (optimization for empty collections)
      const countPromise = this.model.countDocuments(filter).exec();
      
      // Optimize query with field selection and lean
      const dataPromise = this.model
        .find(filter)
        .select('-__v') // Exclude version key
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const [data, total] = await Promise.all([dataPromise, countPromise]);

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
      logger.error('Error fetching program details by company', { error, companyId });
      throw new AppError('Failed to fetch program details', 500, error);
    }
  }

  /**
   * Mark program details as completed
   */
  async markAsCompleted(programId: string, updatedBy?: string): Promise<IProgramDetails> {
    try {
      const program = await this.findById(programId);
      if (!program) {
        throw new AppError('Program details not found', 404);
      }

      if (program.status === 'completed') {
        throw new AppError('Program is already completed', 400);
      }

      const updatedProgram = await this.update(programId, {
        status: 'completed',
        updatedBy: updatedBy || program.createdBy
      }, updatedBy);

      if (!updatedProgram) {
        throw new AppError('Failed to update program details', 500);
      }

      logger.info('Program details marked as completed', { programId });
      return updatedProgram;
    } catch (error: any) {
      logger.error('Error marking program as completed', { error, programId });
      throw new AppError('Failed to mark program as completed', 500, error);
    }
  }
}

