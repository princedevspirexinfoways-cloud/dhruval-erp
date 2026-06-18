import { baseApi } from './baseApi'

// =============================================
// TYPES & INTERFACES
// =============================================

export interface DesignRow {
  _id?: string
  designNumber: string
  bale: number
  meter?: number
  screen?: string
  instructions?: string
}

export interface ProgramDetails {
  _id?: string
  companyId: string
  partyName: string
  customerId?: string // Reference to Customer
  orderNumber: string
  fold: number
  designs: DesignRow[]
  finishWidth?: number
  totalBale?: number
  yards?: number
  salvage?: number
  packingBardan?: string
  shippingMark?: string
  quality?: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface CreateProgramDetailsRequest {
  partyName: string
  customerId?: string // Reference to Customer
  orderNumber: string
  fold: number
  designs: DesignRow[]
  finishWidth?: number
  totalBale?: number
  yards?: number
  salvage?: number
  packingBardan?: string
  shippingMark?: string
  quality?: string
}

export interface UpdateProgramDetailsRequest extends Partial<CreateProgramDetailsRequest> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
}

export interface BleachingProcess {
  _id?: string
  companyId: string
  customerId?: string
  partyName: string
  date: string
  lotNumber: string
  totalBale: number
  totalMeter: number
  transportName?: string
  mercerise?: {
    degree?: number
    width?: number
  }
  status: 'pending' | 'in_progress' | 'completed'
  completedMeter?: number
  isCompleted: boolean
  completedAt?: string
  challanGenerated: boolean
  challanUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateBleachingProcessRequest {
  customerId?: string
  partyName: string
  date: string
  lotNumber: string
  totalBale: number
  totalMeter: number
  transportName?: string
  mercerise?: {
    degree?: number
    width?: number
  }
}

export interface CompleteBleachingRequest {
  updatedMeter: number
}

export interface AfterBleaching {
  _id?: string
  companyId: string
  bleachingProcessId: string
  lotNumber: string
  partyName: string
  customerId?: string
  totalMeter: number
  availableMeter: number
  longationStock: number
  sentToPrinting: number
  printingEntries: Array<{
    date: string
    meter: number
    sentBy: string
  }>
  status: 'available' | 'partially_allocated' | 'fully_allocated'
  createdAt?: string
  updatedAt?: string
}

export interface SendToPrintingRequest {
  meter: number
}

export interface BatchCenter {
  _id?: string
  companyId: string
  date: string
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  totalMeter: number
  receivedMeter: number
  pendingMeter: number
  status: 'pending' | 'partial' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateBatchCenterRequest {
  date: string
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  totalMeter: number
  receivedMeter?: number
}

export interface UpdateReceivedMeterRequest {
  receivedMeter: number
}

// =============================================
// PRINTING MODULE
// =============================================
export interface Printing {
  _id?: string
  companyId: string
  partyName: string
  customerId?: string
  orderNumber?: string
  lotNumber: string
  designNumber: string
  quality: string
  totalMeterReceived: number
  source: 'after_bleaching' | 'batch_center'
  sourceId?: string
  screenNo?: string
  designScreen?: string
  printingType: 'reactive' | 'pigment' | 'digital' | 'kitenge'
  operatorName?: string
  machineName?: string
  date: string
  printedMeter: number
  rejectedMeter: number
  pendingMeter: number
  remarks?: string
  instructions?: string
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold'
  createdAt?: string
  updatedAt?: string
}

export interface CreatePrintingRequest {
  partyName: string
  customerId?: string
  orderNumber?: string
  lotNumber: string
  designNumber: string
  quality: string
  totalMeterReceived: number
  source: 'after_bleaching' | 'batch_center'
  sourceId?: string
  screenNo?: string
  designScreen?: string
  printingType: 'reactive' | 'pigment' | 'digital' | 'kitenge'
  operatorName?: string
  machineName?: string
  date: string
  remarks?: string
  instructions?: string
}

export interface UpdatePrintingOutputRequest {
  printedMeter: number
  rejectedMeter: number
}

// =============================================
// HAZER/SILICATE/CURING MODULE
// =============================================
export interface HazerSilicateCuring {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  printingId?: string
  processType: 'hazer' | 'silicate' | 'curing'
  chemicalUsed?: string
  temperature?: number
  time?: number
  operatorName?: string
  date: string
  processedMeter: number
  lossMeter: number
  pendingMeter: number
  status: 'pending' | 'in_progress' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateHazerSilicateCuringRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  printingId?: string
  processType: 'hazer' | 'silicate' | 'curing'
  chemicalUsed?: string
  temperature?: number
  time?: number
  operatorName?: string
  date: string
}

export interface UpdateProcessOutputRequest {
  processedMeter: number
  lossMeter: number
}

// =============================================
// WASHING MODULE
// =============================================
export interface Washing {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  hazerSilicateCuringId?: string
  washingType: 'normal' | 'soft' | 'heavy'
  operatorName?: string
  date: string
  washedMeter: number
  shrinkageMeter: number
  pendingMeter: number
  status: 'pending' | 'in_progress' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateWashingRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  hazerSilicateCuringId?: string
  washingType: 'normal' | 'soft' | 'heavy'
  operatorName?: string
  date: string
}

export interface UpdateWashingOutputRequest {
  washedMeter: number
  shrinkageMeter: number
}

// =============================================
// FINISHING MODULE
// =============================================
export interface Finishing {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  washingId?: string
  finishWidth?: number
  gsm?: number
  finishingType: 'soft' | 'stiff' | 'export_finish'
  operatorName?: string
  date: string
  finishedMeter: number
  rejectedMeter: number
  pendingMeter: number
  status: 'pending' | 'in_progress' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateFinishingRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  washingId?: string
  finishWidth?: number
  gsm?: number
  finishingType: 'soft' | 'stiff' | 'export_finish'
  operatorName?: string
  date: string
}

export interface UpdateFinishingOutputRequest {
  finishedMeter: number
  rejectedMeter: number
}

// =============================================
// FELT MODULE
// =============================================
export interface Felt {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  finishingId?: string
  feltDuration?: number
  durationUnit: 'hours' | 'days'
  dateIn: string
  dateOut?: string
  feltMeter: number
  lossMeter: number
  status: 'in_felt' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateFeltRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  finishingId?: string
  feltDuration?: number
  durationUnit?: 'hours' | 'days'
  dateIn: string
}

export interface CompleteFeltRequest {
  feltMeter: number
  lossMeter: number
  dateOut: string
}

// =============================================
// FOLDING + CHECKING MODULE
// =============================================
export interface FoldingChecking {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  feltId?: string
  foldType?: string
  checkedMeter: number
  rejectedMeter: number
  qcStatus: 'pass' | 'fail' | 'partial'
  checkerName?: string
  date: string
  status: 'pending' | 'in_progress' | 'completed'
  createdAt?: string
  updatedAt?: string
}

export interface CreateFoldingCheckingRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  inputMeter: number
  feltId?: string
  foldType?: string
  date: string
}

export interface UpdateQCRequest {
  checkedMeter: number
  rejectedMeter: number
  qcStatus: 'pass' | 'fail' | 'partial'
  checkerName: string
}

// =============================================
// PACKING MODULE
// =============================================
export interface Packing {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  foldingCheckingId?: string
  packingType: 'roll' | 'bale' | 'carton'
  bardan?: string
  shippingMark?: string
  totalPackedBale: number
  totalPackedMeter: number
  date: string
  status: 'pending' | 'in_progress' | 'completed' | 'dispatch_ready'
  finishedGoodsInventoryId?: string
  isDispatchReady: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreatePackingRequest {
  lotNumber: string
  partyName: string
  customerId?: string
  quality: string
  inputMeter: number
  foldingCheckingId?: string
  packingType: 'roll' | 'bale' | 'carton'
  bardan?: string
  shippingMark?: string
  date: string
}

export interface UpdatePackingRequest {
  totalPackedBale: number
  totalPackedMeter: number
  finishedGoodsInventoryId?: string
}

// =============================================
// LONGATION STOCK
// =============================================
export interface LongationStock {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  sourceModule: 'after_bleaching' | 'hazer_silicate_curing' | 'washing' | 'felt'
  sourceId?: string
  meter: number
  reason?: string
  status: 'available' | 'allocated' | 'used'
  createdAt?: string
  updatedAt?: string
}

// =============================================
// REJECTION STOCK
// =============================================
export interface RejectionStock {
  _id?: string
  companyId: string
  lotNumber: string
  partyName: string
  sourceModule: 'printing' | 'finishing' | 'folding_checking'
  sourceId?: string
  meter: number
  reason?: string
  qualityIssue?: string
  status: 'pending' | 'disposed' | 'reworked'
  createdAt?: string
  updatedAt?: string
}

export interface UpdateRejectionStatusRequest {
  status: 'disposed' | 'reworked'
}

// =============================================
// API ENDPOINTS
// =============================================

export const productionModulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =============================================
    // PROGRAM DETAILS
    // =============================================
    getProgramDetails: builder.query<{ success: boolean; data: ProgramDetails[]; pagination?: any }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/production/program-details',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getProgramDetailsById: builder.query<{ success: boolean; data: ProgramDetails }, string>({
      query: (id) => `/production/program-details/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getProgramDetailsByOrderNumber: builder.query<{ success: boolean; data: ProgramDetails }, string>({
      query: (orderNumber) => `/production/program-details/order/${orderNumber}`,
      providesTags: (result, error, orderNumber) => [{ type: 'ProductionOrder', id: orderNumber }]
    }),

    createProgramDetails: builder.mutation<{ success: boolean; data: ProgramDetails }, CreateProgramDetailsRequest>({
      query: (data) => ({
        url: '/production/program-details',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateProgramDetails: builder.mutation<{ success: boolean; data: ProgramDetails }, { id: string; data: UpdateProgramDetailsRequest }>({
      query: ({ id, data }) => ({
        url: `/production/program-details/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    deleteProgramDetails: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/production/program-details/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // BLEACHING PROCESS
    // =============================================
    getBleachingDashboard: builder.query<{ success: boolean; data: BleachingProcess[] }, void>({
      query: () => '/production/bleaching/dashboard',
      providesTags: ['ProductionOrder']
    }),

