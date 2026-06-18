import { baseApi } from './baseApi'

// Types
export interface Agent {
  _id?: string
  agentId?: string
  agentCode: string
  agentName: string
  firmName?: string
  contactPersonName: string
  contactInfo?: {
    primaryEmail?: string
    alternateEmail?: string
    primaryPhone?: string
    alternatePhone?: string
    whatsapp?: string
    fax?: string
    tollFree?: string
  }
  addresses?: Array<{
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    country: string
  }>
  contactPersons?: Array<{
    name: string
    designation?: string
    phone?: string
    email?: string
    isPrimary?: boolean
  }>
  registrationDetails?: {
    pan?: string
    gstin?: string
  }
  notes?: string
  tags?: string[]
  isActive?: boolean
  companyId?: string | { _id: string; companyName: string; companyCode: string }
  createdAt?: string
  updatedAt?: string
}

export interface AgentFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export const agentsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all agents with filters
    getAgents: builder.query<
      { success: boolean; data: { data: Agent[]; pagination: any }; message: string; timestamp: string },
      {
        page?: number
        limit?: number
        search?: string
        status?: string
      }
    >({
      query: (params) => ({
        url: '/agents',
        method: 'GET',
        params,
      }),
      providesTags: [{ type: 'Agent', id: 'LIST' }],
    }),

    // Create agent
    createAgent: builder.mutation<
      { success: boolean; data: Agent; message: string },
      Agent
    >({
      query: (agentData) => ({
        url: '/agents',
        method: 'POST',
        body: agentData,
      }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }],
    }),

    // Update agent
    updateAgent: builder.mutation<
      { success: boolean; data: Agent; message: string },
      { id: string; data: Partial<Agent> }
    >({
      query: ({ id, data }) => ({
        url: `/agents/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Agent', id },
        { type: 'Agent', id: 'LIST' },
      ],
    }),

    // Delete agent
    deleteAgent: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/agents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }],
    }),

    // Get agent by ID
    getAgentById: builder.query<
      { success: boolean; data: Agent },
      string
    >({
      query: (agentId) => ({
        url: `/agents/${agentId}`,
        method: 'GET',
      }),
      providesTags: (result, error, agentId) => [
        { type: 'Agent', id: agentId },
      ],
    }),

    // Search agents
    searchAgents: builder.query<
      { success: boolean; data: Agent[] },
      string
    >({
      query: (query) => ({
        url: '/agents/search',
        method: 'GET',
        params: { q: query },
      }),
      providesTags: (result, error, query) => [
        { type: 'Agent', id: `SEARCH_${query}` },
      ],
    }),

    // Get agent statistics
    getAgentStats: builder.query<
      { success: boolean; data: { total: number; active: number; inactive: number } },
      void
    >({
      query: () => ({
        url: '/agents/stats',
        method: 'GET',
      }),
      providesTags: [{ type: 'Agent', id: 'STATS' }],
    }),
  }),
})

export const {
  useGetAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useGetAgentByIdQuery,
  useSearchAgentsQuery,
  useGetAgentStatsQuery,
} = agentsApi











