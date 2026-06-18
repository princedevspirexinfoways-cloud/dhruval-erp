import { baseApi } from '@/lib/api/baseApi';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types';

export const categoryApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        // Get all categories
        getCategories: builder.query<
            { success: boolean; data: Category[]; total: number },
            { companyId?: string; includeInactive?: boolean }
        >({
            query: (params) => ({
                url: '/categories',
                method: 'GET',
                params,
            }),
            providesTags: ['Categories'],
        }),

        // Get category by ID
        getCategoryById: builder.query<
            { success: boolean; data: Category },
            string
        >({
            query: (id) => ({
                url: `/categories/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Categories', id }],
        }),

        // Create category
        createCategory: builder.mutation<
            { success: boolean; data: Category; message: string },
            CreateCategoryRequest
        >({
            query: (data) => ({
                url: '/categories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Categories'],
        }),

        // Update category
        updateCategory: builder.mutation<
            { success: boolean; data: Category; message: string },
            { id: string; data: UpdateCategoryRequest }
        >({
            query: ({ id, data }) => ({
                url: `/categories/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                'Categories',
                { type: 'Categories', id },
            ],
        }),

        // Delete category
        deleteCategory: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (id) => ({
                url: `/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Categories'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;
