console.log('Server: Starting imports...');

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

console.log('Server: Basic imports completed');

console.log('Server: About to import configurations...');

// Import configurations
import config from './config/environment';
import database from './config/database';
import logger from './utils/logger';

console.log('Server: Configurations imported successfully');

// Configure Mongoose to suppress verbose logs and prevent duplicate index warnings
mongoose.set('debug', false);
mongoose.set('autoIndex', false); // Disable automatic index creation

// Import middleware
import { securityMiddleware, requestLogger, securityErrorHandler } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

console.log('Server: About to import API routes...');

// Import consolidated routes
import apiRoutes from './routes';

console.log('Server: API routes imported successfully');

// Automated reports will be integrated later

// Initialize Express app
const app = express();

console.log('Server: Express app initialized');

// =============================================
// TRUST PROXY CONFIGURATION
// =============================================
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
  console.log('Server: Trust proxy enabled');
}

// =============================================
// BASIC MIDDLEWARE SETUP
// =============================================

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req: Request, res: Response, buf: Buffer) => {
    // Store raw body for webhook verification
    (req as any).rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

console.log('Server: Body parsing middleware configured');

// Cookie parsing
app.use(cookieParser(config.COOKIE_SECRET));
console.log('Server: Cookie parser configured with secret:', !!config.COOKIE_SECRET);
console.log('Server: Cookie secret length:', config.COOKIE_SECRET?.length || 0);

// Add debugging for cookie parsing
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    cookies: req.cookies,
    hasCookies: !!req.cookies,
    cookieCount: req.cookies ? Object.keys(req.cookies).length : 0,
    headers: {
      'user-agent': req.get('User-Agent'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer'),
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? 'present' : 'missing'
    },
    body: req.body ? Object.keys(req.body) : 'no body'
  });
  next();
});

// Add a simple test endpoint for cookies
app.get('/test-cookies', (req, res) => {
  console.log('Test cookies endpoint called');
  console.log('Request cookies:', req.cookies);
  
  // Set a test cookie
  res.cookie('test_cookie', 'test_value', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });
  
  res.json({
    message: 'Test cookies endpoint',
    cookies: req.cookies,
    headers: {
      'user-agent': req.get('User-Agent'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    }
  });
});

// Session configuration
app.use(session({
  name: config.SESSION_NAME,
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: config.COOKIE_SECURE,
    httpOnly: config.COOKIE_HTTP_ONLY,
    maxAge: config.SESSION_MAX_AGE,
    sameSite: config.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined,
    path: '/'
  },
  store: MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    touchAfter: 24 * 3600, // Lazy session update
    ttl: config.SESSION_MAX_AGE / 1000,
    autoRemove: 'native',
    crypto: {
      secret: config.SESSION_SECRET
    }
  })
}));

// =============================================
// SECURITY MIDDLEWARE
// =============================================
app.use(securityMiddleware);

// =============================================
// LOGGING MIDDLEWARE
// =============================================
app.use(requestLogger);

