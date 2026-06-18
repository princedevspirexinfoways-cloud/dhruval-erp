import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Import config after loading env vars
import config from '../config/environment';

const testLogin = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to database:', mongoose.connection.name);

        const testUsername = 'superadmin';
        const testPassword = 'password123';

        console.log('\n=== Testing login logic ===');
        console.log('Testing with username:', testUsername);
        console.log('Testing with password:', testPassword);

        // Test 1: Find with lowercase
        console.log('\n--- Test 1: Finding with lowercase ---');
        const user1 = await User.findOne({
            $or: [
                { username: testUsername.toLowerCase() },
                { email: testUsername.toLowerCase() },
                { 'personalInfo.phone': testUsername }
            ],
            isActive: true
        });
        console.log('Found user with lowercase search:', user1 ? `YES (${user1.username})` : 'NO');

        // Test 2: Find exact match
        console.log('\n--- Test 2: Finding with exact match ---');
        const user2 = await User.findOne({ username: testUsername });
        console.log('Found user with exact match:', user2 ? `YES (${user2.username})` : 'NO');

        // Test 3: Find all superadmin users
        console.log('\n--- Test 3: Finding all superadmin users ---');
        const superAdmins = await User.find({
            username: { $regex: /superadmin/i }
        }).select('username email isSuperAdmin isActive');

        console.log('Found superadmin users:', superAdmins.length);
        superAdmins.forEach((user, index) => {
            console.log(`  ${index + 1}. username: "${user.username}", email: "${user.email}", superAdmin: ${user.isSuperAdmin}, active:${user.isActive}`);
        });

        // Test 4: Test password for each found superadmin
        if (superAdmins.length > 0) {
            console.log('\n--- Test 4: Testing passwords ---');
            for (const user of superAdmins) {
                const fullUser = await User.findById(user._id);
                if (fullUser) {
                    const isValid = await bcrypt.compare(testPassword, fullUser.password);
                    console.log(`  "${fullUser.username}" password valid: ${isValid}`);
                }
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Tests complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

testLogin();
