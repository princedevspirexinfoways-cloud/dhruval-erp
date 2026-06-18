#!/bin/bash

# =============================================
# DHRUVAL EXIM ERP CLIENT PRODUCTION DEPLOYMENT
# =============================================

set -e

echo "🚀 Starting Dhruval Exim ERP Client Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dhruval-erp-client"
APP_DIR="/var/www/dhruval-erp/client"
NGINX_DIR="/etc/nginx/sites-available"
BACKUP_DIR="/var/backups/dhruval-erp"
LOG_FILE="/var/log/dhruval-erp-client-deploy.log"
DOMAIN="erp.dhruvalexim.com"
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

# Check Nginx
if ! command -v nginx &> /dev/null; then
    log "Installing Nginx..."
    apt-get update && apt-get install -y nginx
fi

# Create directories
log "📁 Creating necessary directories..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p /var/log/dhruval-erp

# Backup current deployment
if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    log "💾 Creating backup of current deployment..."
    BACKUP_NAME="client-backup-$(date +%Y%m%d-%H%M%S)"
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

# Copy production environment
log "⚙️  Setting up production environment..."
if [ -f ".env.production" ]; then
    cp .env.production .env.local
    log "Production environment configured (.env.production → .env.local)"
    log "Next.js will load environment from .env.local"
else
    error "No .env.production file found. Please create one first!"
    exit 1
fi

# Build application
log "🔨 Building application for production..."
npm run build:prod

# Set permissions
log "🔐 Setting file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Create Nginx configuration
log "🌐 Setting up Nginx configuration..."
cat > $NGINX_DIR/dhruval-erp-client << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Static files caching
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        alias $APP_DIR/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable Nginx site
ln -sf $NGINX_DIR/dhruval-erp-client /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Create PM2 ecosystem for client
log "⚙️  Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start:prod',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4001
    },
    log_file: '/var/log/dhruval-erp/client-combined.log',
    out_file: '/var/log/dhruval-erp/client-out.log',
    error_file: '/var/log/dhruval-erp/client-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '512M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
};
EOF

# Start application with PM2
log "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Health check
log "🏥 Performing health check..."
sleep 15
if curl -f http://localhost:4001 > /dev/null 2>&1; then
    log "✅ Application health check passed"
else
    warning "⚠️  Application health check failed, but continuing..."
fi

if curl -f http://$DOMAIN > /dev/null 2>&1; then
    log "✅ Domain health check passed"
else
    warning "⚠️  Domain health check failed. Check DNS and Nginx configuration."
fi

log "🎉 Client deployment completed successfully!"
log "📍 Application URL: http://$DOMAIN"
log "📊 Monitor with: pm2 monit"
log "📋 View logs with: pm2 logs $APP_NAME"

echo ""
echo "==================================="
echo "🎉 CLIENT DEPLOYMENT SUCCESSFUL!"
echo "==================================="
echo "Client: http://$DOMAIN"
echo "Status: pm2 status"
echo "Logs: pm2 logs $APP_NAME"
echo "Monitor: pm2 monit"
echo "Nginx: systemctl status nginx"
echo "==================================="
