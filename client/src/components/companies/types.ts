export interface Company {
  _id: string
  companyCode: string
  companyName: string
  legalName: string

  registrationDetails: {
    gstin: string
    pan: string
    cin?: string
    udyogAadhar?: string
    iecCode?: string
    registrationDate?: string
  }

  addresses: {
    registeredOffice: Address
    factoryAddress: Address
    warehouseAddresses?: WarehouseAddress[]
  }

  contactInfo: {
    phones: ContactPhone[]
    emails: ContactEmail[]
    website?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      linkedin?: string
    }
  }

  bankAccounts?: BankAccount[]

  businessConfig: {
    currency: string
    timezone: string
    fiscalYearStart: string
    workingDays: string[]
    workingHours: {
      start: string
      end: string
      breakStart: string
      breakEnd: string
    }
    gstRates: {
      defaultRate: number
      rawMaterialRate: number
      finishedGoodsRate: number
    }
  }

  productionCapabilities?: {
    productTypes: string[]
    printingMethods: string[]
    monthlyCapacity: {
      sarees?: number
      fabricMeters?: number
      customOrders?: number
    }
    qualityCertifications: string[]
  }

  licenses?: License[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string

  // Optional stats for backward compatibility
  stats?: {
    totalUsers?: number
    totalProducts?: number
    totalOrders?: number
    monthlyRevenue?: number
  }
}

export interface Address {
  street?: string
  area?: string
  city?: string
  state?: string
  pincode?: string
  country: string
  landmark?: string // For backward compatibility
}

export interface WarehouseAddress extends Address {
  warehouseName?: string
}

export interface ContactEmail {
  email: string
  type: string
  label?: string
  isPrimary?: boolean
}

export interface ContactPhone {
  number: string
  phone?: string // For backward compatibility
  type: string
  label?: string
  isPrimary?: boolean
  countryCode?: string
}

export interface License {
  licenseType: string
  licenseNumber: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  renewalRequired: boolean
  documentUrl?: string
}

export interface BankAccount {
  bankName: string
  accountNumber: string
  ifscCode: string
  accountType: 'savings' | 'current' | 'cc' | 'od'
  branchName: string
  branchAddress: string
  isPrimary: boolean
}

export interface CreateCompanyRequest {
  companyCode: string
  companyName: string
  legalName: string

  registrationDetails: {
    gstin: string
    pan: string
    cin?: string
    udyogAadhar?: string
    iecCode?: string
    registrationDate?: string
  }

  addresses: {
    registeredOffice: Address
    factoryAddress: Address
    warehouseAddresses?: WarehouseAddress[]
  }

  contactInfo: {
    phones: ContactPhone[]
    emails: ContactEmail[]
    website?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      linkedin?: string
    }
  }

  bankAccounts?: BankAccount[]

  businessConfig: {
    currency: string
    timezone: string
    fiscalYearStart: string
    workingDays: string[]
    workingHours: {
      start: string
      end: string
      breakStart: string
      breakEnd: string
    }
    gstRates: {
      defaultRate: number
      rawMaterialRate: number
      finishedGoodsRate: number
    }
  }

  productionCapabilities?: {
    productTypes: string[]
    printingMethods: string[]
    monthlyCapacity: {
      sarees?: number
      fabricMeters?: number
      customOrders?: number
    }
    qualityCertifications: string[]
  }

  licenses?: License[]
}

export interface CompanyFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  state?: string
  city?: string
  registrationDateFrom?: string
  registrationDateTo?: string
  sortBy: 'name' | 'code' | 'created' | 'updated'
  sortOrder: 'asc' | 'desc'
}

export interface CompanyStats {
  totalCompanies: number
  activeCompanies: number
  inactiveCompanies: number
  newThisMonth: number
  totalUsers: number
  totalRevenue: number
  averageOrderValue: number
  topPerformingCompany: {
    name: string
    revenue: number
  }
}

export interface CompanyFormData extends CreateCompanyRequest {
  _id?: string
}

export interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company?: Company | null
  onSubmit: (data: CompanyFormData) => Promise<void>
  isLoading?: boolean
}

export interface CompanyCardProps {
  company: Company
  onView: (company: Company) => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
  onToggleStatus?: (company: Company) => void
}

export interface CompanyListProps {
  companies: Company[]
  isLoading: boolean
  onView: (company: Company) => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
  onToggleStatus?: (company: Company) => void
}

export interface CompanyFiltersProps {
  filters: CompanyFilters
  onFiltersChange: (filters: CompanyFilters) => void
  onReset: () => void
}

export interface CompanyStatsProps {
  stats: CompanyStats
  isLoading: boolean
}
