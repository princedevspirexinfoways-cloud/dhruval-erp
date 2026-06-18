import { baseApi } from '@/lib/api/baseApi';
import { Subcategory, CreateSubcategoryRequest, UpdateSubcategoryRequest } from '../types/subcategory.types';

export const subcategoryApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        // Get all subcategories
        getSubcategories: builder.query<
            { success: boolean; data: Subcategory[] },
            { categoryId?: string; companyId?: string; search?: string; isActive?: boolean }
        >({
            query: (params) => ({
                url: '/subcategories',
                method: 'GET',
                params,
            }),
            providesTags: ['Subcategories'],
        }),

        // Get subcategories by category ID
        getSubcategoriesByCategory: builder.query<
            { success: boolean; data: Subcategory[] },
            string
        >({
            query: (categoryId) => ({
                url: `/subcategories/category/${categoryId}`,
                method: 'GET',
            }),
            providesTags: (result, error, categoryId) => [
                { type: 'Subcategories', id: `CATEGORY_${categoryId}` },
                'Subcategories',
            ],
        }),

        // Get subcategory by ID
        getSubcategoryById: builder.query<
            { success: boolean; data: Subcategory },
            string
        >({
            query: (id) => ({
                url: `/subcategories/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Subcategories', id }],
        }),

        // Create subcategory
        createSubcategory: builder.mutation<
            { success: boolean; data: Subcategory; message: string },
            CreateSubcategoryRequest
        >({
            query: (data) => ({
                url: '/subcategories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Subcategories'],
        }),

        // Update subcategory
        updateSubcategory: builder.mutation<
            { success: boolean; data: Subcategory; message: string },
            { id: string; data: UpdateSubcategoryRequest }
        >({
            query: ({ id, data }) => ({
                url: `/subcategories/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                'Subcategories',
                { type: 'Subcategories', id },
            ],
        }),

        // Delete subcategory
        deleteSubcategory: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (id) => ({
                url: `/subcategories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Subcategories'],
        }),
    }),
});

export const {
    useGetSubcategoriesQuery,
    useGetSubcategoriesByCategoryQuery,
    useGetSubcategoryByIdQuery,
    useCreateSubcategoryMutation,
    useUpdateSubcategoryMutation,
    useDeleteSubcategoryMutation,
} = subcategoryApi;
















