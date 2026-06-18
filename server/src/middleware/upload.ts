import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
import config from '@/config/environment';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure S3 client for Contabo
const s3Client = new S3Client({
  region: config.CONTABO_REGION,
  credentials: {
    accessKeyId: config.CONTABO_ACCESS_KEY,
    secretAccessKey: config.CONTABO_SECRET_KEY,
  },
  endpoint: config.CONTABO_ENDPOINT,
  forcePathStyle: true,
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = config.UPLOAD_ALLOWED_TYPES;
  
  if (!allowedTypes.includes(file.mimetype)) {
    logger.warn('File type not allowed', {
      filename: file.originalname,
      mimetype: file.mimetype,
      allowedTypes
    });
    return cb(new AppError(`File type ${file.mimetype} not allowed`, 400));
  }

  // Additional security checks
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.csv', '.xlsx', '.xls'];
  
  if (!allowedExtensions.includes(ext)) {
    logger.warn('File extension not allowed', {
      filename: file.originalname,
      extension: ext
    });
    return cb(new AppError(`File extension ${ext} not allowed`, 400));
  }

  cb(null, true);
};

// Generate unique filename
const generateFileName = (req: Request, file: Express.Multer.File, folder: string = 'general') => {
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const companyId = req.company?._id || 'unknown';
  
  return `${folder}/${companyId}/${name}-${timestamp}-${uuid}${ext}`;
};

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3Client,
  bucket: config.CONTABO_BUCKET_NAME,
  acl: 'private',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req: Request, file: Express.Multer.File, cb) => {
    const folder = (req as any).uploadFolder || 'general';
    const fileName = generateFileName(req, file, folder);
    cb(null, fileName);
  },
  metadata: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?._id?.toString() || 'unknown',
      companyId: req.company?._id?.toString() || 'unknown',
      uploadDate: new Date().toISOString()
    });
  }
});

// Base multer configuration
const baseUploadConfig = {
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: config.UPLOAD_MAX_FILE_SIZE, // 10MB default
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
  }
};

// Different upload configurations for different use cases

/**
 * Single file upload
 */
export const uploadSingle = (fieldName: string, folder?: string) => {
  return (req: Request, res: any, next: any) => {
    if (folder) {
      (req as any).uploadFolder = folder;
    }
    
    const upload = multer(baseUploadConfig).single(fieldName);
    
    upload(req, res, (err) => {
      if (err) {
        logger.error('Single file upload error', { error: err, fieldName, folder });
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large', 413));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected file field', 400));
          }
        }
        
        return next(err);
      }
      
      next();
    });
  };
};

/**
 * Multiple files upload
 */
export const uploadMultiple = (fieldName: string, maxCount: number = 5, folder?: string) => {
  return (req: Request, res: any, next: any) => {
    if (folder) {
      (req as any).uploadFolder = folder;
    }
    
    const upload = multer(baseUploadConfig).array(fieldName, maxCount);
    
    upload(req, res, (err) => {
      if (err) {
        logger.error('Multiple files upload error', { error: err, fieldName, maxCount, folder });
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large', 413));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files', 400));
          }
        }
        
        return next(err);
      }
      
      next();
    });
  };
};

/**
 * Mixed fields upload (multiple different file fields)
 */
export const uploadFields = (fields: { name: string; maxCount: number }[], folder?: string) => {
  return (req: Request, res: any, next: any) => {
    if (folder) {
      (req as any).uploadFolder = folder;
    }
    
    const upload = multer(baseUploadConfig).fields(fields);
    
    upload(req, res, (err) => {
      if (err) {
        logger.error('Fields upload error', { error: err, fields, folder });
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large', 413));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files', 400));
          }
        }
        
        return next(err);
      }
      
      next();
    });
  };
};

/**
 * Visitor-specific upload configuration
 */
export const uploadVisitorFiles = uploadFields([
  { name: 'entryPhoto', maxCount: 1 },
  { name: 'exitPhoto', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
  { name: 'attachments', maxCount: 3 }
], 'visitors');

/**
 * Profile photo upload
 */
export const uploadProfilePhoto = uploadSingle('profilePhoto', 'profiles');

/**
 * Document upload
 */
export const uploadDocument = uploadSingle('document', 'documents');

/**
 * General file upload
 */
export const uploadFile = uploadSingle('file', 'general');

/**
 * Middleware to set upload folder dynamically
 */
export const setUploadFolder = (folder: string) => {
  return (req: Request, res: any, next: any) => {
    (req as any).uploadFolder = folder;
    next();
  };
};

/**
 * Middleware to validate uploaded files
 */
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  const files = req.files;
  const file = req.file;
  
  if (!files && !file) {
    return next();
  }
  
  // Log successful uploads
  if (file) {
    logger.info('File uploaded successfully', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      key: (file as any).key,
      location: (file as any).location
    });
  }
  
  if (files) {
    if (Array.isArray(files)) {
      files.forEach(f => {
        logger.info('File uploaded successfully', {
          filename: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
          key: (f as any).key,
          location: (f as any).location
        });
      });
    } else {
      Object.keys(files).forEach(fieldName => {
        const fieldFiles = files[fieldName];
        if (Array.isArray(fieldFiles)) {
          fieldFiles.forEach(f => {
            logger.info('File uploaded successfully', {
              fieldName,
              filename: f.originalname,
              size: f.size,
              mimetype: f.mimetype,
              key: (f as any).key,
              location: (f as any).location
            });
          });
        }
      });
    }
  }
  
  next();
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadVisitorFiles,
  uploadProfilePhoto,
  uploadDocument,
  uploadFile,
  setUploadFolder,
  validateUploadedFiles
};
