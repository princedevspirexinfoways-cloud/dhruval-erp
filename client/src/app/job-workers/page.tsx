'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { Plus, Users, Briefcase, Package, TrendingUp } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import {
    useGetWorkersQuery,
    useCreateWorkerMutation,
    useUpdateWorkerMutation,
    useDeleteWorkerMutation,
    JobWorker,
    JobWorkerFilters
} from '@/lib/api/jobWorkerApi'
import { JobWorkersList } from '@/components/job-workers/JobWorkersList'
import { JobWorkerFormModal } from '@/components/job-workers/JobWorkerFormModal'
import { ClientOnly } from '@/components/ui/ClientOnly'

export default function JobWorkersPage() {
    const router = useRouter()
    const user = useSelector(selectCurrentUser)

    // State management
    const [filters, setFilters] = useState<JobWorkerFilters>({
        isActive: true,
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
    })

    const [modals, setModals] = useState({
        createWorker: false,
        editWorker: false,
        viewWorker: false,
        deleteWorker: false
    })

    const [selectedWorker, setSelectedWorker] = useState<JobWorker | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // API hooks
    const { data: workersData, isLoading, refetch } = useGetWorkersQuery({
        ...filters,
        search: searchTerm || undefined
    })

    const [createWorker, { isLoading: createLoading }] = useCreateWorkerMutation()
    const [updateWorker, { isLoading: updateLoading }] = useUpdateWorkerMutation()
    const [deleteWorker, { isLoading: deleteLoading }] = useDeleteWorkerMutation()

    // Modal handlers
    const openModal = (modalName: keyof typeof modals, worker?: JobWorker) => {
        if (worker) setSelectedWorker(worker)
        setModals(prev => ({ ...prev, [modalName]: true }))
    }

    const closeModal = (modalName: keyof typeof modals) => {
        setModals(prev => ({ ...prev, [modalName]: false }))
        if (modalName !== 'viewWorker') {
            setSelectedWorker(null)
        }
    }

    // CRUD handlers
    const handleCreateWorker = async (workerData: any) => {
        try {
            await createWorker(workerData).unwrap()
            toast.success('Worker created successfully')
            closeModal('createWorker')
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to create worker')
        }
    }

    const handleUpdateWorker = async (workerData: any) => {
        if (!selectedWorker) return
        try {
            await updateWorker({ id: selectedWorker._id, data: workerData }).unwrap()
            toast.success('Worker updated successfully')
            closeModal('editWorker')
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to update worker')
        }
    }

    const handleDeleteWorker = async () => {
        if (!selectedWorker) return
        try {
            await deleteWorker(selectedWorker._id).unwrap()
            toast.success('Worker deleted successfully')
            closeModal('deleteWorker')
            refetch()
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to delete worker')
        }
    }

    const workers = workersData?.data || []
    const total = workersData?.total || 0
    const pagination = workersData ? {
        page: workersData.page || 1,
        limit: workersData.limit || 20,
        total: workersData.total || 0,
        totalPages: workersData.totalPages || 1
    } : undefined

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page })
    }

    // Stats
    const statsCards = [
        {
            title: 'Total Workers',
            value: total.toString(),
            icon: Users,
            change: { value: 0, type: 'neutral' as const }
        },
        {
            title: 'Active Workers',
            value: workers.filter(w => w.status === 'active' && w.isActive).length.toString(),
            icon: TrendingUp,
            change: { value: 0, type: 'neutral' as const }
        },
        {
            title: 'Inactive Workers',
            value: workers.filter(w => w.status === 'inactive' || !w.isActive).length.toString(),
            icon: Users,
            change: { value: 0, type: 'neutral' as const }
        }
    ]

    return (
        <AppLayout>
            <ClientOnly>
                <div className="space-y-6">
                    {/* Page Header */}
                    <PageHeader
                        title="Job Workers"
                        description="Manage job workers, their assignments, and material tracking"
                    >
                        <Button
                            onClick={() => openModal('createWorker')}
                            className="flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Worker</span>
                        </Button>
                    </PageHeader>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {statsCards.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {stat.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <stat.icon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Workers List */}
                    <JobWorkersList
                        workers={workers}
                        isLoading={isLoading}
                        searchTerm={searchTerm}
                        onSearchChange={(value) => {
                            setSearchTerm(value)
                            setFilters({ ...filters, search: value || undefined, page: 1 })
                        }}
                        filters={filters}
                        onFiltersChange={setFilters}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onViewWorker={(worker) => {
                            router.push(`/job-workers/${worker._id}`)
                        }}
                        onEditWorker={(worker) => openModal('editWorker', worker)}
                        onDeleteWorker={(worker) => openModal('deleteWorker', worker)}
                    />

                    {/* Modals */}
                    <JobWorkerFormModal
                        isOpen={modals.createWorker}
                        onClose={() => closeModal('createWorker')}
                        onSubmit={handleCreateWorker}
                        isLoading={createLoading}
                    />

                    <JobWorkerFormModal
                        isOpen={modals.editWorker}
                        onClose={() => closeModal('editWorker')}
                        onSubmit={handleUpdateWorker}
                        worker={selectedWorker || undefined}
                        isLoading={updateLoading}
                        isEdit={true}
                    />

                    {modals.deleteWorker && selectedWorker && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                                <h3 className="text-lg font-semibold mb-4">Delete Worker</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete {selectedWorker.name}? This action cannot be undone.
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => closeModal('deleteWorker')}
                                        disabled={deleteLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeleteWorker}
                                        disabled={deleteLoading}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {deleteLoading ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ClientOnly>
        </AppLayout>
    )
}

