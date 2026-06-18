#!/usr/bin/env ts-node

import fixUserCompanyAccess from './fixUserCompanyAccess';

/**
 * Migration runner script
 * Run this script to fix all user company access issues
 */

async function runMigration() {
  console.log('🚀 Starting User Company Access Migration');
  console.log('==========================================');
  
  try {
    await fixUserCompanyAccess();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
