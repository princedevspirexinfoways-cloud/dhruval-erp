import { baseApi } from '@/lib/api/baseApi';
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '../types/unit.types';

export const unitApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        // Get all units
        getUnits: builder.query<
            { success: boolean; data: Unit[]; total: number },
            { companyId?: string; includeInactive?: boolean }
        >({
            query: (params) => ({
                url: '/units',
                method: 'GET',
                params,
            }),
            providesTags: ['Units'],
        }),

        // Get unit by ID
        getUnitById: builder.query<
            { success: boolean; data: Unit },
            string
        >({
            query: (id) => ({
                url: `/units/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Units', id }],
        }),

        // Create unit
        createUnit: builder.mutation<
            { success: boolean; data: Unit; message: string },
            CreateUnitRequest
        >({
            query: (data) => ({
                url: '/units',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Units'],
        }),

        // Update unit
        updateUnit: builder.mutation<
            { success: boolean; data: Unit; message: string },
            { id: string; data: UpdateUnitRequest }
        >({
            query: ({ id, data }) => ({
                url: `/units/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                'Units',
                { type: 'Units', id },
            ],
        }),

        // Delete unit
        deleteUnit: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (id) => ({
                url: `/units/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Units'],
        }),

        // Convert quantity between units
        convertQuantity: builder.mutation<
            {
                success: boolean;
                data: {
                    originalQuantity: number;
                    convertedQuantity: number;
                    fromUnitId: string;
                    toUnitId: string;
                };
            },
            { quantity: number; fromUnitId: string; toUnitId: string }
        >({
            query: (data) => ({
                url: '/units/convert',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useGetUnitsQuery,
    useGetUnitByIdQuery,
    useCreateUnitMutation,
    useUpdateUnitMutation,
    useDeleteUnitMutation,
    useConvertQuantityMutation,
} = unitApi;
