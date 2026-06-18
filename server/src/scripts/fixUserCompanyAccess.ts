import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import DatabaseManager from '../config/database';
import { IUser, ICompany } from '../types/models';

/**
 * Script to fix user company access:
 * - Add company IDs to all users except superadmin
 * - Ensure all non-superadmin users have proper companyAccess
 * - Set primaryCompanyId for users who don't have it
 */

async function fixUserCompanyAccess() {
  try {
    console.log('🚀 Starting user company access fix...');
    
    // Connect to database
    await DatabaseManager.connect();
    console.log('✅ Database connected');

    // Get all companies
    const companies = await Company.find({ isActive: true }).sort({ createdAt: 1 });
    console.log(`📊 Found ${companies.length} active companies:`);
    companies.forEach(company => {
      console.log(`   - ${company.companyName} (${company.companyCode})`);
    });

    if (companies.length === 0) {
      console.log('❌ No companies found. Please create companies first.');
      return;
    }

    // Get the first company as default for users without company access
    const defaultCompany = companies[0];
    console.log(`🏢 Using "${defaultCompany.companyName}" as default company for users without access`);

    // Get all users
    const users = await User.find({});
    console.log(`\n👥 Found ${users.length} users to process`);

    let superAdminCount = 0;
    let regularUserCount = 0;
    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of users) {
      console.log(`\n🔍 Processing user: ${user.username} (${user.personalInfo?.firstName} ${user.personalInfo?.lastName})`);
      
      // Check if user is superadmin
      if (user.isSuperAdmin) {
        console.log('   👑 Super Admin - No company restrictions needed');
        superAdminCount++;
        
        // Ensure superadmin doesn't have primaryCompanyId (they can access all)
        if (user.primaryCompanyId) {
          user.primaryCompanyId = undefined;
          await user.save();
          console.log('   ✅ Removed primaryCompanyId from superadmin');
          updatedCount++;
        } else {
          alreadyCorrectCount++;
        }
        continue;
      }

      regularUserCount++;
      let needsUpdate = false;

      // Check if user has any company access
      if (!user.companyAccess || user.companyAccess.length === 0) {
        console.log('   ❌ No company access found - Adding default company access');
        
        // Add default company access with basic permissions
        user.companyAccess = [{
          companyId: defaultCompany._id,
          role: 'operator', // Default role for users without specific role
          department: 'Production',
          isActive: true,
          joinedAt: new Date(),
          permissions: {
            inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
            production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
            orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
            financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
            security: {
              gateManagement: false,
              visitorManagement: false,
              vehicleTracking: false,
              cctvAccess: false,
              emergencyResponse: false,
              securityReports: false,
              incidentManagement: false,
              accessControl: false,
              patrolManagement: false
            },
            hr: {
              viewEmployees: false,
              manageEmployees: false,
              manageAttendance: false,
              manageSalary: false,
              manageLeaves: false,
              viewReports: false,
              recruitment: false,
              performance: false,
              training: false,
              disciplinary: false
            },
            admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
          }
        }];
        needsUpdate = true;
      } else {
        console.log(`   ✅ Has company access to ${user.companyAccess.length} company(ies)`);
        
        // Verify all company access entries have valid companyIds
        for (let i = 0; i < user.companyAccess.length; i++) {
          const access = user.companyAccess[i];
          if (!access.companyId) {
            console.log(`   ⚠️  Company access entry ${i} missing companyId - Setting to default company`);
            access.companyId = defaultCompany._id;
            needsUpdate = true;
          }
          
          // Ensure permissions object exists
          if (!access.permissions) {
            console.log(`   ⚠️  Company access entry ${i} missing permissions - Adding default permissions`);
            access.permissions = {
              inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
              production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
              orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
              financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
              security: {
                gateManagement: false,
                visitorManagement: false,
                vehicleTracking: false,
                cctvAccess: false,
                emergencyResponse: false,
                securityReports: false,
                incidentManagement: false,
                accessControl: false,
                patrolManagement: false
              },
              hr: {
                viewEmployees: false,
                manageEmployees: false,
                manageAttendance: false,
                manageSalary: false,
                manageLeaves: false,
                viewReports: false,
                recruitment: false,
                performance: false,
                training: false,
                disciplinary: false
              },
              admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
            };
            needsUpdate = true;
          }
        }
      }

      // Set primaryCompanyId if not set
      if (!user.primaryCompanyId) {
        const primaryCompany = user.companyAccess[0]?.companyId || defaultCompany._id;
        user.primaryCompanyId = primaryCompany;
        console.log(`   ✅ Set primaryCompanyId to: ${primaryCompany}`);
        needsUpdate = true;
      }

      // Save user if updates are needed
      if (needsUpdate) {
        await user.save();
        console.log('   💾 User updated successfully');
        updatedCount++;
      } else {
        console.log('   ✅ User already has correct company access');
        alreadyCorrectCount++;
      }
    }

    console.log('\n🎉 Company access fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Super Admins processed: ${superAdminCount}`);
    console.log(`   - Regular users processed: ${regularUserCount}`);
    console.log(`   - Users updated: ${updatedCount}`);
    console.log(`   - Users already correct: ${alreadyCorrectCount}`);
    console.log(`   - Total users processed: ${users.length}`);
    
    // Verify the changes
    console.log('\n🔍 Verification:');
    const usersWithoutCompanyAccess = await User.find({
      isSuperAdmin: false,
      $or: [
        { companyAccess: { $exists: false } },
        { companyAccess: { $size: 0 } },
        { primaryCompanyId: { $exists: false } }
      ]
    });
    
    if (usersWithoutCompanyAccess.length === 0) {
      console.log('✅ All non-superadmin users now have proper company access');
    } else {
      console.log(`❌ ${usersWithoutCompanyAccess.length} users still need company access:`);
      usersWithoutCompanyAccess.forEach(user => {
        console.log(`   - ${user.username}: ${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing user company access:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the script
if (require.main === module) {
  fixUserCompanyAccess();
}

export default fixUserCompanyAccess;
