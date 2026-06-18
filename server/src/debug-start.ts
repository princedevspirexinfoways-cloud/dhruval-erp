#!/usr/bin/env node

/**
 * Debug startup script to isolate hanging issues
 */

// Set up module aliases for production
import * as moduleAlias from 'module-alias';
import * as path from 'path';

// Register aliases
moduleAlias.addAliases({
  '@': path.join(__dirname),
  '@/config': path.join(__dirname, 'config'),
  '@/controllers': path.join(__dirname, 'controllers'),
  '@/middleware': path.join(__dirname, 'middleware'),
  '@/models': path.join(__dirname, 'models'),
  '@/routes': path.join(__dirname, 'routes'),
  '@/services': path.join(__dirname, 'services'),
  '@/utils': path.join(__dirname, 'utils'),
  '@/types': path.join(__dirname, 'types'),
  '@/validators': path.join(__dirname, 'validators')
});

console.log('✅ Module aliases registered');

// Load encrypted environment variables
import { config } from '@dotenvx/dotenvx';
config({ path: '.env.local' });

console.log('✅ Environment variables loaded');

// Test imports one by one
console.log('📦 Testing imports...');

try {
  console.log('1. Testing config import...');
  const envConfig = require('./config/environment').default;
  console.log('✅ Config imported successfully');

  console.log('2. Testing logger import...');
  const logger = require('./utils/logger').logger;
  console.log('✅ Logger imported successfully');
  
  logger.info('🎉 Debug startup successful!');
  
  console.log('3. Testing database import...');
  const database = require('./config/database').default;
  console.log('✅ Database imported successfully');
  
  console.log('4. Testing database connection...');
  database.connect()
    .then(() => {
      logger.info('✅ Database connected successfully!');
      console.log('🎉 All tests passed! Server should work now.');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('❌ Database connection failed:', error);
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
}
