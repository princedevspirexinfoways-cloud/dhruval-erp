const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb+srv://rajatsinha5467:6hCluJxiCcndni9V@erp.h5jya9a.mongodb.net/erp?retryWrites=true&w=majority&appName=erp', {
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

async function updateCorrectUserPassword() {
  try {
    console.log('🔍 Finding user with email superadmin@testcompany.com...');
    
    // Find user by email
    const user = await User.findOne({ email: 'superadmin@testcompany.com' });
    
    if (!user) {
      console.log('❌ User with email superadmin@testcompany.com not found');
      return;
    }
    
    console.log('👤 Found user:', {
      username: user.username,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      id: user._id
    });
    
    // Update password to SuperAdmin123!
    const newPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password updated successfully');
    console.log('📝 Updated credentials:');
    console.log('   Username: superadmin');
    console.log('   Email: superadmin@testcompany.com');
    console.log('   Password: SuperAdmin123!');
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
updateCorrectUserPassword();
