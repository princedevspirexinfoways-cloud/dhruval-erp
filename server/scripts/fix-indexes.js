const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixIndexes() {
  try {
    console.log('🔧 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');
    
    // Check current indexes on vehicles collection
    console.log('📋 Current vehicle indexes:');
    const vehicleIndexes = await mongoose.connection.db.collection('vehicles').indexes();
    vehicleIndexes.forEach(index => {
      console.log(`   • ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Drop problematic indexes
    const indexesToDrop = [
      'vehicleId_1',
      'chassisNumber_1',
      'vehicleType_1',
      'vehicleCategory_1',
      'entries.gatePass.gatePassNumber_1',
      'securityInfo.blacklisted_1',
      'isActive_1',
      'companyId_1_vehicleType_1_currentStatus_1',
      'companyId_1_vehicleCategory_1',
      'companyId_1_ownerInfo.ownerId_1',
      'companyId_1_securityInfo.blacklisted_1',
      'companyId_1_securityInfo.accessLevel_1',
      'driverInfo.driverPhone_1',
      'ownerInfo.ownerPhone_1',
      'vehicleNumber_text_vehicleInfo.make_text_vehicleInfo.model_text_ownerInfo.ownerName_text_driverInfo.driverName_text',
      'companyId_1_isActive_1',
      'companyId_1_vehicleType_1',
      'companyId_1_maintenance.nextServiceDate_1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await mongoose.connection.db.collection('vehicles').dropIndex(indexName);
        console.log(`🗑️  Dropped ${indexName} index`);
      } catch (error) {
        console.log(`ℹ️  ${indexName} index not found (already dropped)`);
      }
    }
    
    // Check current indexes on customervisits collection
    console.log('\n📋 Current customer visit indexes:');
    const visitIndexes = await mongoose.connection.db.collection('customervisits').indexes();
    visitIndexes.forEach(index => {
      console.log(`   • ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Index cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();
