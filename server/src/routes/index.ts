import { Router } from 'express';
import { authenticate, requireCompany } from '../middleware/auth';

// Import V1 routes only (clean structure)
import v1AuthRoutes from './v1/auth';
import v1CompaniesRoutes from './v1/companies';
import v1UsersRoutes from './v1/users';
import v1QuotationsRoutes from './v1/quotations';
import v1ManpowerRoutes from './v1/manpower';
import v1StickerRoutes from './v1/stickers';
import v1CustomersRoutes from './v1/customers';
import v1SuppliersRoutes from './v1/suppliers';
import v1AgentsRoutes from './v1/agents';
import v1InventoryRoutes from './v1/inventory';
// Import production module routes from features (MVC Structure) - Lazy loaded
// Don't import at top level to prevent hang
import v1CustomerOrdersRoutes from './v1/customer-orders';
import v1PurchaseOrdersRoutes from './v1/purchase-orders';
import v1PurchaseRoutes from './v1/purchase';
import v1PurchaseReportsRoutes from './v1/purchase-reports';
import v1InvoicesRoutes from './v1/invoices';
import v1WarehousesRoutes from './v1/warehouses';
import v1StockMovementsRoutes from './v1/stock-movements';
import v1FinancialTransactionsRoutes from './v1/financial-transactions';
import v1VisitorsRoutes from './v1/visitors';
import v1VehiclesRoutes from './v1/vehicles';
import v1GatePassesRoutes from './v1/gatepasses';
import v1SecurityLogsRoutes from './v1/security-logs';
import v1AuditLogsRoutes from './v1/audit-logs';
import v1BusinessAnalyticsRoutes from './v1/business-analytics';
import v1AnalyticsRoutes from './v1/analytics';
import v1SalesAnalyticsRoutes from './v1/salesAnalytics';
import v1SalesRoutes from './v1/sales';
import v1PurchaseAnalyticsRoutes from './v1/purchaseAnalytics';
import v1ProductionTrackingRoutes from './v1/productionTracking';
import v1BoilerMonitoringRoutes from './v1/boiler-monitoring';
import v1ElectricityMonitoringRoutes from './v1/electricity-monitoring';
import v1HospitalityRoutes from './v1/hospitality';
import v1DispatchRoutes from './v1/dispatch';
import v1EnhancedDispatchRoutes from './v1/enhanced-dispatch';
import v1ReportsRoutes from './v1/reports';
import v1SparesRoutes from './v1/spares';
import v1AttendanceRoutes from './v1/attendance';
import v1BatchesRoutes from './v1/batches';
import v1ScrapRoutes from './v1/scrap';
import v1GoodsReturnsRoutes from './v1/goods-returns';
import v1EmployeesRoutes from './v1/employees';
import v1ShiftsRoutes from './v1/shifts';
import v1ProductionDashboardRoutes from './v1/production-dashboard';
import v1AdvancedReportsRoutes from './v1/advanced-reports';
import v1DocumentManagementRoutes from './v1/document-management';
import v1DashboardRoutes from './v1/dashboard';
import v1OrdersRoutes from './v1/orders';
import v1FileAccessRoutes from './v1/file-access';
import v1CustomerVisitsRoutes from './v1/customer-visits';
import v1JobWorkRoutes from './v1/job-work';
import productionFlowRoutes from './productionFlow';
import productionStagesRoutes from './productionStages';
import greyFabricInwardRoutes from './greyFabricInward';
import preProcessingRoutes from './preProcessing';
import productionBatchRoutes from './productionBatchRoutes';

// Import new feature routes
import maintenanceRoutes from './maintenance';
import qualityRoutes from './quality';
import compatibilityRoutes from './compatibility';
import suppliersRoutes from './suppliers';

// Import feature-based routes
import categoryRoutes from '../features/category/routes/category.routes';
import unitRoutes from '../features/unit/routes/unit.routes';
import subcategoryRoutes from '../features/subcategory/routes/subcategory';
import jobWorkerRoutes from '../features/job-worker/routes/job-worker.routes';
import jobWorkTypeRoutes from '../features/job-work-type/routes/job-work-type.routes';

const router = Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Cookie debug endpoint
router.get('/debug/cookies', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cookie debug info',
    cookies: {
      received: req.cookies,
      headers: req.headers.cookie,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    }
  });
});

