import { baseApi } from '@/lib/api/baseApi'

export interface Company {
  _id: string
  companyCode: string
  companyName: string
  legalName?: string
  status?: 'active' | 'inactive' | 'suspended' | 'pending_approval' | 'under_review'
  contactInfo: {
    phones: Array<{
      type: string
      label: string
    }>
    emails: Array<{
      type: string
      label: string
    }>
    website?: string
    socialMedia?: {
      linkedin?: string
    }
  }
  isActive: boolean
  createdAt: string
  updatedAt?: string
  createdBy?: {
    _id: string
    username: string
    personalInfo: {
      firstName: string
      lastName: string
    }
    email: string
  }
  lastModifiedBy?: {
    _id: string
    username: string
    personalInfo: {
      firstName: string
      lastName: string
    }
  }
  users?: Array<{
    _id: string
    username: string
    personalInfo: {
      firstName: string
      lastName: string
    }
    email: string
    companyAccess: Array<{
      companyId: string
      role: string
      department?: string
      isActive: boolean
    }>
  }>
  stats?: {
    totalUsers?: number
    activeUsers?: number
    roles?: Record<string, number>
    totalProducts?: number
    totalOrders?: number
    monthlyRevenue?: number
    totalProduction?: number
    activeProjects?: number
    completedOrders?: number
    pendingOrders?: number
    totalRevenue?: number
    monthlyGrowth?: number
  }
  registrationDetails?: {
    gstin?: string
    pan?: string
    cin?: string
    udyogAadhar?: string
    registrationDate?: string
  }
  addresses?: {
    registeredOffice?: {
      street?: string
      area?: string
      city?: string
      state?: string
      pincode?: string
      country?: string
      isActive?: boolean
    }
    factoryAddress?: {
      street?: string
      area?: string
      city?: string
      state?: string
      pincode?: string
      country?: string
      isActive?: boolean
    }
    warehouseAddresses?: Array<{
      warehouseName: string
      street: string
      area: string
      city: string
      state: string
      pincode: string
    }>
  }
  businessConfig?: {
    currency?: string
    timezone?: string
    fiscalYearStart?: string
    workingDays?: string[]
    workingHours?: {
      start?: string
      end?: string
      breakStart?: string
      breakEnd?: string
    }
    gstRates?: {
      defaultRate?: number
      rawMaterialRate?: number
      finishedGoodsRate?: number
    }
  }
  productionCapabilities?: {
    productTypes?: string[]
    printingMethods?: string[]
    qualityCertifications?: string[]
  }
  bankAccounts?: Array<{
    bankName: string
    branchName: string
    accountNumber: string
    ifscCode: string
    accountType: string
    accountHolderName: string
    currentBalance: number
    isActive: boolean
    isPrimary: boolean
  }>
  licenses?: Array<{
    name?: string
    status?: string
  }>
}

export interface CompaniesResponse {
  success: boolean
  message: string
  data: Company[]
  count: number
  timestamp: string
}

export const companiesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAllCompanies: builder.query<CompaniesResponse, void>({
      query: () => '/companies',
      providesTags: ['Company'],
    }),
    getCompanyById: builder.query<{
      success: boolean
      message: string
      data: Company
      timestamp: string
    }, string>({
      query: (id) => `/companies/${id}`,
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    createCompany: builder.mutation<Company, Partial<Company>>({
      query: (company) => ({
        url: '/companies',
        method: 'POST',
        body: company,
      }),
      invalidatesTags: ['Company'],
    }),
    updateCompany: builder.mutation<Company, { id: string; company: Partial<Company> }>({
      query: ({ id, company }) => ({
        url: `/companies/${id}`,
        method: 'PUT',
        body: company,
      }),
      invalidatesTags: ['Company'],
    }),
    deleteCompany: builder.mutation<void, string>({
      query: (id) => ({
        url: `/companies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Company'],
    }),
    getCompanyStats: builder.query<{
      totalCompanies: number
      activeCompanies: number
      inactiveCompanies: number
    }, void>({
      query: () => '/companies/stats',
      providesTags: ['Company'],
    }),
    getDashboardStats: builder.query<{
      totalUsers: number
      totalRevenue: number
      totalProduction: number
      totalOrders: number
      totalCustomers: number
    }, void>({
      query: () => '/dashboard',
      providesTags: ['Company'],
    }),
    getCompanyDetailedStats: builder.query<{
      success: boolean
      message: string
      data: {
        totalUsers: number
        activeUsers: number
        inactiveUsers: number
        totalOrders: number
        completedOrders: number
        pendingOrders: number
        totalRevenue: number
        totalInventory: number
        totalProduction: number
        totalCustomers: number
        totalInvoices: number
        orderCompletionRate: number
        userActivityRate: number
      }
      timestamp: string
    }, string>({
      query: (companyId) => `/companies/${companyId}/stats`,
      providesTags: (result, error, companyId) => [{ type: 'Company', id: companyId }],
      keepUnusedDataFor: 300, // Keep data for 5 minutes
    }),
    getBatchCompanyStats: builder.query<{
      success: boolean
      message: string
      data: Array<{
        companyId: string
        stats: {
          totalUsers: number
          activeUsers: number
          inactiveUsers: number
          totalOrders: number
          completedOrders: number
          pendingOrders: number
          totalRevenue: number
          totalInventory: number
          totalProduction: number
          totalCustomers: number
          totalInvoices: number
          orderCompletionRate: number
          userActivityRate: number
        }
      }>
      timestamp: string
    }, string[]>({
      query: (companyIds) => ({
        url: '/companies/batch-stats',
        params: { companyIds }
      }),
      providesTags: (result) => 
        result?.data ? result.data.map(({ companyId }) => ({ type: 'Company', id: companyId })) : [],
      keepUnusedDataFor: 300, // Keep data for 5 minutes
    }),
  }),
});

export const {
  useGetAllCompaniesQuery,
  useGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetCompanyStatsQuery,
  useGetDashboardStatsQuery,
  useGetCompanyDetailedStatsQuery,
  useGetBatchCompanyStatsQuery,
} = companiesApi;
