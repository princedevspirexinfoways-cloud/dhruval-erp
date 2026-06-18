import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import expressWinston from 'express-winston';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import config from '../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${
      info.stack ? `\n${info.stack}` : ''
    } ${
      Object.keys(info).length > 3 ? 
      `\n${JSON.stringify(
        Object.fromEntries(
          Object.entries(info).filter(([key]) => 
            !['timestamp', 'level', 'message', 'stack'].includes(key)
          )
        ), 
        null, 
        2
      )}` : ''
    }`
  )
);

// Create transports array
const transports: winston.transport[] = [];

// Check if we should create log files (avoid heavy log files)
const shouldCreateLogFiles = config.LOG_FILE && config.LOG_FILE.trim() !== '';

// Console transport for development
if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
} else {
  // Console transport for production (less verbose)
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  );
}

// File transport for all logs (only if LOG_FILE is specified)
if (shouldCreateLogFiles) {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'application-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: config.LOG_LEVEL,
      format: logFormat,
      auditFile: path.join('logs', 'audit.json'),
      zippedArchive: true
    })
  );
}

// Error file transport (only if LOG_FILE is specified)
if (shouldCreateLogFiles) {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: 'error',
      format: logFormat,
      auditFile: path.join('logs', 'error-audit.json'),
      zippedArchive: true
    })
  );
}

// HTTP access logs (only if LOG_FILE is specified)
if (shouldCreateLogFiles) {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'access-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      auditFile: path.join('logs', 'access-audit.json'),
      zippedArchive: true
    })
  );
}

// Security logs (only if LOG_FILE is specified)
if (shouldCreateLogFiles) {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'security-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: 'warn',
      format: logFormat,
      auditFile: path.join('logs', 'security-audit.json'),
      zippedArchive: true
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
  
  // Handle uncaught exceptions and unhandled rejections (only if LOG_FILE is specified)
  ...(shouldCreateLogFiles ? {
    exceptionHandlers: [
      new DailyRotateFile({
        filename: path.join('logs', 'exceptions-%DATE%.log'),
        datePattern: config.LOG_DATE_PATTERN,
        maxSize: config.LOG_MAX_SIZE,
        maxFiles: config.LOG_MAX_FILES,
        format: logFormat,
        zippedArchive: true
      })
    ],

    rejectionHandlers: [
      new DailyRotateFile({
        filename: path.join('logs', 'rejections-%DATE%.log'),
        datePattern: config.LOG_DATE_PATTERN,
        maxSize: config.LOG_MAX_SIZE,
        maxFiles: config.LOG_MAX_FILES,
        format: logFormat,
        zippedArchive: true
      })
    ]
  } : {})
});

// Create specialized loggers
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'SECURITY' }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'security-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      zippedArchive: true
    })
  ]
});

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'AUDIT' }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'audit-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      zippedArchive: true
    })
  ]
});

const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'PERFORMANCE' }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'performance-%DATE%.log'),
      datePattern: config.LOG_DATE_PATTERN,
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      zippedArchive: true
    })
  ]
});

// Helper functions for structured logging
const logRequest = (req: any, res: any, duration: number) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    companyId: req.headers['x-company-id'],
    requestId: req.requestId
  });
};

const logSecurity = (event: string, details: any) => {
  securityLogger.warn(event, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

const logAudit = (action: string, details: any) => {
  auditLogger.info(action, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

const logPerformance = (operation: string, duration: number, details?: any) => {
  performanceLogger.info(operation, {
    duration,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Database query logging
const logDatabaseQuery = (query: string, duration: number, collection?: string) => {
  if (config.NODE_ENV === 'development') {
    logger.debug('Database Query', {
      query,
      duration,
      collection,
      timestamp: new Date().toISOString()
    });
  }
};

// Error logging with context
const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString()
  });
};

// Business logic logging
const logBusiness = (event: string, details: any) => {
  logger.info(`Business Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

