# Production Module - Naming Conventions

## 📋 Overview
This document defines the naming conventions used in the Production Module to ensure consistency and maintainability.

## 🗂️ Folder Structure

```
features/production/
├── models/              # Database Models (Mongoose Schemas)
├── services/            # Business Logic Layer
├── controllers/         # Request/Response Handlers
├── routes/              # API Route Definitions
├── types/               # TypeScript Type Definitions (if needed)
├── utils/               # Utility Functions (if needed)
├── index.ts             # Main Module Export
├── README.md            # Module Documentation
└── NAMING_CONVENTIONS.md # This file
```

## 📝 File Naming Conventions

### Models
- **Pattern**: `PascalCase.ts`
- **Example**: `ProgramDetails.ts`, `BleachingProcess.ts`
- **Interface**: `I` prefix for interfaces
- **Example**: `IProgramDetails`, `IBleachingProcess`

### Services
- **Pattern**: `PascalCaseService.ts`
- **Example**: `ProgramDetailsService.ts`, `BleachingProcessService.ts`
- **Class**: Same as filename without `.ts`
- **Example**: `ProgramDetailsService`, `BleachingProcessService`

### Controllers
- **Pattern**: `PascalCaseController.ts`
- **Example**: `ProgramDetailsController.ts`, `BleachingProcessController.ts`
- **Class**: Same as filename without `.ts`
- **Example**: `ProgramDetailsController`, `BleachingProcessController`

### Routes
- **Pattern**: `kebab-case.routes.ts`
- **Example**: `program-details.routes.ts`, `bleaching-process.routes.ts`
- **Export**: `camelCaseRoutes`
- **Example**: `programDetailsRoutes`, `bleachingProcessRoutes`

## 🏷️ Variable Naming

### Variables & Functions
- **Pattern**: `camelCase`
- **Example**: `programDetails`, `createProgramDetails()`, `getByOrderNumber()`

### Constants
- **Pattern**: `UPPER_SNAKE_CASE`
- **Example**: `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`

### Classes
- **Pattern**: `PascalCase`
- **Example**: `ProgramDetailsService`, `BleachingProcessController`

### Interfaces/Types
- **Pattern**: `PascalCase` with `I` prefix for interfaces
- **Example**: `IProgramDetails`, `IBleachingProcess`, `IBatchCenter`

## 📦 Collection Names

### Database Collections
- **Pattern**: `snake_case` (plural)
- **Example**: `program_details`, `bleaching_processes`, `after_bleaching_stocks`, `batch_centers`

## 🔗 API Route Naming

### Endpoints
- **Pattern**: `kebab-case`
- **Base Path**: `/api/v1/production/`
- **Examples**:
  - `/api/v1/production/program-details`
  - `/api/v1/production/bleaching`
  - `/api/v1/production/after-bleaching`
  - `/api/v1/production/batch-center`

### Route Methods
- **GET**: Retrieve data
- **POST**: Create new resource
- **PUT**: Update entire resource
- **PATCH**: Partial update
- **DELETE**: Remove resource

## 📄 Export Conventions

### Default Exports
- **Models**: Default export the model
- **Example**: `export default model<IProgramDetails>('ProgramDetails', ProgramDetailsSchema);`

### Named Exports
- **Services**: Named export for classes
- **Controllers**: Named export for classes
- **Routes**: Named export for route objects
- **Interfaces**: Named export with `I` prefix

### Index Files
- Each folder has an `index.ts` that exports all items
- Main module has `index.ts` that exports from all subfolders

## 🎯 Module-Specific Conventions

### Production Module Naming
1. **Program Details** → `ProgramDetails` (model), `program-details` (route)
2. **Bleaching Process** → `BleachingProcess` (model), `bleaching` (route)
3. **After Bleaching** → `AfterBleaching` (model), `after-bleaching` (route)
4. **Batch Center** → `BatchCenter` (model), `batch-center` (route)

### Service Methods
- **Create**: `create{EntityName}()`
- **Get All**: `getAll{EntityName}s()` or `getBy{Filter}()`
- **Get By ID**: `get{EntityName}ById()`
- **Update**: `update{EntityName}()`
- **Delete**: `delete{EntityName}()`

### Controller Methods
- **Create**: `create()` or `create{EntityName}()`
- **Get All**: `getAll()`
- **Get By ID**: `getById()`
- **Update**: `update()`
- **Delete**: `delete()`

## 📚 Code Organization

### Import Order
1. External libraries (React, Express, Mongoose, etc.)
2. Internal utilities (BaseService, BaseController, etc.)
3. Same module imports (models, services, controllers)
4. Types/interfaces

### Example:
```typescript
import { Schema, model, Types } from 'mongoose';
import { BaseService } from '../../services/BaseService';
import ProgramDetails, { IProgramDetails } from '../models/ProgramDetails';
import { AppError } from '../../utils/errors';
```

## ✅ Best Practices

1. **Consistency**: Always follow the same naming pattern within a module
2. **Clarity**: Names should be self-documenting
3. **Abbreviations**: Avoid abbreviations unless widely understood
4. **Plurals**: Use plural for collections, singular for models
5. **Verbs**: Use action verbs for functions (create, get, update, delete)
6. **Nouns**: Use nouns for classes and models

## 🔄 Migration Notes

When moving files:
- Update all import paths
- Maintain naming consistency
- Update documentation
- Update route registrations






