const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the CustomerVisit schema (simplified)
const customerVisitSchema = new mongoose.Schema({
  partyName: { type: String, required: true },
  contactPerson: String,
  contactNumber: String,
  visitDate: { type: Date, default: Date.now },
  purpose: { type: String, enum: ['sales', 'support', 'meeting', 'demo', 'other'], default: 'sales' },
  purposeDescription: String,
  travelType: { type: String, enum: ['local', 'outstation'], default: 'local' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CustomerVisit = mongoose.model('CustomerVisit', customerVisitSchema);

// Sample data
const sampleVisits = [
  {
    partyName: 'ABC Manufacturing Ltd',
    contactPerson: 'John Smith',
    contactNumber: '+1-555-0123',
    visitDate: new Date('2024-01-15'),
    purpose: 'sales',
    purposeDescription: 'Product demonstration and quotation discussion',
    travelType: 'local',
    approvalStatus: 'approved',
    companyId: new mongoose.Types.ObjectId('6889d16fb078601eca6fed53'), // Dhruval Exim
    createdBy: new mongoose.Types.ObjectId('6889d16fb078601eca6fed72'), // First user
  },
  {
    partyName: 'XYZ Industries',
    contactPerson: 'Sarah Johnson',
    contactNumber: '+1-555-0456',
    visitDate: new Date('2024-01-20'),
    purpose: 'support',
    purposeDescription: 'Technical support and maintenance',
    travelType: 'outstation',
    approvalStatus: 'pending',
    companyId: new mongoose.Types.ObjectId('6889d16fb078601eca6fed53'),
    createdBy: new mongoose.Types.ObjectId('6889d16fb078601eca6fed72'),
  },
  {
    partyName: 'Tech Solutions Inc',
    contactPerson: 'Mike Davis',
    contactNumber: '+1-555-0789',
    visitDate: new Date('2024-01-25'),
    purpose: 'meeting',
    purposeDescription: 'Partnership discussion and contract negotiation',
    travelType: 'local',
    approvalStatus: 'approved',
    companyId: new mongoose.Types.ObjectId('6889d16fb078601eca6fed53'),
    createdBy: new mongoose.Types.ObjectId('6889d16fb078601eca6fed72'),
  }
];

async function addSampleData() {
  try {
    console.log('Adding sample customer visits...');
    
    // Clear existing data
    await CustomerVisit.deleteMany({});
    console.log('Cleared existing customer visits');
    
    // Add sample data
    const result = await CustomerVisit.insertMany(sampleVisits);
    console.log(`Added ${result.length} sample customer visits`);
    
    console.log('Sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();
