export const automatedReportsConfig = {
  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  },

  // Report Configuration
  reports: {
    // Daily report at 9:00 AM IST
    dailyTime: process.env.DAILY_REPORT_TIME || '09:00',
    
    // Weekly report every Monday at 10:00 AM IST
    weeklyTime: process.env.WEEKLY_REPORT_TIME || '10:00',
    
    // Monthly report 1st of every month at 11:00 AM IST
    monthlyTime: process.env.MONTHLY_REPORT_TIME || '11:00',
    
    // Email recipients for different report types
    recipients: {
      daily: process.env.DAILY_REPORT_RECIPIENTS?.split(',') || [
        'owner@company.com',
        'manager@company.com',
        'accountant@company.com'
      ],
      weekly: process.env.WEEKLY_REPORT_RECIPIENTS?.split(',') || [
        'owner@company.com',
        'manager@company.com',
        'director@company.com'
      ],
      monthly: process.env.MONTHLY_REPORT_RECIPIENTS?.split(',') || [
        'owner@company.com',
        'director@company.com',
        'board@company.com'
      ]
    },
    
    // Report formats to generate
    formats: ['excel', 'csv'] as ('excel' | 'csv')[],
    
    // Report retention in days
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS) || 90,
    
    // File cleanup after sending (in minutes)
    cleanupAfterMinutes: parseInt(process.env.REPORT_CLEANUP_MINUTES) || 30
  },

  // Database Configuration
  database: {
    // Store report data in database
    storeReportData: process.env.STORE_REPORT_DATA !== 'false',
    
    // Store generated files metadata
    storeFileMetadata: process.env.STORE_FILE_METADATA !== 'false',
    
    // Archive old reports
    archiveOldReports: process.env.ARCHIVE_OLD_REPORTS === 'true',
    
    // Archive reports older than (days)
    archiveAfterDays: parseInt(process.env.ARCHIVE_AFTER_DAYS) || 365
  },

  // Export Configuration
  export: {
    // Export directory
    directory: process.env.EXPORT_DIRECTORY || './exports',
    
    // Maximum file size (MB)
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
    
    // Compress large files
    compressLargeFiles: process.env.COMPRESS_LARGE_FILES === 'true',
    
    // Compression threshold (MB)
    compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD_MB) || 10
  },

  // Notification Configuration
  notifications: {
    // Send success notifications
    sendSuccessNotifications: process.env.SEND_SUCCESS_NOTIFICATIONS !== 'false',
    
    // Send error notifications
    sendErrorNotifications: process.env.SEND_ERROR_NOTIFICATIONS !== 'false',
    
    // Error notification recipients
    errorRecipients: process.env.ERROR_NOTIFICATION_RECIPIENTS?.split(',') || [
      'admin@company.com',
      'tech@company.com'
    ],
    
    // Slack webhook for notifications (optional)
    slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
    
    // WhatsApp Business API (optional)
    whatsappApi: {
      enabled: process.env.WHATSAPP_NOTIFICATIONS === 'true',
      apiKey: process.env.WHATSAPP_API_KEY || '',
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || ''
    }
  },

  // Performance Configuration
  performance: {
    // Maximum concurrent report generations
    maxConcurrentReports: parseInt(process.env.MAX_CONCURRENT_REPORTS) || 5,
    
    // Report generation timeout (minutes)
    generationTimeout: parseInt(process.env.REPORT_GENERATION_TIMEOUT) || 30,
    
    // Enable caching
    enableCaching: process.env.ENABLE_REPORT_CACHING === 'true',
    
    // Cache TTL (minutes)
    cacheTTL: parseInt(process.env.REPORT_CACHE_TTL) || 60
  },

  // Security Configuration
  security: {
    // Encrypt sensitive data in reports
    encryptSensitiveData: process.env.ENCRYPT_SENSITIVE_DATA === 'true',
    
    // Encryption key
    encryptionKey: process.env.REPORT_ENCRYPTION_KEY || 'your-encryption-key',
    
    // Watermark reports
    addWatermark: process.env.ADD_REPORT_WATERMARK === 'true',
    
    // Watermark text
    watermarkText: process.env.REPORT_WATERMARK_TEXT || 'CONFIDENTIAL - ERP System',
    
    // Password protect large reports
    passwordProtectLargeReports: process.env.PASSWORD_PROTECT_LARGE_REPORTS === 'true',
    
    // Default password for protected reports
    defaultReportPassword: process.env.DEFAULT_REPORT_PASSWORD || 'ERP2024!'
  },

  // Customization Configuration
  customization: {
    // Company logo in reports
    includeCompanyLogo: process.env.INCLUDE_COMPANY_LOGO === 'true',
    
    // Logo path
    logoPath: process.env.COMPANY_LOGO_PATH || './assets/logo.png',
    
    // Custom CSS for HTML reports
    customCSS: process.env.CUSTOM_REPORT_CSS || '',
    
    // Report templates directory
    templatesDirectory: process.env.REPORT_TEMPLATES_DIR || './templates/reports',
    
    // Default report language
    defaultLanguage: process.env.DEFAULT_REPORT_LANGUAGE || 'en',
    
    // Supported languages
    supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || ['en', 'hi', 'gu']
  }
};

