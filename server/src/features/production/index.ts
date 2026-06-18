// Production Module Index
// Main entry point for production module

// Models
export * from './models';

// Services
export * from './services';

// Controllers
export * from './controllers';

// Routes - Named exports (lazy)
export * from './routes';

// Default export - Main router with all production routes (lazy loaded)
// Export function that returns router when called
export default () => {
  const productionRoutes = require('./routes').default;
  return typeof productionRoutes === 'function' ? productionRoutes() : productionRoutes;
};

