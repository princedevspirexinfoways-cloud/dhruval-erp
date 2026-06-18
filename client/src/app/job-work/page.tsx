'use client'

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
    useGetJobWorksQuery,
    useGetJobWorkStatsQuery,
    useCreateJobWorkMutation,
    useUpdateJobWorkMutation,
    useDeleteJobWorkMutation,
    type JobWork,
    type JobWorkFilters
} from '@/lib/api/jobWorkApi'
import { useGetJobWorkTypesQuery } from '@/lib/api/jobWorkTypeApi'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Briefcase,
    Plus,
    Search,
    Filter,
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Edit,
    Trash2,
    Eye,
    Package,
    ArrowRight,
    Download,
    Truck
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { selectTheme } from '@/lib/features/ui/uiSlice'
import { JobWorkFormModal } from '@/components/job-work/JobWorkFormModal'
import { CreateJobWorkRequest, UpdateJobWorkRequest } from '@/lib/api/jobWorkApi'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'


const STATUS_COLORS = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    on_hold: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    quality_check: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
}

export default function JobWorkPage() {
    const theme = useSelector(selectTheme)
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [typeFilter, setTypeFilter] = useState<string>('')
    const [paymentFilter, setPaymentFilter] = useState<string>('')
    const [page, setPage] = useState(1)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedJobWork, setSelectedJobWork] = useState<JobWork | null>(null)
    const [showTransportModal, setShowTransportModal] = useState(false)
    const [transportJobWork, setTransportJobWork] = useState<JobWork | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const filters: JobWorkFilters = {
        status: statusFilter || undefined,
        jobWorkType: typeFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        page,
        limit: 10
    }

    const { data: jobWorksData, isLoading, refetch } = useGetJobWorksQuery(filters)
    const { data: statsData } = useGetJobWorkStatsQuery({})
    const { data: jobWorkTypesData } = useGetJobWorkTypesQuery({})
    const [createJobWork] = useCreateJobWorkMutation()
    const [updateJobWork] = useUpdateJobWorkMutation()
    const [deleteJobWork] = useDeleteJobWorkMutation()

    const jobWorkTypes = jobWorkTypesData?.data || []

    const jobWorks = (jobWorksData?.data as any)?.data || []
    const stats = statsData?.data
    const pagination = (jobWorksData?.data as any)?.pagination

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this job work?')) {
            try {
                await deleteJobWork(id).unwrap()
                toast.success('Job work deleted successfully')
                refetch()
            } catch (error: any) {
                console.error('Failed to delete job work:', error)
                toast.error(error?.data?.message || 'Failed to delete job work. Please try again.')
            }
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateJobWork({
                id,
                data: { status: newStatus }
            }).unwrap()
            toast.success(`Status updated to ${newStatus.replace('_', ' ')} successfully`)
            refetch()
        } catch (error: any) {
            console.error('Failed to update status:', error)
            toast.error(error?.data?.message || 'Failed to update status. Please try again.')
        }
    }

    const handleFormSubmit = async (data: CreateJobWorkRequest | UpdateJobWorkRequest) => {
        try {
            if (selectedJobWork) {
                // Update existing job work
                await updateJobWork({
                    id: selectedJobWork._id,
                    data: data as UpdateJobWorkRequest
                }).unwrap()
                toast.success('Job work updated successfully')
            } else {
                // Create new job work
                await createJobWork(data as CreateJobWorkRequest).unwrap()
                toast.success('Job work created successfully')
            }
            refetch()
            setShowCreateModal(false)
            setSelectedJobWork(null)
        } catch (error: any) {
            console.error('Failed to save job work:', error)
            toast.error(error?.data?.message || 'Failed to save job work. Please try again.')
            throw error
        }
    }

    const handleCloseModal = () => {
        setShowCreateModal(false)
        setSelectedJobWork(null)
    }

    const handleDownloadChallan = async (jobWork: JobWork) => {
        try {
            toast.loading('Downloading challan...', { id: 'download-challan' })
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
            const response = await fetch(`${baseUrl}/job-work/${jobWork._id}/challan/pdf`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!response.ok) {
                console.error('Failed to download challan:', response.statusText)
                toast.error('Failed to download challan. Please try again.', { id: 'download-challan' })
                return
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `JobWork-Challan-${(jobWork as any).challanNumber || jobWork._id}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Challan downloaded successfully', { id: 'download-challan' })
        } catch (error) {
            console.error('Error downloading challan:', error)
            toast.error('Error downloading challan. Please try again.', { id: 'download-challan' })
        }
    }

    if (!isClient) {
        return (
            <AppLayout>
                <div className="space-y-6">
                    <div className="animate-pulse">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Job Work Management"
                    description="Manage and track all job work assignments"
                    icon={<Briefcase className="h-6 w-6" />}
                    variant="indigo"
                >
                    <Button
                        className="bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-indigo-200 dark:border-indigo-700"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job Work
                    </Button>
                </PageHeader>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-2 border-sky-500 dark:border-sky-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                                Total Job Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalJobWorks || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-500 dark:border-blue-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.inProgressJobWorks || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-500 dark:border-green-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.completedJobWorks || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-500 dark:border-orange-400 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                Pending Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(stats?.pendingPayments || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-2 border-sky-500 dark:border-sky-400">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-sky-200 dark:border-sky-700 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="quality_check">Quality Check</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Work Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-sky-200 dark:border-sky-700 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">All Types</option>
                                    {jobWorkTypes
                                        .filter((type: any) => type.isActive)
                                        .map((type: any) => (
                                            <option key={type._id} value={type.name}>
                                                {type.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-sky-200 dark:border-sky-700 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">All Payments</option>
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatusFilter('')
                                        setTypeFilter('')
                                        setPaymentFilter('')
                                        setSearchTerm('')
                                    }}
                                    className="w-full"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Job Works Table */}
                <Card className="border-2 border-sky-500 dark:border-sky-400 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-b-2 border-sky-200 dark:border-sky-700">
                        <CardTitle className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                            <Briefcase className="h-5 w-5 mr-2 text-sky-600 dark:text-sky-400" />
                            Job Works List
                            {jobWorks.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {jobWorks.length} {jobWorks.length === 1 ? 'record' : 'records'}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 dark:border-sky-400 mx-auto mb-4"></div>
                                <div className="text-gray-600 dark:text-gray-400">Loading job works...</div>
                            </div>
                        ) : jobWorks.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <div className="text-gray-600 dark:text-gray-300 text-lg mb-2">No job works found</div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm">Create your first job work to get started</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Worker</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Type</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Quantity</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Expected Delivery</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Cost</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Payment</th>
                                            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobWorks.map((jobWork: JobWork) => (
                                            <tr key={jobWork._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-sky-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{jobWork.jobWorkerName}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                        <DollarSign className="h-3 w-3 mr-1" />
                                                        Rate: {formatCurrency(jobWork.jobWorkerRate)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="capitalize font-medium">
                                                        {jobWork.jobWorkType}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {jobWork.quantity} {jobWork.unit}
                                                    </div>
                                                    {jobWork.materialProvided && jobWork.materialProvided.length > 0 && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {jobWork.materialProvided.length} material{jobWork.materialProvided.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={`${STATUS_COLORS[jobWork.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'} font-medium`}>
                                                        {jobWork.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-gray-900 dark:text-white flex items-center">
                                                        <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                                        {formatDate(jobWork.expectedDelivery)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                                                        <DollarSign className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
                                                        {formatCurrency(jobWork.jobWorkCost || 0)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={
                                                            jobWork.paymentStatus === 'paid'
                                                                ? 'default'
                                                                : jobWork.paymentStatus === 'partial'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                        }
                                                        className="font-medium capitalize"
                                                    >
                                                        {jobWork.paymentStatus}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/job-work/${jobWork._id}`)}
                                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadChallan(jobWork)}
                                                            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all"
                                                            title="Download Challan PDF"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setTransportJobWork(jobWork)
                                                                setShowTransportModal(true)
                                                            }}
                                                            className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 hover:text-orange-700 dark:hover:text-orange-300 transition-all"
                                                            title="Transport Details"
                                                        >
                                                            <Truck className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedJobWork(jobWork)
                                                                setShowCreateModal(true)
                                                            }}
                                                            className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-300 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(jobWork._id)}
                                                            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="mt-4 p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} job works
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const pageNum = i + 1
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    variant={page === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    <Button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= pagination.totalPages}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Job Work Form Modal */}
                <JobWorkFormModal
                    isOpen={showCreateModal}
                    onClose={handleCloseModal}
                    onSubmit={handleFormSubmit}
                    jobWork={selectedJobWork}
                    isLoading={false}
                />

                {/* Transport Details Modal */}
                {showTransportModal && transportJobWork && (
                    <TransportDetailsModal
                        isOpen={showTransportModal}
                        onClose={() => {
                            setShowTransportModal(false)
                            setTransportJobWork(null)
                        }}
                        jobWork={transportJobWork}
                        onUpdate={async (transportName: string, transportNumber: string) => {
                            try {
                                await updateJobWork({
                                    id: transportJobWork._id,
                                    data: {
                                        transportName,
                                        transportNumber
                                    } as UpdateJobWorkRequest
                                }).unwrap()
                                toast.success('Transport details updated successfully')
                                refetch()
                                setShowTransportModal(false)
                                setTransportJobWork(null)
                            } catch (error: any) {
                                toast.error(error?.data?.message || 'Failed to update transport details')
                            }
                        }}
                    />
                )}
            </div>
        </AppLayout>
    )
}

// Transport Details Modal Component
function TransportDetailsModal({
    isOpen,
    onClose,
    jobWork,
    onUpdate
}: {
    isOpen: boolean
    onClose: () => void
    jobWork: JobWork
    onUpdate: (transportName: string, transportNumber: string) => Promise<void>
}) {
    const theme = useSelector(selectTheme)
    const [transportName, setTransportName] = React.useState(jobWork.transportName || '')
    const [transportNumber, setTransportNumber] = React.useState(jobWork.transportNumber || '')
    const [isUpdating, setIsUpdating] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setTransportName(jobWork.transportName || '')
            setTransportNumber(jobWork.transportNumber || '')
        }
    }, [isOpen, jobWork])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            await onUpdate(transportName, transportNumber)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`sm:max-w-[500px] ${theme === 'dark' ? '!bg-gray-800 !text-white !border-gray-700' : '!bg-white !text-gray-900 !border-gray-200'}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <Truck className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                        Transport Details
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="transportName" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Transport Name
                        </Label>
                        <Input
                            id="transportName"
                            value={transportName}
                            onChange={(e) => setTransportName(e.target.value)}
                            placeholder="Enter Transport Name"
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <div>
                        <Label htmlFor="transportNumber" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                            Transport Number
                        </Label>
                        <Input
                            id="transportNumber"
                            value={transportNumber}
                            onChange={(e) => setTransportNumber(e.target.value)}
                            placeholder="Enter Transport Number"
                            className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isUpdating}
                            className={theme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {isUpdating ? 'Updating...' : 'Update Transport Details'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