// Environment variables documentation
export const environmentVariables = {
  // Email Configuration
  EMAIL_HOST: 'SMTP server host (default: smtp.gmail.com)',
  EMAIL_PORT: 'SMTP server port (default: 587)',
  EMAIL_SECURE: 'Use SSL/TLS (default: false)',
  EMAIL_USER: 'SMTP username/email',
  EMAIL_PASSWORD: 'SMTP password/app password',
  
  // Report Timing
  DAILY_REPORT_TIME: 'Daily report time in HH:MM format (default: 09:00)',
  WEEKLY_REPORT_TIME: 'Weekly report time in HH:MM format (default: 10:00)',
  MONTHLY_REPORT_TIME: 'Monthly report time in HH:MM format (default: 11:00)',
  
  // Recipients
  DAILY_REPORT_RECIPIENTS: 'Comma-separated list of daily report recipients',
  WEEKLY_REPORT_RECIPIENTS: 'Comma-separated list of weekly report recipients',
  MONTHLY_REPORT_RECIPIENTS: 'Comma-separated list of monthly report recipients',
  ERROR_NOTIFICATION_RECIPIENTS: 'Comma-separated list of error notification recipients',
  
  // Features
  STORE_REPORT_DATA: 'Store report data in database (default: true)',
  STORE_FILE_METADATA: 'Store file metadata in database (default: true)',
  ARCHIVE_OLD_REPORTS: 'Archive old reports (default: false)',
  SEND_SUCCESS_NOTIFICATIONS: 'Send success notifications (default: true)',
  SEND_ERROR_NOTIFICATIONS: 'Send error notifications (default: true)',
  
  // Performance
  MAX_CONCURRENT_REPORTS: 'Maximum concurrent report generations (default: 5)',
  REPORT_GENERATION_TIMEOUT: 'Report generation timeout in minutes (default: 30)',
  ENABLE_REPORT_CACHING: 'Enable report caching (default: false)',
  
  // Security
  ENCRYPT_SENSITIVE_DATA: 'Encrypt sensitive data in reports (default: false)',
  ADD_REPORT_WATERMARK: 'Add watermark to reports (default: true)',
  PASSWORD_PROTECT_LARGE_REPORTS: 'Password protect large reports (default: false)',
  
  // Customization
  INCLUDE_COMPANY_LOGO: 'Include company logo in reports (default: true)',
  CUSTOM_REPORT_CSS: 'Custom CSS for HTML reports',
  DEFAULT_REPORT_LANGUAGE: 'Default report language (default: en)'
};

export default automatedReportsConfig;
