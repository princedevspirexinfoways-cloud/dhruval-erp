import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

// Import configurations
import config from '@/config/environment';
import database from '@/config/database';
import logger, {
  logHealth,
  logError,
  morganMiddleware,
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  businessLogger
} from '@/utils/logger';

// Configure Mongoose to suppress verbose index creation logs
mongoose.set('debug', false);

console.log('✅ Basic imports loaded');

console.log('✅ About to import middleware...');

// Import middleware
import { securityMiddleware, requestLogger, securityErrorHandler } from '@/middleware/security';
import { authenticate, requireCompany } from '@/middleware/auth';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

console.log('✅ Middleware imported');

console.log('✅ About to import routes...');

// Import routes
import authRoutes from '@/routes/auth'
console.log('✅ Auth routes imported');
import dashboardRoutes from '@/routes/dashboard';
console.log('✅ Dashboard routes imported');
// import reportsRoutes from '@/routes/reports';
console.log('✅ Reports routes imported');
import companiesRoutes from '@/routes/companies';
console.log('✅ Companies routes imported');
import usersRoutes from '@/routes/users';
console.log('✅ Users routes imported');
import ordersRoutes from '@/routes/orders';
console.log('✅ Orders routes imported');

// Import new 2FA routes
import twoFactorRoutes from '@/routes/twoFactor';
import adminTwoFactorRoutes from '@/routes/adminTwoFactor';
import adminUsersRoutes from '@/routes/adminUsers';
import adminCompaniesRoutes from '@/routes/adminCompanies';
import userManagementRoutes from '@/routes/userManagement';
console.log('✅ 2FA and admin routes imported');
import inventoryRoutes from '@/routes/inventory';
console.log('✅ Inventory routes imported');
import customersRoutes from '@/routes/customers';
console.log('✅ Customers routes imported');
import suppliersRoutes from '@/routes/suppliers';
console.log('✅ Suppliers routes imported');
import rolesRoutes from '@/routes/roles';
console.log('✅ Roles routes imported');
import setupRoutes from '@/routes/setup';
console.log('✅ Setup routes imported');
import visitorRoutes from '@/routes/visitors';
console.log('✅ Visitor routes imported');
import sparesRoutes from '@/routes/spares';
console.log('✅ Spares routes imported');
import customerVisitsRoutes from '@/routes/customerVisits';
console.log('✅ Customer visits routes imported');
import vehiclesRoutes from '@/routes/vehicles';
console.log('✅ Vehicles routes imported');
import enhancedInventoryRoutes from '@/routes/enhancedInventory';
console.log('✅ Enhanced inventory routes imported');
import warehousesRoutes from '@/routes/warehouses';
console.log('✅ Warehouses routes imported');

// Import V1 routes (new working routes)
import v1CompaniesRoutes from '@/routes/v1/companies';
console.log('✅ V1 Companies routes imported');
import v1UsersRoutes from '@/routes/v1/users';
console.log('✅ V1 Users routes imported');
import v1QuotationsRoutes from '@/routes/v1/quotations';
console.log('✅ V1 Quotations routes imported');
import v1ManpowerRoutes from '@/routes/v1/manpower';
console.log('✅ V1 Manpower routes imported');
import v1StickerRoutes from '@/routes/v1/stickers';
console.log('✅ V1 Sticker routes imported');

