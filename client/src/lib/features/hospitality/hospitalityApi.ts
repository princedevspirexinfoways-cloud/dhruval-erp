import { baseApi } from '@/lib/api/baseApi'

// Customer Visit interfaces
export interface CustomerVisit {
  _id: string
  partyName: string
  contactPerson: string
  contactPhone?: string
  contactNumber?: string
  contactEmail?: string
  visitDate: string
  visitTime?: string
  purpose: 'sales' | 'support' | 'meeting' | 'demo' | 'follow-up' | 'other'
  purposeDescription: string
  travelType: 'local' | 'outstation'

  travelExpenses?: {
    transport: number
    accommodation: number
    food: number
    other: number
    total: number
  }

  rejectionReason?: string
  reimbursementStatus?: 'pending' | 'processed' | 'completed'
  nextFollowUp?: string

  travelDetails?: {
    origin: string
    destination: string
    travelMode: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'other'
    departureDate?: string
    returnDate?: string
    travelClass?: 'economy' | 'business' | 'first' | 'ac' | 'non_ac'
  }
  
  accommodation?: {
    hotelName: string
    hotelAddress: string
    checkInDate: string
    checkOutDate: string
    roomType: 'single' | 'double' | 'suite' | 'deluxe'
    numberOfRooms: number
    costPerNight: number
    totalNights: number
    totalCost: number
    bookingReference?: string
    amenities?: string[]
  }
  
  foodExpenses: Array<{
    _id?: string
    date: string
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages'
    restaurant: string
    location: string
    numberOfPeople: number
    costPerPerson: number
    totalCost: number
    description?: string
    billNumber?: string
  }>
  
  giftsGiven: Array<{
    _id?: string
    itemName: string
    itemType: 'gift' | 'sample' | 'brochure' | 'promotional_material'
    quantity: number
    unitCost: number
    totalCost: number
    description?: string
    recipientName?: string
  }>
  
  transportationExpenses: Array<{
    _id?: string
    date: string
    type: 'taxi' | 'uber' | 'auto' | 'bus' | 'train' | 'flight' | 'fuel' | 'parking'
    from: string
    to: string
    cost: number
    description?: string
    billNumber?: string
  }>
  
  otherExpenses: Array<{
    _id?: string
    date: string
    category: 'communication' | 'printing' | 'stationery' | 'miscellaneous'
    description: string
    cost: number
    billNumber?: string
  }>
  
  visitOutcome?: {
    status: 'successful' | 'partially_successful' | 'unsuccessful' | 'follow_up_required'
    notes: string
    nextActionRequired?: string
    nextFollowUpDate?: string
    businessGenerated?: number
    potentialBusiness?: number
  } | string
  
  totalExpenses: {
    [x: string]: number
    accommodation: number
    food: number
    transportation: number
    gifts: number
    other: number
    total: number
  }
  
  attachments?: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reimbursed'
  approvedBy?: string
  approvedAt?: string
  reimbursementAmount?: number
  reimbursedAt?: string
  
