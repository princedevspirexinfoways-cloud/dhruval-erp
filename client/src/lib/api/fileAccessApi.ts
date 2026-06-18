import { baseApi } from './baseApi';

export interface FileAccessResponse {
  success: boolean;
  data: {
    viewUrl: string;
    expiresIn: number;
    expiresAt: string;
  };
  message: string;
}

export const fileAccessApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Generate presigned URL for viewing a file
    generateViewUrl: builder.mutation<
      FileAccessResponse,
      { fileKey: string; expiresIn?: number }
    >({
      query: ({ fileKey, expiresIn = 3600 }) => ({
        url: '/file-access/view-url',
        method: 'POST',
        body: { fileKey, expiresIn },
      }),
    }),

    // Get file access URL (redirects to presigned URL)
    getFileAccessUrl: builder.query<
      { success: boolean; message: string },
      { fileKey: string; expiresIn?: number }
    >({
      query: ({ fileKey, expiresIn = 3600 }) => ({
        url: `/file-access/${encodeURIComponent(fileKey)}`,
        method: 'GET',
        params: { expiresIn },
      }),
    }),
  }),
});

export const {
  useGenerateViewUrlMutation,
  useGetFileAccessUrlQuery,
} = fileAccessApi;