    getBleachingProcessById: builder.query<{ success: boolean; data: BleachingProcess }, string>({
      query: (id) => `/production/bleaching/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    createBleachingProcess: builder.mutation<{ success: boolean; data: BleachingProcess }, CreateBleachingProcessRequest>({
      query: (data) => ({
        url: '/production/bleaching',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    completeBleachingProcess: builder.mutation<{ success: boolean; data: { process: BleachingProcess; afterBleaching: AfterBleaching } }, { id: string; data: CompleteBleachingRequest }>({
      query: ({ id, data }) => ({
        url: `/production/bleaching/${id}/complete`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    generateBleachingChallan: builder.query<{ success: boolean; data: { challanUrl: string } }, string>({
      query: (id) => `/production/bleaching/${id}/challan`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    updateBleachingProcess: builder.mutation<{ success: boolean; data: BleachingProcess }, { id: string; data: Partial<CreateBleachingProcessRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/bleaching/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    // =============================================
    // AFTER BLEACHING
    // =============================================
    getAfterBleachingStocks: builder.query<{ success: boolean; data: AfterBleaching[] }, { status?: string }>({
      query: (params) => ({
        url: '/production/after-bleaching',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getAfterBleachingById: builder.query<{ success: boolean; data: AfterBleaching }, string>({
      query: (id) => `/production/after-bleaching/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getLongationStock: builder.query<{ success: boolean; data: { totalLongation: number } }, void>({
      query: () => '/production/after-bleaching/longation',
      providesTags: ['ProductionOrder']
    }),

    sendToPrinting: builder.mutation<{ success: boolean; data: AfterBleaching }, { id: string; data: SendToPrintingRequest }>({
      query: ({ id, data }) => ({
        url: `/production/after-bleaching/${id}/send-to-printing`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // BATCH CENTER
    // =============================================
    getBatchCenters: builder.query<{ success: boolean; data: BatchCenter[]; pagination?: any }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/production/batch-center',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getBatchCenterById: builder.query<{ success: boolean; data: BatchCenter }, string>({
      query: (id) => `/production/batch-center/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getPartyNameByLot: builder.query<{ success: boolean; data: { partyName: string | null } }, string>({
      query: (lotNumber) => `/production/batch-center/lot/${lotNumber}/party`,
      providesTags: (result, error, lotNumber) => [{ type: 'ProductionOrder', id: lotNumber }]
    }),

    createBatchCenter: builder.mutation<{ success: boolean; data: BatchCenter }, CreateBatchCenterRequest>({
      query: (data) => ({
        url: '/production/batch-center',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateReceivedMeter: builder.mutation<{ success: boolean; data: BatchCenter }, { id: string; data: UpdateReceivedMeterRequest }>({
      query: ({ id, data }) => ({
        url: `/production/batch-center/${id}/received-meter`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updateBatchCenter: builder.mutation<{ success: boolean; data: BatchCenter }, { id: string; data: Partial<CreateBatchCenterRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/batch-center/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    // =============================================
    // PRINTING
    // =============================================
    getPrintings: builder.query<{ success: boolean; data: Printing[]; pagination?: any }, { status?: string; lotNumber?: string }>({
      query: (params) => ({
        url: '/production/printing',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getPrintingById: builder.query<{ success: boolean; data: Printing }, string>({
      query: (id) => `/production/printing/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getPrintingWIP: builder.query<{ success: boolean; data: Printing[] }, void>({
      query: () => '/production/printing/wip',
      providesTags: ['ProductionOrder']
    }),

    createPrinting: builder.mutation<{ success: boolean; data: Printing }, CreatePrintingRequest>({
      query: (data) => ({
        url: '/production/printing',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updatePrinting: builder.mutation<{ success: boolean; data: Printing }, { id: string; data: Partial<CreatePrintingRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/printing/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updatePrintingOutput: builder.mutation<{ success: boolean; data: { printing: Printing; rejectionStock?: RejectionStock } }, { id: string; data: UpdatePrintingOutputRequest }>({
      query: ({ id, data }) => ({
        url: `/production/printing/${id}/output`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // HAZER/SILICATE/CURING
    // =============================================
    getHazerSilicateCuring: builder.query<{ success: boolean; data: HazerSilicateCuring[] }, { processType?: string; status?: string }>({
      query: (params) => ({
        url: '/production/hazer-silicate-curing',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getHazerSilicateCuringById: builder.query<{ success: boolean; data: HazerSilicateCuring }, string>({
      query: (id) => `/production/hazer-silicate-curing/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getHazerSilicateCuringWIP: builder.query<{ success: boolean; data: HazerSilicateCuring[] }, void>({
      query: () => '/production/hazer-silicate-curing/wip',
      providesTags: ['ProductionOrder']
    }),

    createHazerSilicateCuring: builder.mutation<{ success: boolean; data: HazerSilicateCuring }, CreateHazerSilicateCuringRequest>({
      query: (data) => ({
        url: '/production/hazer-silicate-curing',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateHazerSilicateCuring: builder.mutation<{ success: boolean; data: HazerSilicateCuring }, { id: string; data: Partial<CreateHazerSilicateCuringRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/hazer-silicate-curing/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updateHazerSilicateCuringOutput: builder.mutation<{ success: boolean; data: { process: HazerSilicateCuring; washing?: Washing; longationStock?: LongationStock } }, { id: string; data: UpdateProcessOutputRequest }>({
      query: ({ id, data }) => ({
        url: `/production/hazer-silicate-curing/${id}/output`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // WASHING
    // =============================================
    getWashings: builder.query<{ success: boolean; data: Washing[] }, { washingType?: string; status?: string }>({
      query: (params) => ({
        url: '/production/washing',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getWashingById: builder.query<{ success: boolean; data: Washing }, string>({
      query: (id) => `/production/washing/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getWashingWIP: builder.query<{ success: boolean; data: Washing[] }, void>({
      query: () => '/production/washing/wip',
      providesTags: ['ProductionOrder']
    }),

    createWashing: builder.mutation<{ success: boolean; data: Washing }, CreateWashingRequest>({
      query: (data) => ({
        url: '/production/washing',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateWashing: builder.mutation<{ success: boolean; data: Washing }, { id: string; data: Partial<CreateWashingRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/washing/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updateWashingOutput: builder.mutation<{ success: boolean; data: { washing: Washing; finishing?: Finishing; longationStock?: LongationStock } }, { id: string; data: UpdateWashingOutputRequest }>({
      query: ({ id, data }) => ({
        url: `/production/washing/${id}/output`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // FINISHING
    // =============================================
    getFinishings: builder.query<{ success: boolean; data: Finishing[] }, { finishingType?: string; status?: string }>({
      query: (params) => ({
        url: '/production/finishing',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getFinishingById: builder.query<{ success: boolean; data: Finishing }, string>({
      query: (id) => `/production/finishing/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getFinishingWIP: builder.query<{ success: boolean; data: Finishing[] }, void>({
      query: () => '/production/finishing/wip',
      providesTags: ['ProductionOrder']
    }),

    createFinishing: builder.mutation<{ success: boolean; data: Finishing }, CreateFinishingRequest>({
      query: (data) => ({
        url: '/production/finishing',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateFinishing: builder.mutation<{ success: boolean; data: Finishing }, { id: string; data: Partial<CreateFinishingRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/finishing/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updateFinishingOutput: builder.mutation<{ success: boolean; data: { finishing: Finishing; felt?: Felt; rejectionStock?: RejectionStock } }, { id: string; data: UpdateFinishingOutputRequest }>({
      query: ({ id, data }) => ({
        url: `/production/finishing/${id}/output`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // FELT
    // =============================================
    getFelts: builder.query<{ success: boolean; data: Felt[] }, { status?: string }>({
      query: (params) => ({
        url: '/production/felt',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getFeltById: builder.query<{ success: boolean; data: Felt }, string>({
      query: (id) => `/production/felt/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getActiveFelts: builder.query<{ success: boolean; data: Felt[] }, void>({
      query: () => '/production/felt/active',
      providesTags: ['ProductionOrder']
    }),

    createFelt: builder.mutation<{ success: boolean; data: Felt }, CreateFeltRequest>({
      query: (data) => ({
        url: '/production/felt',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateFelt: builder.mutation<{ success: boolean; data: Felt }, { id: string; data: Partial<CreateFeltRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/felt/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    completeFelt: builder.mutation<{ success: boolean; data: { felt: Felt; foldingChecking?: FoldingChecking; longationStock?: LongationStock } }, { id: string; data: CompleteFeltRequest }>({
      query: ({ id, data }) => ({
        url: `/production/felt/${id}/complete`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // FOLDING + CHECKING
    // =============================================
    getFoldingCheckings: builder.query<{ success: boolean; data: FoldingChecking[] }, { qcStatus?: string; status?: string }>({
      query: (params) => ({
        url: '/production/folding-checking',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getFoldingCheckingById: builder.query<{ success: boolean; data: FoldingChecking }, string>({
      query: (id) => `/production/folding-checking/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    createFoldingChecking: builder.mutation<{ success: boolean; data: FoldingChecking }, CreateFoldingCheckingRequest>({
      query: (data) => ({
        url: '/production/folding-checking',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updateFoldingChecking: builder.mutation<{ success: boolean; data: FoldingChecking }, { id: string; data: Partial<CreateFoldingCheckingRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/folding-checking/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updateQC: builder.mutation<{ success: boolean; data: { folding: FoldingChecking; packing?: Packing; rejectionStock?: RejectionStock } }, { id: string; data: UpdateQCRequest }>({
      query: ({ id, data }) => ({
        url: `/production/folding-checking/${id}/qc`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // PACKING
    // =============================================
    getPackings: builder.query<{ success: boolean; data: Packing[] }, { status?: string; isDispatchReady?: boolean }>({
      query: (params) => ({
        url: '/production/packing',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getPackingById: builder.query<{ success: boolean; data: Packing }, string>({
      query: (id) => `/production/packing/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    getDispatchReadyPackings: builder.query<{ success: boolean; data: Packing[] }, void>({
      query: () => '/production/packing/dispatch-ready',
      providesTags: ['ProductionOrder']
    }),

    createPacking: builder.mutation<{ success: boolean; data: Packing }, CreatePackingRequest>({
      query: (data) => ({
        url: '/production/packing',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    updatePacking: builder.mutation<{ success: boolean; data: Packing }, { id: string; data: Partial<CreatePackingRequest> }>({
      query: ({ id, data }) => ({
        url: `/production/packing/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionOrder', id }]
    }),

    updatePackingDetails: builder.mutation<{ success: boolean; data: Packing }, { id: string; data: UpdatePackingRequest }>({
      query: ({ id, data }) => ({
        url: `/production/packing/${id}/packing`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // LONGATION STOCK
    // =============================================
    getLongationStocks: builder.query<{ success: boolean; data: LongationStock[] }, { sourceModule?: string; status?: string }>({
      query: (params) => ({
        url: '/production/longation-stock',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getLongationStockTotal: builder.query<{ success: boolean; data: { totalLongation: number } }, void>({
      query: () => '/production/longation-stock/total',
      providesTags: ['ProductionOrder']
    }),

    getLongationStockByLot: builder.query<{ success: boolean; data: LongationStock[] }, string>({
      query: (lotNumber) => `/production/longation-stock/lot/${lotNumber}`,
      providesTags: (result, error, lotNumber) => [{ type: 'ProductionOrder', id: lotNumber }]
    }),

    getLongationStockById: builder.query<{ success: boolean; data: LongationStock }, string>({
      query: (id) => `/production/longation-stock/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    // =============================================
    // REJECTION STOCK
    // =============================================
    getRejectionStocks: builder.query<{ success: boolean; data: RejectionStock[] }, { sourceModule?: string; status?: string }>({
      query: (params) => ({
        url: '/production/rejection-stock',
        params
      }),
      providesTags: ['ProductionOrder']
    }),

    getRejectionStockTotal: builder.query<{ success: boolean; data: { totalRejection: number } }, void>({
      query: () => '/production/rejection-stock/total',
      providesTags: ['ProductionOrder']
    }),

    getRejectionStockByLot: builder.query<{ success: boolean; data: RejectionStock[] }, string>({
      query: (lotNumber) => `/production/rejection-stock/lot/${lotNumber}`,
      providesTags: (result, error, lotNumber) => [{ type: 'ProductionOrder', id: lotNumber }]
    }),

    getRejectionStockById: builder.query<{ success: boolean; data: RejectionStock }, string>({
      query: (id) => `/production/rejection-stock/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionOrder', id }]
    }),

    updateRejectionStockStatus: builder.mutation<{ success: boolean; data: RejectionStock }, { id: string; data: UpdateRejectionStatusRequest }>({
      query: ({ id, data }) => ({
        url: `/production/rejection-stock/${id}/status`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ProductionOrder']
    }),

    // =============================================
    // LOT DETAILS (Auto-fill from any module)
    // =============================================
    getLotDetails: builder.query<{ success: boolean; data: { lotDetails: { lotNumber: string; partyName: string | null; customerId: string | null; quality: string | null; availableMeter?: number; sourceModule?: string } | null } }, string>({
      query: (lotNumber) => `/production/lot/${lotNumber}/details`,
      providesTags: (result, error, lotNumber) => [{ type: 'ProductionOrder', id: `lot-${lotNumber}` }]
    }),

    getAvailableInputMeter: builder.query<{ success: boolean; data: { availableMeter: number } }, { lotNumber: string; targetModule: 'printing' | 'hazer' | 'washing' | 'finishing' | 'felt' | 'folding' | 'packing' }>({
      query: ({ lotNumber, targetModule }) => `/production/lot/${lotNumber}/input-meter/${targetModule}`,
      providesTags: (result, error, { lotNumber, targetModule }) => [{ type: 'ProductionOrder', id: `lot-${lotNumber}-${targetModule}` }]
    })
  })
})

// Export hooks
export const {
  // Program Details
  useGetProgramDetailsQuery,
  useGetProgramDetailsByIdQuery,
  useGetProgramDetailsByOrderNumberQuery,
  useCreateProgramDetailsMutation,
  useUpdateProgramDetailsMutation,
  useDeleteProgramDetailsMutation,

  // Bleaching Process
  useGetBleachingDashboardQuery,
  useGetBleachingProcessByIdQuery,
  useCreateBleachingProcessMutation,
  useCompleteBleachingProcessMutation,
  useGenerateBleachingChallanQuery,
  useUpdateBleachingProcessMutation,

  // After Bleaching
  useGetAfterBleachingStocksQuery,
  useGetAfterBleachingByIdQuery,
  useGetLongationStockQuery,
  useSendToPrintingMutation,

  // Batch Center
  useGetBatchCentersQuery,
  useGetBatchCenterByIdQuery,
  useGetPartyNameByLotQuery,
  useCreateBatchCenterMutation,
  useUpdateReceivedMeterMutation,
  useUpdateBatchCenterMutation,

  // Printing
  useGetPrintingsQuery,
  useGetPrintingByIdQuery,
  useGetPrintingWIPQuery,
  useCreatePrintingMutation,
  useUpdatePrintingMutation,
  useUpdatePrintingOutputMutation,

  // Hazer/Silicate/Curing
  useGetHazerSilicateCuringQuery,
  useGetHazerSilicateCuringByIdQuery,
  useGetHazerSilicateCuringWIPQuery,
  useCreateHazerSilicateCuringMutation,
  useUpdateHazerSilicateCuringMutation,
  useUpdateHazerSilicateCuringOutputMutation,

  // Washing
  useGetWashingsQuery,
  useGetWashingByIdQuery,
  useGetWashingWIPQuery,
  useCreateWashingMutation,
  useUpdateWashingMutation,
  useUpdateWashingOutputMutation,

  // Finishing
  useGetFinishingsQuery,
  useGetFinishingByIdQuery,
  useGetFinishingWIPQuery,
  useCreateFinishingMutation,
  useUpdateFinishingMutation,
  useUpdateFinishingOutputMutation,

  // Felt
  useGetFeltsQuery,
  useGetFeltByIdQuery,
  useGetActiveFeltsQuery,
  useCreateFeltMutation,
  useUpdateFeltMutation,
  useCompleteFeltMutation,

  // Folding + Checking
  useGetFoldingCheckingsQuery,
  useGetFoldingCheckingByIdQuery,
  useCreateFoldingCheckingMutation,
  useUpdateFoldingCheckingMutation,
  useUpdateQCMutation,

  // Packing
  useGetPackingsQuery,
  useGetPackingByIdQuery,
  useGetDispatchReadyPackingsQuery,
  useCreatePackingMutation,
  useUpdatePackingMutation,
  useUpdatePackingDetailsMutation,

  // Longation Stock
  useGetLongationStocksQuery,
  useGetLongationStockTotalQuery,
  useGetLongationStockByLotQuery,
  useGetLongationStockByIdQuery,

  // Rejection Stock
  useGetRejectionStocksQuery,
  useGetRejectionStockTotalQuery,
  useGetRejectionStockByLotQuery,
  useGetRejectionStockByIdQuery,
  useUpdateRejectionStockStatusMutation,

  // Lot Details
  useGetLotDetailsQuery,
  useGetAvailableInputMeterQuery
} = productionModulesApi

