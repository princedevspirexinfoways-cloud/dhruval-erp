import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  location?: string;
}

interface UploadedFiles {
  [fieldname: string]: UploadedFile[];
}

/**
 * Validate uploaded files
 */
export const validateUploadedFiles = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as UploadedFiles | undefined;

    if (!files) {
      return next();
    }

    // Define allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Define maximum file size (10MB)
    const maxFileSize = 10 * 1024 * 1024;

    // Validate each uploaded file
    for (const fieldName in files) {
      const fieldFiles = files[fieldName];
      
      for (const file of fieldFiles) {
        // Check file type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new AppError(
            `File type ${file.mimetype} is not allowed for field ${fieldName}`,
            400
          );
        }

        // Check file size
        if (file.size > maxFileSize) {
          throw new AppError(
            `File ${file.originalname} is too large. Maximum size is 10MB`,
            400
          );
        }

        // Check if file has required properties
        if (!file.originalname || !file.mimetype) {
          throw new AppError(
            `Invalid file uploaded for field ${fieldName}`,
            400
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate specific file fields
 */
export const validateFileFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as UploadedFiles | undefined;

      if (!files) {
        throw new AppError('No files uploaded', 400);
      }

      // Check if all required fields are present
      for (const fieldName of requiredFields) {
        if (!files[fieldName] || files[fieldName].length === 0) {
          throw new AppError(`Field ${fieldName} is required`, 400);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate file count limits
 */
export const validateFileCounts = (limits: { [fieldName: string]: number }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as UploadedFiles | undefined;

      if (!files) {
        return next();
      }

      // Check file count limits
      for (const fieldName in limits) {
        if (files[fieldName] && files[fieldName].length > limits[fieldName]) {
          throw new AppError(
            `Too many files for field ${fieldName}. Maximum allowed: ${limits[fieldName]}`,
            400
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
