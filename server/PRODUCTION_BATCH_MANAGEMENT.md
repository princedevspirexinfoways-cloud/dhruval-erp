# Production Batch Management System

## Overview

This system manages the complete production flow from grey fabric inward to finished goods dispatch, with proper inventory tracking and material consumption management.

## Production Flow

```
Grey Fabric Inward (GRN) → Raw Material Inventory → Working Inventory → Production Stages → Finished Goods
```

## Production Stages

The system supports 8 standardized production stages:

1. **Pre-Processing (Desizing/Bleaching)** - `pre_processing`
2. **Dyeing Process** - `dyeing`
3. **Printing Process** - `printing`
4. **Washing Process** - `washing`
5. **Color Fixing** - `fixing`
6. **Finishing (Stenter, Coating)** - `finishing`
7. **Quality Control (Pass/Hold/Reject)** - `quality_control`
8. **Cutting & Packing (Labels & Cartons)** - `cutting_packing`

## Key Features

### ✅ Implemented Features

1. **Production Batch Creation**
   - Automatic batch number generation
   - Material input planning and reservation
   - 8-stage production workflow initialization

2. **Material Consumption Management**
   - Real-time inventory updates during consumption
   - Waste and return tracking
   - Automatic stock deduction from source inventory

3. **Working Inventory System**
   - Transfer raw materials to working inventory for production
   - Track materials through production stages
   - Convert working inventory to finished goods

4. **Stage Output Management**
   - Create inventory items for semi-finished and finished goods
   - Quality grade tracking (A+, A, B+, B, C, Reject)
   - Defect and quality parameter recording

5. **Inventory Category Management**
   - Support for `working_inventory` category
   - Material category transfers
   - Production info tracking for traceability

## API Endpoints

### Production Batch Management

```http
POST /api/v1/batches
GET /api/v1/batches
GET /api/v1/batches/:id
PATCH /api/v1/batches/:id
DELETE /api/v1/batches/:id
```

### Stage Management

```http
PATCH /api/v1/batches/:batchId/stages/:stageNumber/status
POST /api/v1/batches/:batchId/stages/:stageNumber/consume-materials
POST /api/v1/batches/:batchId/stages/:stageNumber/add-output
```

### Working Inventory

```http
POST /api/v1/batches/:batchId/transfer-to-working-inventory
```

### Material Category Transfer

```http
POST /api/v1/batches/materials/:itemId/transfer-category
```

## Usage Examples

### 1. Create Production Batch

```javascript
const batchData = {
  companyId: "company_id",
  productionOrderId: "PO-2024-001",
  customerOrderId: "CO-2024-001",
  productSpecifications: {
    fabricType: "Cotton",
    gsm: 120,
    width: 44,
    color: "Blue"
  },
  plannedQuantity: 1000,
  unit: "meters",
  plannedStartDate: "2024-01-15",
  plannedEndDate: "2024-01-22",
  materialInputs: [
    {
      itemId: "grey_fabric_item_id",
      quantity: 1000,
      unit: "meters",
      unitCost: 50,
      totalCost: 50000
    }
  ],
  reserveMaterials: true
};
```

### 2. Transfer to Working Inventory

```javascript
const transferData = {
  materialInputs: [
    {
      itemId: "raw_material_item_id",
      quantity: 1000,
      unit: "meters"
    }
  ]
};
```

### 3. Consume Materials for Stage

```javascript
const consumptionData = {
  materials: [
    {
      itemId: "working_inventory_item_id",
      plannedQuantity: 1000,
      actualQuantity: 980,
      wasteQuantity: 20,
      returnedQuantity: 0,
      unit: "meters",
      notes: "Normal processing waste"
    }
  ]
};
```

### 4. Add Stage Output

```javascript
const outputData = {
  outputs: [
    {
      itemName: "Dyed Cotton Fabric",
      category: {
        primary: "semi_finished",
        secondary: "dyed_fabric",
        tertiary: "cotton"
      },
      quantity: 980,
      unit: "meters",
      qualityGrade: "A",
      defects: [],
      notes: "Dyeing completed successfully"
    }
  ]
};
```

## Services

### MaterialConsumptionService

Handles material consumption, waste tracking, and stage output management.

**Key Methods:**
- `reserveMaterialsForBatch()` - Reserve materials for production
- `consumeMaterialsForStage()` - Record material consumption
- `recordStageOutput()` - Create inventory items for stage outputs
- `transferMaterialCategory()` - Transfer between inventory categories

### WorkingInventoryService

Manages the working inventory system for production tracking.

**Key Methods:**
- `transferToWorkingInventory()` - Move raw materials to working inventory
- `transferToFinishedGoods()` - Convert working inventory to finished goods
- `getWorkingInventoryForBatch()` - Get working inventory items for a batch
- `getWorkingInventoryStats()` - Get working inventory statistics

## Database Schema Updates

### InventoryItem Model

Added support for:
- `working_inventory` category
- `productionInfo` field for production tracking
- Enhanced quality tracking

### ProductionBatch Model

Updated with:
- 8 standardized production stages
- Enhanced material input/output tracking
- Working inventory references

## Testing

Run the test script to verify the complete production flow:

```bash
node server/test-production-flow.js
```

## Next Steps

1. **Quality Control Integration**
   - Implement quality gate validations
   - Add quality check workflows

2. **Cost Tracking**
   - Track production costs per stage
   - Calculate total batch costs

3. **Reporting & Analytics**
   - Production efficiency reports
   - Material utilization analytics
   - Quality metrics dashboard

4. **Notifications**
   - Stage completion alerts
   - Quality issue notifications
   - Low stock warnings

## System Status

✅ **PRODUCTION READY** - The core production batch management system is complete and ready for use.

The system correctly handles:
- Grey fabric inward → Raw material inventory
- Raw material → Working inventory transfer
- Production stage management with material consumption
- Stage output creation as inventory items
- Complete traceability through production info tracking
