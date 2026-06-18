import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Database Indexing Configuration for Performance Optimization
 * This file contains all the indexes needed for optimal query performance
 */

export interface IndexConfig {
  collection: string;
  indexes: Array<{
    fields: Record<string, 1 | -1 | 'text'>;
    options?: {
      unique?: boolean;
      sparse?: boolean;
      background?: boolean;
      name?: string;
      partialFilterExpression?: any;
    };
    description: string;
  }>;
}

export const DATABASE_INDEXES: IndexConfig[] = [
  // Company Indexes
  {
    collection: 'companies',
    indexes: [
      {
        fields: { companyCode: 1 },
        options: { unique: true },
        description: 'Unique company code lookup'
      },

      {
        fields: { isActive: 1, createdAt: -1 },
        description: 'Active companies with recent first'
      }
    ]
  },

  // User Indexes
  {
    collection: 'users',
    indexes: [
      {
        fields: { email: 1 },
        options: { unique: true },
        description: 'Unique email lookup for authentication'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Company users lookup'
      },
      {
        fields: { companyId: 1, role: 1 },
        description: 'Users by company and role'
      },
      {
        fields: { employeeId: 1, companyId: 1 },
        options: { unique: true },
        description: 'Unique employee ID per company'
      },
      {
        fields: { lastLoginAt: -1 },
        description: 'Recent login tracking'
      }
    ]
  },

  // Customer Indexes
  {
    collection: 'customers',
    indexes: [
      {
        fields: { companyId: 1, customerCode: 1 },
        options: { unique: true },
        description: 'Unique customer code per company'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active customers by company'
      },
      {
        fields: { companyId: 1, 'contactInfo.email': 1 },
        description: 'Customer email lookup'
      },
      {
        fields: { companyId: 1, 'contactInfo.phone': 1 },
        description: 'Customer phone lookup'
      },
      {
        fields: { companyId: 1, 'financialInfo.creditLimit': -1 },
        description: 'Customers by credit limit'
      },
      {
        fields: { companyId: 1, 'financialInfo.outstandingAmount': -1 },
        description: 'Customers by outstanding amount'
      }
    ]
  },

  // Supplier Indexes
  {
    collection: 'suppliers',
    indexes: [
      {
        fields: { companyId: 1, supplierCode: 1 },
        options: { unique: true },
        description: 'Unique supplier code per company'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active suppliers by company'
      },
      {
        fields: { companyId: 1, category: 1 },
        description: 'Suppliers by category'
      },
      {
        fields: { companyId: 1, 'performanceMetrics.overallRating': -1 },
        description: 'Suppliers by rating'
      }
    ]
  },

  // Inventory Item Indexes
  {
    collection: 'inventory_items',
    indexes: [
      {
        fields: { companyId: 1, itemCode: 1 },
        options: { unique: true },
        description: 'Unique item code per company'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active items by company'
      },
      {
        fields: { companyId: 1, category: 1 },
        description: 'Items by category'
      },
      {
        fields: { companyId: 1, currentStock: 1 },
        description: 'Items by stock level'
      },
      {
        fields: { companyId: 1, reorderLevel: 1, currentStock: 1 },
        description: 'Low stock items detection'
      },
      {
        fields: { companyId: 1, unitPrice: -1 },
        description: 'Items by price'
      },
      {
        fields: { itemName: 'text', description: 'text' },
        options: { name: 'item_text_search' },
        description: 'Text search on item name and description'
      }
    ]
  },

  // Stock Movement Indexes
  {
    collection: 'stock_movements',
    indexes: [
      {
        fields: { companyId: 1, movementDate: -1 },
        description: 'Recent stock movements by company'
      },
      {
        fields: { companyId: 1, itemId: 1, movementDate: -1 },
        description: 'Item movement history'
      },
      {
        fields: { companyId: 1, movementType: 1, movementDate: -1 },
        description: 'Movements by type'
      },
      {
        fields: { companyId: 1, warehouseId: 1, movementDate: -1 },
        description: 'Warehouse movements'
      },
      {
        fields: { companyId: 1, referenceType: 1, referenceId: 1 },
        description: 'Movements by reference'
      }
    ]
  },

  // Production Order Indexes
  {
    collection: 'production_orders',
    indexes: [
      {
        fields: { companyId: 1, productionOrderNumber: 1 },
        options: { unique: true },
        description: 'Unique production order number'
      },
      {
        fields: { companyId: 1, status: 1, startDate: -1 },
        description: 'Production orders by status and date'
      },
      {
        fields: { companyId: 1, itemId: 1, startDate: -1 },
        description: 'Production orders by item'
      },
      {
        fields: { companyId: 1, priority: 1, startDate: 1 },
        description: 'Production orders by priority'
      },
      {
        fields: { companyId: 1, endDate: 1 },
        description: 'Production orders by end date'
      }
    ]
  },

  // Customer Order Indexes
  {
    collection: 'customer_orders',
    indexes: [
      {
        fields: { companyId: 1, orderNumber: 1 },
        options: { unique: true },
        description: 'Unique order number'
      },
      {
        fields: { companyId: 1, customerId: 1, orderDate: -1 },
        description: 'Customer order history'
      },
      {
        fields: { companyId: 1, status: 1, orderDate: -1 },
        description: 'Orders by status'
      },
      {
        fields: { companyId: 1, deliveryDate: 1 },
        description: 'Orders by delivery date'
      },
      {
        fields: { companyId: 1, totalAmount: -1 },
        description: 'Orders by value'
      }
    ]
  },

  // Invoice Indexes
  {
    collection: 'invoices',
    indexes: [
      {
        fields: { companyId: 1, invoiceNumber: 1 },
        options: { unique: true },
        description: 'Unique invoice number'
      },
      {
        fields: { companyId: 1, customerId: 1, invoiceDate: -1 },
        description: 'Customer invoice history'
      },
      {
        fields: { companyId: 1, status: 1, invoiceDate: -1 },
        description: 'Invoices by status'
      },
      {
        fields: { companyId: 1, dueDate: 1 },
        description: 'Invoices by due date'
      },
      {
        fields: { companyId: 1, totalAmount: -1 },
        description: 'Invoices by amount'
      },
      {
        fields: { companyId: 1, paymentStatus: 1, dueDate: 1 },
        description: 'Payment tracking'
      }
    ]
  },

  // Purchase Order Indexes
  {
    collection: 'purchase_orders',
    indexes: [
      {
        fields: { companyId: 1, purchaseOrderNumber: 1 },
        options: { unique: true },
        description: 'Unique purchase order number'
      },
      {
        fields: { companyId: 1, supplierId: 1, orderDate: -1 },
        description: 'Supplier order history'
      },
      {
        fields: { companyId: 1, status: 1, orderDate: -1 },
        description: 'Purchase orders by status'
      },
      {
        fields: { companyId: 1, expectedDeliveryDate: 1 },
        description: 'Purchase orders by delivery date'
      },
      {
        fields: { companyId: 1, grandTotal: -1 },
        description: 'Purchase orders by value'
      }
    ]
  },

  // Quotation Indexes
  {
    collection: 'quotations',
    indexes: [
      {
        fields: { companyId: 1, quotationNumber: 1 },
        options: { unique: true },
        description: 'Unique quotation number'
      },
      {
        fields: { companyId: 1, customerId: 1, quotationDate: -1 },
        description: 'Customer quotation history'
      },
      {
        fields: { companyId: 1, status: 1, quotationDate: -1 },
        description: 'Quotations by status'
      },
      {
        fields: { companyId: 1, validUntil: 1 },
        description: 'Quotations by validity'
      }
    ]
  },

  // Warehouse Indexes
  {
    collection: 'warehouses',
    indexes: [
      {
        fields: { companyId: 1, warehouseCode: 1 },
        options: { unique: true },
        description: 'Unique warehouse code'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active warehouses'
      },
      {
        fields: { companyId: 1, warehouseType: 1 },
        description: 'Warehouses by type'
      }
    ]
  },

  // Vehicle Indexes
  {
    collection: 'vehicles',
    indexes: [
      {
        fields: { companyId: 1, vehicleNumber: 1 },
        options: { unique: true },
        description: 'Unique vehicle number'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active vehicles'
      },
      {
        fields: { companyId: 1, vehicleType: 1 },
        description: 'Vehicles by type'
      },
      {
        fields: { companyId: 1, 'maintenance.nextServiceDate': 1 },
        description: 'Vehicles by service date'
      }
    ]
  },

  // Visitor Indexes
  {
    collection: 'visitors',
    indexes: [
      {
        fields: { companyId: 1, visitDate: -1 },
        description: 'Recent visitors by company'
      },
      {
        fields: { companyId: 1, currentStatus: 1, visitDate: -1 },
        description: 'Visitors by status'
      },
      {
        fields: { companyId: 1, approvalStatus: 1 },
        description: 'Visitors by approval status'
      },
      {
        fields: { companyId: 1, 'contactInfo.phone': 1 },
        description: 'Visitor phone lookup'
      },
      {
        fields: { companyId: 1, 'hostInfo.hostEmployeeId': 1, visitDate: -1 },
        description: 'Visitors by host'
      }
    ]
  },

  // Role Indexes
  {
    collection: 'roles',
    indexes: [
      {
        fields: { companyId: 1, roleName: 1 },
        options: { unique: true },
        description: 'Unique role name per company'
      },
      {
        fields: { companyId: 1, isActive: 1 },
        description: 'Active roles'
      }
    ]
  },

  // Financial Transaction Indexes
  {
    collection: 'financial_transactions',
    indexes: [
      {
        fields: { companyId: 1, transactionDate: -1 },
        description: 'Recent transactions by company'
      },
      {
        fields: { companyId: 1, transactionType: 1, transactionDate: -1 },
        description: 'Transactions by type'
      },
      {
        fields: { companyId: 1, status: 1, transactionDate: -1 },
        description: 'Transactions by status'
      },
      {
        fields: { companyId: 1, amount: -1 },
        description: 'Transactions by amount'
      },
      {
        fields: { companyId: 1, referenceType: 1, referenceId: 1 },
        description: 'Transactions by reference'
      }
    ]
  },

  // Audit Log Indexes
  {
    collection: 'audit_logs',
    indexes: [
      {
        fields: { companyId: 1, timestamp: -1 },
        description: 'Recent audit logs by company'
      },
      {
        fields: { companyId: 1, action: 1, timestamp: -1 },
        description: 'Audit logs by action'
      },
      {
        fields: { companyId: 1, userId: 1, timestamp: -1 },
        description: 'Audit logs by user'
      },
      {
        fields: { companyId: 1, resourceType: 1, timestamp: -1 },
        description: 'Audit logs by resource type'
      }
    ]
  },

  // Security Log Indexes
  {
    collection: 'security_logs',
    indexes: [
      {
        fields: { companyId: 1, eventDateTime: -1 },
        description: 'Recent security events'
      },
      {
        fields: { companyId: 1, eventType: 1, eventDateTime: -1 },
        description: 'Security events by type'
      },
      {
        fields: { companyId: 1, priority: 1, eventDateTime: -1 },
        description: 'Security events by priority'
      }
    ]
  },

  // Business Analytics Indexes
  {
    collection: 'business_analytics',
    indexes: [
      {
        fields: { companyId: 1, analyticsId: 1 },
        options: { unique: true },
        description: 'Unique analytics ID'
      },
      {
        fields: { companyId: 1, createdAt: -1 },
        description: 'Recent analytics by company'
      }
    ]
  },

  // Boiler Monitoring Indexes
  {
    collection: 'boiler_monitorings',
    indexes: [
      {
        fields: { companyId: 1, boilerId: 1 },
        options: { unique: true },
        description: 'Unique boiler ID per company'
      },
      {
        fields: { companyId: 1, 'currentStatus.operationalStatus': 1 },
        description: 'Boilers by operational status'
      },
      {
        fields: { companyId: 1, createdAt: -1 },
        description: 'Recent boiler data'
      }
    ]
  },

  // Electricity Monitoring Indexes
  {
    collection: 'electricity_monitorings',
    indexes: [
      {
        fields: { companyId: 1, monitoringId: 1 },
        options: { unique: true },
        description: 'Unique monitoring ID per company'
      },
      {
        fields: { companyId: 1, 'currentStatus.operationalStatus': 1 },
        description: 'Monitoring systems by status'
      },
      {
        fields: { companyId: 1, createdAt: -1 },
        description: 'Recent electricity data'
      }
    ]
  },

  // Hospitality Indexes
  {
    collection: 'hospitalities',
    indexes: [
      {
        fields: { companyId: 1, facilityId: 1 },
        options: { unique: true },
        description: 'Unique facility ID per company'
      },
      {
        fields: { companyId: 1, facilityType: 1 },
        description: 'Facilities by type'
      },
      {
        fields: { companyId: 1, createdAt: -1 },
        description: 'Recent hospitality data'
      }
    ]
  },

  // Dispatch Indexes
  {
    collection: 'dispatches',
    indexes: [
      {
        fields: { companyId: 1, dispatchNumber: 1 },
        options: { unique: true },
        description: 'Unique dispatch number'
      },
      {
        fields: { companyId: 1, dispatchDate: -1 },
        description: 'Recent dispatches'
      },
      {
        fields: { companyId: 1, dispatchType: 1, dispatchDate: -1 },
        description: 'Dispatches by type'
      },
      {
        fields: { companyId: 1, priority: 1, dispatchDate: -1 },
        description: 'Dispatches by priority'
      }
    ]
  },

  // Report Indexes
  {
    collection: 'reports',
    indexes: [
      {
        fields: { companyId: 1, reportId: 1 },
        options: { unique: true },
        description: 'Unique report ID'
      },
      {
        fields: { companyId: 1, category: 1, createdAt: -1 },
        description: 'Reports by category'
      },
      {
        fields: { companyId: 1, reportType: 1, createdAt: -1 },
        description: 'Reports by type'
      }
    ]
  }
];

