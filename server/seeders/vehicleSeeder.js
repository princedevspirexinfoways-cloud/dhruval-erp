const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Vehicle Schema - matching the actual model
const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  driverName: { type: String, required: true, trim: true },
  driverPhone: { type: String, required: true, trim: true },
  purpose: {
    type: String,
    enum: ['delivery', 'pickup', 'maintenance', 'other'],
    required: true
  },
  reason: { type: String, required: true, trim: true },
  timeIn: { type: Date, default: Date.now },
  timeOut: Date,
  status: {
    type: String,
    enum: ['in', 'out', 'pending'],
    default: 'pending'
  },
  currentStatus: {
    type: String,
    enum: ['in', 'out', 'pending'],
    default: 'pending'
  },
  gatePassNumber: String,
  images: [String],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Sample Vehicle Data
const sampleVehicles = [
  {
    vehicleNumber: 'GJ-01-AB-1234',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91-9876543210',
    purpose: 'delivery',
    reason: 'Delivering raw materials to Ahmedabad Industrial Area',
    timeIn: new Date('2024-01-15T09:00:00Z'),
    timeOut: new Date('2024-01-15T17:00:00Z'),
    status: 'out',
    currentStatus: 'out',
    gatePassNumber: 'GP-2024-001'
  },
  {
    vehicleNumber: 'GJ-01-CD-5678',
    driverName: 'Suresh Patel',
    driverPhone: '+91-9876543211',
    purpose: 'pickup',
    reason: 'Picking up finished goods from Surat Port',
    timeIn: new Date('2024-01-16T08:30:00Z'),
    timeOut: new Date('2024-01-16T16:30:00Z'),
    status: 'out',
    currentStatus: 'out',
    gatePassNumber: 'GP-2024-002'
  },
  {
    vehicleNumber: 'GJ-02-EF-9012',
    driverName: 'Mahesh Shah',
    driverPhone: '+91-9876543212',
    purpose: 'delivery',
    reason: 'Delivering equipment to Vadodara Factory',
    timeIn: new Date('2024-01-17T10:00:00Z'),
    status: 'in',
    currentStatus: 'in',
    gatePassNumber: 'GP-2024-003'
  },
  {
    vehicleNumber: 'GJ-03-GH-3456',
    driverName: 'Kiran Desai',
    driverPhone: '+91-9876543213',
    purpose: 'maintenance',
    reason: 'Vehicle maintenance at service center',
    timeIn: new Date('2024-01-18T09:00:00Z'),
    status: 'pending',
    currentStatus: 'pending',
    gatePassNumber: 'GP-2024-004'
  },
  {
    vehicleNumber: 'GJ-01-IJ-7890',
    driverName: 'Vijay Sharma',
    driverPhone: '+91-9876543214',
    purpose: 'pickup',
    reason: 'Picking up inventory from Rajkot Warehouse',
    timeIn: new Date('2024-01-18T07:00:00Z'),
    timeOut: new Date('2024-01-18T19:00:00Z'),
    status: 'out',
    currentStatus: 'out',
    gatePassNumber: 'GP-2024-005'
  },
  {
    vehicleNumber: 'GJ-04-KL-2468',
    driverName: 'Ashok Modi',
    driverPhone: '+91-9876543215',
    purpose: 'delivery',
    reason: 'Delivering products to Mumbai Distribution Center',
    timeIn: new Date('2024-01-19T06:00:00Z'),
    status: 'in',
    currentStatus: 'in',
    gatePassNumber: 'GP-2024-006'
  },
  {
    vehicleNumber: 'GJ-02-MN-1357',
    driverName: 'Prakash Joshi',
    driverPhone: '+91-9876543216',
    purpose: 'other',
    reason: 'Official visit to Head Office',
    timeIn: new Date('2024-01-20T10:00:00Z'),
    timeOut: new Date('2024-01-20T18:00:00Z'),
    status: 'out',
    currentStatus: 'out',
    gatePassNumber: 'GP-2024-007'
  },
  {
    vehicleNumber: 'GJ-05-OP-9753',
    driverName: 'Dinesh Rao',
    driverPhone: '+91-9876543217',
    purpose: 'pickup',
    reason: 'Collecting raw materials from Gandhinagar Supplier',
    timeIn: new Date('2024-01-20T11:00:00Z'),
    timeOut: new Date('2024-01-20T15:00:00Z'),
    status: 'out',
    currentStatus: 'out',
    gatePassNumber: 'GP-2024-008'
  }
];

async function seedVehicles() {
  try {
    console.log('🚛 Starting Vehicle Seeder...');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully!');
    
    // Get company and user data
    const company = await mongoose.connection.db.collection('companies').findOne({});
    const user = await mongoose.connection.db.collection('users').findOne({});
    
    if (!company || !user) {
      throw new Error('❌ Company or User not found in database');
    }
    
    console.log(`🏢 Using company: ${company.companyName || company.name}`);
    console.log(`👤 Using user: ${user.email}`);
    
    // Clear existing vehicles
    console.log('🗑️  Clearing existing vehicles...');
    const deleteResult = await Vehicle.deleteMany({});
    console.log(`🗑️  Removed ${deleteResult.deletedCount} existing vehicles`);
    
    // Add company and user IDs to sample data
    const vehiclesWithIds = sampleVehicles.map(vehicle => ({
      ...vehicle,
      companyId: company._id,
      createdBy: user._id
    }));
    
    // Insert new vehicles
    console.log('📝 Adding new vehicles...');
    const insertResult = await Vehicle.insertMany(vehiclesWithIds);
    console.log(`✅ Successfully added ${insertResult.length} vehicles`);
    
    // Display summary
    console.log('\n📊 Vehicle Seeder Summary:');
    console.log(`   • Total vehicles added: ${insertResult.length}`);
    console.log(`   • Vehicles IN: ${sampleVehicles.filter(v => v.status === 'in').length}`);
    console.log(`   • Vehicles OUT: ${sampleVehicles.filter(v => v.status === 'out').length}`);
    console.log(`   • Pending vehicles: ${sampleVehicles.filter(v => v.status === 'pending').length}`);
    console.log(`   • Delivery purpose: ${sampleVehicles.filter(v => v.purpose === 'delivery').length}`);
    console.log(`   • Pickup purpose: ${sampleVehicles.filter(v => v.purpose === 'pickup').length}`);
    console.log(`   • Maintenance purpose: ${sampleVehicles.filter(v => v.purpose === 'maintenance').length}`);
    
    console.log('\n🎉 Vehicle seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in vehicle seeder:', error);
    process.exit(1);
  }
}

// Run seeder
seedVehicles();
