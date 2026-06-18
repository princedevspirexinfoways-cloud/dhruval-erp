import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface InventoryPaginationProps {
  pagination: Pagination
  currentPage: number
  onPageChange: (page: number) => void
  theme?: 'light' | 'dark'
}

export function InventoryPagination({
  pagination,
  currentPage,
  onPageChange,
  theme = 'light'
}: InventoryPaginationProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className={clsx(
      "px-6 py-4 flex items-center justify-between border-t rounded-b-xl",
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-indigo-50 border-indigo-200'
    )}>
      <div className={clsx(
        "text-sm",
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
        items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
          {pagination.totalPages > 5 && (
            <>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>...</span>
              <Button
                onClick={() => onPageChange(pagination.totalPages)}
                variant={currentPage === pagination.totalPages ? 'default' : 'outline'}
                size="sm"
                className={clsx(
                  "w-8 h-8 p-0",
                  theme === 'dark' && currentPage === pagination.totalPages
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : ''
                )}
              >
                {pagination.totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pagination.totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
}




