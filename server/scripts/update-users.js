const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function updateUsers() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    // Get the first company ID
    const company = await mongoose.connection.db.collection('companies').findOne({});
    console.log('Using company:', company.companyName || company.name, company._id);
    
    // Update all users to have this companyId
    const result = await mongoose.connection.db.collection('users').updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: company._id } }
    );
    
    console.log(`Updated ${result.modifiedCount} users with companyId`);
    
    // Verify the update
    const updatedUsers = await mongoose.connection.db.collection('users').find({}).limit(3).toArray();
    console.log('Sample updated users:', updatedUsers.map(u => ({ 
      _id: u._id, 
      email: u.email, 
      companyId: u.companyId 
    })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUsers();
