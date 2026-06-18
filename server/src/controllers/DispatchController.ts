import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { DispatchService } from '@/services/DispatchService';
import { S3Service } from '@/services/S3Service';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class DispatchController extends BaseController<any> {
  private dispatchService: DispatchService;
  private s3Service: S3Service;

  constructor() {
    const dispatchService = new DispatchService();
    super(dispatchService, 'Dispatch');
    this.dispatchService = dispatchService;
    this.s3Service = new S3Service();
  }

  /**
   * Create a new dispatch with file uploads
   */
  async createDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);

      const { userId, companyId } = this.getUserInfo(req);
      const dispatchData = { ...req.body, companyId };

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (files) {
        // Handle dispatch photos
        if (files.dispatchPhotos && files.dispatchPhotos.length > 0) {
          dispatchData.dispatchPhotos = files.dispatchPhotos.map((file: any) => file.location);
        }

        // Handle cargo photos
        if (files.cargoPhotos && files.cargoPhotos.length > 0) {
          dispatchData.cargoPhotos = files.cargoPhotos.map((file: any) => file.location);
        }

        // Handle vehicle photos
        if (files.vehiclePhotos && files.vehiclePhotos.length > 0) {
          dispatchData.vehiclePhotos = files.vehiclePhotos.map((file: any) => file.location);
        }

        // Handle documents
        if (files.documents && files.documents.length > 0) {
          dispatchData.documents = files.documents.map((file: any) => ({
            documentType: 'dispatch',
            documentNumber: `DOC-${Date.now()}`,
            documentUrl: file.location,
            isVerified: false
          }));
        }
      }

      logger.info('Creating dispatch with files', {
        dispatchData: { ...dispatchData, documents: dispatchData.documents?.length || 0 },
        userId,
        companyId,
        filesUploaded: files ? Object.keys(files).length : 0
      });

      const dispatch = await this.dispatchService.createDispatch(dispatchData, userId);

      this.sendSuccess(res, dispatch, 'Dispatch created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all dispatches for company
   */
  async getDispatchesByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { page = 1, limit = 10, status, priority } = req.query;

      const dispatches = await this.dispatchService.getDispatchesByCompany(
        companyId,
        {
          page: Number(page),
          limit: Number(limit),
          status: status as string,
          priority: priority as string
        }
      );

      this.sendSuccess(res, dispatches, 'Dispatches retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dispatch by ID
   */
  async getDispatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = this.getUserInfo(req);

      const dispatch = await this.dispatchService.findById(id);
      if (!dispatch || dispatch.companyId?.toString() !== companyId) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Dispatch retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update dispatch
   */
  async updateDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);

      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);
      const updateData = req.body;

      const dispatch = await this.dispatchService.update(id, updateData, userId);
      if (!dispatch || dispatch.companyId?.toString() !== companyId) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Dispatch updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete dispatch
   */
  async deleteDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      const deleted = await this.dispatchService.delete(id, userId);
      if (!deleted) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, null, 'Dispatch deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update dispatch status
   */
  async updateDispatchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dispatchId } = req.params;
      const { status } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const dispatch = await this.dispatchService.updateDispatchStatus(dispatchId, status, userId);
      if (!dispatch) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Dispatch status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dispatch statistics
   */
  async getDispatchStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { period = 'month' } = req.query;

      const stats = await this.dispatchService.getDispatchStats(companyId);
      this.sendSuccess(res, stats, 'Dispatch statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned URL for file upload
   */
  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName, contentType, folder } = req.body;

      if (!fileName || !contentType) {
        throw new AppError('File name and content type are required', 400);
      }

      const { uploadUrl, key, expiresAt } = await this.s3Service.getPresignedUploadUrl(
        fileName,
        contentType,
        folder
      );

      this.sendSuccess(res, { uploadUrl, key, expiresAt }, 'Upload URL generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned URL for file download
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        throw new AppError('File key is required', 400);
      }

      const { downloadUrl, expiresAt } = await this.s3Service.getPresignedDownloadUrl(key, 3600); // 1 hour

      this.sendSuccess(res, { downloadUrl, expiresAt }, 'Download URL generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload dispatch photos
   */
  async uploadDispatchPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      if (!req.files || !(req.files as any).dispatchPhotos) {
        throw new AppError('Dispatch photos are required', 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photoUrls = files.dispatchPhotos.map((file: any) => file.location);

      const dispatch = await this.dispatchService.update(id, {
        dispatchPhotos: photoUrls
      }, userId);

      if (!dispatch || dispatch.companyId?.toString() !== companyId) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Dispatch photos uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload cargo photos
   */
  async uploadCargoPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      if (!req.files || !(req.files as any).cargoPhotos) {
        throw new AppError('Cargo photos are required', 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photoUrls = files.cargoPhotos.map((file: any) => file.location);

      const dispatch = await this.dispatchService.update(id, {
        cargoPhotos: photoUrls
      }, userId);

      if (!dispatch || dispatch.companyId?.toString() !== companyId) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Cargo photos uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload vehicle photos
   */
  async uploadVehiclePhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = this.getUserInfo(req);

      if (!req.files || !(req.files as any).vehiclePhotos) {
        throw new AppError('Vehicle photos are required', 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photoUrls = files.vehiclePhotos.map((file: any) => file.location);

      const dispatch = await this.dispatchService.update(id, {
        vehiclePhotos: photoUrls
      }, userId);

      if (!dispatch || dispatch.companyId?.toString() !== companyId) {
        throw new AppError('Dispatch not found', 404);
      }

      this.sendSuccess(res, dispatch, 'Vehicle photos uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dispatch statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      const { period = 'month' } = req.query;

      const stats = await this.dispatchService.getDispatchStats(companyId);
      this.sendSuccess(res, stats, 'Dispatch statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
