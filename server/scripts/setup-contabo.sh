#!/bin/bash

# Contabo S3 Setup Script for Dhruval ERP
# This script helps set up the Contabo S3 configuration

echo "=============================================="
echo "Contabo S3 Setup for Dhruval ERP"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.contabo.example .env
    echo "✅ .env file created from template"
else
    echo "⚠️  .env file already exists. Please manually update it with Contabo settings."
fi

echo ""
echo "=============================================="
echo "Contabo S3 Configuration"
echo "=============================================="
echo "Region: usc1"
echo "Endpoint: https://usc1.contabostorage.com"
echo "Bucket: erp"
echo "Base URL: https://usc1.contabostorage.com/erp"
echo ""

echo "=============================================="
echo "Required Environment Variables"
echo "=============================================="
echo "CONTABO_REGION=usc1"
echo "CONTABO_ENDPOINT=https://usc1.contabostorage.com"
echo "CONTABO_ACCESS_KEY=a515fceddec13b83b773ba47cb024c02"
echo "CONTABO_SECRET_KEY=c318d5ae360fa3ad1a7de0146d99fbb1"
echo "CONTABO_BUCKET_NAME=erp"
echo "CONTABO_BASE_URL=https://usc1.contabostorage.com/erp"
echo ""

echo "=============================================="
echo "Client-side Configuration"
echo "=============================================="
echo "Add to your client .env.local or .env:"
echo "NEXT_PUBLIC_S3_BASE_URL=https://usc1.contabostorage.com/erp"
echo ""

echo "=============================================="
echo "Testing Configuration"
echo "=============================================="
echo "To test the configuration, run:"
echo "npm run dev"
echo ""
echo "Then try uploading a file through the application."
echo ""

echo "=============================================="
echo "Troubleshooting"
echo "=============================================="
echo "1. Make sure your Contabo bucket 'erp' exists"
echo "2. Verify your access keys are correct"
echo "3. Check that the bucket permissions allow upload/download"
echo "4. Ensure CORS is configured if needed"
echo ""

echo "✅ Contabo S3 setup complete!"
echo "Please review and update your .env file with the correct values."
