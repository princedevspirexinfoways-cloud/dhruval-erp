// #!/usr/bin/env ts-node

// /**
//  * 🌱 COMPREHENSIVE SEED SCRIPT FOR FACTORY ERP
//  * Seeds all models with realistic data for testing and development
//  */

// import mongoose from 'mongoose';
// import { faker } from '@faker-js/faker';
// import * as dotenv from 'dotenv';

// // Load environment variables
// dotenv.config({ path: '.env.local' });

// // bcrypt is handled by User model pre-save hook

// // Import all models
// import {
//   Company,
//   User,
//   Role,
//   Customer,
//   Supplier,
//   InventoryItem,
//   StockMovement,
//   Warehouse,
//   ProductionOrder,
//   CustomerOrder,
//   PurchaseOrder,
//   Invoice,
//   Quotation,
//   FinancialTransaction,
//   Visitor,
//   Vehicle,
//   SecurityLog,
//   AuditLog,
//   BusinessAnalytics,
//   BoilerMonitoring,
//   ElectricityMonitoring,
//   Hospitality,
//   Dispatch,
//   Report
// } from '../models';

// // Additional seeding methods will be defined inline

// // Seed configuration
// const SEED_CONFIG = {
//   companies: 5,
//   usersPerCompany: 15,
//   rolesPerCompany: 8,
//   customersPerCompany: 25,
//   suppliersPerCompany: 15,
//   inventoryItemsPerCompany: 50,
//   warehousesPerCompany: 3,
//   productionOrdersPerCompany: 30,
//   customerOrdersPerCompany: 40,
//   purchaseOrdersPerCompany: 25,
//   invoicesPerCompany: 35,
//   quotationsPerCompany: 20,
//   financialTransactionsPerCompany: 100,
//   visitorsPerCompany: 50,
//   vehiclesPerCompany: 20,
//   securityLogsPerCompany: 100,
//   auditLogsPerCompany: 200,
//   businessAnalyticsPerCompany: 12,
//   boilerMonitoringPerCompany: 30,
//   electricityMonitoringPerCompany: 30,
//   hospitalityPerCompany: 25,
//   dispatchesPerCompany: 40,
//   reportsPerCompany: 15
// };

// // Helper functions
// const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
// const getRandomElements = <T>(array: T[], count: number): T[] => {
//   const shuffled = [...array].sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, count);
// };

// // Indian cities and states
// const INDIAN_LOCATIONS = [
//   { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
//   { city: 'Delhi', state: 'Delhi', pincode: '110001' },
//   { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
//   { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
//   { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
//   { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
//   { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
//   { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
//   { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
//   { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' }
// ];

// // Industry types
// const INDUSTRIES = [
//   'Manufacturing', 'Textiles', 'Pharmaceuticals', 'Automotive', 
//   'Electronics', 'Food Processing', 'Chemical', 'Steel', 
//   'Cement', 'Paper & Pulp'
// ];

// // Company types
// const COMPANY_TYPES = ['Private Limited', 'Public Limited', 'Partnership', 'Proprietorship'];

// // User roles
// const USER_ROLES = [
//   'super_admin', 'admin', 'manager', 'supervisor', 
//   'operator', 'accountant', 'hr', 'security', 
//   'quality_control', 'maintenance'
// ];

// // Product categories
// const PRODUCT_CATEGORIES = [
//   'Raw Materials', 'Finished Goods', 'Work in Progress', 
//   'Spare Parts', 'Consumables', 'Tools', 'Chemicals', 
//   'Packaging Materials', 'Safety Equipment'
// ];

// // Vehicle types
// const VEHICLE_TYPES = ['Truck', 'Car', 'Van', 'Motorcycle', 'Bus', 'Trailer'];

// class ComprehensiveSeed {
//   private companies: any[] = [];
//   private users: any[] = [];
//   private roles: any[] = [];
//   private customers: any[] = [];
//   private suppliers: any[] = [];
//   private inventoryItems: any[] = [];
//   private warehouses: any[] = [];

//   async connect() {
//     const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp_dev';

//     try {
//       await mongoose.connect(MONGODB_URI, {
//         serverSelectionTimeoutMS: 10000,
//         connectTimeoutMS: 10000,
//         socketTimeoutMS: 45000,
//       });
//       console.log('🔗 Connected to MongoDB successfully');
//     } catch (error) {
//       console.error('❌ MongoDB connection error:', error);
//       console.log('💡 Trying local MongoDB as fallback...');

//       try {
//         await mongoose.connect('mongodb://localhost:27017/factory_erp_dev');
//         console.log('🔗 Connected to local MongoDB');
//       } catch (localError) {
//         console.error('❌ Local MongoDB connection also failed:', localError);
//         console.log('💡 Please ensure MongoDB is running locally or check Atlas connection');
//         process.exit(1);
//       }
//     }
//   }

//   async clearDatabase() {
//     console.log('🧹 Clearing existing data...');

//     try {
//       await Company.deleteMany({});
//       await User.deleteMany({});
//       await Role.deleteMany({});
//       await Customer.deleteMany({});
//       await Supplier.deleteMany({});
//       await InventoryItem.deleteMany({});
//       await StockMovement.deleteMany({});
//       await Warehouse.deleteMany({});
//       await ProductionOrder.deleteMany({});
//       await CustomerOrder.deleteMany({});
//       await PurchaseOrder.deleteMany({});
//       await Invoice.deleteMany({});
//       await Quotation.deleteMany({});
//       await FinancialTransaction.deleteMany({});
//       await Visitor.deleteMany({});
//       await Vehicle.deleteMany({});
//       await SecurityLog.deleteMany({});
//       await AuditLog.deleteMany({});
//       await BusinessAnalytics.deleteMany({});
//       await BoilerMonitoring.deleteMany({});
//       await ElectricityMonitoring.deleteMany({});
//       await Hospitality.deleteMany({});
//       await Dispatch.deleteMany({});
//       await Report.deleteMany({});

//       console.log('✅ Database cleared');
//     } catch (error) {
//       console.error('❌ Error clearing database:', error);
//       throw error;
//     }
//   }