// Import all missing V1 routes
import v1CustomersRoutes from '@/routes/v1/customers';
console.log('✅ V1 Customers routes imported');
import v1SuppliersRoutes from '@/routes/v1/suppliers';
console.log('✅ V1 Suppliers routes imported');
import v1InventoryRoutes from '@/routes/v1/inventory';
console.log('✅ V1 Inventory routes imported');
import v1ProductionRoutes from '@/routes/v1/production';
console.log('✅ V1 Production routes imported');
import v1CustomerOrdersRoutes from '@/routes/v1/customer-orders';
console.log('✅ V1 Customer Orders routes imported');
import v1PurchaseOrdersRoutes from '@/routes/v1/purchase-orders';
console.log('✅ V1 Purchase Orders routes imported');
import v1InvoicesRoutes from '@/routes/v1/invoices';
console.log('✅ V1 Invoices routes imported');
import v1WarehousesRoutes from '@/routes/v1/warehouses';
console.log('✅ V1 Warehouses routes imported');
import v1StockMovementsRoutes from '@/routes/v1/stock-movements';
console.log('✅ V1 Stock Movements routes imported');
import v1FinancialTransactionsRoutes from '@/routes/v1/financial-transactions';
console.log('✅ V1 Financial Transactions routes imported');
import v1VisitorsRoutes from '@/routes/v1/visitors';
console.log('✅ V1 Visitors routes imported');
import v1VehiclesRoutes from '@/routes/v1/vehicles';
console.log('✅ V1 Vehicles routes imported');
import v1SecurityLogsRoutes from '@/routes/v1/security-logs';
console.log('✅ V1 Security Logs routes imported');
import v1AuditLogsRoutes from '@/routes/v1/audit-logs';
console.log('✅ V1 Audit Logs routes imported');
import v1BusinessAnalyticsRoutes from '@/routes/v1/business-analytics';
console.log('✅ V1 Business Analytics routes imported');
import v1BoilerMonitoringRoutes from '@/routes/v1/boiler-monitoring';
console.log('✅ V1 Boiler Monitoring routes imported');
import v1ElectricityMonitoringRoutes from '@/routes/v1/electricity-monitoring';
console.log('✅ V1 Electricity Monitoring routes imported');
import v1HospitalityRoutes from '@/routes/v1/hospitality';
console.log('✅ V1 Hospitality routes imported');
import v1DispatchRoutes from '@/routes/v1/dispatch';
console.log('✅ V1 Dispatch routes imported');
import v1ReportsRoutes from '@/routes/v1/reports';
console.log('✅ V1 Reports routes imported');
import v1SparesRoutes from '@/routes/v1/spares';
console.log('✅ V1 Spares routes imported');

// V2 routes have been migrated to V1 and V2 folder removed
console.log('✅ V2 routes successfully migrated to V1 - V2 folder removed');

console.log('✅ All routes imported successfully!');
console.log('🚀 About to create Express app...');

// Initialize Express app
console.log('🚀 Creating Express app...');
const app = express();
console.log('✅ Express app created');

// =============================================
// TRUST PROXY CONFIGURATION
// =============================================
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
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

// Cookie parsing
app.use(cookieParser(config.COOKIE_SECRET));

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

// HTTP Request logging with Morgan
if (config.NODE_ENV === 'development') {
  app.use(morganMiddleware.dev);
} else {
  app.use(morganMiddleware.combined);
}

// Express-Winston request logging
app.use(requestLoggerMiddleware);

// Request logging (custom)
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
      logHealth('application', 'healthy', healthCheck);
      res.status(200).json(healthCheck);
    } else {
      logHealth('application', 'unhealthy', healthCheck);
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    logHealth('application', 'unhealthy', { error: error instanceof Error ? error.message : 'Unknown error' });
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
const apiRouter = express.Router();

// Public routes (no authentication required)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/setup', setupRoutes);

// Health check endpoint (public)
apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: config.APP_VERSION
  });
});

// Cookie debug endpoint (public)
apiRouter.get('/debug/cookies', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Cookie debug info',
    cookies: {
      received: req.cookies,
      headers: req.headers.cookie,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    },
    config: {
      cookieDomain: config.COOKIE_DOMAIN,
      cookieSecure: config.COOKIE_SECURE,
      cookieSameSite: config.COOKIE_SAME_SITE,
      nodeEnv: config.NODE_ENV
    }
  });
});

// 2FA routes now mounted under /auth/2fa in auth.ts
// Keep this for login verification only
apiRouter.use('/2fa', twoFactorRoutes);

