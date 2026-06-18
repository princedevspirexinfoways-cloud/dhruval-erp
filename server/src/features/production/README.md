# Production Module

Complete Production Management Module with MVC Architecture

**Location**: `server/src/features/production/`

This module follows the standard features folder structure and naming conventions.

## 📁 Folder Structure

**Location**: `server/src/features/production/`

```
features/production/
├── models/              # Database Models
│   ├── ProgramDetails.ts
│   ├── BleachingProcess.ts
│   ├── AfterBleaching.ts
│   ├── BatchCenter.ts
│   └── index.ts
├── services/            # Business Logic Layer
│   ├── ProgramDetailsService.ts
│   ├── BleachingProcessService.ts
│   ├── AfterBleachingService.ts
│   ├── BatchCenterService.ts
│   └── index.ts
├── controllers/         # Request/Response Handlers
│   ├── ProgramDetailsController.ts
│   ├── BleachingProcessController.ts
│   ├── AfterBleachingController.ts
│   ├── BatchCenterController.ts
│   └── index.ts
├── routes/              # API Routes
│   ├── program-details.routes.ts
│   ├── bleaching-process.routes.ts
│   ├── after-bleaching.routes.ts
│   ├── batch-center.routes.ts
│   └── index.ts
├── index.ts             # Main Module Export
├── README.md            # Module Documentation
└── NAMING_CONVENTIONS.md # Naming Standards
```

## 🎯 Modules

### 1. Program Details
- **Model**: `ProgramDetails`
- **Service**: `ProgramDetailsService`
- **Controller**: `ProgramDetailsController`
- **Routes**: `/api/v1/production/program-details`

**Features:**
- Party Name, Order Number, Fold
- Design Mini Module (Row-wise entry)
- Auto-calculate Meter: `Bale × 600 × Fold`
- Additional Program Details (Finish Width, Total Bale, Yards, etc.)

### 2. Bleaching Process
- **Model**: `BleachingProcess`
- **Service**: `BleachingProcessService`
- **Controller**: `BleachingProcessController`
- **Routes**: `/api/v1/production/bleaching`

**Features:**
- Bleaching Entry Form
- Mercerise Sub-Module (Degree, Width)
- Dashboard with "Complete Process" button
- Challan Generation (6" × 4")
- Auto-updates After Bleaching Stock

### 3. After Bleaching
- **Model**: `AfterBleaching`
- **Service**: `AfterBleachingService`
- **Controller**: `AfterBleachingController`
- **Routes**: `/api/v1/production/after-bleaching`

**Features:**
- Stock Management
- Send to Printing
- Longation (Shrinkage/Extra Meter) Handling
- Automatic stock updates from Bleaching Process

### 4. Batch Center
- **Model**: `BatchCenter`
- **Service**: `BatchCenterService`
- **Controller**: `BatchCenterController`
- **Routes**: `/api/v1/production/batch-center`

**Features:**
- Batch Entry Form
- Auto-fill Party Name from Lot Number
- Auto-calculate Pending Meter: `Total - Received`
- Status Management (Pending, Partial, Completed)

## 🔄 Workflow

```
Program Details → Bleaching Process → After Bleaching → Printing → Longation Stock
                                    ↓
                              Batch Center
```

## 📝 Usage

### Import Models
```typescript
import { ProgramDetails, BleachingProcess, AfterBleaching, BatchCenter } from '../features/production/models';
```

### Import Services
```typescript
import { ProgramDetailsService, BleachingProcessService } from '../features/production/services';
```

### Import Controllers
```typescript
import { ProgramDetailsController, BleachingProcessController } from '../features/production/controllers';
```

### Import Routes
```typescript
import { programDetailsRoutes, bleachingProcessRoutes } from '../features/production/routes';
```

## 🚀 API Endpoints

### Program Details
- `POST /api/v1/production/program-details` - Create
- `GET /api/v1/production/program-details` - Get all
- `GET /api/v1/production/program-details/:id` - Get by ID
- `GET /api/v1/production/program-details/order/:orderNumber` - Get by order number
- `PUT /api/v1/production/program-details/:id` - Update
- `DELETE /api/v1/production/program-details/:id` - Delete

### Bleaching Process
- `POST /api/v1/production/bleaching` - Create
- `GET /api/v1/production/bleaching/dashboard` - Get dashboard
- `POST /api/v1/production/bleaching/:id/complete` - Complete process
- `GET /api/v1/production/bleaching/:id/challan` - Generate challan
- `GET /api/v1/production/bleaching/:id` - Get by ID
- `PUT /api/v1/production/bleaching/:id` - Update

### After Bleaching
- `GET /api/v1/production/after-bleaching` - Get all stocks
- `GET /api/v1/production/after-bleaching/longation` - Get longation stock
- `POST /api/v1/production/after-bleaching/:id/send-to-printing` - Send to printing
- `GET /api/v1/production/after-bleaching/:id` - Get by ID

### Batch Center
- `POST /api/v1/production/batch-center` - Create
- `GET /api/v1/production/batch-center` - Get all
- `GET /api/v1/production/batch-center/lot/:lotNumber/party` - Get party by lot
- `PUT /api/v1/production/batch-center/:id/received-meter` - Update received meter
- `GET /api/v1/production/batch-center/:id` - Get by ID
- `PUT /api/v1/production/batch-center/:id` - Update

## ✨ Features

- ✅ Complete MVC Architecture
- ✅ Auto-calculations (Meter, Pending Meter, Longation)
- ✅ Workflow Integration
- ✅ Stock Management
- ✅ Status Tracking
- ✅ Audit Trail (createdBy, updatedBy, timestamps)
- ✅ Company-based Multi-tenancy
- ✅ TypeScript Support
- ✅ Error Handling
- ✅ Logging

## 📦 Dependencies

- `mongoose` - MongoDB ODM
- `express` - Web framework
- `BaseService` - Base service class
- `BaseController` - Base controller class

## 🔐 Authentication

All routes require authentication middleware. Use `authenticate` from `../../middleware/auth`.

## 📊 Database Collections

- `program_details`
- `bleaching_processes`
- `after_bleaching_stocks`
- `batch_centers`