//   async seedCompanies() {
//     console.log('🏢 Seeding companies...');
    
//     for (let i = 0; i < SEED_CONFIG.companies; i++) {
//       const location = getRandomElement(INDIAN_LOCATIONS);
      
//       const company = await Company.create({
//         name: faker.company.name() + ' Industries',
//         displayName: faker.company.name(),
//         industry: getRandomElement(INDUSTRIES),
//         companyType: getRandomElement(COMPANY_TYPES),
//         incorporationDate: faker.date.past({ years: 10 }),
        
//         // Address
//         address: {
//           street: faker.location.streetAddress(),
//           area: faker.location.secondaryAddress(),
//           city: location.city,
//           state: location.state,
//           pincode: location.pincode,
//           country: 'India'
//         },
        
//         // Contact
//         contactPhone: {
//           primary: faker.phone.number(),
//           secondary: faker.phone.number()
//         },
//         contactEmail: {
//           primary: faker.internet.email(),
//           secondary: faker.internet.email()
//         },
//         website: faker.internet.url(),
        
//         // GST & Legal
//         gstNumber: `${Math.floor(Math.random() * 100000000000000).toString().padStart(15, '0')}`,
//         panNumber: faker.string.alphanumeric(10).toUpperCase(),
//         tanNumber: faker.string.alphanumeric(10).toUpperCase(),
//         cinNumber: faker.string.alphanumeric(21).toUpperCase(),
        
//         // Bank Account
//         bankAccounts: [{
//           bankName: getRandomElement(['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'PNB']),
//           branchName: faker.location.city(),
//           accountNumber: faker.finance.accountNumber(),
//           ifscCode: faker.finance.routingNumber(),
//           accountType: getRandomElement(['Current', 'Savings']),
//           accountHolderName: faker.company.name(),
//           currentBalance: faker.number.int({ min: 100000, max: 10000000 }),
//           isActive: true,
//           isPrimary: true
//         }],
        
//         // Settings
//         settings: {
//           timezone: 'Asia/Kolkata',
//           currency: 'INR',
//           dateFormat: 'DD/MM/YYYY',
//           fiscalYearStart: new Date('2024-04-01'),
//           workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
//           workingHours: { start: '09:00', end: '18:00' }
//         },
        
//         status: getRandomElement(['active', 'inactive']),
//         subscriptionPlan: getRandomElement(['basic', 'premium', 'enterprise']),
//         subscriptionExpiry: faker.date.future(),
        
//         createdBy: null, // Will be set after creating super admin
//         updatedBy: null
//       });
      
//       this.companies.push(company);
//     }
    
//     console.log(`✅ Created ${this.companies.length} companies`);
//   }

//   async seedRoles() {
//     console.log('👥 Seeding roles...');
    
//     for (const company of this.companies) {
//       const roleNames = [
//         'Super Admin', 'Admin', 'Manager', 'Supervisor', 
//         'Operator', 'Accountant', 'HR Manager', 'Security Officer'
//       ];
      
//       for (const roleName of roleNames) {
//         const role = await Role.create({
//           companyId: company._id,
//           name: roleName,
//           description: `${roleName} role for ${company.name}`,
//           permissions: {
//             dashboard: { view: true },
//             users: roleName.includes('Admin') ? { view: true, create: true, edit: true, delete: true } : { view: true },
//             inventory: { view: true, create: roleName.includes('Manager'), edit: roleName.includes('Manager') },
//             production: { view: true, create: roleName.includes('Manager'), edit: roleName.includes('Manager') },
//             orders: { view: true, create: true, edit: roleName.includes('Manager') },
//             customers: { view: true, create: true, edit: roleName.includes('Manager') },
//             suppliers: { view: true, create: roleName.includes('Manager') },
//             finance: roleName.includes('Account') ? { view: true, create: true, edit: true } : { view: false },
//             reports: { view: true, viewReports: true },
//             settings: roleName.includes('Admin') ? { view: true, edit: true } : { view: false }
//           },
//           isActive: true,
//           createdBy: null,
//           updatedBy: null
//         });
        
//         this.roles.push(role);
//       }
//     }
    
//     console.log(`✅ Created ${this.roles.length} roles`);
//   }

//   async seedUsers() {
//     console.log('👤 Seeding users...');

//     for (const company of this.companies) {
//       const companyRoles = this.roles.filter(r => r.companyId.toString() === company._id.toString());

//       // Create super admin for each company
//       const superAdmin = await User.create({
//         companyAccess: [{
//           companyId: company._id,
//           role: 'super_admin',
//           permissions: {
//             dashboard: { view: true },
//             users: { view: true, create: true, edit: true, delete: true, approve: true },
//             inventory: { view: true, create: true, edit: true, delete: true, approve: true },
//             production: { view: true, create: true, edit: true, delete: true, approve: true },
//             orders: { view: true, create: true, edit: true, delete: true, approve: true },
//             customers: { view: true, create: true, edit: true, delete: true },
//             suppliers: { view: true, create: true, edit: true, delete: true },
//             finance: { view: true, create: true, edit: true, delete: true, viewReports: true },
//             reports: { view: true, create: true, edit: true, viewReports: true },
//             settings: { view: true, edit: true }
//           },
//           isActive: true,
//           joinedAt: faker.date.past({ years: 2 })
//         }],
//         personalInfo: {
//           firstName: faker.person.firstName(),
//           lastName: faker.person.lastName(),
//           email: `admin@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
//           phone: faker.phone.number(),
//           dateOfBirth: faker.date.birthdate({ min: 25, max: 55, mode: 'age' }),
//           gender: getRandomElement(['Male', 'Female']),
//           address: {
//             street: faker.location.streetAddress(),
//             city: faker.location.city(),
//             state: faker.location.state(),
//             pincode: faker.location.zipCode(),
//             country: 'India'
//           }
//         },
//         employmentInfo: {
//           employeeId: `EMP${faker.number.int({ min: 1000, max: 9999 })}`,
//           department: 'Administration',
//           designation: 'Super Administrator',
//           joiningDate: faker.date.past({ years: 3 }),
//           employmentType: 'Full-time',
//           workLocation: 'Head Office',
//           reportingManager: null,
//           salary: faker.number.int({ min: 100000, max: 200000 }),
//           isActive: true
//         },
//         credentials: {
//           username: `admin_${company.name.toLowerCase().replace(/\s+/g, '_')}`,
//           password: 'admin123', // Will be hashed by pre-save hook
//           lastLogin: faker.date.recent(),
//           loginAttempts: 0,
//           isLocked: false,
//           mustChangePassword: false
//         },
//         preferences: {
//           language: 'en',
//           timezone: 'Asia/Kolkata',
//           theme: getRandomElement(['light', 'dark']),
//           notifications: {
//             email: true,
//             sms: true,
//             push: true
//           }
//         },
//         isActive: true,
//         createdBy: null,
//         updatedBy: null
//       });

