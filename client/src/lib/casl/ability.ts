import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { User } from '../features/auth/authSlice'

// Define all possible actions
export type Actions = 
  | 'manage' // wildcard for any action
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'archive'

// Define all possible subjects (resources) - All 24 ERP Modules
export type Subjects =
  | 'all' // wildcard for any subject
  | 'Dashboard'

  // Core Business Models
  | 'Company'
  | 'User'
  | 'Role'
  | 'Customer'
  | 'Supplier'
  | 'InventoryItem'
  | 'StockMovement'
  | 'Warehouse'
  | 'ProductionOrder'
  | 'CustomerOrder'
  | 'PurchaseOrder'
  | 'Invoice'
  | 'Quotation'
  | 'FinancialTransaction'

  // Human Resources Models
  | 'Manpower'
  | 'Attendance'
  | 'Employee'
  | 'Shift'
  | 'Batch'

  // Sticker & Label Models
  | 'Sticker'

  // Security & Management Models
  | 'Visitor'
  | 'Vehicle'
  | 'SecurityLog'
  | 'AuditLog'

  // Advanced Operational Models
  | 'BusinessAnalytics'
  | 'BoilerMonitoring'
  | 'ElectricityMonitoring'
  | 'Hospitality'
  | 'Dispatch'
  | 'Report'

  // Additional
  | 'Permission'
  | 'Settings'

export type AppAbility = MongoAbility<[Actions, Subjects]>

// Default permissions for different roles
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rolePermissions = {
  'super_admin': [
    { action: 'manage' as Actions, subject: 'all' as Subjects }
  ],
  'admin': [
    { action: 'manage' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'manage' as Actions, subject: 'Company' as Subjects },
    { action: 'manage' as Actions, subject: 'User' as Subjects },
    { action: 'read' as Actions, subject: 'Role' as Subjects },
    { action: 'manage' as Actions, subject: 'Customer' as Subjects },
    { action: 'manage' as Actions, subject: 'Supplier' as Subjects },
    { action: 'manage' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'manage' as Actions, subject: 'Warehouse' as Subjects },
    { action: 'manage' as Actions, subject: 'StockMovement' as Subjects },
    { action: 'manage' as Actions, subject: 'ProductionOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'CustomerOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'Invoice' as Subjects },
    { action: 'read' as Actions, subject: 'Report' as Subjects },
    { action: 'read' as Actions, subject: 'Settings' as Subjects },
    { action: 'manage' as Actions, subject: 'Manpower' as Subjects },
    { action: 'manage' as Actions, subject: 'Attendance' as Subjects },
    { action: 'manage' as Actions, subject: 'Sticker' as Subjects },
    { action: 'manage' as Actions, subject: 'Employee' as Subjects },
    { action: 'manage' as Actions, subject: 'Shift' as Subjects },
    { action: 'manage' as Actions, subject: 'Batch' as Subjects },
  ],
  'manager': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'Company' as Subjects },
    { action: 'read' as Actions, subject: 'User' as Subjects },
    { action: 'manage' as Actions, subject: 'Customer' as Subjects },
    { action: 'manage' as Actions, subject: 'Supplier' as Subjects },
    { action: 'manage' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'manage' as Actions, subject: 'Warehouse' as Subjects },
    { action: 'manage' as Actions, subject: 'StockMovement' as Subjects },
    { action: 'manage' as Actions, subject: 'ProductionOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'CustomerOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'Invoice' as Subjects },
    { action: 'read' as Actions, subject: 'Report' as Subjects },
    { action: 'read' as Actions, subject: 'Manpower' as Subjects },
    { action: 'read' as Actions, subject: 'Attendance' as Subjects },
    { action: 'read' as Actions, subject: 'Sticker' as Subjects },
    { action: 'read' as Actions, subject: 'Employee' as Subjects },
    { action: 'read' as Actions, subject: 'Shift' as Subjects },
    { action: 'read' as Actions, subject: 'Batch' as Subjects },
  ],
  'sales': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'Customer' as Subjects },
    { action: 'create' as Actions, subject: 'Customer' as Subjects },
    { action: 'update' as Actions, subject: 'Customer' as Subjects },
    { action: 'read' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'manage' as Actions, subject: 'CustomerOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'Invoice' as Subjects },
    { action: 'read' as Actions, subject: 'Report' as Subjects },
  ],
  'production': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'read' as Actions, subject: 'Warehouse' as Subjects },
    { action: 'manage' as Actions, subject: 'StockMovement' as Subjects },
    { action: 'manage' as Actions, subject: 'ProductionOrder' as Subjects },
    { action: 'read' as Actions, subject: 'CustomerOrder' as Subjects },
  ],
  'warehouse': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'manage' as Actions, subject: 'Warehouse' as Subjects },
    { action: 'manage' as Actions, subject: 'StockMovement' as Subjects },
    { action: 'read' as Actions, subject: 'ProductionOrder' as Subjects },
    { action: 'read' as Actions, subject: 'CustomerOrder' as Subjects },
  ],
  'hr': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'manage' as Actions, subject: 'Manpower' as Subjects },
    { action: 'manage' as Actions, subject: 'Attendance' as Subjects },
    { action: 'manage' as Actions, subject: 'Employee' as Subjects },
    { action: 'manage' as Actions, subject: 'Shift' as Subjects },
    { action: 'read' as Actions, subject: 'Report' as Subjects },
  ],
  'employee': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'Manpower' as Subjects },
    { action: 'update' as Actions, subject: 'Attendance' as Subjects },
    { action: 'read' as Actions, subject: 'Attendance' as Subjects },
  ],
  'accountant': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'Customer' as Subjects },
    { action: 'read' as Actions, subject: 'Supplier' as Subjects },
    { action: 'manage' as Actions, subject: 'Invoice' as Subjects },
    { action: 'read' as Actions, subject: 'CustomerOrder' as Subjects },
    { action: 'manage' as Actions, subject: 'Report' as Subjects },
  ],
  'viewer': [
    { action: 'read' as Actions, subject: 'Dashboard' as Subjects },
    { action: 'read' as Actions, subject: 'Customer' as Subjects },
    { action: 'read' as Actions, subject: 'InventoryItem' as Subjects },
    { action: 'read' as Actions, subject: 'CustomerOrder' as Subjects },
    { action: 'read' as Actions, subject: 'Invoice' as Subjects },
    { action: 'read' as Actions, subject: 'Report' as Subjects },
  ],
}

