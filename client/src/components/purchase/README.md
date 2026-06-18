# Purchase Order Form System

This directory contains a modular, well-structured purchase order form system that has been split into reusable components for better maintainability and user experience.

## Architecture Overview

The purchase order form system is built using a modular architecture with the following components:

### Core Components

1. **PurchaseOrderForm** (`PurchaseOrderForm.tsx`)
   - Main form container and state management
   - Handles form validation and submission
   - Manages API calls for creating purchase orders and inventory items
   - Coordinates between all sub-components

2. **PurchaseOrderDetails** (`PurchaseOrderDetails.tsx`)
   - Basic purchase order information (PO number, dates, type, priority, category)
   - Company selection for super admins
   - Form validation for required fields

3. **SupplierSelection** (`SupplierSelection.tsx`)
   - Supplier selection dropdown
   - Displays selected supplier information
   - Integrates with suppliers API

4. **WarehouseSelection** (`WarehouseSelection.tsx`)
   - Warehouse selection dropdown
   - Displays selected warehouse information
   - Integrates with warehouses API

5. **ItemsSection** (`ItemsSection.tsx`)
   - Dynamic item management (add/remove items)
   - Support for both new and existing inventory items
   - Real-time calculations for discounts, taxes, and totals
   - Stock information display for existing items

6. **ChargesSection** (`ChargesSection.tsx`)
   - Additional charges (freight, packing, other charges)
   - Simple number inputs with validation

7. **PaymentTermsSection** (`PaymentTermsSection.tsx`)
   - Payment terms configuration
   - Payment days and advance percentage settings

8. **NotesSection** (`NotesSection.tsx`)
   - Terms and conditions
   - Additional notes and special instructions

9. **OrderSummary** (`OrderSummary.tsx`)
   - Real-time order total calculations
   - Breakdown of subtotal, discounts, taxes, and charges
   - Grand total display

10. **InventoryImpactSummary** (`InventoryImpactSummary.tsx`)
    - Shows impact on inventory system
    - Displays what will be created/updated

## Usage

### As a Modal
```tsx
import { CreatePurchaseOrderModalV2 } from '@/components/purchase/CreatePurchaseOrderModalV2'

<CreatePurchaseOrderModalV2 
  onSuccess={handleSuccess} 
  open={showModal}
  onOpenChange={setShowModal}
/>
```

### As a Standalone Page
```tsx
import { PurchaseOrderForm } from '@/components/purchase/PurchaseOrderForm'

<PurchaseOrderForm 
  onSuccess={handleSuccess}
  onCancel={handleCancel}
  isSubmitting={isSubmitting}
  setIsSubmitting={setIsSubmitting}
/>
```

### Direct URL Access
Navigate to `/purchase/create` to access the standalone creation page.

## Features

### ✅ Implemented Features

1. **Form Validation**
   - Required field validation
   - Data type validation
   - Business logic validation

2. **Dynamic Item Management**
   - Add/remove items
   - Support for new and existing inventory items
   - Real-time stock information display

3. **Calculations**
   - Automatic discount calculations
   - Tax calculations (CGST/SGST)
   - Real-time totals

4. **API Integration**
   - Suppliers API
   - Warehouses API
   - Inventory API
   - Purchase Orders API

5. **User Experience**
   - Responsive design
   - Loading states
   - Error handling
   - Success notifications

6. **Inventory Integration**
   - Automatic inventory item creation for new items
   - Stock movement tracking
   - Warehouse inventory updates

### 🔧 Technical Features

1. **Type Safety**
   - Full TypeScript support
   - Proper interface definitions
   - Type-safe form data handling

2. **State Management**
   - Centralized form state
   - Proper state updates
   - Immutable state updates

3. **Component Architecture**
   - Modular design
   - Reusable components
   - Clear separation of concerns

4. **Performance**
   - Optimized re-renders
   - Efficient state updates
   - Lazy loading where appropriate

## Form Data Structure

```typescript
interface PurchaseOrderFormData {
  // Basic Details
  poNumber: string
  poDate: string
  expectedDeliveryDate: string
  financialYear: string
  poType: 'standard' | 'blanket' | 'contract' | 'planned' | 'emergency' | 'service' | 'capital'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'raw_material' | 'finished_goods' | 'consumables' | 'services' | 'capital_goods' | 'maintenance'
  
  // Company
  selectedCompanyId: string
  
  // Supplier
  selectedSupplierId: string
  selectedSupplier: any
  
  // Warehouse
  selectedWarehouseId: string
  selectedWarehouse: any
  
  // Items
  items: Array<{
    itemId?: string
    itemCode: string
    itemName: string
    description: string
    specifications: string
    hsnCode: string
    quantity: number
    unit: string
    rate: number
    itemType?: 'new' | 'existing'
    selectedInventoryItemId?: string
    currentStock?: number
    availableStock?: number
    discount: {
      type: 'percentage' | 'amount'
      value: number
    }
    discountAmount: number
    taxableAmount: number
    taxBreakup: Array<{
      taxType: 'CGST' | 'SGST' | 'IGST' | 'CESS'
      rate: number
      amount: number
    }>
    totalTaxAmount: number
    lineTotal: number
    deliveryDate: string
    notes: string
  }>
  
  // Charges
  freightCharges: number
  packingCharges: number
  otherCharges: number
  
  // Payment Terms
  paymentTermType: 'advance' | 'net' | 'cod' | 'credit' | 'milestone'
  paymentDays: number
  advancePercentage: number
  
  // Notes
  terms: string
  notes: string
}
```

## API Endpoints Used

1. **GET /api/suppliers** - Fetch suppliers list
2. **GET /api/warehouses** - Fetch warehouses list
3. **GET /api/inventory/items** - Fetch inventory items
4. **GET /api/companies** - Fetch companies (super admin)
5. **POST /api/purchase-orders** - Create purchase order
6. **POST /api/inventory/items** - Create inventory item
7. **POST /api/inventory/stock-movements** - Create stock movement

## Styling

The components use:
- Tailwind CSS for styling
- Shadcn/ui components for consistency
- Lucide React icons
- Responsive design patterns

## Error Handling

- Form validation errors with toast notifications
- API error handling with user-friendly messages
- Loading states during API calls
- Graceful fallbacks for missing data

## Future Enhancements

1. **Advanced Features**
   - Draft saving
   - Form templates
   - Bulk item import
   - Advanced tax calculations

2. **User Experience**
   - Form wizard mode
   - Auto-save functionality
   - Offline support
   - Mobile optimization

3. **Integration**
   - PDF generation
   - Email notifications
   - Approval workflows
   - Integration with accounting systems

## Contributing

When adding new features or modifying existing ones:

1. Maintain the modular architecture
2. Add proper TypeScript types
3. Include error handling
4. Add loading states
5. Test thoroughly
6. Update this README

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons
- React Hot Toast
- RTK Query