//       this.users.push(superAdmin);

//       // Create regular users
//       for (let i = 0; i < SEED_CONFIG.usersPerCompany - 1; i++) {
//         const role = getRandomElement(companyRoles);
//         const firstName = faker.person.firstName();
//         const lastName = faker.person.lastName();

//         const user = await User.create({
//           companyAccess: [{
//             companyId: company._id,
//             role: getRandomElement(USER_ROLES.filter(r => r !== 'super_admin')),
//             permissions: role.permissions,
//             isActive: true,
//             joinedAt: faker.date.past({ years: 2 })
//           }],
//           personalInfo: {
//             firstName,
//             lastName,
//             email: faker.internet.email({ firstName, lastName }),
//             phone: faker.phone.number(),
//             dateOfBirth: faker.date.birthdate({ min: 22, max: 60, mode: 'age' }),
//             gender: getRandomElement(['Male', 'Female']),
//             address: {
//               street: faker.location.streetAddress(),
//               city: faker.location.city(),
//               state: faker.location.state(),
//               pincode: faker.location.zipCode(),
//               country: 'India'
//             }
//           },
//           employmentInfo: {
//             employeeId: `EMP${faker.number.int({ min: 1000, max: 9999 })}`,
//             department: getRandomElement(['Production', 'Quality', 'Maintenance', 'Admin', 'HR', 'Finance']),
//             designation: faker.person.jobTitle(),
//             joiningDate: faker.date.past({ years: 3 }),
//             employmentType: getRandomElement(['Full-time', 'Part-time', 'Contract']),
//             workLocation: getRandomElement(['Head Office', 'Factory Floor', 'Warehouse']),
//             reportingManager: superAdmin._id,
//             salary: faker.number.int({ min: 25000, max: 80000 }),
//             isActive: getRandomElement([true, true, true, false]) // 75% active
//           },
//           credentials: {
//             username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
//             password: 'password123', // Will be hashed by pre-save hook
//             lastLogin: faker.date.recent(),
//             loginAttempts: 0,
//             isLocked: false,
//             mustChangePassword: false
//           },
//           preferences: {
//             language: 'en',
//             timezone: 'Asia/Kolkata',
//             theme: getRandomElement(['light', 'dark']),
//             notifications: {
//               email: true,
//               sms: faker.datatype.boolean(),
//               push: faker.datatype.boolean()
//             }
//           },
//           isActive: getRandomElement([true, true, true, false]),
//           createdBy: superAdmin._id,
//           updatedBy: superAdmin._id
//         });

//         this.users.push(user);
//       }
//     }

//     console.log(`✅ Created ${this.users.length} users`);
//   }

//   async seedCustomers() {
//     console.log('🤝 Seeding customers...');

//     for (const company of this.companies) {
//       for (let i = 0; i < SEED_CONFIG.customersPerCompany; i++) {
//         const location = getRandomElement(INDIAN_LOCATIONS);
//         const companyUsers = this.users.filter(u =>
//           u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//         );
//         const createdBy = getRandomElement(companyUsers);

//         const customer = await Customer.create({
//           companyId: company._id,
//           customerCode: `CUST${faker.number.int({ min: 1000, max: 9999 })}`,
//           name: faker.company.name(),
//           contactPerson: faker.person.fullName(),
//           email: faker.internet.email(),
//           phone: faker.phone.number(),
//           alternatePhone: faker.phone.number(),

//           address: {
//             street: faker.location.streetAddress(),
//             area: faker.location.secondaryAddress(),
//             city: location.city,
//             state: location.state,
//             pincode: location.pincode,
//             country: 'India'
//           },

//           billingAddress: {
//             street: faker.location.streetAddress(),
//             area: faker.location.secondaryAddress(),
//             city: location.city,
//             state: location.state,
//             pincode: location.pincode,
//             country: 'India'
//           },

//           gstNumber: Math.random() > 0.3 ? `${Math.floor(Math.random() * 100000000000000).toString().padStart(15, '0')}` : undefined,
//           panNumber: faker.string.alphanumeric(10).toUpperCase(),

//           customerType: getRandomElement(['Regular', 'Premium', 'VIP']),
//           industry: getRandomElement(INDUSTRIES),
//           creditLimit: faker.number.int({ min: 50000, max: 1000000 }),
//           creditDays: getRandomElement([15, 30, 45, 60]),

//           bankDetails: {
//             bankName: getRandomElement(['SBI', 'HDFC', 'ICICI', 'Axis Bank']),
//             accountNumber: faker.finance.accountNumber(),
//             ifscCode: faker.finance.routingNumber(),
//             accountHolderName: faker.company.name()
//           },

//           isActive: getRandomElement([true, true, true, false]),
//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });

//         this.customers.push(customer);
//       }
//     }

//     console.log(`✅ Created ${this.customers.length} customers`);
//   }

//   async seedSuppliers() {
//     console.log('🏭 Seeding suppliers...');

//     for (const company of this.companies) {
//       for (let i = 0; i < SEED_CONFIG.suppliersPerCompany; i++) {
//         const location = getRandomElement(INDIAN_LOCATIONS);
//         const companyUsers = this.users.filter(u =>
//           u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//         );
//         const createdBy = getRandomElement(companyUsers);

