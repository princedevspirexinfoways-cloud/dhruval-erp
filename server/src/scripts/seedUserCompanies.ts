import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import DatabaseManager from '../config/database';

async function seedUserCompanies() {
  try {
    console.log('🚀 Starting user company seeding...');
    
    // Connect to database
    await DatabaseManager.connect();
    console.log('✅ Database connected');

    // Get all companies
    const companies = await Company.find({ isActive: true });
    console.log(`📊 Found ${companies.length} active companies`);

    if (companies.length === 0) {
      console.log('❌ No companies found. Please create companies first.');
      return;
    }

    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users to update`);

    let updatedCount = 0;
    let superAdminCount = 0;

    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.username} (${user.email})`);
      
      // Check if user is super admin
      if (user.isSuperAdmin) {
        console.log(`👑 Super Admin detected: ${user.username}`);
        
        // Super admin gets access to all companies
        const companyAccess = companies.map(company => ({
          companyId: company._id,
          role: 'super_admin' as const,
          isActive: true,
          permissions: {
            inventory: {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
              viewReports: true
            },
            production: {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
              viewReports: true
            },
            orders: {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
              viewReports: true
            },
            financial: {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
              viewReports: true
            },
            security: {
              gateManagement: true,
              visitorManagement: true,
              vehicleTracking: true,
              cctvAccess: true,
              emergencyResponse: true,
              securityReports: true,
              incidentManagement: true,
              accessControl: true,
              patrolManagement: true
            },
            hr: {
              viewEmployees: true,
              manageEmployees: true,
              manageAttendance: true,
              manageSalary: true,
              manageLeaves: true,
              viewReports: true,
              recruitment: true,
              performance: true,
              training: true,
              disciplinary: true
            },
            admin: {
              userManagement: true,
              systemSettings: true,
              backupRestore: true,
              auditLogs: true
            }
          },
          joinedAt: new Date()
        }));

        // Set primary company to first company
        user.primaryCompanyId = companies[0]._id;
        user.companyAccess = companyAccess;
        
        await user.save();
        superAdminCount++;
        console.log(`✅ Super Admin updated with access to ${companies.length} companies`);
        
      } else {
        console.log(`👤 Regular user detected: ${user.username}`);
        
        // Check if user already has company access
        if (user.companyAccess && user.companyAccess.length > 0) {
          console.log(`ℹ️  User already has company access, skipping...`);
          continue;
        }

        // Regular users get access to first company (or you can customize this logic)
        const defaultCompany = companies[0]; // You can change this logic as needed
        
        const companyAccess = [{
          companyId: defaultCompany._id,
          role: 'operator' as const, // Default role for regular users
          isActive: true,
          permissions: {
            inventory: {
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              viewReports: false
            },
            production: {
              view: true,
              create: true,
              edit: true,
              delete: false,
              approve: false,
              viewReports: false
            },
            orders: {
              view: true,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              viewReports: false
            },
            financial: {
              view: false,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              viewReports: false
            },
            security: {
              gateManagement: false,
              visitorManagement: true,
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
            admin: {
              userManagement: false,
              systemSettings: false,
              backupRestore: false,
              auditLogs: false
            }
          },
          joinedAt: new Date()
        }];

        user.primaryCompanyId = defaultCompany._id;
        user.companyAccess = companyAccess;
        
        await user.save();
        updatedCount++;
        console.log(`✅ Regular user updated with access to: ${defaultCompany.companyName}`);
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Super Admins updated: ${superAdminCount}`);
    console.log(`   - Regular users updated: ${updatedCount}`);
    console.log(`   - Total users processed: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding user companies:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the script
if (require.main === module) {
  seedUserCompanies();
}

export default seedUserCompanies;
