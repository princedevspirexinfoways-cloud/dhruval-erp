import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  API_PREFIX: string;

  // Database
  MONGODB_URI: string;
  MONGODB_URI_TEST: string;
  DB_MAX_POOL_SIZE: number;
  DB_MIN_POOL_SIZE: number;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;

  // Session
  SESSION_SECRET: string;
  SESSION_NAME: string;
  SESSION_MAX_AGE: number;

  // Cookie
  COOKIE_SECRET: string;
  COOKIE_DOMAIN: string;
  COOKIE_SECURE: boolean;
  COOKIE_HTTP_ONLY: boolean;
  COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';

  // CORS
  CORS_ORIGIN: string[];
  CORS_CREDENTIALS: boolean;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: boolean;

  // Security
  BCRYPT_SALT_ROUNDS: number;
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_TIME: number;
  PASSWORD_MIN_LENGTH: number;
  PASSWORD_REQUIRE_UPPERCASE: boolean;
  PASSWORD_REQUIRE_LOWERCASE: boolean;
  PASSWORD_REQUIRE_NUMBERS: boolean;
  PASSWORD_REQUIRE_SYMBOLS: boolean;

  // File Upload
  UPLOAD_MAX_FILE_SIZE: number;
  UPLOAD_ALLOWED_TYPES: string[];
  UPLOAD_DESTINATION: string;

  // AWS S3 / Contabo S3
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  AWS_S3_ACL: string;
  
  // Contabo S3 Configuration
  CONTABO_REGION: string;
  CONTABO_ENDPOINT: string;
  CONTABO_ACCESS_KEY: string;
  CONTABO_SECRET_KEY: string;
  CONTABO_BUCKET_NAME: string;
  CONTABO_BASE_URL: string;

  // Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;

  // SMS
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // Redis
  REDIS_URL: string;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_KEY_PREFIX: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;
  LOG_MAX_SIZE: string;
  LOG_MAX_FILES: string;
  LOG_DATE_PATTERN: string;

  // Monitoring
  ENABLE_METRICS: boolean;
  METRICS_PORT: number;
  HEALTH_CHECK_INTERVAL: number;

  // Feature Flags
  ENABLE_SWAGGER: boolean;
  ENABLE_GRAPHQL: boolean;
  ENABLE_WEBSOCKETS: boolean;
  ENABLE_CRON_JOBS: boolean;
  ENABLE_FILE_COMPRESSION: boolean;

  // Security Flags
  TRUST_PROXY: boolean;
  DISABLE_X_POWERED_BY: boolean;
  ENABLE_CONTENT_SECURITY_POLICY: boolean;
  ENABLE_HSTS: boolean;
  ENABLE_NOSNIFF: boolean;
  ENABLE_XSS_FILTER: boolean;
}

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'COOKIE_SECRET',
  'MONGODB_URI'
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const config: EnvironmentConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_NAME: process.env.APP_NAME || 'Factory ERP Server',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp',
  MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/factory_erp_test',
  DB_MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
  DB_MIN_POOL_SIZE: parseInt(process.env.DB_MIN_POOL_SIZE || '5', 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'dhruval-erp',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'dhruval-erp-users',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  SESSION_NAME: process.env.SESSION_NAME || 'factory-erp-session',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),

  // Cookie
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-super-secret-cookie-key-change-in-production',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY !== 'false',
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax', // Changed default to 'lax' for development

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS !== 'false',

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '100', 10),
  LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME || '1800000', 10),
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  PASSWORD_REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  PASSWORD_REQUIRE_LOWERCASE: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  PASSWORD_REQUIRE_NUMBERS: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  PASSWORD_REQUIRE_SYMBOLS: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',

  // File Upload
  UPLOAD_MAX_FILE_SIZE: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10),
  UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png'],
  UPLOAD_DESTINATION: process.env.UPLOAD_DESTINATION || 'uploads/',

  // AWS S3 / Contabo S3
  AWS_ACCESS_KEY_ID: process.env.CONTABO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.CONTABO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.CONTABO_REGION || process.env.AWS_REGION || 'usc1',
  AWS_S3_BUCKET: process.env.CONTABO_BUCKET_NAME || process.env.AWS_S3_BUCKET || '',
  AWS_S3_ACL: process.env.AWS_S3_ACL || 'private',
  
  // Contabo S3 Configuration
  CONTABO_REGION: process.env.CONTABO_REGION || 'usc1',
  CONTABO_ENDPOINT: process.env.CONTABO_ENDPOINT || 'https://usc1.contabostorage.com',
  CONTABO_ACCESS_KEY: process.env.CONTABO_ACCESS_KEY || '',
  CONTABO_SECRET_KEY: process.env.CONTABO_SECRET_KEY || '',
  CONTABO_BUCKET_NAME: process.env.CONTABO_BUCKET_NAME || 'erp',
  CONTABO_BASE_URL: process.env.CONTABO_BASE_URL || 'https://usc1.contabostorage.com/erp',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@factoryerp.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Factory ERP System',

  // SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'factory-erp:',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',
  LOG_DATE_PATTERN: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',

  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090', 10),
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),

  // Feature Flags
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER !== 'false',
  ENABLE_GRAPHQL: process.env.ENABLE_GRAPHQL === 'true',
  ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS !== 'false',
  ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS !== 'false',
  ENABLE_FILE_COMPRESSION: process.env.ENABLE_FILE_COMPRESSION !== 'false',

  // Security Flags
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',
  DISABLE_X_POWERED_BY: process.env.DISABLE_X_POWERED_BY !== 'false',
  ENABLE_CONTENT_SECURITY_POLICY: process.env.ENABLE_CONTENT_SECURITY_POLICY !== 'false',
  ENABLE_HSTS: process.env.ENABLE_HSTS !== 'false',
  ENABLE_NOSNIFF: process.env.ENABLE_NOSNIFF !== 'false',
  ENABLE_XSS_FILTER: process.env.ENABLE_XSS_FILTER !== 'false',
};

export default config;
