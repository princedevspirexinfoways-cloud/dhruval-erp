const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Customer Visit Schema - matching the new model
const customerVisitSchema = new mongoose.Schema({
  partyName: { type: String, required: true },
  contactPerson: String,
  contactNumber: String,
  contactEmail: String,
  visitDate: { type: Date, required: true },
  visitTime: String,
  purpose: { 
    type: String, 
    enum: ['sales', 'support', 'meeting', 'demo', 'follow-up', 'other'], 
    default: 'sales' 
  },
  purposeDescription: String,
  travelType: { 
    type: String, 
    enum: ['local', 'outstation'], 
    default: 'local' 
  },
  travelExpenses: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
  reimbursementStatus: { 
    type: String, 
    enum: ['pending', 'processed', 'completed'], 
    default: 'pending' 
  },
  reimbursementAmount: { type: Number, default: 0 },
  visitOutcome: String,
  nextFollowUp: Date,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CustomerVisit = mongoose.model('CustomerVisit', customerVisitSchema);

// Sample Customer Visit Data
const sampleVisits = [
  {
    partyName: 'ABC Manufacturing Ltd',
    contactPerson: 'Rajesh Kumar',
    contactNumber: '+91-9876543210',
    contactEmail: 'rajesh@abcmfg.com',
    visitDate: new Date('2024-01-15'),
    visitTime: '10:00 AM',
    purpose: 'sales',
    purposeDescription: 'Product demonstration and quotation discussion for new machinery',
    travelType: 'local',
    travelExpenses: {
      transport: 500,
      food: 300,
      other: 100,
      total: 900
    },
    approvalStatus: 'approved',
    reimbursementStatus: 'completed',
    reimbursementAmount: 900,
    visitOutcome: 'Positive response, quotation requested',
    nextFollowUp: new Date('2024-01-25')
  },
  {
    partyName: 'XYZ Industries Pvt Ltd',
    contactPerson: 'Priya Sharma',
    contactNumber: '+91-9876543211',
    contactEmail: 'priya@xyzind.com',
    visitDate: new Date('2024-01-18'),
    visitTime: '2:00 PM',
    purpose: 'support',
    purposeDescription: 'Technical support for existing equipment and maintenance training',
    travelType: 'outstation',
    travelExpenses: {
      transport: 2500,
      accommodation: 1800,
      food: 800,
      other: 200,
      total: 5300
    },
    approvalStatus: 'approved',
    reimbursementStatus: 'processed',
    reimbursementAmount: 5300,
    visitOutcome: 'Issue resolved, maintenance schedule updated',
    nextFollowUp: new Date('2024-02-15')
  },
  {
    partyName: 'Tech Solutions Inc',
    contactPerson: 'Amit Patel',
    contactNumber: '+91-9876543212',
    contactEmail: 'amit@techsol.com',
    visitDate: new Date('2024-01-20'),
    visitTime: '11:30 AM',
    purpose: 'meeting',
    purposeDescription: 'Partnership discussion and contract negotiation',
    travelType: 'local',
    travelExpenses: {
      transport: 400,
      food: 250,
      other: 50,
      total: 700
    },
    approvalStatus: 'pending',
    reimbursementStatus: 'pending',
    visitOutcome: 'Initial discussion completed, awaiting decision',
    nextFollowUp: new Date('2024-01-30')
  },
  {
    partyName: 'Global Exports Ltd',
    contactPerson: 'Neha Gupta',
    contactNumber: '+91-9876543213',
    contactEmail: 'neha@globalexp.com',
    visitDate: new Date('2024-01-22'),
    visitTime: '9:00 AM',
    purpose: 'demo',
    purposeDescription: 'Product demonstration for export quality requirements',
    travelType: 'outstation',
    travelExpenses: {
      transport: 3200,
      accommodation: 2200,
      food: 900,
      other: 300,
      total: 6600
    },
    approvalStatus: 'approved',
    reimbursementStatus: 'pending',
    reimbursementAmount: 6600,
    visitOutcome: 'Demo successful, trial order expected',
    nextFollowUp: new Date('2024-02-05')
  },
  {
    partyName: 'Metro Construction Co',
    contactPerson: 'Vikram Singh',
    contactNumber: '+91-9876543214',
    contactEmail: 'vikram@metrocon.com',
    visitDate: new Date('2024-01-25'),
    visitTime: '3:30 PM',
    purpose: 'follow-up',
    purposeDescription: 'Follow-up on previous quotation and address concerns',
    travelType: 'local',
    travelExpenses: {
      transport: 350,
      food: 200,
      other: 75,
      total: 625
    },
    approvalStatus: 'approved',
    reimbursementStatus: 'completed',
    reimbursementAmount: 625,
    visitOutcome: 'Concerns addressed, order confirmation pending',
    nextFollowUp: new Date('2024-02-10')
  },
  {
    partyName: 'Sunrise Chemicals',
    contactPerson: 'Kavita Joshi',
    contactNumber: '+91-9876543215',
    contactEmail: 'kavita@sunrisechem.com',
    visitDate: new Date('2024-01-28'),
    visitTime: '1:00 PM',
    purpose: 'sales',
    purposeDescription: 'New product introduction and market analysis discussion',
    travelType: 'outstation',
    travelExpenses: {
      transport: 2800,
      accommodation: 1500,
      food: 600,
      other: 150,
      total: 5050
    },
    approvalStatus: 'pending',
    reimbursementStatus: 'pending',
    visitOutcome: 'Interest shown in new products, samples provided',
    nextFollowUp: new Date('2024-02-12')
  },
  {
    partyName: 'Elite Motors Pvt Ltd',
    contactPerson: 'Rohit Mehta',
    contactNumber: '+91-9876543216',
    contactEmail: 'rohit@elitemotors.com',
    visitDate: new Date('2024-01-30'),
    visitTime: '10:30 AM',
    purpose: 'support',
    purposeDescription: 'Equipment calibration and operator training',
    travelType: 'local',
    travelExpenses: {
      transport: 450,
      food: 300,
      other: 100,
      total: 850
    },
    approvalStatus: 'approved',
    reimbursementStatus: 'processed',
    reimbursementAmount: 850,
    visitOutcome: 'Calibration completed, training provided',
    nextFollowUp: new Date('2024-03-01')
  },
  {
    partyName: 'Future Tech Systems',
    contactPerson: 'Anita Rao',
    contactNumber: '+91-9876543217',
    contactEmail: 'anita@futuretech.com',
    visitDate: new Date('2024-02-02'),
    visitTime: '2:30 PM',
    purpose: 'other',
    purposeDescription: 'Market research and competitor analysis discussion',
    travelType: 'local',
    travelExpenses: {
      transport: 300,
      food: 250,
      other: 50,
      total: 600
    },
    approvalStatus: 'rejected',
    rejectionReason: 'Not aligned with current business objectives',
    reimbursementStatus: 'pending',
    visitOutcome: 'Information gathered for future reference'
  }
];

async function seedHospitality() {
  try {
    console.log('🏨 Starting Hospitality (Customer Visits) Seeder...');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully!');
    
    // Get company and user data
    const company = await mongoose.connection.db.collection('companies').findOne({});
    const users = await mongoose.connection.db.collection('users').find({}).limit(3).toArray();
    
    if (!company || !users.length) {
      throw new Error('❌ Company or Users not found in database');
    }
    
    console.log(`🏢 Using company: ${company.companyName || company.name}`);
    console.log(`👥 Found ${users.length} users for assignment`);
    
    // Clear existing customer visits
    console.log('🗑️  Clearing existing customer visits...');
    const deleteResult = await CustomerVisit.deleteMany({});
    console.log(`🗑️  Removed ${deleteResult.deletedCount} existing customer visits`);
    
    // Add company and user IDs to sample data
    const visitsWithIds = sampleVisits.map((visit, index) => ({
      ...visit,
      companyId: company._id,
      createdBy: users[index % users.length]._id, // Rotate between users
      approvedBy: visit.approvalStatus === 'approved' ? users[(index + 1) % users.length]._id : undefined,
      approvedAt: visit.approvalStatus === 'approved' ? new Date() : undefined
    }));
    
    // Insert new customer visits
    console.log('📝 Adding new customer visits...');
    const insertResult = await CustomerVisit.insertMany(visitsWithIds);
    console.log(`✅ Successfully added ${insertResult.length} customer visits`);
    
    // Display summary
    console.log('\n📊 Hospitality Seeder Summary:');
    console.log(`   • Total visits added: ${insertResult.length}`);
    console.log(`   • Pending approvals: ${sampleVisits.filter(v => v.approvalStatus === 'pending').length}`);
    console.log(`   • Approved visits: ${sampleVisits.filter(v => v.approvalStatus === 'approved').length}`);
    console.log(`   • Rejected visits: ${sampleVisits.filter(v => v.approvalStatus === 'rejected').length}`);
    console.log(`   • Local visits: ${sampleVisits.filter(v => v.travelType === 'local').length}`);
    console.log(`   • Outstation visits: ${sampleVisits.filter(v => v.travelType === 'outstation').length}`);
    
    const totalExpenses = sampleVisits.reduce((sum, v) => sum + (v.travelExpenses?.total || 0), 0);
    console.log(`   • Total expenses: ₹${totalExpenses.toLocaleString()}`);
    
    console.log('\n🎉 Hospitality seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in hospitality seeder:', error);
    process.exit(1);
  }
}

// Run seeder
seedHospitality();
