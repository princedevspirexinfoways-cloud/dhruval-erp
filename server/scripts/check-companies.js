const mongoose = require('mongoose');
const Company = require('../dist/models/Company').default;
require('dotenv').config({ path: '.env.local' });

async function checkCompanies() {
  try {
    console.log('🔍 Environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-erp');
    console.log('✅ Connected to MongoDB');

    // Check all companies
    const companies = await Company.find({});
    console.log(`\n📊 Found ${companies.length} companies in database:`);
    
    if (companies.length === 0) {
      console.log('❌ No companies found in database');
    } else {
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. Company Details:`);
        console.log(`   ID: ${company._id}`);
        console.log(`   Name: ${company.companyName}`);
        console.log(`   Code: ${company.companyCode}`);
        console.log(`   Active: ${company.isActive}`);
        console.log(`   Created: ${company.createdAt}`);
      });
    }

    // Check for the specific company ID from the error
    const specificCompany = await Company.findById('6889d16fb078601eca6fed65');
    if (specificCompany) {
      console.log('\n✅ Company with ID 6889d16fb078601eca6fed65 found:', specificCompany.companyName);
    } else {
      console.log('\n❌ Company with ID 6889d16fb078601eca6fed65 NOT found');
    }

  } catch (error) {
    console.error('❌ Error checking companies:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  checkCompanies()
    .then(() => {
      console.log('\n🎉 Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkCompanies };
