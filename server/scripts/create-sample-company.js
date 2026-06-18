const mongoose = require('mongoose');
const Company = require('./src/models/Company');
const User = require('./src/models/User');
require('dotenv').config();

async function createSampleCompany() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-erp');
    console.log('✅ Connected to MongoDB');

    // Check if company already exists
    const existingCompany = await Company.findOne({ companyCode: 'SAMPLE' });
    if (existingCompany) {
      console.log('✅ Sample company already exists:', existingCompany.companyName);
      console.log('Company ID:', existingCompany._id);
      return existingCompany;
    }

    // Create sample company
    const sampleCompany = new Company({
      companyName: 'Sample Company Ltd',
      companyCode: 'SAMPLE',
      legalName: 'Sample Company Limited',
      contactInfo: {
        emails: [{ 
          email: 'info@samplecompany.com', 
          type: 'primary', 
          isPrimary: true 
        }],
        phones: [{ 
          number: '+91-9876543210', 
          type: 'primary', 
          isPrimary: true 
        }],
        website: 'https://samplecompany.com'
      },
      addresses: {
        registeredOffice: {
          street: '123 Sample Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001',
          isActive: true
        },
        factoryAddress: {
          street: '456 Factory Road',
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411001',
          isActive: true
        },
        warehouseAddresses: []
      },
      registrationDetails: {
        gstin: '27AABCS1234Z1Z5',
        pan: 'AABCS1234Z'
      },
      businessConfig: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        fiscalYearStart: 'April',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: {
          start: '09:00',
          end: '18:00',
          breakStart: '13:00',
          breakEnd: '14:00'
        },
        gstRates: {
          defaultRate: 18,
          rawMaterialRate: 18,
          finishedGoodsRate: 18
        }
      },
      isActive: true
    });

    await sampleCompany.save();
    console.log('✅ Sample company created successfully!');
    console.log('Company ID:', sampleCompany._id);
    console.log('Company Name:', sampleCompany.companyName);
    console.log('Company Code:', sampleCompany.companyCode);

    return sampleCompany;
  } catch (error) {
    console.error('❌ Error creating sample company:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createSampleCompany()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSampleCompany };
