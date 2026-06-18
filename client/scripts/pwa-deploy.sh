#!/bin/bash

# ERP PWA Deployment Script
# This script helps deploy and test the PWA in production

set -e

echo "🚀 ERP PWA Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the client directory"
    exit 1
fi

# Check if required files exist
print_info "Checking PWA files..."

required_files=(
    "public/manifest.json"
    "public/sw.js"
    "next.config.ts"
    "src/app/layout.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check if icons exist
print_info "Checking PWA icons..."

icon_sizes=(72 96 128 144 152 192 384 512)
missing_icons=()

for size in "${icon_sizes[@]}"; do
    icon_file="public/icons/icon-${size}x${size}.png"
    if [ ! -f "$icon_file" ]; then
        missing_icons+=("$icon_file")
    fi
done

if [ ${#missing_icons[@]} -gt 0 ]; then
    print_warning "Missing icons detected:"
    for icon in "${missing_icons[@]}"; do
        echo "  - $icon"
    done
    print_info "Please generate icons using: open public/icons/create-basic-icons.html"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_status "All required icons found"
fi

# Build the application
print_info "Building application for production..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Start the production server
print_info "Starting production server..."
print_warning "Make sure to test on HTTPS domain for full PWA functionality"

echo ""
echo "🔗 Test URLs:"
echo "  - Main App: http://localhost:4001"
echo "  - PWA Test: http://localhost:4001/pwa-test.html"
echo "  - Manifest: http://localhost:4001/manifest.json"
echo ""

print_info "PWA Testing Checklist:"
echo "  1. ✅ Test installation on mobile devices"
echo "  2. ✅ Test installation on desktop browsers"
echo "  3. ✅ Test offline functionality"
echo "  4. ✅ Test push notifications"
echo "  5. ✅ Run Lighthouse PWA audit"
echo "  6. ✅ Test on HTTPS domain"
echo ""

# Ask if user wants to start the server
read -p "Start production server now? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_info "Build completed. Run 'npm start' to start the server."
    exit 0
fi

# Start the server
npm start