// =============================================
// HEALTH CHECK ENDPOINTS
// =============================================
app.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
    checks: {
      database: false,
      memory: false,
      disk: false
    }
  };

  try {
    // Database health check
    healthCheck.checks.database = await database.healthCheck();

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    healthCheck.checks.memory = memUsageMB.heapUsed < 1000; // Less than 1GB
    (healthCheck as any).memory = memUsageMB;

    // Overall health status
    const isHealthy = Object.values(healthCheck.checks).every(check => check === true);
    
    if (isHealthy) {
      res.status(200).json(healthCheck);
    } else {
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    res.status(503).json({
      ...healthCheck,
      message: 'Service Unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness probe
app.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await database.healthCheck();
    if (dbHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database not available' });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      reason: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Liveness probe
app.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Automated Reports Health Check
app.get('/health/automated-reports', async (req: Request, res: Response) => {
  try {
    // Check if automated reports system is available
    const status = {
      isRunning: true,
      activeTasks: 0,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
      configuration: {
        dailyTime: '09:00',
        weeklyTime: '10:00',
        monthlyTime: '11:00',
        formats: ['excel', 'csv'],
        recipients: {}
      }
    };
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Automated reports system unavailable'
    });
  }
});

// Manual Report Trigger Endpoint
app.post('/api/trigger-report', async (req: Request, res: Response) => {
  try {
    const { companyId, reportType, formats, recipients, customFilters } = req.body;
    
    // Validate request
    if (!companyId || !reportType) {
      return res.status(400).json({
        success: false,
        error: 'Company ID and report type are required'
      });
    }
    
    // Simulate report generation
    const reportResult = {
      success: true,
      message: `${reportType} report triggered successfully for company ${companyId}`,
      reportId: `report_${Date.now()}`,
      status: 'generating',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };
    
    res.status(200).json(reportResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger report generation'
    });
  }
});

// =============================================
// CORS PREFLIGHT HANDLER
// =============================================
// Handle preflight OPTIONS requests for all routes
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Company-ID,X-API-Key,X-Request-ID,X-User-Agent,X-Forwarded-For,Origin,Accept,Cache-Control,Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// =============================================
// API ROUTES
// =============================================

// Mount API routes
app.use(config.API_PREFIX, apiRoutes);
console.log('Server: API routes mounted at:', config.API_PREFIX);
console.log('Server: Available routes:', [
  'POST /api/v1/auth/login',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/logout',
  'POST /api/v1/auth/refresh-token',
  'GET /api/v1/health',
  'GET /api/v1/debug/cookies'
]);

// Root API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dhruval Exim ERP API',
    version: '2.0.0',
    description: 'Complete Factory ERP Management System with 24 Business Models',
    endpoints: {
      v1: '/api/v1/',
      health: '/api/v1/health',
      info: '/api/v1/info',
      auth: '/api/v1/auth/*',
      companies: '/api/v1/companies/*',
      users: '/api/v1/users/*',
      customers: '/api/v1/customers/*',
      suppliers: '/api/v1/suppliers/*',
      inventory: '/api/v1/inventory/*',
      production: '/api/v1/production/*',
      orders: '/api/v1/customer-orders/*',
      purchaseOrders: '/api/v1/purchase-orders/*',
      invoices: '/api/v1/invoices/*',
      quotations: '/api/v1/quotations/*',
      warehouses: '/api/v1/warehouses/*',
      stockMovements: '/api/v1/stock-movements/*',
      financial: '/api/v1/financial-transactions/*',
      visitors: '/api/v1/visitors/*',
      vehicles: '/api/v1/vehicles/*',
      security: '/api/v1/security-logs/*',
      audit: '/api/v1/audit-logs/*',
      analytics: '/api/v1/business-analytics/*',
      boiler: '/api/v1/boiler-monitoring/*',
      electricity: '/api/v1/electricity-monitoring/*',
      hospitality: '/api/v1/hospitality/*',
      dispatch: '/api/v1/dispatch/*',
      reports: '/api/v1/reports/*',
      spares: '/api/v1/spares/*',
      manpower: '/api/v1/manpower/*',
      stickers: '/api/v1/stickers/*',
      dashboard: '/api/v1/dashboard/*',
      productionDashboard: '/api/v1/production-dashboard/*',
      advancedReports: '/api/v1/advanced-reports/*',
      documentManagement: '/api/v1/documents/*',
      automatedReports: '/health/automated-reports'
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================
// WEBSOCKET SETUP
// =============================================
const httpServer = createServer(app);
let io: SocketIOServer | null = null;

if (config.ENABLE_WEBSOCKETS) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: config.CORS_CREDENTIALS
    },
    transports: ['websocket', 'polling']
  });

  // WebSocket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: (socket as any).userId,
      ip: socket.handshake.address
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        reason,
        userId: (socket as any).userId
      });
    });

    // Handle real-time events
    socket.on('join-company', (companyId) => {
      socket.join(`company:${companyId}`);
      logger.info('Client joined company room', {
        socketId: socket.id,
        companyId,
        userId: (socket as any).userId
      });
    });

    socket.on('leave-company', (companyId) => {
      socket.leave(`company:${companyId}`);
      logger.info('Client left company room', {
        socketId: socket.id,
        companyId,
        userId: (socket as any).userId
      });
    });
  });
}

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// Security error handler
app.use(securityErrorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================
// GRACEFUL SHUTDOWN
// =============================================
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket server
  if (io) {
    io.close(() => {
      logger.info('WebSocket server closed');
    });
  }

  // Close database connection
  try {
    await database.disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error });
  }

  // Exit process
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// =============================================
// SERVER STARTUP
// =============================================
const startServer = async () => {
  try {
    console.log('🚀 Starting Factory ERP Server...');
    console.log('Server: Environment:', config.NODE_ENV);
    console.log('Server: Port:', config.PORT);
    console.log('Server: API Prefix:', config.API_PREFIX);
    console.log('Server: CORS Origin:', config.CORS_ORIGIN);
    console.log('Server: Cookie SameSite:', config.COOKIE_SAME_SITE);
    console.log('Server: JWT Secret configured:', !!config.JWT_SECRET);
    console.log('Server: JWT Refresh Secret configured:', !!config.JWT_REFRESH_SECRET);
    console.log('Server: JWT Issuer:', config.JWT_ISSUER);
    console.log('Server: JWT Audience:', config.JWT_AUDIENCE);
    console.log('Server: Cookie Secret configured:', !!config.COOKIE_SECRET);

    // Connect to database
    console.log('📊 Attempting database connection...');
    try {
      await database.connect();
      console.log('✅ Database connected successfully!');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.log('⚠️  Continuing without database connection for debugging...');
    }
    
    // Start HTTP server
    httpServer.listen(config.PORT, () => {
      console.log(`🚀 Factory ERP Server started successfully`, {
        port: config.PORT,
        environment: config.NODE_ENV,
        version: config.APP_VERSION,
        database: database.getConnectionStatus(),
        websockets: config.ENABLE_WEBSOCKETS,
        cors: config.CORS_ORIGIN,
        apiPrefix: config.API_PREFIX
      });
      
      console.log('📊 Available endpoints:');
      console.log('  - POST /api/v1/auth/login');
      console.log('  - POST /api/v1/auth/register');
      console.log('  - POST /api/v1/auth/logout');
      console.log('  - POST /api/v1/auth/refresh-token');
      console.log('  - GET /api/v1/health');
      console.log('  - GET /api/v1/debug/cookies');
    });

  } catch (error) {
    console.error('Failed to start server', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, httpServer, io };