//         const supplier = await Supplier.create({
//           companyId: company._id,
//           supplierCode: `SUPP${faker.number.int({ min: 1000, max: 9999 })}`,
//           name: faker.company.name() + ' Suppliers',
//           contactPerson: faker.person.fullName(),
//           email: faker.internet.email(),
//           phone: faker.phone.number(),
//           alternatePhone: faker.phone.number(),

//           address: {
//             street: faker.location.streetAddress(),
//             area: faker.location.secondaryAddress(),
//             city: location.city,
//             state: location.state,
//             pincode: location.pincode,
//             country: 'India'
//           },

//           gstNumber: Math.random() > 0.2 ? `${Math.floor(Math.random() * 100000000000000).toString().padStart(15, '0')}` : undefined,
//           panNumber: faker.string.alphanumeric(10).toUpperCase(),

//           supplierType: getRandomElement(['Raw Material', 'Finished Goods', 'Services', 'Equipment']),
//           category: getRandomElement(['Local', 'National', 'International']),
//           paymentTerms: getRandomElement(['Advance', 'COD', '15 Days', '30 Days', '45 Days']),
//           creditLimit: faker.number.int({ min: 100000, max: 2000000 }),

//           bankDetails: {
//             bankName: getRandomElement(['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'PNB']),
//             accountNumber: faker.finance.accountNumber(),
//             ifscCode: faker.finance.routingNumber(),
//             accountHolderName: faker.company.name()
//           },

//           performanceRating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
//           isActive: getRandomElement([true, true, true, false]),
//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });

//         this.suppliers.push(supplier);
//       }
//     }

//     console.log(`✅ Created ${this.suppliers.length} suppliers`);
//   }

//   async seedWarehouses() {
//     console.log('🏪 Seeding warehouses...');

//     for (const company of this.companies) {
//       for (let i = 0; i < SEED_CONFIG.warehousesPerCompany; i++) {
//         const location = getRandomElement(INDIAN_LOCATIONS);
//         const companyUsers = this.users.filter(u =>
//           u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//         );
//         const createdBy = getRandomElement(companyUsers);

//         const warehouse = await Warehouse.create({
//           companyId: company._id,
//           warehouseCode: `WH${faker.number.int({ min: 100, max: 999 })}`,
//           name: `${getRandomElement(['Main', 'Secondary', 'Raw Material', 'Finished Goods'])} Warehouse ${i + 1}`,
//           description: faker.lorem.sentence(),

//           address: {
//             street: faker.location.streetAddress(),
//             area: faker.location.secondaryAddress(),
//             city: location.city,
//             state: location.state,
//             pincode: location.pincode,
//             country: 'India'
//           },

//           contactPerson: faker.person.fullName(),
//           phone: faker.phone.number(),
//           email: faker.internet.email(),

//           capacity: {
//             totalArea: faker.number.int({ min: 1000, max: 10000 }),
//             usedArea: faker.number.int({ min: 500, max: 8000 }),
//             availableArea: faker.number.int({ min: 200, max: 2000 })
//           },

//           zones: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, zoneIndex) => ({
//             zoneName: `Zone ${String.fromCharCode(65 + zoneIndex)}`,
//             zoneType: getRandomElement(['Storage', 'Dispatch', 'Receiving', 'Quality Check']),
//             capacity: faker.number.int({ min: 100, max: 1000 }),
//             currentOccupancy: faker.number.int({ min: 50, max: 800 })
//           })),

//           facilities: getRandomElements([
//             'Loading Dock', 'Unloading Dock', 'Cold Storage', 'Security System',
//             'Fire Safety', 'CCTV', 'Weighbridge', 'Office Space'
//           ], faker.number.int({ min: 3, max: 6 })),

//           isActive: true,
//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });

//         this.warehouses.push(warehouse);
//       }
//     }

//     console.log(`✅ Created ${this.warehouses.length} warehouses`);
//   }

//   async seedInventoryItems() {
//     console.log('📦 Seeding inventory items...');

//     for (const company of this.companies) {
//       const companyWarehouses = this.warehouses.filter(w => w.companyId.toString() === company._id.toString());
//       const companySuppliers = this.suppliers.filter(s => s.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.inventoryItemsPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);
//         const category = getRandomElement(PRODUCT_CATEGORIES);

//         const item = await InventoryItem.create({
//           companyId: company._id,
//           itemCode: `ITEM${faker.number.int({ min: 10000, max: 99999 })}`,
//           name: faker.commerce.productName(),
//           description: faker.commerce.productDescription(),
//           category,
//           subCategory: `${category} - ${faker.commerce.productAdjective()}`,

//           specifications: {
//             brand: faker.company.name(),
//             model: faker.vehicle.model(),
//             dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })} cm`,
//             weight: `${faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 })} kg`,
//             color: faker.color.human(),
//             material: getRandomElement(['Steel', 'Aluminum', 'Plastic', 'Wood', 'Composite'])
//           },

//           pricing: {
//             costPrice: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
//             sellingPrice: faker.number.float({ min: 15, max: 1500, fractionDigits: 2 }),
//             mrp: faker.number.float({ min: 20, max: 2000, fractionDigits: 2 }),
//             currency: 'INR'
//           },

//           inventory: {
//             currentStock: faker.number.int({ min: 0, max: 1000 }),
//             reservedStock: faker.number.int({ min: 0, max: 100 }),
//             availableStock: faker.number.int({ min: 0, max: 900 }),
//             reorderLevel: faker.number.int({ min: 10, max: 50 }),
//             maxStockLevel: faker.number.int({ min: 500, max: 2000 }),
//             unit: getRandomElement(['Pieces', 'Kg', 'Liters', 'Meters', 'Boxes'])
//           },

//           suppliers: companySuppliers.length > 0 ? [getRandomElement(companySuppliers)._id] : [],
//           primaryWarehouse: companyWarehouses.length > 0 ? getRandomElement(companyWarehouses)._id : null,

//           qualityParameters: {
//             hasQualityCheck: faker.datatype.boolean(),
//             qualityGrade: getRandomElement(['A', 'B', 'C']),
//             certifications: getRandomElements(['ISO', 'CE', 'BIS', 'ROHS'], faker.number.int({ min: 0, max: 3 }))
//           },

//           isActive: getRandomElement([true, true, true, false]),
//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });

