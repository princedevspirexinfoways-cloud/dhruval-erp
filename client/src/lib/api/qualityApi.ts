import { baseApi } from './baseApi'

// Types
export interface QualityCheck {
  _id?: string
  id?: string // For compatibility with components
  spareId: string
  date: string
  inspector: string
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'Reject'
  score: number
  parameters: Array<{
    name: string
    value: string
    status: 'pass' | 'fail' | 'warning'
    notes?: string
  }>
  notes?: string
  images?: string[]
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  nextCheckDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface Certification {
  _id?: string
  id?: string // For compatibility with components
  spareId: string
  name: string
  issuingAuthority: string
  issueDate: string
  expiryDate?: string
  certificateNumber: string
  status: 'active' | 'expired' | 'pending' | 'suspended'
  documentUrl?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ComplianceStandard {
  _id?: string
  id?: string // For compatibility with components
  spareId: string
  name: string
  code: string
  description: string
  status: 'compliant' | 'non-compliant' | 'pending' | 'exempt'
  lastAuditDate?: string
  nextAuditDate?: string
  auditNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface QualityAnalytics {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  averageScore: number
  gradeDistribution: Array<{
    grade: string
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    checks: number
    passed: number
    failed: number
    averageScore: number
  }>
  inspectorPerformance: Array<{
    inspector: string
    checks: number
    passed: number
    failed: number
    averageScore: number
  }>
  certificationStats: {
    total: number
    active: number
    expired: number
    expiringSoon: number
  }
  complianceStats: {
    compliant: number
    nonCompliant: number
    pending: number
    exempt: number
  }
}

export interface QualityFilters {
  spareId?: string
  grade?: string
  status?: string
  inspector?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const qualityApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get quality checks for a spare
    getQualityChecks: builder.query<
      { success: boolean; data: QualityCheck[] },
      string
    >({
      query: (spareId) => ({
        url: `/quality/checks/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `QUALITY_${spareId}` },
      ],
    }),

    // Create quality check
    createQualityCheck: builder.mutation<
      { success: boolean; data: QualityCheck; message: string },
      QualityCheck
    >({
      query: (checkData) => ({
        url: '/quality/checks',
        method: 'POST',
        body: checkData,
      }),
      invalidatesTags: (result, error, checkData) => [
        { type: 'Spare', id: `QUALITY_${checkData.spareId}` },
        { type: 'Spare', id: 'QUALITY_LIST' },
      ],
    }),

    // Update quality check
    updateQualityCheck: builder.mutation<
      { success: boolean; data: QualityCheck; message: string },
      { id: string; data: Partial<QualityCheck> }
    >({
      query: ({ id, data }) => ({
        url: `/quality/checks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id: `QUALITY_${id}` },
        { type: 'Spare', id: `QUALITY_${data.spareId}` },
        { type: 'Spare', id: 'QUALITY_LIST' },
      ],
    }),

    // Delete quality check
    deleteQualityCheck: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/quality/checks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id: `QUALITY_${id}` },
        { type: 'Spare', id: 'QUALITY_LIST' },
      ],
    }),

    // Get certifications for a spare
    getCertifications: builder.query<
      { success: boolean; data: Certification[] },
      string
    >({
      query: (spareId) => ({
        url: `/quality/certifications/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `CERT_${spareId}` },
      ],
    }),

    // Create certification
    createCertification: builder.mutation<
      { success: boolean; data: Certification; message: string },
      Certification
    >({
      query: (certData) => ({
        url: '/quality/certifications',
        method: 'POST',
        body: certData,
      }),
      invalidatesTags: (result, error, certData) => [
        { type: 'Spare', id: `SPARE_${certData.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Update certification
    updateCertification: builder.mutation<
      { success: boolean; data: Certification; message: string },
      { id: string; data: Partial<Certification> }
    >({
      query: ({ id, data }) => ({
        url: `/quality/certifications/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: `SPARE_${data.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete certification
    deleteCertification: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/quality/certifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get compliance standards for a spare
    getComplianceStandards: builder.query<
      { success: boolean; data: ComplianceStandard[] },
      string
    >({
      query: (spareId) => ({
        url: `/quality/compliance/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: `SPARE_${spareId}` },
      ],
    }),

    // Create compliance standard
    createComplianceStandard: builder.mutation<
      { success: boolean; data: ComplianceStandard; message: string },
      ComplianceStandard
    >({
      query: (complianceData) => ({
        url: '/quality/compliance',
        method: 'POST',
        body: complianceData,
      }),
      invalidatesTags: (result, error, complianceData) => [
        { type: 'Spare', id: `SPARE_${complianceData.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Update compliance standard
    updateComplianceStandard: builder.mutation<
      { success: boolean; data: ComplianceStandard; message: string },
      { id: string; data: Partial<ComplianceStandard> }
    >({
      query: ({ id, data }) => ({
        url: `/quality/compliance/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, data }) => [
        { type: 'Spare', id },
        { type: 'Spare', id: `SPARE_${data.spareId}` },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Delete compliance standard
    deleteComplianceStandard: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/quality/compliance/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Spare', id },
        { type: 'Spare', id: 'LIST' },
      ],
    }),

    // Get quality analytics for a spare
    getQualityAnalytics: builder.query<
      { success: boolean; data: QualityAnalytics },
      string
    >({
      query: (spareId) => ({
        url: `/quality/analytics/${spareId}`,
        method: 'GET',
      }),
      providesTags: (result, error, spareId) => [
        { type: 'Spare', id: spareId },
      ],
    }),

    // Get quality checks due soon
    getQualityChecksDueSoon: builder.query<
      { success: boolean; data: QualityCheck[] },
      number
    >({
      query: (days) => ({
        url: `/quality/checks-due/${days}`,
        method: 'GET',
      }),
      providesTags: (result, error, days) => [
        { type: 'Spare', id: `DUE_SOON_${days}` },
      ],
    }),

    // Get expired certifications
    getExpiredCertifications: builder.query<
      { success: boolean; data: Certification[] },
      void
    >({
      query: () => ({
        url: '/quality/certifications-expired',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'EXPIRED' }],
    }),

    // Get certifications expiring soon
    getCertificationsExpiringSoon: builder.query<
      { success: boolean; data: Certification[] },
      number
    >({
      query: (days) => ({
        url: `/quality/certifications-expiring/${days}`,
        method: 'GET',
      }),
      providesTags: (result, error, days) => [
        { type: 'Spare', id: `EXPIRING_SOON_${days}` },
      ],
    }),

    // Get overall quality statistics
    getQualityStats: builder.query<
      { success: boolean; data: QualityAnalytics },
      void
    >({
      query: () => ({
        url: '/quality/stats',
        method: 'GET',
      }),
      providesTags: [{ type: 'Spare', id: 'OVERALL' }],
    }),
  }),
})

export const {
  useGetQualityChecksQuery,
  useCreateQualityCheckMutation,
  useUpdateQualityCheckMutation,
  useDeleteQualityCheckMutation,
  useGetCertificationsQuery,
  useCreateCertificationMutation,
  useUpdateCertificationMutation,
  useDeleteCertificationMutation,
  useGetComplianceStandardsQuery,
  useCreateComplianceStandardMutation,
  useUpdateComplianceStandardMutation,
  useDeleteComplianceStandardMutation,
  useGetQualityAnalyticsQuery,
  useGetQualityChecksDueSoonQuery,
  useGetExpiredCertificationsQuery,
  useGetCertificationsExpiringSoonQuery,
  useGetQualityStatsQuery,
} = qualityApi
