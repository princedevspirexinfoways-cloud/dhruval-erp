const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Company = require('../dist/models/Company');

async function addStatusToCompanies() {
  try {
    console.log('Starting to add status field to existing companies...');
    
    // Find all companies that don't have a status field
    const companiesWithoutStatus = await Company.find({ status: { $exists: false } });
    
    console.log(`Found ${companiesWithoutStatus.length} companies without status field`);
    
    if (companiesWithoutStatus.length === 0) {
      console.log('All companies already have status field');
      return;
    }
    
    // Update all companies to add the status field
    const updateResult = await Company.updateMany(
      { status: { $exists: false } },
      { 
        $set: { 
          status: 'active' // Set default status as active
        } 
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} companies with status field`);
    
    // Verify the update
    const companiesWithStatus = await Company.find({ status: { $exists: true } });
    console.log(`Total companies with status field: ${companiesWithStatus.length}`);
    
    // Show some examples
    const sampleCompanies = await Company.find().limit(3).select('companyName companyCode status');
    console.log('Sample companies with status:');
    sampleCompanies.forEach(company => {
      console.log(`- ${company.companyName} (${company.companyCode}): ${company.status}`);
    });
    
    console.log('Status field addition completed successfully!');
    
  } catch (error) {
    console.error('Error adding status field to companies:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addStatusToCompanies();
