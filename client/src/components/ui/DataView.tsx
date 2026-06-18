import React from 'react';
import { ViewMode } from './ViewToggle';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
}

interface DataViewProps<T> {
  data: T[];
  columns: Column[];
  viewMode: ViewMode;
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
  renderGridCard?: (item: T, index: number) => React.ReactNode;
  gridClassName?: string;
  tableClassName?: string;
  theme?: 'light' | 'dark';
}

export function DataView<T extends { _id?: string; id?: string }>({
  data,
  columns,
  viewMode,
  loading = false,
  emptyMessage = 'No data available',
  onItemClick,
  renderGridCard,
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  tableClassName = 'min-w-full divide-y divide-gray-200',
  theme = 'light'
}: DataViewProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className={gridClassName}>
        {data.map((item, index) => {
          const key = item._id || item.id || index;
          return (
            <div
              key={key}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 ${
                onItemClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onItemClick?.(item)}
            >
              {renderGridCard ? renderGridCard(item, index) : (
                <DefaultGridCard item={item} columns={columns} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // List view (table)
  return (
    <div className={`rounded-lg shadow ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="w-full overflow-x-auto">
        <table className={tableClassName}>
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' 
                      ? 'text-gray-300' 
                      : 'text-gray-500'
                  } ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${
            theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
          } divide-y`}>
            {data.map((item, index) => {
              const key = item._id || item.id || index;
              return (
                <tr
                  key={key}
                  className={`${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${onItemClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onItemClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                      } ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render(getNestedValue(item, column.key), item)
                        : getNestedValue(item, column.key) || 'N/A'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Default grid card component
function DefaultGridCard<T>({ item, columns }: { item: T; columns: Column[] }) {
  return (
    <div className="p-6">
      {columns.slice(0, 4).map((column) => (
        <div key={column.key} className="mb-3 last:mb-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {column.label}
          </div>
          <div className="text-sm text-gray-900">
            {column.render
              ? column.render(getNestedValue(item, column.key), item)
              : getNestedValue(item, column.key) || 'N/A'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export default DataView;
