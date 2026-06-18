import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import config from '../config/environment';

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create test users with proper roles and permissions
async function createTestUsers() {
  try {
    console.log('🚀 Creating test users...');

    // Find existing companies
    const companies = await Company.find({ isActive: true });

    if (companies.length === 0) {
      console.log('❌ No companies found. Please run the seed script first.');
      return;
    }

    console.log(`✅ Found ${companies.length} companies`);
    const primaryCompany = companies[0]; // Primary company for regular users

    // Create Super Admin User
    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@testcompany.com',
      password: 'SuperAdmin123!', // Will be hashed by pre-save hook
      personalInfo: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+919876543210',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'Male'
      },
      addresses: {
        current: {
          street: '123 Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      },
      companyAccess: companies.map(comp => ({
        companyId: comp._id,
        role: 'super_admin',
        department: 'Management',
        designation: 'Super Administrator',
        employeeId: 'EMP001',
        joiningDate: new Date('2024-01-01'),
        permissions: {
          // System permissions - Full access
          system: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          users: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          roles: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          companies: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },

          // Business modules - Full access
          inventory: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          production: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
          orders: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, dispatch: true },
          customers: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          suppliers: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          financial: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, bankTransactions: true },

          // Advanced modules - Full access
          security: { gateManagement: true, visitorManagement: true, vehicleManagement: true, securityReports: true },
          hr: { viewEmployees: true, manageAttendance: true, payrollManagement: true, hrReports: true },
          quality: { qualityControl: true, qualityReports: true, auditManagement: true },
          maintenance: { equipmentManagement: true, maintenanceScheduling: true, maintenanceReports: true },
          analytics: { businessAnalytics: true, performanceReports: true, customReports: true },
          monitoring: { boilerMonitoring: true, electricityMonitoring: true, environmentalMonitoring: true },
          hospitality: { guestManagement: true, facilityBooking: true, hospitalityReports: true },
          dispatch: { dispatchManagement: true, logisticsTracking: true, dispatchReports: true },

          // Admin permissions
          admin: { userManagement: true, systemSettings: true, backupRestore: true, auditLogs: true }
        },
        isActive: true,
        joinedAt: new Date('2024-01-01')
      })),
      isSuperAdmin: true,
      primaryCompanyId: primaryCompany._id,
      security: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        passwordLastChanged: new Date(),
        mustChangePassword: false,
        twoFactorEnabled: false
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
          push: true
        }
      },
      isActive: true
    };

    // Check if super admin already exists
    let superAdmin = await User.findOne({ 
      $or: [
        { email: 'superadmin@testcompany.com' },
        { username: 'superadmin' }
      ]
    });

    if (!superAdmin) {
      superAdmin = await User.create(superAdminData);
      console.log('✅ Created Super Admin');
      console.log('   📧 Email: superadmin@testcompany.com');
      console.log('   📱 Phone: +919876543210');
      console.log('   🔑 Password: SuperAdmin123!');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }

    // Create Admin User
    const adminData = {
      username: 'admin',
      email: 'admin@testcompany.com',
      password: 'Admin123!', // Will be hashed by pre-save hook
      personalInfo: {
        firstName: 'Company',
        lastName: 'Admin',
        phone: '+919876543211',
        dateOfBirth: new Date('1988-05-15'),
        gender: 'Male'
      },
      addresses: {
        current: {
          street: '456 Admin Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          country: 'India'
        }
      },
      companyAccess: [{
        companyId: primaryCompany._id,
        role: 'owner',
        department: 'Management',
        designation: 'Company Owner',
        employeeId: 'EMP002',
        joiningDate: new Date('2024-01-15'),
        permissions: {
          // System permissions - Limited admin access
          system: { view: true, create: false, edit: true, delete: false, approve: true, viewReports: true },
          users: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true },
          roles: { view: true, create: false, edit: true, delete: false, approve: false, viewReports: true },
          companies: { view: true, create: false, edit: true, delete: false, approve: false, viewReports: true },

          // Business modules - Good access
          inventory: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true },
          production: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
          orders: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true, dispatch: true },
          customers: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true },
          suppliers: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true },
          financial: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true, bankTransactions: false },

          // Advanced modules - Limited access
          security: { gateManagement: true, visitorManagement: true, vehicleManagement: true, securityReports: true },
          hr: { viewEmployees: true, manageAttendance: true, payrollManagement: false, hrReports: true },
          quality: { qualityControl: true, qualityReports: true, auditManagement: false },
          maintenance: { equipmentManagement: true, maintenanceScheduling: true, maintenanceReports: true },
          analytics: { businessAnalytics: true, performanceReports: true, customReports: false },
          monitoring: { boilerMonitoring: true, electricityMonitoring: true, environmentalMonitoring: true },
          hospitality: { guestManagement: true, facilityBooking: true, hospitalityReports: true },
          dispatch: { dispatchManagement: true, logisticsTracking: true, dispatchReports: true },

          // Admin permissions - Limited
          admin: { userManagement: true, systemSettings: false, backupRestore: false, auditLogs: true }
        },
        isActive: true,
        joinedAt: new Date('2024-01-15')
      }],
      isSuperAdmin: false,
      primaryCompanyId: primaryCompany._id,
      security: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        passwordLastChanged: new Date(),
        mustChangePassword: false,
        twoFactorEnabled: false
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
          push: true
        }
      },
      isActive: true
    };

    let admin = await User.findOne({
      $or: [
        { email: 'admin@testcompany.com' },
        { username: 'admin' }
      ]
    });

    if (!admin) {
      admin = await User.create(adminData);
      console.log('✅ Created Admin');
      console.log('   📧 Email: admin@testcompany.com');
      console.log('   📱 Phone: +919876543211');
      console.log('   🔑 Password: Admin123!');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create Manager User
    const managerData = {
      username: 'manager',
      email: 'manager@testcompany.com',
      password: 'Manager123!', // Will be hashed by pre-save hook
      personalInfo: {
        firstName: 'Production',
        lastName: 'Manager',
        phone: '+919876543212',
        dateOfBirth: new Date('1990-08-20'),
        gender: 'Female'
      },
      addresses: {
        current: {
          street: '789 Manager Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003',
          country: 'India'
        }
      },
      companyAccess: [{
        companyId: primaryCompany._id,
        role: 'production_manager',
        department: 'Production',
        designation: 'Production Manager',
        employeeId: 'EMP003',
        joiningDate: new Date('2024-02-01'),
        permissions: {
          // System permissions - View only
          system: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: true },
          users: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          roles: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          companies: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },

          // Business modules - Department focused
          inventory: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
          production: { view: true, create: true, edit: true, delete: false, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
          orders: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true, dispatch: false },
          customers: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          suppliers: { view: true, create: true, edit: true, delete: false, approve: false, viewReports: true },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, bankTransactions: false },

          // Advanced modules - Production focused
          security: { gateManagement: false, visitorManagement: false, vehicleManagement: false, securityReports: false },
          hr: { viewEmployees: true, manageAttendance: true, payrollManagement: false, hrReports: false },
          quality: { qualityControl: true, qualityReports: true, auditManagement: false },
          maintenance: { equipmentManagement: true, maintenanceScheduling: true, maintenanceReports: true },
          analytics: { businessAnalytics: false, performanceReports: true, customReports: false },
          monitoring: { boilerMonitoring: true, electricityMonitoring: true, environmentalMonitoring: true },
          hospitality: { guestManagement: false, facilityBooking: false, hospitalityReports: false },
          dispatch: { dispatchManagement: true, logisticsTracking: true, dispatchReports: true },

          // Admin permissions - None
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        },
        isActive: true,
        joinedAt: new Date('2024-02-01')
      }],
      isSuperAdmin: false,
      primaryCompanyId: primaryCompany._id,
      security: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        passwordLastChanged: new Date(),
        mustChangePassword: false,
        twoFactorEnabled: false
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
          push: true
        }
      },
      isActive: true
    };

    let manager = await User.findOne({
      $or: [
        { email: 'manager@testcompany.com' },
        { username: 'manager' }
      ]
    });

    if (!manager) {
      manager = await User.create(managerData);
      console.log('✅ Created Manager');
      console.log('   📧 Email: manager@testcompany.com');
      console.log('   📱 Phone: +919876543212');
      console.log('   🔑 Password: Manager123!');
    } else {
      console.log('ℹ️  Manager already exists');
    }

    // Create Operator User
    const operatorData = {
      username: 'operator',
      email: 'operator@testcompany.com',
      password: 'Operator123!', // Will be hashed by pre-save hook
      personalInfo: {
        firstName: 'Machine',
        lastName: 'Operator',
        phone: '+919876543213',
        dateOfBirth: new Date('1995-03-10'),
        gender: 'Male'
      },
      addresses: {
        current: {
          street: '321 Worker Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400004',
          country: 'India'
        }
      },
      companyAccess: [{
        companyId: primaryCompany._id,
        role: 'operator',
        department: 'Production',
        designation: 'Machine Operator',
        employeeId: 'EMP004',
        joiningDate: new Date('2024-03-01'),
        permissions: {
          // System permissions - View only basic
          system: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          users: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          roles: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          companies: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },

          // Business modules - Limited operational access
          inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false, startProcess: true, qualityCheck: false },
          orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false, dispatch: false },
          customers: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          suppliers: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false, bankTransactions: false },

          // Advanced modules - Basic operational only
          security: { gateManagement: false, visitorManagement: false, vehicleManagement: false, securityReports: false },
          hr: { viewEmployees: false, manageAttendance: true, payrollManagement: false, hrReports: false },
          quality: { qualityControl: false, qualityReports: false, auditManagement: false },
          maintenance: { equipmentManagement: false, maintenanceScheduling: false, maintenanceReports: false },
          analytics: { businessAnalytics: false, performanceReports: false, customReports: false },
          monitoring: { boilerMonitoring: true, electricityMonitoring: false, environmentalMonitoring: false },
          hospitality: { guestManagement: false, facilityBooking: false, hospitalityReports: false },
          dispatch: { dispatchManagement: false, logisticsTracking: false, dispatchReports: false },

          // Admin permissions - None
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        },
        isActive: true,
        joinedAt: new Date('2024-03-01')
      }],
      isSuperAdmin: false,
      primaryCompanyId: primaryCompany._id,
      security: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        passwordLastChanged: new Date(),
        mustChangePassword: false,
        twoFactorEnabled: false
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false,
          push: true
        }
      },
      isActive: true
    };

    let operator = await User.findOne({
      $or: [
        { email: 'operator@testcompany.com' },
        { username: 'operator' }
      ]
    });

    if (!operator) {
      operator = await User.create(operatorData);
      console.log('✅ Created Operator');
      console.log('   📧 Email: operator@testcompany.com');
      console.log('   📱 Phone: +919876543213');
      console.log('   🔑 Password: Operator123!');
    } else {
      console.log('ℹ️  Operator already exists');
    }

    console.log('\n🎉 Test users creation completed!');
    console.log('\n📋 Summary:');
    console.log('   🔑 Super Admin: superadmin@testcompany.com / +919876543210 / SuperAdmin123!');
    console.log('   👨‍💼 Admin: admin@testcompany.com / +919876543211 / Admin123!');
    console.log('   👩‍💼 Manager: manager@testcompany.com / +919876543212 / Manager123!');
    console.log('   👨‍🔧 Operator: operator@testcompany.com / +919876543213 / Operator123!');
    console.log('\n✨ All users can login with email, phone, or username!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
}

// Main execution function
async function main() {
  try {
    await connectDB();
    await createTestUsers();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}