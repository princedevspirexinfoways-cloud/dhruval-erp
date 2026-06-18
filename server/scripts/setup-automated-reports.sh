#!/bin/bash

# 🚀 ERP Automated Reporting System Quick Setup Script
# This script will install dependencies, create necessary directories, and set up the system

set -e  # Exit on any error

echo "🚀 Starting ERP Automated Reporting System Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the server directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Step 1: Install Dependencies
print_status "Installing required dependencies..."
npm install exceljs csv-writer node-cron nodemailer

# Install TypeScript types for development
if [ -f "tsconfig.json" ]; then
    print_status "Installing TypeScript types..."
    npm install --save-dev @types/nodemailer @types/node-cron
fi

print_success "Dependencies installed successfully"

# Step 2: Create necessary directories
print_status "Creating necessary directories..."
mkdir -p exports
mkdir -p logs
mkdir -p config
mkdir -p templates/reports

print_success "Directories created successfully"

# Step 3: Set proper permissions
print_status "Setting directory permissions..."
chmod 755 exports
chmod 755 logs
chmod 755 config
chmod 755 templates

print_success "Permissions set successfully"

# Step 4: Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    if [ -f "src/config/automatedReports.env.template" ]; then
        cp src/config/automatedReports.env.template .env
        print_warning "Please edit .env file with your actual configuration values"
        print_warning "Especially update EMAIL_USER, EMAIL_PASSWORD, and recipient emails"
    else
        print_warning "Environment template not found. Please create .env file manually"
    fi
else
    print_status ".env file already exists"
fi

# Step 5: Check if models are properly registered
print_status "Checking model registration..."
if [ -f "src/models/index.ts" ]; then
    if grep -q "ProductionDashboard\|AdvancedReport\|DocumentManagement" src/models/index.ts; then
        print_success "New models are registered in index.ts"
    else
        print_warning "New models may not be registered. Please check src/models/index.ts"
    fi
else
    print_warning "Models index file not found"
fi

# Step 6: Check if routes are properly registered
print_status "Checking route registration..."
if [ -f "src/routes/index.ts" ]; then
    if grep -q "production-dashboard\|advanced-reports\|document-management" src/routes/index.ts; then
        print_success "New routes are registered in index.ts"
    else
        print_warning "New routes may not be registered. Please check src/routes/index.ts"
    fi
else
    print_warning "Routes index file not found"
fi

# Step 7: Create a basic test configuration
print_status "Creating test configuration..."
cat > config/test-automated-reports.js << 'EOF'
// Test configuration for automated reports
module.exports = {
  test: {
    email: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    },
    recipients: {
      daily: ['test@example.com'],
      weekly: ['test@example.com'],
      monthly: ['test@example.com']
    },
    timing: {
      daily: '09:00',
      weekly: '10:00',
      monthly: '11:00'
    }
  }
};
EOF

print_success "Test configuration created"

# Step 8: Create startup integration example
print_status "Creating startup integration example..."
cat > examples/server-integration.js << 'EOF'
// Example of how to integrate automated reports into your main server

const { startAutomatedReports, stopAutomatedReports } = require('../src/utils/automatedReportsIntegration');

// Start automated reports after database connection
async function startServer() {
  try {
    // ... your existing server startup code ...
    
    // Start automated reporting system
    await startAutomatedReports();
    console.log('✅ Automated reporting system started');
    
    // ... rest of your server code ...
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down automated reporting system...');
  await stopAutomatedReports();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down automated reporting system...');
  await stopAutomatedReports();
  process.exit(0);
});

startServer();
EOF

mkdir -p examples
print_success "Startup integration example created"

# Step 9: Create health check endpoint example
print_status "Creating health check endpoint example..."
cat > examples/health-check-endpoint.js << 'EOF'
// Example of how to add health check endpoints

const express = require('express');
const { automatedReportsHealthCheck } = require('../src/utils/automatedReportsIntegration');

const app = express();