//         this.inventoryItems.push(item);
//       }
//     }

//     console.log(`✅ Created ${this.inventoryItems.length} inventory items`);
//   }

//   async seedProductionOrders() {
//     console.log('🏭 Seeding production orders...');

//     for (const company of this.companies) {
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.productionOrdersPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 5 }));

//         const productionOrder = await ProductionOrder.create({
//           companyId: company._id,
//           orderNumber: `PO${faker.number.int({ min: 10000, max: 99999 })}`,
//           orderDate: faker.date.past({ years: 1 }),
//           expectedCompletionDate: faker.date.future({ years: 0.5 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             quantity: faker.number.int({ min: 10, max: 500 }),
//             unitPrice: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
//             totalPrice: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 })
//           })),

//           totalAmount: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),

//           status: getRandomElement(['Draft', 'Approved', 'In Progress', 'Completed', 'Cancelled']),
//           priority: getRandomElement(['Low', 'Medium', 'High', 'Urgent']),

//           productionStages: [
//             {
//               stageName: 'Material Preparation',
//               status: getRandomElement(['Pending', 'In Progress', 'Completed']),
//               startDate: faker.date.past(),
//               estimatedDuration: faker.number.int({ min: 1, max: 5 })
//             },
//             {
//               stageName: 'Manufacturing',
//               status: getRandomElement(['Pending', 'In Progress', 'Completed']),
//               startDate: faker.date.past(),
//               estimatedDuration: faker.number.int({ min: 3, max: 10 })
//             },
//             {
//               stageName: 'Quality Check',
//               status: getRandomElement(['Pending', 'In Progress', 'Completed']),
//               startDate: faker.date.past(),
//               estimatedDuration: faker.number.int({ min: 1, max: 3 })
//             }
//           ],

//           assignedTo: getRandomElement(companyUsers)._id,
//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created production orders for all companies`);
//   }

//   async seedCustomerOrders() {
//     console.log('🛒 Seeding customer orders...');

//     for (const company of this.companies) {
//       const companyCustomers = this.customers.filter(c => c.companyId.toString() === company._id.toString());
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.customerOrdersPerCompany; i++) {
//         const customer = getRandomElement(companyCustomers);
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 8 }));

//         const customerOrder = await CustomerOrder.create({
//           companyId: company._id,
//           orderNumber: `CO${faker.number.int({ min: 10000, max: 99999 })}`,
//           customerId: customer._id,
//           orderDate: faker.date.past({ years: 1 }),
//           expectedDeliveryDate: faker.date.future({ years: 0.3 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             quantity: faker.number.int({ min: 1, max: 100 }),
//             unitPrice: item.pricing.sellingPrice,
//             discount: faker.number.float({ min: 0, max: 15, fractionDigits: 2 }),
//             totalPrice: faker.number.float({ min: 50, max: 10000, fractionDigits: 2 })
//           })),

//           subtotal: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
//           taxAmount: faker.number.float({ min: 180, max: 9000, fractionDigits: 2 }),
//           totalAmount: faker.number.float({ min: 1180, max: 59000, fractionDigits: 2 }),

//           status: getRandomElement(['Draft', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
//           priority: getRandomElement(['Low', 'Medium', 'High']),

//           shippingAddress: {
//             street: faker.location.streetAddress(),
//             city: faker.location.city(),
//             state: faker.location.state(),
//             pincode: faker.location.zipCode(),
//             country: 'India'
//           },

//           paymentStatus: getRandomElement(['Pending', 'Partial', 'Paid', 'Overdue']),
//           paymentMethod: getRandomElement(['Cash', 'Bank Transfer', 'Cheque', 'Online']),

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created customer orders for all companies`);
//   }

//   async seedPurchaseOrders() {
//     console.log('🛍️ Seeding purchase orders...');

//     for (const company of this.companies) {
//       const companySuppliers = this.suppliers.filter(s => s.companyId.toString() === company._id.toString());
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.purchaseOrdersPerCompany; i++) {
//         const supplier = getRandomElement(companySuppliers);
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 6 }));

//         await PurchaseOrder.create({
//           companyId: company._id,
//           poNumber: `PUR${faker.number.int({ min: 10000, max: 99999 })}`,
//           supplierId: supplier._id,
//           orderDate: faker.date.past({ years: 1 }),
//           expectedDeliveryDate: faker.date.future({ years: 0.2 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             quantity: faker.number.int({ min: 10, max: 1000 }),
//             unitPrice: item.pricing.costPrice,
//             totalPrice: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 })
//           })),

//           subtotal: faker.number.float({ min: 5000, max: 100000, fractionDigits: 2 }),
//           taxAmount: faker.number.float({ min: 900, max: 18000, fractionDigits: 2 }),
//           totalAmount: faker.number.float({ min: 5900, max: 118000, fractionDigits: 2 }),

//           status: getRandomElement(['Draft', 'Sent', 'Acknowledged', 'Partially Received', 'Completed', 'Cancelled']),

//           terms: {
//             paymentTerms: getRandomElement(['Advance', '15 Days', '30 Days', '45 Days']),
//             deliveryTerms: getRandomElement(['FOB', 'CIF', 'Ex-Works']),
//             warranty: `${faker.number.int({ min: 6, max: 36 })} months`
//           },

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created purchase orders for all companies`);
//   }

//   async seedInvoices() {
//     console.log('🧾 Seeding invoices...');

//     for (const company of this.companies) {
//       const companyCustomers = this.customers.filter(c => c.companyId.toString() === company._id.toString());
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.invoicesPerCompany; i++) {
//         const customer = getRandomElement(companyCustomers);
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 5 }));

//         await Invoice.create({
//           companyId: company._id,
//           invoiceNumber: `INV${faker.number.int({ min: 10000, max: 99999 })}`,
//           customerId: customer._id,
//           invoiceDate: faker.date.past({ years: 1 }),
//           dueDate: faker.date.future({ years: 0.1 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             description: item.name,
//             quantity: faker.number.int({ min: 1, max: 50 }),
//             unitPrice: item.pricing.sellingPrice,
//             discount: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
//             taxRate: 18,
//             totalPrice: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })
//           })),

