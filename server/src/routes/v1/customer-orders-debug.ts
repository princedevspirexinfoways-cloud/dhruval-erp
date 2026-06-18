import { Router } from 'express';

const router = Router();

console.log('🔍 Step 1: Router created');

// Test 2: Try importing the controller
console.log('🔍 Step 2: About to import CustomerOrderController...');
try {
  const { CustomerOrderController } = require('../../controllers/CustomerOrderController');
  console.log('✅ Step 2: CustomerOrderController imported successfully');
  
  // Test 3: Try instantiating the controller
  console.log('🔍 Step 3: About to instantiate CustomerOrderController...');
  const customerOrderController = new CustomerOrderController();
  console.log('✅ Step 3: CustomerOrderController instantiated successfully');
  
  // Add a simple test route
  router.get('/test', (req, res) => {
    res.json({ 
      message: 'Customer orders debug route working!',
      controllerStatus: 'instantiated'
    });
  });
  
} catch (error) {
  console.error('❌ Error in CustomerOrderController:', error);
  
  router.get('/test', (req, res) => {
    res.json({ 
      message: 'Customer orders debug route - controller failed',
      error: error.message
    });
  });
}

console.log('✅ Customer orders debug route loaded');

export default router;
