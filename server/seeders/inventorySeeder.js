const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Enhanced Inventory Schema
const inventoryItemSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  itemCode: { type: String, required: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  itemDescription: { type: String, trim: true },
  companyItemCode: { type: String, required: true, trim: true },
  
  category: {
    primary: { 
      type: String, 
      enum: ['raw_material', 'semi_finished', 'finished_goods', 'consumables', 'spare_parts'],
      required: true 
    },
    secondary: { type: String, trim: true },
    tertiary: { type: String, trim: true }
  },
  
  productType: { 
    type: String, 
    enum: ['saree', 'african', 'garment', 'digital_print', 'custom', 'chemical', 'dye', 'machinery', 'yarn', 'thread'],
    required: true
  },

  designInfo: {
    designNumber: { type: String, trim: true },
    designName: { type: String, trim: true },
    designCategory: { type: String, trim: true },
    season: { type: String, enum: ['spring', 'summer', 'monsoon', 'winter', 'all_season'] },
    collection: { type: String, trim: true },
    colorVariants: [{ type: String }],
    sizeVariants: [{ type: String }]
  },
  
  specifications: {
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    color: { type: String, trim: true },
    colorCode: { type: String, trim: true },
    design: { type: String, trim: true },
    pattern: { type: String, trim: true },
    fabricComposition: { type: String, trim: true },
    threadCount: { type: Number, min: 0 },
    weaveType: { type: String, enum: ['plain', 'twill', 'satin', 'jacquard', 'dobby', 'other'] },
    finish: { type: String, trim: true },
    tensileStrength: { type: Number, min: 0 },
    shrinkage: { type: Number, min: 0, max: 100 },
    colorFastness: { type: Number, min: 1, max: 5 },
    pilling: { type: Number, min: 1, max: 5 },
    concentration: { type: Number, min: 0, max: 100 },
    purity: { type: Number, min: 0, max: 100 },
    phLevel: { type: Number, min: 0, max: 14 },
    batchNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date }
  },
  
  stock: {
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    availableStock: { type: Number, required: true, min: 0, default: 0 },
    inTransitStock: { type: Number, default: 0, min: 0 },
    damagedStock: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true, trim: true },
    alternateUnit: { type: String, trim: true },
    conversionFactor: { type: Number, default: 1, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    maxStockLevel: { type: Number, default: 0, min: 0 },
    economicOrderQuantity: { type: Number, min: 0 },
    valuationMethod: { type: String, enum: ['FIFO', 'LIFO', 'Weighted Average'], default: 'FIFO' },
    averageCost: { type: Number, required: true, min: 0, default: 0 },
    totalValue: { type: Number, required: true, min: 0, default: 0 }
  },
  
  locations: [{
    warehouseId: { type: mongoose.Schema.Types.ObjectId },
    warehouseName: { type: String, required: true },
    zone: { type: String },
    rack: { type: String },
    bin: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  
  ageing: {
    ageInDays: { type: Number, default: 0, min: 0 },
    ageCategory: { 
      type: String, 
      enum: ['fresh', 'good', 'aging', 'old', 'obsolete'], 
      default: 'fresh'
    },
    lastMovementDate: { type: Date, default: Date.now },
    turnoverRate: { type: Number, default: 0, min: 0 },
    daysInStock: { type: Number, default: 0, min: 0 },
    slowMovingThreshold: { type: Number, default: 90 },
    obsoleteThreshold: { type: Number, default: 365 }
  },
  
  qualityControl: {
    qualityGrade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject'], default: 'A' },
    qualityScore: { type: Number, min: 0, max: 100, default: 100 },
    defectRate: { type: Number, min: 0, max: 100, default: 0 },
    lastQualityCheck: { type: Date },
    qualityCheckDue: { type: Date },
    qualityNotes: [{ 
      date: { type: Date, default: Date.now },
      inspector: { type: String },
      grade: { type: String },
      notes: { type: String },
      images: [String]
    }],
    requiresInspection: { type: Boolean, default: false }
  },
  
  pricing: {
    costPrice: { type: Number, min: 0 },
    standardCost: { type: Number, min: 0 },
    lastPurchasePrice: { type: Number, min: 0 },
    sellingPrice: { type: Number, min: 0 },
    marginPercentage: { type: Number, min: 0, max: 100 }
  },
  
  status: {
    isActive: { type: Boolean, default: true },
    isDiscontinued: { type: Boolean, default: false },
    isFastMoving: { type: Boolean, default: false },
    isSlowMoving: { type: Boolean, default: false },
    isObsolete: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  collection: 'inventory_items'
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

// Sample Inventory Data
const sampleInventoryItems = [
  // Raw Materials
  {
    itemCode: 'RM001',
    itemName: 'Grey Fabric - Cotton 120 GSM',
    itemDescription: 'Premium cotton grey fabric for saree printing',
    companyItemCode: 'GF-CT-120',
    category: { primary: 'raw_material', secondary: 'fabric', tertiary: 'cotton' },
    productType: 'saree',
    designInfo: {
      designCategory: 'base_fabric',
      season: 'all_season',
      collection: 'Cotton Base'
    },
    specifications: {
      gsm: 120,
      width: 44,
      color: 'Natural White',
      colorCode: '#F8F8FF',
      fabricComposition: '100% Cotton',
      weaveType: 'plain',
      finish: 'Mercerized'
    },
    stock: {
      currentStock: 500,
      availableStock: 450,
      reservedStock: 50,
      unit: 'meters',
      reorderLevel: 100,
      minStockLevel: 50,
      maxStockLevel: 1000,
      averageCost: 85,
      totalValue: 42500
    },
    locations: [{
      warehouseName: 'Main Warehouse',
      zone: 'A',
      rack: 'A1',
      bin: 'A1-01',
      quantity: 500
    }],
    ageing: {
      ageInDays: 15,
      ageCategory: 'fresh',
      lastMovementDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    qualityControl: {
      qualityGrade: 'A+',
      qualityScore: 95
    },
    pricing: {
      costPrice: 85,
      sellingPrice: 120,
      marginPercentage: 41.2
    }
  },
  
  {
    itemCode: 'RM002',
    itemName: 'African Print Base - Polyester 140 GSM',
    itemDescription: 'Polyester base fabric for African print designs',
    companyItemCode: 'AF-PL-140',
    category: { primary: 'raw_material', secondary: 'fabric', tertiary: 'polyester' },
    productType: 'african',
    specifications: {
      gsm: 140,
      width: 46,
      color: 'White',
      fabricComposition: '100% Polyester',
      weaveType: 'plain'
    },
    stock: {
      currentStock: 300,
      availableStock: 280,
      reservedStock: 20,
      unit: 'meters',
      reorderLevel: 80,
      averageCost: 95,
      totalValue: 28500
    },
    locations: [{
      warehouseName: 'Main Warehouse',
      zone: 'A',
      rack: 'A2',
      quantity: 300
    }],
    ageing: {
      ageInDays: 25,
      ageCategory: 'fresh'
    },
    qualityControl: {
      qualityGrade: 'A',
      qualityScore: 90
    }
  },

  // Semi-Finished Goods
  {
    itemCode: 'SF001',
    itemName: 'Saree Design S001 - In Print',
    itemDescription: 'Traditional paisley design saree in printing stage',
    companyItemCode: 'S001-PR',
    category: { primary: 'semi_finished', secondary: 'saree', tertiary: 'printing' },
    productType: 'saree',
    designInfo: {
      designNumber: 'S001',
      designName: 'Traditional Paisley',
      designCategory: 'traditional',
      season: 'all_season',
      collection: 'Heritage Collection',
      colorVariants: ['Red', 'Blue', 'Green', 'Purple']
    },
    specifications: {
      gsm: 120,
      width: 44,
      color: 'Red',
      colorCode: '#DC143C',
      design: 'Paisley Pattern',
      pattern: 'Traditional'
    },
    stock: {
      currentStock: 25,
      availableStock: 25,
      unit: 'pieces',
      reorderLevel: 10,
      averageCost: 450,
      totalValue: 11250
    },
    locations: [{
      warehouseName: 'Production Unit',
      zone: 'Print',
      rack: 'P1',
      quantity: 25
    }],
    ageing: {
      ageInDays: 5,
      ageCategory: 'fresh'
    },
    qualityControl: {
      qualityGrade: 'A',
      qualityScore: 88
    }
  },

  // Finished Goods
  {
    itemCode: 'FG001',
    itemName: 'Saree - Traditional Paisley Red',
    itemDescription: 'Finished saree with traditional paisley design in red',
    companyItemCode: 'S001-RD-FN',
    category: { primary: 'finished_goods', secondary: 'saree', tertiary: 'traditional' },
    productType: 'saree',
    designInfo: {
      designNumber: 'S001',
      designName: 'Traditional Paisley',
      designCategory: 'traditional',
      season: 'all_season',
      collection: 'Heritage Collection'
    },
    specifications: {
      gsm: 120,
      width: 44,
      length: 5.5,
      color: 'Red',
      colorCode: '#DC143C',
      design: 'Paisley Pattern',
      pattern: 'Traditional',
      fabricComposition: '100% Cotton'
    },
    stock: {
      currentStock: 15,
      availableStock: 12,
      reservedStock: 3,
      unit: 'pieces',
      reorderLevel: 5,
      averageCost: 650,
      totalValue: 9750
    },
    locations: [{
      warehouseName: 'Finished Goods Warehouse',
      zone: 'FG',
      rack: 'FG1',
      bin: 'FG1-S001',
      quantity: 15
    }],
    ageing: {
      ageInDays: 10,
      ageCategory: 'fresh'
    },
    qualityControl: {
      qualityGrade: 'A+',
      qualityScore: 95
    },
    pricing: {
      costPrice: 650,
      sellingPrice: 1200,
      marginPercentage: 84.6
    }
  },

  // Chemicals
  {
    itemCode: 'CH001',
    itemName: 'Reactive Dye - Red 195',
    itemDescription: 'High-quality reactive dye for cotton fabrics',
    companyItemCode: 'RD-195',
    category: { primary: 'raw_material', secondary: 'chemical', tertiary: 'dye' },
    productType: 'dye',
    specifications: {
      color: 'Red',
      concentration: 95,
      purity: 98,
      phLevel: 7.2
    },
    stock: {
      currentStock: 50,
      availableStock: 45,
      reservedStock: 5,
      unit: 'kg',
      reorderLevel: 15,
      averageCost: 850,
      totalValue: 42500
    },
    locations: [{
      warehouseName: 'Chemical Storage',
      zone: 'CS',
      rack: 'CS1',
      quantity: 50
    }],
    ageing: {
      ageInDays: 30,
      ageCategory: 'good'
    },
    qualityControl: {
      qualityGrade: 'A',
      qualityScore: 92
    }
  }
];

async function seedInventory() {
  try {
    console.log('📦 Starting Enhanced Inventory Seeder...');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully!');
    
    // Get company and user data
    const company = await mongoose.connection.db.collection('companies').findOne({});
    const user = await mongoose.connection.db.collection('users').findOne({});
    
    if (!company || !user) {
      throw new Error('❌ Company or User not found in database');
    }
    
    console.log(`🏢 Using company: ${company.companyName || company.name}`);
    console.log(`👤 Using user: ${user.email}`);
    
    // Clear existing inventory items
    console.log('🗑️  Clearing existing inventory items...');
    const deleteResult = await InventoryItem.deleteMany({});
    console.log(`🗑️  Removed ${deleteResult.deletedCount} existing inventory items`);
    
    // Add company and user IDs to sample data
    const inventoryWithIds = sampleInventoryItems.map(item => ({
      ...item,
      companyId: company._id,
      createdBy: user._id
    }));
    
    // Insert new inventory items
    console.log('📝 Adding new inventory items...');
    const insertResult = await InventoryItem.insertMany(inventoryWithIds);
    console.log(`✅ Successfully added ${insertResult.length} inventory items`);
    
    // Display summary
    console.log('\n📊 Enhanced Inventory Seeder Summary:');
    console.log(`   • Total items added: ${insertResult.length}`);
    console.log(`   • Raw materials: ${sampleInventoryItems.filter(i => i.category.primary === 'raw_material').length}`);
    console.log(`   • Semi-finished: ${sampleInventoryItems.filter(i => i.category.primary === 'semi_finished').length}`);
    console.log(`   • Finished goods: ${sampleInventoryItems.filter(i => i.category.primary === 'finished_goods').length}`);
    
    const totalValue = sampleInventoryItems.reduce((sum, i) => sum + (i.stock?.totalValue || 0), 0);
    console.log(`   • Total inventory value: ₹${totalValue.toLocaleString()}`);
    
    console.log('\n🎉 Enhanced inventory seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in enhanced inventory seeder:', error);
    process.exit(1);
  }
}

// Run seeder
seedInventory();