  companyId: string
  createdBy: string
  lastModifiedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerVisitRequest {
  partyName: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  visitDate: string
  purpose: CustomerVisit['purpose']
  purposeDescription: string
  travelType: CustomerVisit['travelType']
  travelDetails: CustomerVisit['travelDetails']
  accommodation?: CustomerVisit['accommodation']
  visitOutcome?: CustomerVisit['visitOutcome']
  companyId: string
}

export interface UpdateCustomerVisitRequest {
  partyName?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  visitDate?: string
  purpose?: CustomerVisit['purpose']
  purposeDescription?: string
  travelType?: CustomerVisit['travelType']
  travelDetails?: Partial<CustomerVisit['travelDetails']>
  accommodation?: Partial<CustomerVisit['accommodation']>
  visitOutcome?: Partial<CustomerVisit['visitOutcome']>
}

export interface HospitalityStats {
  totalVisits: number
  totalExpenses: number
  avgExpensePerVisit: number
  accommodationTotal: number
  foodTotal: number
  transportationTotal: number
  giftsTotal: number
  otherTotal: number
  pendingApprovals: number
  approvedVisits: number
  reimbursedVisits: number
}

export interface FoodExpenseRequest {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages'
  restaurant: string
  location: string
  numberOfPeople: number
  costPerPerson: number
  description?: string
  billNumber?: string
}

export interface GiftRequest {
  itemName: string
  itemType: 'gift' | 'sample' | 'brochure' | 'promotional_material'
  quantity: number
  unitCost: number
  description?: string
  recipientName?: string
}

export const hospitalityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all customer visits
    getAllCustomerVisits: builder.query<{
      data: CustomerVisit[]
      total: number
      totalPages: number
      page: number
      limit: number
    }, {
      page?: number
      limit?: number
      search?: string
      purpose?: string
      travelType?: string
      approvalStatus?: string
      dateFrom?: string
      dateTo?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }>({
      query: (params) => ({
        url: '/customer-visits',
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
        ),
      }),
      transformResponse: (response: { data: any[]; total: number; page: number; limit: number; totalPages: number }) => {
        console.log('Transform response:', response)
        // Return the response object which contains the data array and pagination info
        return response
      },
      providesTags: ['CustomerVisit'],
    }),

    // Get customer visit by ID
    getCustomerVisitById: builder.query<CustomerVisit, string>({
      query: (id) => `/customer-visits/${id}`,
      transformResponse: (response: { success: boolean; data: CustomerVisit; message: string }) => response.data,
      providesTags: (_, __, id) => [{ type: 'CustomerVisit', id }],
    }),

    // Get hospitality statistics
    getHospitalityStats: builder.query<HospitalityStats, {
      dateFrom?: string
      dateTo?: string
    }>({
      query: (params) => ({
        url: '/customer-visits/stats',
        params: Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
        ),
      }),
      transformResponse: (response: { success: boolean; data: HospitalityStats; message: string }) => response.data,
      providesTags: ['HospitalityStats'],
    }),

    // Get pending approvals
    getPendingApprovals: builder.query<CustomerVisit[], void>({
      query: () => '/customer-visits/pending-approvals',
      transformResponse: (response: { success: boolean; data: CustomerVisit[]; message: string }) => response.data,
      providesTags: ['CustomerVisit'],
    }),

    // Create customer visit
    createCustomerVisit: builder.mutation<CustomerVisit, CreateCustomerVisitRequest>({
      query: (visitData) => ({
        url: '/customer-visits',
        method: 'POST',
        body: visitData,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Update customer visit
    updateCustomerVisit: builder.mutation<CustomerVisit, { id: string; data: UpdateCustomerVisitRequest }>({
      query: ({ id, data }) => ({
        url: `/customer-visits/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Delete customer visit
    deleteCustomerVisit: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customer-visits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Approve visit
    approveVisit: builder.mutation<CustomerVisit, { id: string; reimbursementAmount?: number }>({
      query: ({ id, reimbursementAmount }) => ({
        url: `/customer-visits/${id}/approve`,
        method: 'PATCH',
        body: { reimbursementAmount },
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Reject visit
    rejectVisit: builder.mutation<CustomerVisit, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/customer-visits/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Mark as reimbursed
    markAsReimbursed: builder.mutation<CustomerVisit, string>({
      query: (id) => ({
        url: `/customer-visits/${id}/reimburse`,
        method: 'PATCH',
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Add food expense
    addFoodExpense: builder.mutation<CustomerVisit, { id: string; expense: FoodExpenseRequest }>({
      query: ({ id, expense }) => ({
        url: `/customer-visits/${id}/food-expense`,
        method: 'POST',
        body: expense,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Add gift
    addGift: builder.mutation<CustomerVisit, { id: string; gift: GiftRequest }>({
      query: ({ id, gift }) => ({
        url: `/customer-visits/${id}/gift`,
        method: 'POST',
        body: gift,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Add transportation expense
    addTransportationExpense: builder.mutation<CustomerVisit, { id: string; expense: any }>({
      query: ({ id, expense }) => ({
        url: `/customer-visits/${id}/transportation-expense`,
        method: 'POST',
        body: expense,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Add other expense
    addOtherExpense: builder.mutation<CustomerVisit, { id: string; expense: any }>({
      query: ({ id, expense }) => ({
        url: `/customer-visits/${id}/other-expense`,
        method: 'POST',
        body: expense,
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),

    // Recalculate totals
    recalculateTotals: builder.mutation<CustomerVisit, { id: string }>({
      query: ({ id }) => ({
        url: `/customer-visits/${id}/recalculate-totals`,
        method: 'POST',
      }),
      invalidatesTags: ['CustomerVisit', 'HospitalityStats'],
    }),
  }),
})

export const {
  useGetAllCustomerVisitsQuery,
  useGetCustomerVisitByIdQuery,
  useGetHospitalityStatsQuery,
  useGetPendingApprovalsQuery,
  useCreateCustomerVisitMutation,
  useUpdateCustomerVisitMutation,
  useDeleteCustomerVisitMutation,
  useApproveVisitMutation,
  useRejectVisitMutation,
  useMarkAsReimbursedMutation,
  useAddFoodExpenseMutation,
  useAddGiftMutation,
  useAddTransportationExpenseMutation,
  useAddOtherExpenseMutation,
  useRecalculateTotalsMutation,
} = hospitalityApi