export function defineAbilityFor(
  user: User | null,
  permissions: { [module: string]: string[] } = {}
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (!user) {
    // No permissions for unauthenticated users
    return build()
  }

  // Super admin has all permissions
  if (user.isSuperAdmin) {
    can('manage', 'all')
    return build()
  }

  // Add permissions from the permissions object (from server)
  Object.entries(permissions).forEach(([module, actions]) => {
    actions.forEach(action => {
      // Map module names to subjects
      const subject = mapModuleToSubject(module)
      if (subject) {
        can(action as Actions, subject as Subjects)
      }
    })
  })

  // User can always manage their own profile
  can('update', 'User')

  // Additional role-based permissions can be added here if needed

  return build()
}

// Helper function to map module names to CASL subjects
function mapModuleToSubject(module: string): Subjects | null {
  const moduleMap: { [key: string]: Subjects } = {
    'system': 'all',
    'dashboard': 'Dashboard',
    'company': 'Company',
    'users': 'User',
    'roles': 'Role',
    'customers': 'Customer',
    'suppliers': 'Supplier',
    'inventory': 'InventoryItem',
    'stockMovements': 'StockMovement',
    'warehouses': 'Warehouse',
    'production': 'ProductionOrder',
    'sales': 'CustomerOrder',
    'purchase': 'PurchaseOrder',
    'invoices': 'Invoice',
    'quotations': 'Quotation',
    'financial': 'FinancialTransaction',
    'visitors': 'Visitor',
    'vehicles': 'Vehicle',
    'security': 'SecurityLog',
    'audit': 'AuditLog',
    'analytics': 'BusinessAnalytics',
    'boiler': 'BoilerMonitoring',
    'electricity': 'ElectricityMonitoring',
    'hospitality': 'Hospitality',
    'dispatch': 'Dispatch',
    'reports': 'Report',
    'settings': 'Settings',
  }

  return moduleMap[module.toLowerCase()] || null
}

// Create a default ability instance
export const ability = createMongoAbility<[Actions, Subjects]>()
