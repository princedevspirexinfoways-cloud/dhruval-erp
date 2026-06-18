const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Company = require('./src/models/Company');
const User = require('./src/models/User');
const ProductionOrder = require('./src/models/ProductionOrder');
const { SpareSupplier } = require('./src/models/Supplier');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dhruval-erp');
    colorLog('✅ Connected to MongoDB', 'green');
  } catch (error) {
    colorLog(`❌ MongoDB connection failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function createSampleData() {
  try {
    colorLog('🌱 Creating sample production data...', 'cyan');

    // Find or create a company
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        companyName: 'Dhruval Exim Pvt. Ltd.',
        legalName: 'Dhruval Exim Pvt. Ltd.',
        companyCode: 'COMP001',
        status: 'active',
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
        addresses: {
          registeredOffice: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          }
        },
        contactInfo: {
          phones: [{ type: '+91-9876543210', label: 'Primary' }],
          emails: [{ type: 'info@dhruval.com', label: 'Primary' }]
        }
      });
      colorLog('✅ Created sample company', 'green');
    }

    // Find or create a user
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@dhruval.com',
        password: 'password123',
        role: 'admin',
        companyId: company._id,
        isActive: true,
        createdBy: new mongoose.Types.ObjectId()
      });
      colorLog('✅ Created sample user', 'green');
    }

    // Create sample suppliers
    const suppliers = [
      {
        supplierName: 'ABC Textiles Ltd.',
        supplierCode: 'SUPP001',
        companyId: company._id,
        contactInfo: {
          primaryPhone: '+91-9876543210',
          primaryEmail: 'contact@abctextiles.com'
        },
        isActive: true,
        createdBy: user._id
      },
      {
        supplierName: 'XYZ Fabrics Pvt. Ltd.',
        supplierCode: 'SUPP002',
        companyId: company._id,
        contactInfo: {
          primaryPhone: '+91-9876543211',
          primaryEmail: 'info@xyzfabrics.com'
        },
        isActive: true,
        createdBy: user._id
      },
      {
        supplierName: 'PQR Textile Mills',
        supplierCode: 'SUPP003',
        companyId: company._id,
        contactInfo: {
          primaryPhone: '+91-9876543212',
          primaryEmail: 'sales@pqrmills.com'
        },
        isActive: true,
        createdBy: user._id
      }
    ];

    for (const supplierData of suppliers) {
      const existingSupplier = await SpareSupplier.findOne({ supplierCode: supplierData.supplierCode });
      if (!existingSupplier) {
        await SpareSupplier.create(supplierData);
        colorLog(`✅ Created supplier: ${supplierData.supplierName}`, 'green');
      }
    }

    // Create sample production orders
    const productionOrders = [
      {
        productionOrderNumber: 'PO-2024-001',
        orderDate: new Date(),
        customerName: 'Fashion House Pvt. Ltd.',
        product: {
          productType: 'saree',
          design: 'Floral Print',
          color: 'Red',
          gsm: 150,
          width: 60,
          length: 6
        },
        orderQuantity: 1000,
        unit: 'pieces',
        status: 'approved',
        priority: 'high',
        companyId: company._id,
        createdBy: user._id,
        schedule: {
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      },
      {
        productionOrderNumber: 'PO-2024-002',
        orderDate: new Date(),
        customerName: 'Textile Mart Ltd.',
        product: {
          productType: 'garment',
          design: 'Plain',
          color: 'Blue',
          gsm: 200,
          width: 45,
          length: 3
        },
        orderQuantity: 500,
        unit: 'meters',
        status: 'approved',
        priority: 'medium',
        companyId: company._id,
        createdBy: user._id,
        schedule: {
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        }
      },
      {
        productionOrderNumber: 'PO-2024-003',
        orderDate: new Date(),
        customerName: 'Fashion Trends Inc.',
        product: {
          productType: 'african',
          design: 'Geometric',
          color: 'Green',
          gsm: 180,
          width: 55,
          length: 4
        },
        orderQuantity: 750,
        unit: 'yards',
        status: 'approved',
        priority: 'low',
        companyId: company._id,
        createdBy: user._id,
        schedule: {
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
        }
      }
    ];

    for (const orderData of productionOrders) {
      const existingOrder = await ProductionOrder.findOne({ productionOrderNumber: orderData.productionOrderNumber });
      if (!existingOrder) {
        await ProductionOrder.create(orderData);
        colorLog(`✅ Created production order: ${orderData.productionOrderNumber}`, 'green');
      }
    }

    colorLog('🎉 Sample production data created successfully!', 'green');
    colorLog('📊 Summary:', 'bright');
    colorLog('   • 1 Company created', 'green');
    colorLog('   • 1 User created', 'green');
    colorLog('   • 3 Suppliers created', 'green');
    colorLog('   • 3 Production Orders created', 'green');
    colorLog('   • Ready for GRN creation!', 'green');

  } catch (error) {
    colorLog(`❌ Error creating sample data: ${error.message}`, 'red');
    throw error;
  }
}

async function runSeeder() {
  try {
    await connectDB();
    await createSampleData();
    process.exit(0);
  } catch (error) {
    colorLog(`❌ Seeder failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the seeder
runSeeder();
