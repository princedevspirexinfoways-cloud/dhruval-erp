const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import the InventoryItem model
const InventoryItem = require('../dist/models/InventoryItem').default;

const fabricMaterials = [
  {
    itemCode: 'COTTON-001',
    itemName: 'Cotton Fabric - Premium Grade',
    companyItemCode: 'FAB-COT-001',
    category: {
      primary: 'raw_material',
      secondary: 'fabric',
      tertiary: 'cotton'
    },
    productType: 'yarn',
    quality: {
      qualityGrade: 'A+',
      qualityStandard: 'ISO 9001',
      qualityNotes: 'Premium cotton fabric for high-end products'
    },
    specifications: {
      gsm: 180,
      width: 60,
      color: 'White',
      weight: 2.5,
      composition: '100% Cotton',
      finish: 'Mercerized',
      threadCount: 40,
      weave: 'Plain',
      shrinkage: 4,
      careInstructions: 'Machine wash cold, tumble dry low'
    },
    stock: {
      currentStock: 1000,
      reservedStock: 0,
      availableStock: 1000,
      unit: 'meters',
      reorderLevel: 200,
      minStockLevel: 100,
      maxStockLevel: 2000,
      averageCost: 150,
      totalValue: 150000
    },
    pricing: {
      costPrice: 150,
      sellingPrice: 200,
      margin: 25,
      currency: 'INR'
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      lastUpdated: new Date()
    },
    tracking: {
      createdBy: '68aed39044f2955162f473eb', // superadmin user ID
      createdAt: new Date(),
      lastModifiedBy: '68aed39044f2955162f473eb',
      lastModifiedAt: new Date()
    }
  },
  {
    itemCode: 'POLY-001',
    itemName: 'Polyester Fabric - Industrial Grade',
    companyItemCode: 'FAB-POL-001',
    category: {
      primary: 'raw_material',
      secondary: 'fabric',
      tertiary: 'polyester'
    },
    productType: 'yarn',
    quality: {
      qualityGrade: 'A',
      qualityStandard: 'ISO 9001',
      qualityNotes: 'Industrial grade polyester fabric'
    },
    specifications: {
      gsm: 200,
      width: 58,
      color: 'Grey',
      weight: 3.0,
      composition: '100% Polyester',
      finish: 'DWR Coated',
      threadCount: 50,
      weave: 'Twill',
      shrinkage: 1.5,
      careInstructions: 'Machine wash warm, air dry'
    },
    stock: {
      currentStock: 800,
      reservedStock: 0,
      availableStock: 800,
      unit: 'meters',
      reorderLevel: 150,
      minStockLevel: 80,
      maxStockLevel: 1500,
      averageCost: 120,
      totalValue: 96000
    },
    pricing: {
      costPrice: 120,
      sellingPrice: 160,
      margin: 25,
      currency: 'INR'
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      lastUpdated: new Date()
    },
    tracking: {
      createdBy: '68aed39044f2955162f473eb', // superadmin user ID
      createdAt: new Date(),
      lastModifiedBy: '68aed39044f2955162f473eb',
      lastModifiedAt: new Date()
    }
  },
  {
    itemCode: 'LINEN-001',
    itemName: 'Linen Fabric - Natural',
    companyItemCode: 'FAB-LIN-001',
    category: {
      primary: 'raw_material',
      secondary: 'fabric',
      tertiary: 'linen'
    },
    productType: 'yarn',
    quality: {
      qualityGrade: 'A',
      qualityStandard: 'ISO 9001',
      qualityNotes: 'Natural linen fabric'
    },
    specifications: {
      gsm: 160,
      width: 55,
      color: 'Natural',
      weight: 2.2,
      composition: '100% Linen',
      finish: 'Natural',
      threadCount: 30,
      weave: 'Plain',
      shrinkage: 6.5,
      careInstructions: 'Hand wash cold, air dry'
    },
    stock: {
      currentStock: 500,
      reservedStock: 0,
      availableStock: 500,
      unit: 'meters',
      reorderLevel: 100,
      minStockLevel: 50,
      maxStockLevel: 800,
      averageCost: 200,
      totalValue: 100000
    },
    pricing: {
      costPrice: 200,
      sellingPrice: 280,
      margin: 28.57,
      currency: 'INR'
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      lastUpdated: new Date()
    },
    tracking: {
      createdBy: '68aed39044f2955162f473eb', // superadmin user ID
      createdAt: new Date(),
      lastModifiedBy: '68aed39044f2955162f473eb',
      lastModifiedAt: new Date()
    }
  },
  {
    itemCode: 'BLEND-001',
    itemName: 'Cotton-Polyester Blend Fabric',
    companyItemCode: 'FAB-BLD-001',
    category: {
      primary: 'raw_material',
      secondary: 'fabric',
      tertiary: 'blend'
    },
    productType: 'yarn',
    quality: {
      qualityGrade: 'B+',
      qualityStandard: 'ISO 9001',
      qualityNotes: 'Cotton-polyester blend for durability'
    },
    specifications: {
      gsm: 170,
      width: 59,
      color: 'Blue',
      weight: 2.8,
      composition: '65% Cotton, 35% Polyester',
      finish: 'Soft',
      threadCount: 40,
      weave: 'Plain',
      shrinkage: 3,
      careInstructions: 'Machine wash warm, tumble dry low'
    },
    stock: {
      currentStock: 750,
      reservedStock: 0,
      availableStock: 750,
      unit: 'meters',
      reorderLevel: 120,
      minStockLevel: 60,
      maxStockLevel: 1200,
      averageCost: 130,
      totalValue: 97500
    },
    pricing: {
      costPrice: 130,
      sellingPrice: 180,
      margin: 27.78,
      currency: 'INR'
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      lastUpdated: new Date()
    },
    tracking: {
      createdBy: '68aed39044f2955162f473eb', // superadmin user ID
      createdAt: new Date(),
      lastModifiedBy: '68aed39044f2955162f473eb',
      lastModifiedAt: new Date()
    }
  },
  {
    itemCode: 'DENIM-001',
    itemName: 'Denim Fabric - Heavy Weight',
    companyItemCode: 'FAB-DEN-001',
    category: {
      primary: 'raw_material',
      secondary: 'fabric',
      tertiary: 'denim'
    },
    productType: 'yarn',
    quality: {
      qualityGrade: 'A',
      qualityStandard: 'ISO 9001',
      qualityNotes: 'Heavy weight denim for jeans manufacturing'
    },
    specifications: {
      gsm: 300,
      width: 58,
      color: 'Indigo',
      weight: 4.5,
      composition: '100% Cotton',
      finish: 'Raw',
      threadCount: 50,
      weave: 'Twill',
      shrinkage: 9,
      careInstructions: 'Machine wash cold, air dry'
    },
    stock: {
      currentStock: 400,
      reservedStock: 0,
      availableStock: 400,
      unit: 'meters',
      reorderLevel: 80,
      minStockLevel: 40,
      maxStockLevel: 600,
      averageCost: 180,
      totalValue: 72000
    },
    pricing: {
      costPrice: 180,
      sellingPrice: 250,
      margin: 28,
      currency: 'INR'
    },
    status: {
      isActive: true,
      isDiscontinued: false,
      lastUpdated: new Date()
    },
    tracking: {
      createdBy: '68aed39044f2955162f473eb', // superadmin user ID
      createdAt: new Date(),
      lastModifiedBy: '68aed39044f2955162f473eb',
      lastModifiedAt: new Date()
    }
  }
];

async function seedFabricMaterials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-erp');
    console.log('Connected to MongoDB');

    // Get company ID (assuming we're using the same company)
    const companyId = '68aed30c8d1ce6852fdc5e07';

    // Add company ID to each fabric material
    const fabricMaterialsWithCompany = fabricMaterials.map(fabric => ({
      ...fabric,
      companyId: companyId,
      locations: [{
        warehouseId: '68aed32e8d1ce6852fdc5fd8', // Main Warehouse
        warehouseName: 'Main Warehouse',
        quantity: fabric.stock.currentStock,
        lastUpdated: new Date(),
        isActive: true
      }]
    }));

    // Insert fabric materials
    const result = await InventoryItem.insertMany(fabricMaterialsWithCompany);
    console.log(`✅ Successfully seeded ${result.length} fabric materials:`);
    
    result.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName} (${item.itemCode}) - ${item.stock.currentStock} ${item.stock.unit}`);
    });

    console.log('\n🎉 Fabric materials seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding fabric materials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedFabricMaterials();
