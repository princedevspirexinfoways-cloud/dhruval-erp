# Routes Structure - Clean & Organized

## 🎯 Overview
This routes folder has been cleaned up to remove duplicate files and organize everything properly.

## 📁 Current Structure

### `/` (Root Routes)
- **`index.ts`** - Main routes index file that imports and registers all v1 routes

### `/v1/` (Version 1 API Routes)
All business logic routes are organized in the v1 folder:

#### Core Business Management
- `companies.ts` - Company management
- `users.ts` - User management  
- `customers.ts` - Customer management
- `suppliers.ts` - Supplier management

#### Inventory & Production
- `inventory.ts` - Inventory management
- `production.ts` - Production management
- `warehouses.ts` - Warehouse management
- `stock-movements.ts` - Stock tracking
- `spares.ts` - Spare parts management

#### Orders & Financial
- `customer-orders.ts` - Customer orders
- `purchase-orders.ts` - Purchase orders
- `invoices.ts` - Invoice management
- `quotations.ts` - Quotation management
- `financial-transactions.ts` - Financial management

#### Operations & Management
- `manpower.ts` - Manpower management
- `stickers.ts` - Sticker & label system
- `visitors.ts` - Visitor management with S3 file uploads
- `vehicles.ts` - Vehicle management

#### Monitoring & Analytics
- `boiler-monitoring.ts` - Boiler monitoring
- `electricity-monitoring.ts` - Electricity monitoring
- `business-analytics.ts` - Business analytics
- `security-logs.ts` - Security logging
- `audit-logs.ts` - Audit trail

#### Specialized Services
- `hospitality.ts` - Hospitality management
- `dispatch.ts` - Dispatch management
- `reports.ts` - Report generation

### `/legacy/` (Old Routes - Not in Use)
All old duplicate routes have been moved here for reference:
- `visitors.ts` - Old visitor routes
- `users.ts` - Old user routes
- `auth.ts` - Old auth routes
- `companies.ts` - Old company routes
- And many more...

## 🚀 Benefits of New Structure

1. **No Duplicates** - Each route exists only once
2. **Clear Versioning** - All routes are under `/v1/` prefix
3. **Organized by Function** - Routes grouped by business domain
4. **Easy Maintenance** - Clear separation of concerns
5. **S3 Integration** - Modern file upload functionality in visitor routes

## 📝 Usage

### API Endpoints
All routes are accessible under `/api/v1/` prefix:
- `GET /api/v1/visitors` - Get all visitors
- `POST /api/v1/visitors` - Create new visitor
- `POST /api/v1/visitors/:id/checkin` - Check-in visitor
- `POST /api/v1/visitors/:id/checkout` - Check-out visitor

### File Uploads (S3)
Visitor routes support S3 file uploads:
- `POST /api/v1/visitors/with-files` - Create visitor with files
- `POST /api/v1/visitors/:id/entry-photo` - Upload entry photo
- `POST /api/v1/visitors/:id/exit-photo` - Upload exit photo
- `POST /api/v1/visitors/:id/documents` - Upload documents

## 🔧 Migration Notes

- Old routes in `/legacy/` folder are **NOT** being used
- All active routes are in `/v1/` folder
- Main `index.ts` only imports v1 routes
- Authentication middleware applied to all v1 routes
- Company context required for business operations

## 📊 Route Statistics

- **Total Active Routes**: 28 v1 routes
- **Legacy Routes**: 22 (moved to legacy folder)
- **File Upload Support**: Yes (S3 integration)
- **Authentication**: Required for all v1 routes
- **API Version**: v1 (stable)

## 🎉 Result
The routes structure is now clean, organized, and ready for production use with proper S3 file upload functionality for visitors and other features.
