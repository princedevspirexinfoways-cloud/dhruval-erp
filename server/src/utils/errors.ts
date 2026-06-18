/**
 * Custom Error Classes for the Factory ERP System
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `External service ${service} is unavailable`, 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed') {
    super(message, 400);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, details);
  }
}

/**
 * Error handler utility functions
 */
export const createError = (message: string, statusCode: number = 500, details?: any): AppError => {
  return new AppError(message, statusCode, details);
};

export const createValidationError = (message: string, details?: any): ValidationError => {
  return new ValidationError(message, details);
};

export const createNotFoundError = (resource: string): NotFoundError => {
  return new NotFoundError(resource);
};

export const createAuthError = (message?: string): AuthenticationError => {
  return new AuthenticationError(message);
};

export const createAuthzError = (message?: string): AuthorizationError => {
  return new AuthorizationError(message);
};

export const createConflictError = (message: string): ConflictError => {
  return new ConflictError(message);
};

export const createDatabaseError = (message?: string, details?: any): DatabaseError => {
  return new DatabaseError(message, details);
};

export const createBusinessLogicError = (message: string, details?: any): BusinessLogicError => {
  return new BusinessLogicError(message, details);
};

/**
 * Check if error is operational (expected) or programming error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Error response formatter
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  statusCode: number;
  timestamp: string;
}

export const formatErrorResponse = (
  error: AppError | Error,
  includeStack: boolean = false
): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    message: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError && error.details) {
    response.details = error.details;
  }

  if (includeStack) {
    response.error = error.stack;
  }

  return response;
};

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  ACCESS_DENIED: 'Access denied: Insufficient permissions',
  ACCOUNT_LOCKED: 'Account is locked. Please contact administrator',
  ACCOUNT_INACTIVE: 'Account is inactive',

  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_DATE: 'Invalid date format',
  INVALID_ID: 'Invalid ID format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_TOO_WEAK: 'Password must contain uppercase, lowercase, number and special character',

  // Database
  DUPLICATE_ENTRY: 'Record already exists',
  RECORD_NOT_FOUND: 'Record not found',
  DATABASE_ERROR: 'Database operation failed',
  CONSTRAINT_VIOLATION: 'Database constraint violation',

  // Business Logic
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  INVALID_QUANTITY: 'Invalid quantity specified',
  ORDER_ALREADY_PROCESSED: 'Order has already been processed',
  CANNOT_DELETE_REFERENCED: 'Cannot delete record as it is referenced by other records',
  OPERATION_NOT_ALLOWED: 'Operation not allowed in current state',

  // File Upload
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'External service is temporarily unavailable',
  PAYMENT_GATEWAY_ERROR: 'Payment processing failed',
  EMAIL_SERVICE_ERROR: 'Email service is unavailable',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  MAINTENANCE_MODE: 'System is under maintenance'
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  FileUploadError,
  BusinessLogicError,
  createError,
  createValidationError,
  createNotFoundError,
  createAuthError,
  createAuthzError,
  createConflictError,
  createDatabaseError,
  createBusinessLogicError,
  isOperationalError,
  formatErrorResponse,
  ERROR_MESSAGES,
  HTTP_STATUS
};