// System health logging
const logHealth = (component: string, status: 'healthy' | 'unhealthy', details?: any) => {
  const level = status === 'healthy' ? 'info' : 'error';
  logger.log(level, `Health Check: ${component}`, {
    status,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// =============================================
// MORGAN HTTP REQUEST LOGGING
// =============================================

// Create custom Morgan tokens
morgan.token('id', (req: any) => req.requestId);
morgan.token('user-id', (req: any) => req.user?.id || 'anonymous');
morgan.token('company-id', (req: any) => req.headers['x-company-id'] || 'none');
morgan.token('real-ip', (req: any) => req.headers['x-forwarded-for'] || req.connection.remoteAddress);
morgan.token('user-agent', (req: any) => req.headers['user-agent']);
morgan.token('response-time-ms', (req: any, res: any) => `${res.responseTime}ms`);

// Custom Morgan format for detailed logging
const morganFormat = ':id :method :url :status :res[content-length] - :response-time ms - :real-ip - :user-id - :company-id - ":user-agent"';

// Morgan stream that writes to Winston
const morganStream = {
  write: (message: string) => {
    // Remove trailing newline and log as HTTP level
    logger.http(message.trim());
  }
};

// Morgan middleware configurations
export const morganMiddleware: any = {
  // Development - detailed logging
  dev: morgan('dev', {
    stream: morganStream,
    skip: (req: Request) => req.url === '/health' || req.url === '/metrics'
  }),

  // Production - structured logging
  combined: morgan(morganFormat, {
    stream: morganStream,
    skip: (req: Request) => req.url === '/health' || req.url === '/metrics'
  }),

  // Error logging only
  error: morgan(morganFormat, {
    stream: morganStream,
    skip: (req: Request, res: Response) => res.statusCode < 400
  }),

  // Custom format for API requests
  api: morgan(':id :method :url :status :res[content-length] - :response-time ms - :user-id', {
    stream: morganStream,
    skip: (req: Request) => !req.url.startsWith('/api')
  })
};

// =============================================
// EXPRESS-WINSTON INTEGRATION
// =============================================

// Request logger middleware
export const requestLoggerMiddleware = expressWinston.logger({
  winstonInstance: logger,
  level: 'http',
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: config.NODE_ENV === 'development',
  ignoreRoute: (req: Request) => {
    return req.url === '/health' || req.url === '/metrics' || req.url === '/favicon.ico';
  },
  requestWhitelist: [
    'url', 'method', 'httpVersion', 'originalUrl', 'query', 'body'
  ],
  responseWhitelist: [
    'statusCode', 'responseTime'
  ],
  bodyWhitelist: ['username', 'email', 'companyCode'], // Only log safe fields
  bodyBlacklist: ['password', 'token', 'secret'],
  dynamicMeta: (req: any, res: any) => ({
    requestId: req.requestId,
    userId: req.user?.id,
    companyId: req.headers['x-company-id'],
    userAgent: req.headers['user-agent'],
    realIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    sessionId: req.sessionID,
    correlationId: req.headers['x-correlation-id']
  })
});

// Error logger middleware
export const errorLoggerMiddleware: any = expressWinston.errorLogger({
  winstonInstance: logger,
  level: 'error',
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{err.status}} {{err.message}}',


  dynamicMeta: (req: any, res: any, err: any) => ({
    requestId: req.requestId,
    userId: req.user?.id,
    companyId: req.headers['x-company-id'],
    userAgent: req.headers['user-agent'],
    realIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    errorStack: err.stack,
    errorCode: err.code,
    errorName: err.name
  })
});

// =============================================
// ADVANCED LOGGING UTILITIES
// =============================================

// Performance monitoring
export const performanceMonitor = {
  start: (operation: string) => {
    const startTime = process.hrtime.bigint();
    return {
      end: (metadata?: any) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        performanceLogger.info(`Performance: ${operation}`, {
          operation,
          duration,
          ...metadata,
          timestamp: new Date().toISOString()
        });

        return duration;
      }
    };
  }
};

// Database operation logging
export const dbLogger = {
  query: (collection: string, operation: string, query: any, duration: number) => {
    logger.debug('Database Query', {
      collection,
      operation,
      query: JSON.stringify(query),
      duration,
      timestamp: new Date().toISOString()
    });
  },

  error: (collection: string, operation: string, error: Error, query?: any) => {
    logger.error('Database Error', {
      collection,
      operation,
      error: error.message,
      stack: error.stack,
      query: query ? JSON.stringify(query) : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// API response logging
export const apiLogger = {
  request: (req: any, metadata?: any) => {
    logger.info('API Request', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      companyId: req.headers['x-company-id'],
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },

  response: (req: any, res: any, metadata?: any) => {
    logger.info('API Response', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: res.responseTime,
      userId: req.user?.id,
      companyId: req.headers['x-company-id'],
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
};

// Business event logging
export const businessLogger = {
  userAction: (userId: string, action: string, resource: string, metadata?: any) => {
    auditLogger.info('User Action', {
      userId,
      action,
      resource,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },

  systemEvent: (event: string, severity: 'info' | 'warn' | 'error', metadata?: any) => {
    logger.log(severity, `System Event: ${event}`, {
      event,
      severity,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },

  securityEvent: (event: string, risk: 'low' | 'medium' | 'high', metadata?: any) => {
    securityLogger.warn(`Security Event: ${event}`, {
      event,
      risk,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
};

// Only create logs directory if LOG_FILE is specified (avoid heavy log files)
const logsDir = path.join(process.cwd(), 'logs');

if (shouldCreateLogFiles && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Export everything
export {
  logger as default,
  securityLogger,
  auditLogger,
  performanceLogger,
  logRequest,
  logSecurity,
  logAudit,
  logPerformance,
  logDatabaseQuery,
  logError,
  logBusiness,
  logHealth
};
