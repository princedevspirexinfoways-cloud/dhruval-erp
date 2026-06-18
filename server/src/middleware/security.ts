import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import config from '@/config/environment';
import logger from '@/utils/logger';

// =============================================
// CORS Configuration
// =============================================
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // In development, allow all localhost origins (any port)
    if (config.NODE_ENV === 'development') {
      // Allow localhost on any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('CORS: Allowing localhost origin:', origin);
        return callback(null, true);
      }
      // Also check configured origins
      if (config.CORS_ORIGIN.includes(origin) || config.CORS_ORIGIN.includes('*')) {
        console.log('CORS: Allowing configured origin:', origin);
        return callback(null, true);
      }
    }

    // In production, strictly check configured origins
    if (config.CORS_ORIGIN.includes(origin) || config.CORS_ORIGIN.includes('*')) {
      console.log('CORS: Allowing request from allowed origin:', origin);
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', {
        origin,
        allowedOrigins: config.CORS_ORIGIN,
        nodeEnv: config.NODE_ENV
      });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Always allow credentials for authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Company-ID',
    'X-API-Key',
    'X-Request-ID',
    'X-User-Agent',
    'X-Forwarded-For',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false
};

// =============================================
// Helmet Security Configuration
// =============================================
export const helmetOptions = {
  contentSecurityPolicy: config.ENABLE_CONTENT_SECURITY_POLICY ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      connectSrc: ["'self'", "https://api.factoryerp.com"],
      workerSrc: ["'self'", "blob:"]
    }
  } : false,

  crossOriginEmbedderPolicy: false, // Disable for file uploads

  hsts: config.ENABLE_HSTS ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,

  noSniff: config.ENABLE_NOSNIFF,
  xssFilter: config.ENABLE_XSS_FILTER,

  referrerPolicy: {
    policy: "same-origin" as const
  }
};

// =============================================
// Rate Limiting Configuration
// =============================================
export const createRateLimit = (windowMs: number, max: number, message?: string, extraOptions?: Record<string, any>) => {
  // More lenient limits for development
  const isDev = process.env.NODE_ENV === 'development'
  const adjustedMax = isDev ? max * 1000 : max * 1000 // 10x more requests in dev

  return rateLimit({
    windowMs,
    max: adjustedMax,
    message: message || {
      error: 'Too many requests',
      message: `Too many requests from this IP, please try again later. (${adjustedMax} requests per ${Math.round(windowMs / 1000)}s)`,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/metrics';
    },
    keyGenerator: (req: Request) => {
      // Use IP + User ID for authenticated requests
      const userId = (req as any).user?.id;
      return userId ? `${req.ip}-${userId}` : req.ip;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    // Allow per-instance overrides (e.g., auth should not count successful attempts)
    ...(extraOptions || {})
  });
};

// General API rate limiting (skip auth routes to prevent double limiting)
export const generalRateLimit = createRateLimit(
  config.RATE_LIMIT_WINDOW_MS,
  config.RATE_LIMIT_MAX_REQUESTS,
  'Too many API requests',
  {
    skip: (req: Request) => {
      const p = req.path || '';
      // Skip health/metrics and auth routes here; auth has its own limiter
      if (p === '/health' || p === '/metrics') return true;
      return p.includes('/auth/');
    }
  }
);

// Stricter rate limiting for authentication endpoints (count only failed attempts)
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // Allow up to 100 attempts per 15 mins (1000 in dev)
  'Too many authentication attempts',
  {
    skipSuccessfulRequests: true // Only failed logins count against the limit
  }
);

// File upload rate limiting
export const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads
  'Too many file uploads'
);

// =============================================
// Slow Down Configuration
// =============================================
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Fixed: Use function for new behavior
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/metrics';
  },
  validate: { delayMs: false } // Disable warning
});

// =============================================
// Security Middleware Stack
// =============================================
export const securityMiddleware = [
  // Trust proxy if configured
  (req: Request, res: Response, next: NextFunction) => {
    if (config.TRUST_PROXY) {
      req.app.set('trust proxy', true);
    }
    next();
  },

  // Disable X-Powered-By header
  (req: Request, res: Response, next: NextFunction) => {
    if (config.DISABLE_X_POWERED_BY) {
      res.removeHeader('X-Powered-By');
    }
    next();
  },

  // Helmet security headers
  helmet(helmetOptions),

  // CORS
  cors(corsOptions),

  // Compression
  compression({
    filter: (req: Request, res: Response) => {
      // Don't compress if the request includes a cache-control no-transform directive
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (1-9)
    threshold: 1024 // Only compress if response is larger than 1KB
  }),

  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['tags', 'categories', 'colors', 'sizes'] // Allow arrays for these parameters
  }),

  // Data sanitization against NoSQL injection attacks
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }: { req: Request; key: string }) => {
      logger.warn('MongoDB injection attempt detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        sanitizedKey: key
      });
    }
  }),

  // Data sanitization against XSS attacks
  xss(),

  // Rate limiting
  generalRateLimit,

  // Speed limiting
  speedLimiter
];

// =============================================
// Request Logging Middleware
// =============================================
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Generate request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    userId: (req as any).user?.id,
    companyId: req.headers['x-company-id']
  });

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
      userId: (req as any).user?.id
    });

    return originalSend.call(this, data);
  };

  next();
};

// =============================================
// Error Handling Middleware
// =============================================
export const securityErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;

  // Log security-related errors
  if (err.type === 'entity.too.large') {
    logger.warn('Request entity too large', {
      requestId,
      ip: req.ip,
      path: req.path,
      method: req.method,
      contentLength: req.get('Content-Length')
    });

    return res.status(413).json({
      error: 'Request entity too large',
      message: 'The request payload is too large',
      requestId
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS error',
      message: 'Origin not allowed by CORS policy',
      requestId
    });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token mismatch', {
      requestId,
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'CSRF token mismatch',
      message: 'Invalid CSRF token',
      requestId
    });
  }

  // Pass to next error handler
  next(err);
};

// =============================================
// IP Whitelist Middleware (for admin endpoints)
// =============================================
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip;

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not whitelisted', {
        ip: clientIP,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource'
      });
    }

    next();
  };
};

// =============================================
// API Key Validation Middleware
// =============================================
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'X-API-Key header is required'
    });
  }

  // Validate API key (implement your logic here)
  // This is a simple example - in production, use proper API key management
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      apiKey: apiKey.substring(0, 8) + '...' // Log only first 8 characters
    });

    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  next();
};