//           subtotal: faker.number.float({ min: 1000, max: 25000, fractionDigits: 2 }),
//           discountAmount: faker.number.float({ min: 0, max: 2500, fractionDigits: 2 }),
//           taxAmount: faker.number.float({ min: 180, max: 4500, fractionDigits: 2 }),
//           totalAmount: faker.number.float({ min: 1180, max: 27000, fractionDigits: 2 }),

//           status: getRandomElement(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']),
//           paymentStatus: getRandomElement(['Unpaid', 'Partial', 'Paid']),

//           gstDetails: {
//             gstNumber: customer.gstNumber || '',
//             placeOfSupply: faker.location.state(),
//             reverseCharge: faker.datatype.boolean()
//           },

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created invoices for all companies`);
//   }

//   async seedQuotations() {
//     console.log('💰 Seeding quotations...');

//     for (const company of this.companies) {
//       const companyCustomers = this.customers.filter(c => c.companyId.toString() === company._id.toString());
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.quotationsPerCompany; i++) {
//         const customer = getRandomElement(companyCustomers);
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 4 }));

//         await Quotation.create({
//           companyId: company._id,
//           quotationNumber: `QUO${faker.number.int({ min: 10000, max: 99999 })}`,
//           customerId: customer._id,
//           quotationDate: faker.date.past({ years: 1 }),
//           validUntil: faker.date.future({ years: 0.1 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             description: item.name,
//             quantity: faker.number.int({ min: 1, max: 100 }),
//             unitPrice: item.pricing.sellingPrice,
//             discount: faker.number.float({ min: 0, max: 15, fractionDigits: 2 }),
//             totalPrice: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 })
//           })),

//           subtotal: faker.number.float({ min: 1000, max: 40000, fractionDigits: 2 }),
//           discountAmount: faker.number.float({ min: 0, max: 6000, fractionDigits: 2 }),
//           taxAmount: faker.number.float({ min: 180, max: 7200, fractionDigits: 2 }),
//           totalAmount: faker.number.float({ min: 1180, max: 41200, fractionDigits: 2 }),

//           status: getRandomElement(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']),

//           terms: {
//             paymentTerms: getRandomElement(['Advance', '15 Days', '30 Days']),
//             deliveryTerms: getRandomElement(['7 Days', '15 Days', '30 Days']),
//             warranty: `${faker.number.int({ min: 12, max: 24 })} months`,
//             validityPeriod: `${faker.number.int({ min: 15, max: 90 })} days`
//           },

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created quotations for all companies`);
//   }

//   async seedFinancialTransactions() {
//     await AdditionalSeedMethods.seedFinancialTransactions(
//       this.companies, this.users, this.customers, this.suppliers, SEED_CONFIG
//     );
//   }

//   async seedVisitors() {
//     await AdditionalSeedMethods.seedVisitors(this.companies, this.users, SEED_CONFIG);
//   }

//   async seedVehicles() {
//     await AdditionalSeedMethods.seedVehicles(this.companies, this.users, SEED_CONFIG);
//   }

//   async seedSecurityLogs() {
//     await AdditionalSeedMethods.seedSecurityLogs(this.companies, this.users, SEED_CONFIG);
//   }

//   async seedAuditLogs() {
//     await AdditionalSeedMethods.seedAuditLogs(this.companies, this.users, SEED_CONFIG);
//   }

//   async seedBusinessAnalytics() {
//     console.log('📊 Seeding business analytics...');

//     for (const company of this.companies) {
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.businessAnalyticsPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);

//         await BusinessAnalytics.create({
//           companyId: company._id,
//           reportDate: faker.date.past({ years: 1 }),

//           revenue: {
//             totalRevenue: faker.number.float({ min: 100000, max: 1000000, fractionDigits: 2 }),
//             monthlyGrowth: faker.number.float({ min: -10, max: 25, fractionDigits: 2 }),
//             yearlyGrowth: faker.number.float({ min: -5, max: 40, fractionDigits: 2 })
//           },

//           orders: {
//             totalOrders: faker.number.int({ min: 50, max: 500 }),
//             completedOrders: faker.number.int({ min: 40, max: 450 }),
//             pendingOrders: faker.number.int({ min: 5, max: 50 }),
//             cancelledOrders: faker.number.int({ min: 0, max: 20 })
//           },

//           customers: {
//             totalCustomers: faker.number.int({ min: 20, max: 200 }),
//             newCustomers: faker.number.int({ min: 2, max: 20 }),
//             activeCustomers: faker.number.int({ min: 15, max: 150 })
//           },

//           inventory: {
//             totalItems: faker.number.int({ min: 100, max: 1000 }),
//             lowStockItems: faker.number.int({ min: 5, max: 50 }),
//             outOfStockItems: faker.number.int({ min: 0, max: 10 })
//           },

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created business analytics for all companies`);
//   }

//   async seedMonitoringData() {
//     console.log('⚡ Seeding monitoring data...');

//     for (const company of this.companies) {
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       // Boiler Monitoring
//       for (let i = 0; i < SEED_CONFIG.boilerMonitoringPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);

//         await BoilerMonitoring.create({
//           companyId: company._id,
//           boilerId: `BOILER${faker.number.int({ min: 1, max: 10 })}`,
//           timestamp: faker.date.past({ years: 0.5 }),

//           temperature: faker.number.float({ min: 80, max: 150, fractionDigits: 1 }),
//           pressure: faker.number.float({ min: 5, max: 15, fractionDigits: 2 }),
//           waterLevel: faker.number.float({ min: 30, max: 90, fractionDigits: 1 }),
//           fuelConsumption: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),

//           status: getRandomElement(['Normal', 'Warning', 'Critical', 'Maintenance']),
//           efficiency: faker.number.float({ min: 75, max: 95, fractionDigits: 1 }),

//           alerts: Math.random() > 0.8 ? [faker.lorem.sentence()] : [],

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }

//       // Electricity Monitoring
//       for (let i = 0; i < SEED_CONFIG.electricityMonitoringPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);

//         await ElectricityMonitoring.create({
//           companyId: company._id,
//           meterId: `METER${faker.number.int({ min: 1, max: 20 })}`,
//           timestamp: faker.date.past({ years: 0.5 }),

//           voltage: faker.number.float({ min: 220, max: 240, fractionDigits: 1 }),
//           current: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
//           power: faker.number.float({ min: 1000, max: 10000, fractionDigits: 0 }),
//           energy: faker.number.float({ min: 100, max: 1000, fractionDigits: 2 }),

//           powerFactor: faker.number.float({ min: 0.8, max: 1.0, fractionDigits: 3 }),
//           frequency: faker.number.float({ min: 49.5, max: 50.5, fractionDigits: 2 }),

//           cost: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created monitoring data for all companies`);
//   }

