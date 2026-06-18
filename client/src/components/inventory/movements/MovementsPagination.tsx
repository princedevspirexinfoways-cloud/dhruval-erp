'use client'

import { Pagination } from './types'

interface MovementsPaginationProps {
  theme: 'light' | 'dark'
  pagination: Pagination
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function MovementsPagination({
  theme,
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange
}: MovementsPaginationProps) {
  if (!pagination || pagination.pages <= 1) {
    return null
  }

  return (
    <div className={`rounded-xl border shadow-lg p-4 transition-theme ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-sky-200'
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} movements
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange(1) // Reset to first page when changing page size
              }}
              className={`px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-theme ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-gray-100'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>per page</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1}
            className={`px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                : 'border-sky-300 bg-white text-gray-900 hover:bg-sky-50'
            }`}
            title="First Page"
          >
            «
          </button>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={`px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                : 'border-sky-300 bg-white text-gray-900 hover:bg-sky-50'
            }`}
          >
            Previous
          </button>
          <span className={`text-sm px-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className={`px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                : 'border-sky-300 bg-white text-gray-900 hover:bg-sky-50'
            }`}
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(pagination.pages)}
            disabled={pagination.page >= pagination.pages}
            className={`px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
                : 'border-sky-300 bg-white text-gray-900 hover:bg-sky-50'
            }`}
            title="Last Page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
