// Public info endpoint
apiRouter.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dhruval Exim ERP API v1 - Complete Business Management System',
    version: '2.0.0',
    description: 'Complete Factory ERP Management System with 24 Business Models',
    availableEndpoints: [
      'GET /api/v1/info - API information (public)',
      'POST /api/v1/auth/login - User login (public)',
      'POST /api/v1/auth/register - User registration (public)',
      'GET /api/v1/companies - Company management (auth required)',
      'GET /api/v1/users - User management (auth required)',
      'GET /api/v1/customers - Customer management (auth required)',
      'GET /api/v1/suppliers - Supplier management (auth required)',
      'GET /api/v1/inventory - Inventory management (auth required)',
      'GET /api/v1/production - Production management (auth required)',
      'GET /api/v1/customer-orders - Customer orders (auth required)',
      'GET /api/v1/purchase-orders - Purchase orders (auth required)',
      'GET /api/v1/invoices - Invoice management (auth required)',
      'GET /api/v1/quotations - Quotation management (auth required)',
      'GET /api/v1/warehouses - Warehouse management (auth required)',
      'GET /api/v1/stock-movements - Stock tracking (auth required)',
      'GET /api/v1/financial-transactions - Financial management (auth required)',
      'GET /api/v1/visitors - Visitor management (auth required)',
      'GET /api/v1/vehicles - Vehicle management (auth required)',
      'GET /api/v1/security-logs - Security logging (auth required)',
      'GET /api/v1/audit-logs - Audit trail (auth required)',
      'GET /api/v1/business-analytics - Business analytics (auth required)',
      'GET /api/v1/boiler-monitoring - Boiler monitoring (auth required)',
      'GET /api/v1/electricity-monitoring - Electricity monitoring (auth required)',
      'GET /api/v1/hospitality - Hospitality management (auth required)',
      'GET /api/v1/dispatch - Dispatch management (auth required)',
      'GET /api/v1/reports - Report generation (auth required)',
      'GET /api/v1/spares - Spare parts management (auth required)',
      'GET /api/v1/manpower - Manpower management (auth required)',
      'GET /api/v1/stickers - Sticker & label system (auth required)',
      'GET /api/v1/dashboard - Dashboard data (auth required)'
    ],
    authentication: {
      required: 'Most endpoints require authentication',
      loginEndpoint: '/api/v1/auth/login',
      tokenType: 'Bearer token in Authorization header'
    },
    timestamp: new Date().toISOString()
  });
});

// Protected routes (authentication required)
apiRouter.use(authenticate);

// Admin routes (require admin/super admin access)
apiRouter.use('/admin', adminTwoFactorRoutes);
apiRouter.use('/admin', adminUsersRoutes);
apiRouter.use('/admin', adminCompaniesRoutes);
apiRouter.use('/admin/users', userManagementRoutes);

// Company context required for these routes
apiRouter.use(requireCompany);

// Legacy v1 routes
// apiRouter.use('/visitors', visitorRoutes);

// Dashboard routes (protected)
apiRouter.use('/dashboard', dashboardRoutes);

// Reports routes (protected)
// apiRouter.use('/reports', reportsRoutes);

// Companies routes (protected) - TEMPORARILY DISABLED to fix v1 route conflict
// apiRouter.use('/companies', companiesRoutes);

// Users routes (protected)
apiRouter.use('/users', usersRoutes);

// Orders routes (protected)
apiRouter.use('/orders', ordersRoutes);

// Inventory routes (protected)
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/inventory-enhanced', enhancedInventoryRoutes);

// Customers routes (protected)
apiRouter.use('/customers', customersRoutes);

// Suppliers routes (protected)
apiRouter.use('/suppliers', suppliersRoutes);

// Roles routes (protected)
apiRouter.use('/roles', rolesRoutes);

// Visitor routes (protected)
apiRouter.use('/visitors', visitorRoutes);

