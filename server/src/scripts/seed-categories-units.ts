import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from '../features/category/models/Category';
import Unit from '../features/unit/models/Unit';
import { Types } from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp_dev';

// Default Categories for Textile/Inventory Management
const DEFAULT_CATEGORIES = [
  {
    name: 'Raw Materials',
    description: 'Raw materials and base components',
    icon: '📦',
    color: '#3b82f6',
    isActive: true
  },
  {
    name: 'Finished Goods',
    description: 'Completed products ready for sale',
    icon: '✅',
    color: '#10b981',
    isActive: true
  },
  {
    name: 'Semi-Finished',
    description: 'Work in progress items',
    icon: '⚙️',
    color: '#f59e0b',
    isActive: true
  },
  {
    name: 'Consumables',
    description: 'Consumable items and supplies',
    icon: '🔧',
    color: '#8b5cf6',
    isActive: true
  },
  {
    name: 'Spare Parts',
    description: 'Spare parts and equipment',
    icon: '🔩',
    color: '#ef4444',
    isActive: true
  },
  {
    name: 'Chemicals',
    description: 'Chemical products and compounds',
    icon: '🧪',
    color: '#06b6d4',
    isActive: true
  },
  {
    name: 'Packaging Materials',
    description: 'Packaging and wrapping materials',
    icon: '📦',
    color: '#84cc16',
    isActive: true
  },
  {
    name: 'Tools & Equipment',
    description: 'Tools and equipment for operations',
    icon: '🛠️',
    color: '#f97316',
    isActive: true
  }
];

// Default Units for Textile/Inventory Management
const DEFAULT_UNITS = [
  { name: 'Meters', symbol: 'm', description: 'Length measurement in meters', baseUnit: 'm', conversionFactor: 1 },
  { name: 'Kilograms', symbol: 'kg', description: 'Weight measurement in kilograms', baseUnit: 'kg', conversionFactor: 1 },
  { name: 'Grams', symbol: 'g', description: 'Weight measurement in grams', baseUnit: 'kg', conversionFactor: 0.001 },
  { name: 'Pieces', symbol: 'pcs', description: 'Count in pieces', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Liters', symbol: 'L', description: 'Volume measurement in liters', baseUnit: 'L', conversionFactor: 1 },
  { name: 'Milliliters', symbol: 'ml', description: 'Volume measurement in milliliters', baseUnit: 'L', conversionFactor: 0.001 },
  { name: 'Yards', symbol: 'yd', description: 'Length measurement in yards', baseUnit: 'm', conversionFactor: 0.9144 },
  { name: 'Feet', symbol: 'ft', description: 'Length measurement in feet', baseUnit: 'm', conversionFactor: 0.3048 },
  { name: 'Inches', symbol: 'in', description: 'Length measurement in inches', baseUnit: 'm', conversionFactor: 0.0254 },
  { name: 'Centimeters', symbol: 'cm', description: 'Length measurement in centimeters', baseUnit: 'm', conversionFactor: 0.01 },
  { name: 'Square Meters', symbol: 'm²', description: 'Area measurement in square meters', baseUnit: 'm²', conversionFactor: 1 },
  { name: 'Square Feet', symbol: 'ft²', description: 'Area measurement in square feet', baseUnit: 'm²', conversionFactor: 0.092903 },
  { name: 'Rolls', symbol: 'rolls', description: 'Count in rolls', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Bundles', symbol: 'bundles', description: 'Count in bundles', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Boxes', symbol: 'boxes', description: 'Count in boxes', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Cartons', symbol: 'cartons', description: 'Count in cartons', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Bags', symbol: 'bags', description: 'Count in bags', baseUnit: 'pcs', conversionFactor: 1 },
  { name: 'Dozens', symbol: 'doz', description: 'Count in dozens (12 pieces)', baseUnit: 'pcs', conversionFactor: 12 },
  { name: 'Tons', symbol: 't', description: 'Weight measurement in tons', baseUnit: 'kg', conversionFactor: 1000 },
  { name: 'Pounds', symbol: 'lbs', description: 'Weight measurement in pounds', baseUnit: 'kg', conversionFactor: 0.453592 }
];

async function seedCategoriesAndUnits() {
  try {
    console.log('🌱 Starting Categories and Units Seeder...');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Database connected successfully!');
    
    // Get all companies
    const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));
    const companies = await Company.find({ isActive: true }).lean() as any[];
    
    if (companies.length === 0) {
      console.log('⚠️  No active companies found. Please create a company first.');
      process.exit(1);
    }
    
    console.log(`🏢 Found ${companies.length} active companies`);
    
    // Get a super admin user or first user for createdBy
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ isActive: true }).lean() as any;
    
    if (!user) {
      console.log('⚠️  No active users found. Please create a user first.');
      process.exit(1);
    }
    
    const createdBy = new Types.ObjectId(user._id.toString());
    console.log(`👤 Using user: ${(user as any).email || (user as any).username || user._id}`);
    
    let totalCategoriesCreated = 0;
    let totalUnitsCreated = 0;
    
    // Seed categories and units for each company
    for (const company of companies) {
      const companyId = new Types.ObjectId(company._id.toString());
      const companyName = (company as any).companyName || (company as any).name || company._id.toString();
      console.log(`\n📦 Processing company: ${companyName}`);
      
      // Seed Categories
      console.log('  📂 Seeding categories...');
      for (const categoryData of DEFAULT_CATEGORIES) {
        // Check if category already exists
        const existingCategory = await Category.findOne({
          companyId,
          name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
        });
        
        if (!existingCategory) {
          await Category.create({
            ...categoryData,
            companyId,
            createdBy,
            lastModifiedBy: createdBy
          });
          totalCategoriesCreated++;
          console.log(`    ✅ Created category: ${categoryData.name}`);
        } else {
          console.log(`    ⏭️  Category already exists: ${categoryData.name}`);
        }
      }
      
      // Seed Units
      console.log('  📏 Seeding units...');
      for (const unitData of DEFAULT_UNITS) {
        // Check if unit already exists
        const existingUnit = await Unit.findOne({
          companyId,
          $or: [
            { name: { $regex: new RegExp(`^${unitData.name}$`, 'i') } },
            { symbol: { $regex: new RegExp(`^${unitData.symbol}$`, 'i') } }
          ]
        });
        
        if (!existingUnit) {
          await Unit.create({
            ...unitData,
            companyId,
            createdBy,
            lastModifiedBy: createdBy,
            isActive: true
          });
          totalUnitsCreated++;
          console.log(`    ✅ Created unit: ${unitData.name} (${unitData.symbol})`);
        } else {
          console.log(`    ⏭️  Unit already exists: ${unitData.name} (${unitData.symbol})`);
        }
      }
    }
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   📂 Categories created: ${totalCategoriesCreated}`);
    console.log(`   📏 Units created: ${totalUnitsCreated}`);
    console.log(`   🏢 Companies processed: ${companies.length}`);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories and units:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seeder
seedCategoriesAndUnits();