//   async seedHospitality() {
//     console.log('🏨 Seeding hospitality data...');

//     for (const company of this.companies) {
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.hospitalityPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);

//         await Hospitality.create({
//           companyId: company._id,
//           bookingId: `BOOK${faker.number.int({ min: 10000, max: 99999 })}`,

//           guestInfo: {
//             name: faker.person.fullName(),
//             phone: faker.phone.number(),
//             email: faker.internet.email(),
//             company: faker.company.name(),
//             designation: faker.person.jobTitle()
//           },

//           roomInfo: {
//             roomNumber: `R${faker.number.int({ min: 101, max: 350 })}`,
//             roomType: getRandomElement(['Single', 'Double', 'Suite', 'Conference Room']),
//             capacity: faker.number.int({ min: 1, max: 8 }),
//             amenities: getRandomElements(['AC', 'WiFi', 'TV', 'Minibar', 'Balcony'], faker.number.int({ min: 2, max: 5 }))
//           },

//           bookingDates: {
//             checkIn: faker.date.past({ years: 0.5 }),
//             checkOut: faker.date.future({ years: 0.1 }),
//             duration: faker.number.int({ min: 1, max: 7 })
//           },

//           services: {
//             meals: getRandomElements(['Breakfast', 'Lunch', 'Dinner'], faker.number.int({ min: 1, max: 3 })),
//             transport: faker.datatype.boolean(),
//             laundry: faker.datatype.boolean(),
//             extraServices: []
//           },

//           billing: {
//             roomCharges: faker.number.float({ min: 2000, max: 8000, fractionDigits: 2 }),
//             serviceCharges: faker.number.float({ min: 500, max: 2000, fractionDigits: 2 }),
//             taxes: faker.number.float({ min: 300, max: 1200, fractionDigits: 2 }),
//             totalAmount: faker.number.float({ min: 2800, max: 11200, fractionDigits: 2 })
//           },

//           status: getRandomElement(['Booked', 'Checked In', 'Checked Out', 'Cancelled']),

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created hospitality data for all companies`);
//   }

//   async seedDispatches() {
//     console.log('🚚 Seeding dispatches...');

//     for (const company of this.companies) {
//       const companyCustomers = this.customers.filter(c => c.companyId.toString() === company._id.toString());
//       const companyItems = this.inventoryItems.filter(i => i.companyId.toString() === company._id.toString());
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.dispatchesPerCompany; i++) {
//         const customer = getRandomElement(companyCustomers);
//         const createdBy = getRandomElement(companyUsers);
//         const items = getRandomElements(companyItems, faker.number.int({ min: 1, max: 5 }));

//         await Dispatch.create({
//           companyId: company._id,
//           dispatchNumber: `DISP${faker.number.int({ min: 10000, max: 99999 })}`,
//           customerId: customer._id,
//           dispatchDate: faker.date.past({ years: 0.5 }),

//           items: items.map(item => ({
//             itemId: item._id,
//             quantity: faker.number.int({ min: 1, max: 50 }),
//             batchNumber: faker.string.alphanumeric(8),
//             serialNumbers: []
//           })),

//           vehicleInfo: {
//             vehicleNumber: faker.vehicle.vrm(),
//             driverName: faker.person.fullName(),
//             driverPhone: faker.phone.number()
//           },

//           destination: {
//             address: faker.location.streetAddress(),
//             city: faker.location.city(),
//             state: faker.location.state(),
//             pincode: faker.location.zipCode()
//           },

//           status: getRandomElement(['Prepared', 'Dispatched', 'In Transit', 'Delivered', 'Returned']),

//           tracking: {
//             trackingNumber: faker.string.alphanumeric(12),
//             estimatedDelivery: faker.date.future({ years: 0.1 }),
//             actualDelivery: Math.random() > 0.5 ? faker.date.recent() : undefined
//           },

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created dispatches for all companies`);
//   }

//   async seedReports() {
//     console.log('📄 Seeding reports...');

//     for (const company of this.companies) {
//       const companyUsers = this.users.filter(u =>
//         u.companyAccess.some((ca: any) => ca.companyId.toString() === company._id.toString())
//       );

//       for (let i = 0; i < SEED_CONFIG.reportsPerCompany; i++) {
//         const createdBy = getRandomElement(companyUsers);

//         await Report.create({
//           companyId: company._id,
//           reportId: `RPT${faker.number.int({ min: 10000, max: 99999 })}`,
//           title: faker.lorem.words(4),
//           type: getRandomElement(['Sales', 'Inventory', 'Financial', 'Production', 'Quality', 'HR']),

//           parameters: {
//             dateRange: {
//               from: faker.date.past({ years: 1 }),
//               to: faker.date.recent()
//             },
//             filters: {
//               department: getRandomElement(['All', 'Production', 'Sales', 'Finance']),
//               status: getRandomElement(['All', 'Active', 'Completed'])
//             }
//           },

//           data: {
//             summary: {
//               totalRecords: faker.number.int({ min: 100, max: 1000 }),
//               totalValue: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 })
//             },
//             details: []
//           },

//           format: getRandomElement(['PDF', 'Excel', 'CSV']),
//           status: getRandomElement(['Generated', 'Scheduled', 'Failed']),

//           generatedAt: faker.date.recent(),
//           fileSize: faker.number.int({ min: 100, max: 5000 }), // KB
//           downloadCount: faker.number.int({ min: 0, max: 50 }),

//           createdBy: createdBy._id,
//           updatedBy: createdBy._id
//         });
//       }
//     }

