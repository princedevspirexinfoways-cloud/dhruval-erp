# Factory ERP Server

A complete, secure, and scalable TypeScript-based server for Factory ERP system with advanced security, monitoring, and multi-tenant support.

## 🚀 Features

### Core Features
- **TypeScript** - Full type safety and modern JavaScript features
- **MongoDB** - Flexible document database with Mongoose ODM
- **Multi-tenant Architecture** - Complete company-wise data isolation
- **Advanced Security** - Comprehensive security middleware stack
- **Real-time Communication** - WebSocket support with Socket.IO
- **Complete Authentication** - JWT-based auth with refresh tokens
- **Role-based Access Control** - Granular permissions system
- **Comprehensive Logging** - Structured logging with Winston
- **Health Monitoring** - Built-in health checks and metrics
- **API Documentation** - Swagger/OpenAPI integration ready

### Security Features
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet Security Headers** - Comprehensive HTTP security headers
- **Rate Limiting** - Multiple rate limiting strategies
- **Request Sanitization** - MongoDB injection and XSS protection
- **Session Management** - Secure session handling with MongoDB store
- **Password Security** - Bcrypt hashing with configurable complexity
- **Account Lockout** - Brute force protection
- **Security Logging** - Detailed security event logging

### Database Models
- **Company Management** - Multi-tenant company setup
- **User Management** - Advanced user system with multi-company access
- **Inventory Management** - Complete item tracking with locations
- **Stock Movement** - Comprehensive transaction tracking
- **Production Orders** - Stage-wise production management
- **Customer Orders** - Complete order lifecycle management

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **MongoDB** >= 5.0
- **Redis** (optional, for caching and sessions)

## 🛠️ Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/factory_erp
   
   # JWT Secrets (CHANGE THESE IN PRODUCTION!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
   
   # CORS
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173
   ```

4. **Create logs directory**
   ```bash
   mkdir logs
   ```

## 🚀 Running the Server

### Development Mode
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

### Production Mode
```bash
pnpm start:prod
```

## 📊 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm start:prod` - Start with NODE_ENV=production
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm health` - Check server health

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── environment.ts # Environment variables
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication & authorization
│   │   └── security.ts   # Security middleware stack
│   ├── models/           # MongoDB models
│   │   ├── Company.ts    # Company model
│   │   ├── User.ts       # User model
│   │   ├── InventoryItem.ts # Inventory model
│   │   └── index.ts      # Models export
│   ├── routes/           # API routes
│   │   └── auth.ts       # Authentication routes
│   ├── types/            # TypeScript type definitions
│   │   └── models.ts     # Model interfaces
│   ├── utils/            # Utility functions
│   │   └── logger.ts     # Logging configuration
│   └── server.ts         # Main server file
├── logs/                 # Log files (auto-created)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔐 Authentication

### Registration
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@company.com",
  "password": "SecurePass123!",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+919876543210",
  "companyCode": "COMPANY",
  "companyName": "My Company Ltd",
  "gstin": "24XXXXX1234X1ZX",
  "pan": "XXXXX1234X"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "SecurePass123!",
  "companyCode": "COMPANY"
}
```

### Using Access Token
```bash
GET /api/v1/protected-endpoint
Authorization: Bearer <access_token>
X-Company-ID: <company_id>
```

## 🏥 Health Checks

- **Health Check**: `GET /health` - Complete system health
- **Readiness**: `GET /ready` - Database connectivity
- **Liveness**: `GET /live` - Server responsiveness

## 📝 Logging

The server uses structured logging with multiple log levels:

- **Error Logs**: `logs/error-YYYY-MM-DD.log`
- **Application Logs**: `logs/application-YYYY-MM-DD.log`
- **Access Logs**: `logs/access-YYYY-MM-DD.log`
- **Security Logs**: `logs/security-YYYY-MM-DD.log`
- **Audit Logs**: `logs/audit-YYYY-MM-DD.log`

## 🔒 Security Configuration

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Upload**: 10 uploads per minute

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Lockout
- 5 failed login attempts
- 30-minute lockout period
- Automatic unlock after timeout

## 🌐 Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `SESSION_SECRET` | Session secret | Required |
| `COOKIE_SECRET` | Cookie signing secret | Required |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### PM2 (Process Manager)
```bash
pnpm build
pm2 start dist/server.js --name "factory-erp-server"
```

### Environment-specific Configurations
- **Development**: Full logging, CORS enabled, debug mode
- **Production**: Optimized logging, security headers, compression

## 📊 Monitoring

### Built-in Metrics
- Request/response times
- Error rates
- Database connection status
- Memory usage
- Active connections

### External Monitoring
- **New Relic**: APM monitoring (configure `NEW_RELIC_LICENSE_KEY`)
- **Elastic APM**: Performance monitoring
- **Prometheus**: Metrics collection (port 9090)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain test coverage above 80%
3. Use conventional commit messages
4. Update documentation for new features
5. Ensure all security checks pass

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the logs in `logs/` directory
- Review environment configuration
- Ensure MongoDB is running and accessible
- Verify all required environment variables are set

## 🔄 Updates

To update dependencies:
```bash
pnpm update
```

To check for security vulnerabilities:
```bash
pnpm audit
```
npx tsc --noEmit --skipLibCheck

8789280225