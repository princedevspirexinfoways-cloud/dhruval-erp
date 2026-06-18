const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function clearData() {
  try {
    console.log('🗑️  Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');
    
    // Clear vehicles
    const vehicleResult = await mongoose.connection.db.collection('vehicles').deleteMany({});
    console.log(`🗑️  Cleared ${vehicleResult.deletedCount} vehicles`);
    
    // Clear customer visits
    const visitResult = await mongoose.connection.db.collection('customervisits').deleteMany({});
    console.log(`🗑️  Cleared ${visitResult.deletedCount} customer visits`);
    
    console.log('✅ Data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearData();
