import { Router } from 'express';

const router = Router();

console.log('🔍 Testing CustomerOrder route isolation...');

// Test 1: Just import the CustomerOrder model
console.log('🔍 Step 1: Importing CustomerOrder model...');
try {
  const { CustomerOrder } = require('../../models');
  console.log('✅ Step 1: CustomerOrder model imported successfully');
} catch (error) {
  console.error('❌ Step 1: Error importing CustomerOrder model:', error.message);
}

// Test 2: Try importing the CustomerOrderService
console.log('🔍 Step 2: Importing CustomerOrderService...');
try {
  const { CustomerOrderService } = require('../../services/CustomerOrderService');
  console.log('✅ Step 2: CustomerOrderService imported successfully');
  
  // Test 3: Try instantiating the service
  console.log('🔍 Step 3: Instantiating CustomerOrderService...');
  const customerOrderService = new CustomerOrderService();
  console.log('✅ Step 3: CustomerOrderService instantiated successfully');
  
} catch (error) {
  console.error('❌ Step 2/3: Error with CustomerOrderService:', error.message);
}

// Test 4: Try importing the CustomerOrderController
console.log('🔍 Step 4: Importing CustomerOrderController...');
try {
  const { CustomerOrderController } = require('../../controllers/CustomerOrderController');
  console.log('✅ Step 4: CustomerOrderController imported successfully');
  
  // Test 5: Try instantiating the controller
  console.log('🔍 Step 5: Instantiating CustomerOrderController...');
  const customerOrderController = new CustomerOrderController();
  console.log('✅ Step 5: CustomerOrderController instantiated successfully');
  
} catch (error) {
  console.error('❌ Step 4/5: Error with CustomerOrderController:', error.message);
}

// Add a simple test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Customer orders isolation test completed!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Customer orders isolation test route loaded');

export default router;