// Public info endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dhruval Exim ERP API v1 - Complete Business Management System',
    version: '2.0.0',
    description: 'Complete Factory ERP Management System with 24 Business Models',
    availableEndpoints: [
      'GET /api/v1/info - API information (public)',
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
      'GET /api/v1/analytics - Comprehensive analytics & reports (auth required)',
      'GET /api/v1/sales-analytics - Customer-wise sales analytics (auth required)',
      'GET /api/v1/sales - Comprehensive sales management (auth required)',
      'GET /api/v1/purchase-analytics - Supplier-wise purchase analytics (auth required)',
      'GET /api/v1/production-tracking - Real-time production tracking (auth required)',
      'GET /api/v1/boiler-monitoring - Boiler monitoring (auth required)',
      'GET /api/v1/electricity-monitoring - Electricity monitoring (auth required)',
      'GET /api/v1/hospitality - Hospitality management (auth required)',
      'GET /api/v1/dispatch - Dispatch management (auth required)',
      'GET /api/v1/reports - Report generation (auth required)',
      'GET /api/v1/spares - Spare parts management (auth required)',
      'GET /api/v1/manpower - Manpower management (auth required)',
      'GET /api/v1/stickers - Sticker & label system (auth required)',
      'GET /api/v1/attendance - Employee attendance (auth required)',
      'GET /api/v1/batches - Production batches (auth required)',
      'GET /api/v1/production-dashboard - Real-time production dashboard (auth required)',
      'GET /api/v1/advanced-reports - Advanced reporting system (auth required)',
      'GET /api/v1/document-management - Document management system (auth required)'
    ],
    authentication: {
      required: 'Most endpoints require authentication',
      loginEndpoint: '/api/v1/auth/login',
      tokenType: 'Bearer token in Authorization header'
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================
// V1 API ROUTES (Complete Business Management System)
// =============================================

// Auth routes (no authentication required)
router.use('/auth', v1AuthRoutes);

// Apply authentication middleware to all other v1 routes
router.use('/', authenticate);

// Core business management
router.use('/companies', v1CompaniesRoutes);
router.use('/users', v1UsersRoutes);
router.use('/customers', v1CustomersRoutes);
router.use('/suppliers', v1SuppliersRoutes);
router.use('/agents', v1AgentsRoutes);

// Dashboard and orders
router.use('/dashboard', v1DashboardRoutes);
router.use('/orders', v1OrdersRoutes);

// Inventory and production
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/job-work-types', jobWorkTypeRoutes);
router.use('/units', unitRoutes);
router.use('/job-workers', jobWorkerRoutes);
router.use('/inventory', v1InventoryRoutes);
// Production Module Routes (MVC Structure - Complete)
// All production modules registered under /production prefix
// Ultra-lazy loading: Only load the specific route being accessed + caching
const productionRouteCache: Record<string, any> = {};

router.use('/production', (req, res, next) => {
  try {
    // Extract the route path (e.g., 'program-details' from '/production/program-details')
    // req.path will be like '/program-details' or '/program-details/123' or '/program-details/order/ORD123'
    const pathParts = req.path.split('/').filter(Boolean);
    const firstPathSegment = pathParts[0] || '';
    
    // Map route paths to their module files
    const routeMap: Record<string, () => any> = {
      'program-details': () => require('../features/production/routes/program-details.routes').default,
      'bleaching': () => require('../features/production/routes/bleaching-process.routes').default,
      'after-bleaching': () => require('../features/production/routes/after-bleaching.routes').default,
      'batch-center': () => require('../features/production/routes/batch-center.routes').default,
      'printing': () => require('../features/production/routes/printing.routes').printingRoutes,
      'hazer-silicate-curing': () => require('../features/production/routes/hazer-silicate-curing.routes').hazerSilicateCuringRoutes,
      'washing': () => require('../features/production/routes/washing.routes').washingRoutes,
      'finishing': () => require('../features/production/routes/finishing.routes').finishingRoutes,
      'felt': () => require('../features/production/routes/felt.routes').feltRoutes,
      'folding-checking': () => require('../features/production/routes/folding-checking.routes').foldingCheckingRoutes,
      'packing': () => require('../features/production/routes/packing.routes').packingRoutes,
      'longation-stock': () => require('../features/production/routes/longation-stock.routes').longationStockRoutes,
      'rejection-stock': () => require('../features/production/routes/rejection-stock.routes').rejectionStockRoutes,
      'lot': () => require('../features/production/routes/lot.routes').default,
    };

    // Load only the specific route being accessed (with caching)
    if (firstPathSegment && routeMap[firstPathSegment]) {
      // Check cache first
      if (!productionRouteCache[firstPathSegment]) {
        const routeLoader = routeMap[firstPathSegment];
        productionRouteCache[firstPathSegment] = routeLoader();
      }
      // Create a temporary router to mount the route at the correct path
      // This ensures Express properly strips the path segment
      const tempRouter = Router();
      tempRouter.use(`/${firstPathSegment}`, productionRouteCache[firstPathSegment]);
      tempRouter(req, res, next);
    } else {
      // If path not found, try loading all routes (fallback)
      const getProductionRoutes = require('../features/production').default;
      const productionRoutes = typeof getProductionRoutes === 'function' ? getProductionRoutes() : getProductionRoutes;
      productionRoutes(req, res, next);
    }
  } catch (error) {
    console.error('Error loading production routes:', error);
    res.status(503).json({ success: false, message: 'Production routes not available' });
  }
});
router.use('/warehouses', v1WarehousesRoutes);
router.use('/stock-movements', v1StockMovementsRoutes);
router.use('/spares', v1SparesRoutes);
router.use('/scrap', v1ScrapRoutes);
router.use('/goods-returns', v1GoodsReturnsRoutes);

// New feature routes
router.use('/maintenance', maintenanceRoutes);
router.use('/quality', qualityRoutes);
router.use('/compatibility', compatibilityRoutes);
router.use('/suppliers-management', suppliersRoutes);

router.use('/batches', v1BatchesRoutes);

// Orders and financial
router.use('/customer-orders', v1CustomerOrdersRoutes);
router.use('/purchase-orders', v1PurchaseOrdersRoutes);
router.use('/purchase', v1PurchaseRoutes);
router.use('/purchase/reports', v1PurchaseReportsRoutes);

router.use('/invoices', v1InvoicesRoutes);
router.use('/quotations', v1QuotationsRoutes);
router.use('/financial-transactions', v1FinancialTransactionsRoutes);

// Operations and management
router.use('/manpower', v1ManpowerRoutes);
router.use('/stickers', v1StickerRoutes);
router.use('/visitors', v1VisitorsRoutes);
router.use('/vehicles', v1VehiclesRoutes);
router.use('/gatepasses', v1GatePassesRoutes);
router.use('/attendance', v1AttendanceRoutes);
router.use('/employees', v1EmployeesRoutes);
router.use('/shifts', v1ShiftsRoutes);

// Monitoring and analytics
router.use('/boiler-monitoring', v1BoilerMonitoringRoutes);
router.use('/electricity-monitoring', v1ElectricityMonitoringRoutes);
router.use('/business-analytics', v1BusinessAnalyticsRoutes);
router.use('/analytics', v1AnalyticsRoutes);
router.use('/sales-analytics', v1SalesAnalyticsRoutes);
router.use('/sales', v1SalesRoutes);
router.use('/purchase-analytics', v1PurchaseAnalyticsRoutes);
router.use('/production-tracking', v1ProductionTrackingRoutes);
router.use('/job-work', v1JobWorkRoutes);
router.use('/production-flow', productionFlowRoutes);
router.use('/production-stages', productionStagesRoutes);
router.use('/grey-fabric-inward', greyFabricInwardRoutes);
router.use('/pre-processing', preProcessingRoutes);
router.use('/production-batches', productionBatchRoutes);
router.use('/security-logs', v1SecurityLogsRoutes);
router.use('/audit-logs', v1AuditLogsRoutes);

// Specialized services
router.use('/hospitality', v1HospitalityRoutes);
router.use('/customer-visits', v1CustomerVisitsRoutes);
router.use('/dispatch', v1DispatchRoutes);
router.use('/enhanced-dispatch', v1EnhancedDispatchRoutes);
router.use('/reports', v1ReportsRoutes);

// Advanced features
router.use('/file-access', v1FileAccessRoutes);

router.use('/production-dashboard', v1ProductionDashboardRoutes);
router.use('/advanced-reports', v1AdvancedReportsRoutes);
router.use('/document-management', v1DocumentManagementRoutes);

export default router;