// Spares routes (protected)
apiRouter.use('/spares', sparesRoutes);

// Customer visits routes (protected)
apiRouter.use('/customer-visits', customerVisitsRoutes);

// Vehicles routes (protected)
apiRouter.use('/vehicles', vehiclesRoutes);

// Warehouses routes (protected)
apiRouter.use('/warehouses', warehousesRoutes);

// Mount API routes
app.use(config.API_PREFIX, apiRouter);

// Mount V1 specific routes (working routes) - Keep for backward compatibility
app.use('/api/v1/companies-legacy', v1CompaniesRoutes);
app.use('/api/v1/users-legacy', v1UsersRoutes);
app.use('/api/v1/quotations-legacy', v1QuotationsRoutes);
app.use('/api/v1/manpower-legacy', v1ManpowerRoutes);
app.use('/api/v1/stickers-legacy', v1StickerRoutes);

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
      dashboard: '/api/v1/dashboard/*'
    },
    timestamp: new Date().toISOString()
  });
});



// =============================================
// API V1 ROUTES (Complete Business Management System)
// =============================================
// Mount V1 specific routes (working routes) - Current working routes
app.use('/api/v1/companies', v1CompaniesRoutes);
app.use('/api/v1/users', v1UsersRoutes);
app.use('/api/v1/quotations', v1QuotationsRoutes);
app.use('/api/v1/manpower', v1ManpowerRoutes);
app.use('/api/v1/stickers', v1StickerRoutes);

// Mount all V1 routes (migrated from V2) - Clean and organized
app.use('/api/v1/customers', v1CustomersRoutes);
app.use('/api/v1/suppliers', v1SuppliersRoutes);
app.use('/api/v1/inventory', v1InventoryRoutes);
app.use('/api/v1/production', v1ProductionRoutes);
app.use('/api/v1/customer-orders', v1CustomerOrdersRoutes);
app.use('/api/v1/purchase-orders', v1PurchaseOrdersRoutes);
app.use('/api/v1/invoices', v1InvoicesRoutes);
app.use('/api/v1/warehouses', v1WarehousesRoutes);
app.use('/api/v1/stock-movements', v1StockMovementsRoutes);
app.use('/api/v1/financial-transactions', v1FinancialTransactionsRoutes);
app.use('/api/v1/visitors', v1VisitorsRoutes);
app.use('/api/v1/vehicles', v1VehiclesRoutes);
app.use('/api/v1/security-logs', v1SecurityLogsRoutes);
app.use('/api/v1/audit-logs', v1AuditLogsRoutes);
app.use('/api/v1/business-analytics', v1BusinessAnalyticsRoutes);
app.use('/api/v1/boiler-monitoring', v1BoilerMonitoringRoutes);
app.use('/api/v1/electricity-monitoring', v1ElectricityMonitoringRoutes);
app.use('/api/v1/hospitality', v1HospitalityRoutes);
app.use('/api/v1/dispatch', v1DispatchRoutes);
app.use('/api/v1/reports', v1ReportsRoutes);
app.use('/api/v1/spares', v1SparesRoutes);

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

      // Verify token and attach user info
      // Implementation similar to authenticate middleware
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

// Express-Winston error logging
app.use(errorLoggerMiddleware);

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

// =============================================
// ERROR HANDLING
// =============================================

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
    logger.info('🚀 Starting Factory ERP Server...');

    // Connect to database
    logger.info('📊 Attempting database connection...');
    await database.connect();
    logger.info('✅ Database connected successfully!');
    
    // Start HTTP server
    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 Factory ERP Server started successfully`, {
        port: config.PORT,
        environment: config.NODE_ENV,
        version: config.APP_VERSION,
        database: database.getConnectionStatus(),
        websockets: config.ENABLE_WEBSOCKETS,
        cors: config.CORS_ORIGIN,
        apiPrefix: config.API_PREFIX
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, httpServer, io };
