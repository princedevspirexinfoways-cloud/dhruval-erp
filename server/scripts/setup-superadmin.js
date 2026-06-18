const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  fullName: String,
  isSuperAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  companyAccess: [{
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    role: String,
    isActive: { type: Boolean, default: true }
  }],
  preferences: {
    dashboard: {
      defaultCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function setupSuperAdmin() {
  try {
    console.log('🔍 Checking for existing super admin...');
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists:', {
        username: existingSuperAdmin.username,
        email: existingSuperAdmin.email,
        isSuperAdmin: existingSuperAdmin.isSuperAdmin
      });
      
      // Update to ensure isSuperAdmin is true
      await User.updateOne(
        { _id: existingSuperAdmin._id },
        { 
          $set: { 
            isSuperAdmin: true,
            isActive: true 
          } 
        }
      );
      console.log('✅ Super admin status confirmed');
      return;
    }
    
    console.log('🚀 Creating new super admin...');
    
    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = new User({
      username: 'superadmin',
      email: 'admin@erpsystem.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      isSuperAdmin: true,
      isActive: true,
      companyAccess: [], // Super admin doesn't need specific company access
      preferences: {
        dashboard: {}
      }
    });
    
    await superAdmin.save();
    
    console.log('✅ Super admin created successfully:', {
      username: superAdmin.username,
      email: superAdmin.email,
      isSuperAdmin: superAdmin.isSuperAdmin
    });
    
    console.log('📝 Login credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    console.log('   Email: admin@erpsystem.com');
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupSuperAdmin();