/**
 * Create all database indexes
 */
export async function createDatabaseIndexes(): Promise<void> {
  try {
    let totalIndexes = 0;
    let createdIndexes = 0;
    let existingIndexes = 0;
    let errorCount = 0;

    for (const config of DATABASE_INDEXES) {
      const collection = mongoose.connection.collection(config.collection);

      for (const indexConfig of config.indexes) {
        totalIndexes++;
        try {
          await collection.createIndex(indexConfig.fields, indexConfig.options || {});
          createdIndexes++;
        } catch (error: any) {
          if (error.code === 11000 || error.codeName === 'IndexOptionsConflict' || error.code === 86) {
            existingIndexes++;
            // Silently skip existing indexes - this is normal
          } else {
            errorCount++;
            logger.error(`❌ Failed to create index for ${config.collection}: ${indexConfig.description}`, error);
          }
        }
      }
    }

    // Summary log
    logger.info(`📊 Database indexes summary: ${totalIndexes} total, ${createdIndexes} created, ${existingIndexes} existing, ${errorCount} errors`);
  } catch (error) {
    logger.error('❌ Error creating database indexes:', error);
    throw error;
  }
}

/**
 * Drop all indexes (for development/testing)
 */
export async function dropAllIndexes(): Promise<void> {
  try {
    logger.info('Dropping all custom indexes...');
    
    for (const config of DATABASE_INDEXES) {
      const collection = mongoose.connection.collection(config.collection);
      
      try {
        const indexes = await collection.listIndexes().toArray();
        for (const index of indexes) {
          if (index.name !== '_id_') {
            await collection.dropIndex(index.name);
            logger.info(`Dropped index ${index.name} from ${config.collection}`);
          }
        }
      } catch (error) {
        logger.warn(`Failed to drop indexes for ${config.collection}:`, error);
      }
    }
    
    logger.info('Index dropping completed');
  } catch (error) {
    logger.error('Error dropping indexes:', error);
    throw error;
  }
}
