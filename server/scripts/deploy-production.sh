#!/bin/bash

# =============================================
# DHRUVAL EXIM ERP SERVER PRODUCTION DEPLOYMENT
# =============================================

set -e

echo "🚀 Starting Dhruval Exim ERP Server Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dhruval-erp-server"
APP_DIR="/var/www/dhruval-erp/server"
BACKUP_DIR="/var/backups/dhruval-erp"
LOG_FILE="/var/log/dhruval-erp-deploy.log"
NODE_VERSION="18"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    warning "Running as root. Consider using a dedicated user for deployment."
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_CURRENT -lt $NODE_VERSION ]]; then
    error "Node.js version $NODE_VERSION or higher is required. Current: v$NODE_CURRENT"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
fi

# Create directories
log "📁 Creating necessary directories..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p /var/log/dhruval-erp
mkdir -p /var/www/dhruval-erp/uploads

# Backup current deployment
if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    log "💾 Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME
    log "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Stop existing application
log "🛑 Stopping existing application..."
pm2 stop $APP_NAME 2>/dev/null || log "No existing application to stop"

# Copy new files
log "📋 Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
log "📦 Installing production dependencies..."
npm ci --only=production

# Build application
log "🔨 Building application..."
npm run build

# Copy production environment
log "⚙️  Setting up production environment..."
if [ -f ".env.production" ]; then
    cp .env.production .env.local
    log "Production environment configured (.env.production → .env.local)"
    log "Environment file will be loaded as .env.local by PM2"
else
    error "No .env.production file found. Please create one first!"
    exit 1
fi

# Set permissions
log "🔐 Setting file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 777 $APP_DIR/uploads
chmod -R 777 /var/log/dhruval-erp

# Database setup
log "🗄️  Setting up database..."
if command -v mongod &> /dev/null; then
    log "MongoDB is available"
    # Run any database migrations here if needed
    # node scripts/migrate.js
else
    warning "MongoDB not found. Please ensure MongoDB is installed and running."
fi

# Start application with PM2
log "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Health check
log "🏥 Performing health check..."
sleep 10
if curl -f http://localhost:4000/api/v1/health > /dev/null 2>&1; then
    log "✅ Health check passed"
else
    error "❌ Health check failed"
fi

# Setup log rotation
log "📝 Setting up log rotation..."
cat > /etc/logrotate.d/dhruval-erp << EOF
/var/log/dhruval-erp/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload $APP_NAME
    endscript
}
EOF

# Setup monitoring
log "📊 Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

log "🎉 Deployment completed successfully!"
log "📍 Application URL: http://server.dhruvalexim.com"
log "📊 Monitor with: pm2 monit"
log "📋 View logs with: pm2 logs $APP_NAME"

echo ""
echo "==================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "==================================="
echo "Server: http://server.dhruvalexim.com"
echo "Status: pm2 status"
echo "Logs: pm2 logs dhruval-erp-server"
echo "Monitor: pm2 monit"
echo "==================================="