//     console.log(`✅ Created reports for all companies`);
//   }

//   calculateTotalRecords(): number {
//     const companiesCount = this.companies.length;
//     return (
//       companiesCount + // Companies
//       this.roles.length + // Roles
//       this.users.length + // Users
//       this.customers.length + // Customers
//       this.suppliers.length + // Suppliers
//       this.warehouses.length + // Warehouses
//       this.inventoryItems.length + // Inventory Items
//       (SEED_CONFIG.productionOrdersPerCompany * companiesCount) + // Production Orders
//       (SEED_CONFIG.customerOrdersPerCompany * companiesCount) + // Customer Orders
//       (SEED_CONFIG.purchaseOrdersPerCompany * companiesCount) + // Purchase Orders
//       (SEED_CONFIG.invoicesPerCompany * companiesCount) + // Invoices
//       (SEED_CONFIG.quotationsPerCompany * companiesCount) + // Quotations
//       (SEED_CONFIG.financialTransactionsPerCompany * companiesCount) + // Financial Transactions
//       (SEED_CONFIG.visitorsPerCompany * companiesCount) + // Visitors
//       (SEED_CONFIG.vehiclesPerCompany * companiesCount) + // Vehicles
//       (SEED_CONFIG.securityLogsPerCompany * companiesCount) + // Security Logs
//       (SEED_CONFIG.auditLogsPerCompany * companiesCount) + // Audit Logs
//       (SEED_CONFIG.businessAnalyticsPerCompany * companiesCount) + // Business Analytics
//       (SEED_CONFIG.boilerMonitoringPerCompany * companiesCount) + // Boiler Monitoring
//       (SEED_CONFIG.electricityMonitoringPerCompany * companiesCount) + // Electricity Monitoring
//       (SEED_CONFIG.hospitalityPerCompany * companiesCount) + // Hospitality
//       (SEED_CONFIG.dispatchesPerCompany * companiesCount) + // Dispatches
//       (SEED_CONFIG.reportsPerCompany * companiesCount) // Reports
//     );
//   }

//   async run() {
//     try {
//       await this.connect();
//       await this.clearDatabase();

//       // Seed in order (due to dependencies)
//       await this.seedCompanies();
//       await this.seedRoles();
//       await this.seedUsers();
//       await this.seedCustomers();
//       await this.seedSuppliers();
//       await this.seedWarehouses();
//       await this.seedInventoryItems();
//       await this.seedProductionOrders();
//       await this.seedCustomerOrders();
//       await this.seedPurchaseOrders();
//       await this.seedInvoices();
//       await this.seedQuotations();
//       await this.seedFinancialTransactions();
//       await this.seedVisitors();
//       await this.seedVehicles();
//       await this.seedSecurityLogs();
//       await this.seedAuditLogs();
//       await this.seedBusinessAnalytics();
//       await this.seedMonitoringData();
//       await this.seedHospitality();
//       await this.seedDispatches();
//       await this.seedReports();

//       console.log('🎉 Comprehensive seeding completed successfully!');
//       console.log(`📊 COMPLETE SEEDING SUMMARY:`);
//       console.log(`   🏢 Companies: ${this.companies.length}`);
//       console.log(`   👥 Roles: ${this.roles.length}`);
//       console.log(`   👤 Users: ${this.users.length}`);
//       console.log(`   🤝 Customers: ${this.customers.length}`);
//       console.log(`   🏭 Suppliers: ${this.suppliers.length}`);
//       console.log(`   🏪 Warehouses: ${this.warehouses.length}`);
//       console.log(`   📦 Inventory Items: ${this.inventoryItems.length}`);
//       console.log(`   🏭 Production Orders: ${SEED_CONFIG.productionOrdersPerCompany * this.companies.length}`);
//       console.log(`   🛒 Customer Orders: ${SEED_CONFIG.customerOrdersPerCompany * this.companies.length}`);
//       console.log(`   🛍️ Purchase Orders: ${SEED_CONFIG.purchaseOrdersPerCompany * this.companies.length}`);
//       console.log(`   🧾 Invoices: ${SEED_CONFIG.invoicesPerCompany * this.companies.length}`);
//       console.log(`   💰 Quotations: ${SEED_CONFIG.quotationsPerCompany * this.companies.length}`);
//       console.log(`   💳 Financial Transactions: ${SEED_CONFIG.financialTransactionsPerCompany * this.companies.length}`);
//       console.log(`   👥 Visitors: ${SEED_CONFIG.visitorsPerCompany * this.companies.length}`);
//       console.log(`   🚗 Vehicles: ${SEED_CONFIG.vehiclesPerCompany * this.companies.length}`);
//       console.log(`   🔒 Security Logs: ${SEED_CONFIG.securityLogsPerCompany * this.companies.length}`);
//       console.log(`   📋 Audit Logs: ${SEED_CONFIG.auditLogsPerCompany * this.companies.length}`);
//       console.log(`   📊 Business Analytics: ${SEED_CONFIG.businessAnalyticsPerCompany * this.companies.length}`);
//       console.log(`   ⚡ Monitoring Records: ${(SEED_CONFIG.boilerMonitoringPerCompany + SEED_CONFIG.electricityMonitoringPerCompany) * this.companies.length}`);
//       console.log(`   🏨 Hospitality Records: ${SEED_CONFIG.hospitalityPerCompany * this.companies.length}`);
//       console.log(`   🚚 Dispatches: ${SEED_CONFIG.dispatchesPerCompany * this.companies.length}`);
//       console.log(`   📄 Reports: ${SEED_CONFIG.reportsPerCompany * this.companies.length}`);
//       console.log(`\n🎯 TOTAL RECORDS: ${this.calculateTotalRecords()}`);
//       console.log(`💾 Database: Fully populated with realistic factory ERP data!`);

//     } catch (error) {
//       console.error('❌ Seeding failed:', error);
//     } finally {
//       await mongoose.disconnect();
//       console.log('🔌 Disconnected from MongoDB');
//     }
//   }
// }

// // Run the seed script
// if (require.main === module) {
//   const seed = new ComprehensiveSeed();
//   seed.run();
// }

// export default ComprehensiveSeed;
