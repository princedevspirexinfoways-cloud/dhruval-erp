import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Import config after loading env vars
import config from '../config/environment';

const checkAndCreateSuperAdmin = async () => {
    try {
        console.log('Connecting to database...');
        console.log('MONGODB_URI:', config.MONGODB_URI);

        await mongoose.connect(config.MONGODB_URI);

        console.log('Connected successfully!');
        console.log('Database name:', mongoose.connection.name);
        console.log('Database host:', mongoose.connection.host);

        // Check if superadmin exists
        console.log('\n=== Checking for existing superadmin ===');
        const existingUser = await User.findOne({ username: 'superadmin' });

        if (existingUser) {
            console.log('✅ Superadmin user found!');
            console.log('Username:', existingUser.username);
            console.log('Email:', existingUser.email);
            console.log('Is SuperAdmin:', existingUser.isSuperAdmin);
            console.log('Is Active:', existingUser.isActive);
            console.log('Phone:', existingUser.personalInfo?.phone);

            // Test password
            console.log('\n=== Testing password ===');
            const isPasswordValid = await bcrypt.compare('password123', existingUser.password);
            console.log('Password "password123" is valid:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('\n⚠️  Password does not match! Updating password...');
                existingUser.password = 'password123';
                await existingUser.save();
                console.log('✅ Password updated successfully!');
            }

            if (!existingUser.isSuperAdmin) {
                console.log('\n⚠️  User is not a superadmin! Updating...');
                existingUser.isSuperAdmin = true;
                await existingUser.save();
                console.log('✅ User updated to superadmin!');
            }
        } else {
            console.log('❌ No superadmin user found. Creating new user...');

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
                companyAccess: []
            };

            const newUser = new User(superAdminData);
            await newUser.save();
            console.log('✅ Superadmin user created successfully!');

            // Verify the password was hashed correctly
            const verifyUser = await User.findOne({ username: 'superadmin' });
            if (verifyUser) {
                const isPasswordValid = await bcrypt.compare('password123', verifyUser.password);
                console.log('Password verification after creation:', isPasswordValid);
            }
        }

        // List all users in the database
        console.log('\n=== All users in database ===');
        const allUsers = await User.find({}).select('username email isSuperAdmin isActive');
        console.log('Total users:', allUsers.length);
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username} (${user.email}) - SuperAdmin: ${user.isSuperAdmin}, Active: ${user.isActive}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

checkAndCreateSuperAdmin();
