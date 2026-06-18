import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Import config after loading env vars
import config from '../config/environment';

const createSuperAdmin = async () => {
  try {
    console.log('Connecting to database...');
    // Use MONGODB_URI from config, which should be loaded from .env.local
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to database.');

    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'password123', 
      personalInfo: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+919876543210',
      },
      isSuperAdmin: true,
      isActive: true,
      companyAccess: [] // Superadmin doesn't strictly need company access if isSuperAdmin is true
    };

    const existingUser = await User.findOne({ 
      $or: [
        { email: superAdminData.email },
        { username: superAdminData.username }
      ]
    });

    if (existingUser) {
      console.log('Superadmin user already exists.');
      if (!existingUser.isSuperAdmin) {
          existingUser.isSuperAdmin = true;
          await existingUser.save();
          console.log('Updated existing user to superadmin.');
      } else {
          console.log('User is already a superadmin.');
      }
    } else {
      const newUser = new User(superAdminData);
      await newUser.save();
      console.log('Superadmin user created successfully.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);

  } catch (error) {
    console.error('Error creating superadmin:', error);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
  }
};

createSuperAdmin();
