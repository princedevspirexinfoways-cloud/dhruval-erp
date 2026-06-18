'use client'

import React, { useState } from 'react'
import { Search, Filter, Eye, Edit, Trash2, Phone, Mail, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { JobWorker, JobWorkerFilters } from '@/lib/api/jobWorkerApi'

interface JobWorkersListProps {
    workers: JobWorker[]
    isLoading: boolean
    searchTerm: string
    onSearchChange: (value: string) => void
    filters: JobWorkerFilters
    onFiltersChange: (filters: JobWorkerFilters) => void
    onViewWorker: (worker: JobWorker) => void
    onEditWorker: (worker: JobWorker) => void
    onDeleteWorker: (worker: JobWorker) => void
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    onPageChange?: (page: number) => void
}

export const JobWorkersList: React.FC<JobWorkersListProps> = ({
    workers,
    isLoading,
    searchTerm,
    onSearchChange,
    filters,
    onFiltersChange,
    pagination,
    onPageChange,
    onViewWorker,
    onEditWorker,
    onDeleteWorker
}) => {
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<string>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
        onFiltersChange({
            ...filters,
            sortBy: field,
            sortOrder: sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
        })
    }

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive || status === 'inactive') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Inactive
                </span>
            )
        }
        if (status === 'suspended') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    Suspended
                </span>
            )
        }
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Active
            </span>
        )
    }

    const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center space-x-1 hover:text-sky-600 dark:hover:text-sky-400"
        >
            <span>{children}</span>
            <ArrowUpDown className="w-3 h-3" />
        </button>
    )

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workers...</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search workers by name, code, or phone..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined, page: 1 })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Active Only
                            </label>
                            <select
                                value={filters.isActive === undefined ? '' : filters.isActive ? 'true' : 'false'}
                                onChange={(e) => onFiltersChange({
                                    ...filters,
                                    isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                                    page: 1
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All</option>
                                <option value="true">Active Only</option>
                                <option value="false">Inactive Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Specialization
                            </label>
                            <select
                                value={filters.specialization || ''}
                                onChange={(e) => onFiltersChange({ ...filters, specialization: e.target.value || undefined, page: 1 })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All Specializations</option>
                                <option value="printing">Printing</option>
                                <option value="dyeing">Dyeing</option>
                                <option value="washing">Washing</option>
                                <option value="finishing">Finishing</option>
                                <option value="cutting">Cutting</option>
                                <option value="packing">Packing</option>
                                <option value="stitching">Stitching</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <SortButton field="name">Worker</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Specialization
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <SortButton field="status">Status</SortButton>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {workers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No workers found
                                </td>
                            </tr>
                        ) : (
                            workers.map((worker) => (
                                <tr key={worker._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {worker.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {worker.workerCode}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span>{worker.phoneNumber}</span>
                                            </div>
                                            {worker.email && (
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-500 dark:text-gray-400">{worker.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {worker.specialization && worker.specialization.length > 0 ? (
                                                worker.specialization.slice(0, 2).map((spec, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs font-medium rounded bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300"
                                                    >
                                                        {spec}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                            )}
                                            {worker.specialization && worker.specialization.length > 2 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    +{worker.specialization.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(worker.status, worker.isActive)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewWorker(worker)}
                                                className="flex items-center space-x-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditWorker(worker)}
                                                className="flex items-center space-x-1"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDeleteWorker(worker)}
                                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && onPageChange && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={onPageChange}
                        onLimitChange={(limit) => onFiltersChange({ ...filters, limit, page: 1 })}
                    />
                </div>
            )}
        </div>
    )
}
