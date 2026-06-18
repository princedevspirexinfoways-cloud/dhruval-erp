const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected! Checking database data...');
    
    // Check companies
    const companies = await mongoose.connection.db.collection('companies').find({}).limit(5).toArray();
    console.log('Companies:', companies.map(c => ({ _id: c._id, name: c.companyName || c.name })));
    
    // Check users
    const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
    console.log('Users:', users.map(u => ({ _id: u._id, email: u.email, companyId: u.companyId })));
    
    // Check customer visits
    const visits = await mongoose.connection.db.collection('customervisits').find({}).toArray();
    console.log('Customer Visits:', visits.length, 'found');
    console.log('Sample visit:', visits[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
