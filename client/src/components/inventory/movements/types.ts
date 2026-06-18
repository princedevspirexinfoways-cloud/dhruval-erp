// TypeScript interfaces for Stock Movement data

export interface StockMovement {
  _id: string
  movementNumber: string
  movementType: 'inward' | 'outward' | 'transfer' | 'adjustment' | 'adjustment_note'
  itemId?: string | {
    _id: string
    itemName: string
    itemCode: string
    category?: { primary?: string; secondary?: string; tertiary?: string }
    stock?: { unit: string; currentStock?: number; availableStock?: number }
    pricing?: { costPrice: number; sellingPrice: number }
  }
  itemName?: string
  companyItemCode?: string
  itemCode?: string
  quantity: number
  stock?: { unit: string }
  unit?: string
  fromLocation?: string | { 
    warehouseName: string
    warehouseId?: { _id: string; warehouseName: string }
    isExternal?: boolean 
  }
  toLocation?: string | { 
    warehouseName: string
    warehouseId?: { _id: string; warehouseName: string }
    isExternal?: boolean 
  }
  performedBy?: string
  createdBy?: string | { personalInfo: { firstName?: string; lastName?: string }; username?: string; _id: string }
  status?: 'completed' | 'pending' | 'cancelled'
  timestamp?: string
  movementDate?: string
  createdAt: string
  updatedAt?: string
  notes?: string
  referenceDocument?: {
    documentType?: string
    documentNumber?: string
    date?: string
  }
  approval?: {
    isRequired?: boolean
    approvalLevel?: number
    status?: string
    approvedBy?: string
    approvedAt?: string
  }
  batchDetails?: {
    serialNumbers?: string[]
  }
  qualityCheck?: {
    isRequired?: boolean
    isCompleted?: boolean
    defects?: any[]
    rejectedQuantity?: number
    qualityImages?: string[]
  }
  gatePass?: {
    securityApproval?: {
      documentsVerified?: string[]
    }
  }
  attachments?: string[]
  tags?: string[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