// Health check endpoint
app.get('/health/automated-reports', (req, res) => {
  try {
    const health = automatedReportsHealthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Manual trigger endpoint
app.post('/api/trigger-report', async (req, res) => {
  try {
    const { companyId, reportType } = req.body;
    
    if (!companyId || !reportType) {
      return res.status(400).json({
        success: false,
        message: 'companyId and reportType are required'
      });
    }
    
    const { triggerManualReport } = require('../src/utils/automatedReportsIntegration');
    const result = await triggerManualReport(companyId, reportType);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = app;
EOF

print_success "Health check endpoint example created"

# Step 10: Create a simple test script
print_status "Creating test script..."
cat > scripts/test-automated-reports.js << 'EOF'
#!/usr/bin/env node

// Simple test script for automated reports
const { startAutomatedReports, getAutomatedReportsStatus } = require('../src/utils/automatedReportsIntegration');

async function testAutomatedReports() {
  try {
    console.log('🧪 Testing automated reports system...');
    
    // Start the system
    await startAutomatedReports();
    console.log('✅ System started successfully');
    
    // Check status
    const status = getAutomatedReportsStatus();
    console.log('📊 System status:', JSON.stringify(status, null, 2));
    
    // Wait a bit to see cron jobs
    console.log('⏳ Waiting 5 seconds to see cron jobs...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAutomatedReports();
EOF

chmod +x scripts/test-automated-reports.js
print_success "Test script created"

# Step 11: Create cleanup script
print_status "Creating cleanup script..."
cat > scripts/cleanup-reports.sh << 'EOF'
#!/bin/bash

# Cleanup script for old reports and files
echo "🧹 Cleaning up old reports..."

# Remove files older than 30 days
find exports/ -name "*.xlsx" -mtime +30 -delete
find exports/ -name "*.csv" -mtime +30 -delete

# Remove empty directories
find exports/ -type d -empty -delete

# Clean up logs older than 7 days
find logs/ -name "*.log" -mtime +7 -delete

echo "✅ Cleanup completed"
EOF

chmod +x scripts/cleanup-reports.sh
print_success "Cleanup script created"

# Step 12: Create PM2 ecosystem configuration
print_status "Creating PM2 configuration..."
cat > ecosystem-automated-reports.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'erp-automated-reports',
      script: 'src/utils/automatedReportsIntegration.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/automated-reports-error.log',
      out_file: './logs/automated-reports-out.log',
      log_file: './logs/automated-reports-combined.log',
      time: true
    }
  ]
};
EOF

print_success "PM2 configuration created"

# Step 13: Final checks and summary
print_status "Performing final checks..."

# Check if all required files exist
REQUIRED_FILES=(
  "src/services/AutomatedReportService.ts"
  "src/services/CronJobScheduler.ts"
  "src/utils/automatedReportsIntegration.ts"
  "src/config/automatedReports.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_success "✓ $file exists"
  else
    print_error "✗ $file missing"
  fi
done

# Check if exports directory is writable
if [ -w "exports" ]; then
  print_success "✓ exports directory is writable"
else
  print_error "✗ exports directory is not writable"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your email configuration"
echo "2. Update recipient email addresses"
echo "3. Test the system: npm run test:automated-reports"
echo "4. Integrate into your main server startup"
echo "5. Set up cron jobs for cleanup (optional)"
echo ""
echo "📚 Documentation:"
echo "- Setup Guide: AUTOMATED_REPORTS_SETUP.md"
echo "- Examples: examples/ directory"
echo "- Test Script: scripts/test-automated-reports.js"
echo ""
echo "🔧 Useful commands:"
echo "- Test system: node scripts/test-automated-reports.js"
echo "- Cleanup: ./scripts/cleanup-reports.sh"
echo "- PM2 start: pm2 start ecosystem-automated-reports.config.js"
echo ""
echo "📞 For help, check the setup guide or logs in logs/ directory"
echo ""
