import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import DatabaseManager from '../config/database';
import { IUser, ICompany } from '../types/models';

/**
 * Test script to verify user creation logic works correctly
 * Tests that new users automatically get proper company access
 */

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation logic...');
    
    // Connect to database
    await DatabaseManager.connect();
    console.log('✅ Database connected');

    // Get a test company
    const testCompany = await Company.findOne({ isActive: true });
    if (!testCompany) {
      console.log('❌ No active companies found for testing');
      return;
    }

    console.log(`🏢 Using test company: ${testCompany.companyName} (${testCompany.companyCode})`);

    // Test 1: Create user with UserService
    console.log('\n🔍 Test 1: Creating user with UserService...');
    
    const UserService = require('../services/UserService').default;
    const userService = new UserService();

    const testUserData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '9876543210'
    };

    try {
      const createdUser = await userService.createUser(testUserData);
      console.log('✅ User created successfully with UserService');
      console.log(`   - Username: ${createdUser.username}`);
      console.log(`   - Primary Company ID: ${createdUser.primaryCompanyId}`);
      console.log(`   - Company Access Count: ${createdUser.companyAccess?.length || 0}`);
      
      if (createdUser.companyAccess && createdUser.companyAccess.length > 0) {
        const access = createdUser.companyAccess[0];
        console.log(`   - Company Access: ${access.companyId} (${access.role})`);
        console.log(`   - Has Permissions: ${Object.keys(access.permissions || {}).length > 0 ? 'Yes' : 'No'}`);
      }

      // Clean up test user
      await User.findByIdAndDelete(createdUser._id);
      console.log('🧹 Test user cleaned up');
      
    } catch (error) {
      console.log('❌ UserService test failed:', error.message);
    }

    // Test 2: Create user with specific company
    console.log('\n🔍 Test 2: Creating user with specific company...');
    
    const testUserData2 = {
      username: `testuser2_${Date.now()}`,
      email: `test2_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test2',
      lastName: 'User2',
      phone: '9876543211',
      primaryCompanyId: testCompany._id
    };

    try {
      const createdUser2 = await userService.createUser(testUserData2);
      console.log('✅ User created successfully with specific company');
      console.log(`   - Username: ${createdUser2.username}`);
      console.log(`   - Primary Company ID: ${createdUser2.primaryCompanyId}`);
      console.log(`   - Company Access Count: ${createdUser2.companyAccess?.length || 0}`);
      
      if (createdUser2.companyAccess && createdUser2.companyAccess.length > 0) {
        const access = createdUser2.companyAccess[0];
        console.log(`   - Company Access: ${access.companyId} (${access.role})`);
        console.log(`   - Has Permissions: ${Object.keys(access.permissions || {}).length > 0 ? 'Yes' : 'No'}`);
      }

      // Clean up test user
      await User.findByIdAndDelete(createdUser2._id);
      console.log('🧹 Test user cleaned up');
      
    } catch (error) {
      console.log('❌ Specific company test failed:', error.message);
    }

    // Test 3: Create superadmin user
    console.log('\n🔍 Test 3: Creating superadmin user...');
    
    const testSuperAdminData = {
      username: `testsuperadmin_${Date.now()}`,
      email: `testsuperadmin_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'SuperAdmin',
      phone: '9876543212',
      isSuperAdmin: true
    };

    try {
      const createdSuperAdmin = await userService.createUser(testSuperAdminData);
      console.log('✅ SuperAdmin created successfully');
      console.log(`   - Username: ${createdSuperAdmin.username}`);
      console.log(`   - Is SuperAdmin: ${createdSuperAdmin.isSuperAdmin}`);
      console.log(`   - Primary Company ID: ${createdSuperAdmin.primaryCompanyId || 'None (as expected)'}`);
      console.log(`   - Company Access Count: ${createdSuperAdmin.companyAccess?.length || 0}`);

      // Clean up test user
      await User.findByIdAndDelete(createdSuperAdmin._id);
      console.log('🧹 Test superadmin cleaned up');
      
    } catch (error) {
      console.log('❌ SuperAdmin test failed:', error.message);
    }

    console.log('\n🎉 User creation tests completed!');
    
  } catch (error) {
    console.error('❌ Error during user creation tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the test
if (require.main === module) {
  testUserCreation();
}

export default testUserCreation;
