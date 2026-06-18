import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import config from '@/config/environment';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = null;

  // Log the error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof MongooseError.ValidationError) {
    // Mongoose validation errors
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: (err as any).value
    }));
  } else if (error instanceof MongooseError.CastError) {
    // Mongoose cast errors (invalid ObjectId, etc.)
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 400;
    message = 'Duplicate field value';
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    details = {
      field,
      value,
      message: `${field} '${value}' already exists`
    };
  } else if (error instanceof JsonWebTokenError) {
    // JWT errors
    statusCode = 401;
    if (error instanceof TokenExpiredError) {
      message = 'Token expired';
    } else {
      message = 'Invalid token';
    }
  } else if (error.name === 'UnauthorizedError') {
    // JWT middleware errors
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (error.type === 'entity.parse.failed') {
    // JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON format';
  } else if (error.type === 'entity.too.large') {
    // Request entity too large
    statusCode = 413;
    message = 'Request entity too large';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    // File upload size limit
    statusCode = 413;
    message = 'File too large';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    // Unexpected file field
    statusCode = 400;
    message = 'Unexpected file field';
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection error
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (error.name === 'TimeoutError') {
    // Request timeout
    statusCode = 408;
    message = 'Request timeout';
  } else if (error.name === 'RateLimitError') {
    // Rate limiting error
    statusCode = 429;
    message = 'Too many requests';
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add error message and stack trace in development
  if (config.NODE_ENV === 'development') {
    errorResponse.error = error.message;
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 */
export const handleValidationErrors = (errors: any[]) => {
  const details = errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));

  throw new AppError('Validation failed', 400, details);
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any) => {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    throw new AppError(`Duplicate value for ${field}: ${value}`, 400);
  }

  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
    throw new AppError('Validation failed', 400, errors);
  }

  if (error.name === 'CastError') {
    // Invalid ObjectId
    throw new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  // Generic database error
  throw new AppError('Database operation failed', 500);
};

/**
 * File upload error handler
 */
export const handleFileUploadError = (error: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    throw new AppError('File size too large', 413);
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    throw new AppError('Too many files', 400);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    throw new AppError('Unexpected file field', 400);
  }

  if (error.code === 'LIMIT_FIELD_KEY') {
    throw new AppError('Field name too long', 400);
  }

  if (error.code === 'LIMIT_FIELD_VALUE') {
    throw new AppError('Field value too long', 400);
  }

  if (error.code === 'LIMIT_FIELD_COUNT') {
    throw new AppError('Too many fields', 400);
  }

  if (error.code === 'LIMIT_PART_COUNT') {
    throw new AppError('Too many parts', 400);
  }

  throw new AppError('File upload failed', 500);
};

/**
 * Authentication error handler
 */
export const handleAuthError = (error: any) => {
  if (error instanceof JsonWebTokenError) {
    if (error instanceof TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }

  if (error.name === 'UnauthorizedError') {
    throw new AppError('Unauthorized access', 401);
  }

  throw new AppError('Authentication failed', 401);
};

/**
 * Permission error handler
 */
export const handlePermissionError = (resource: string, action: string) => {
  throw new AppError(`Insufficient permissions for ${action} on ${resource}`, 403);
};

/**
 * Rate limit error handler
 */
export const handleRateLimitError = (req: Request, res: Response) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

/**
 * CORS error handler
 */
export const handleCorsError = (req: Request, res: Response) => {
  logger.warn('CORS error', {
    origin: req.get('Origin'),
    path: req.path,
    method: req.method
  });

  res.status(403).json({
    success: false,
    message: 'CORS policy violation',
    statusCode: 403,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server: any) => {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    server.close(() => {
      logger.info('Process terminated gracefully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleValidationErrors,
  handleDatabaseError,
  handleFileUploadError,
  handleAuthError,
  handlePermissionError,
  handleRateLimitError,
  handleCorsError,
  gracefulShutdown
};
