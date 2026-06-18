'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Edit, Plus, Package, TrendingUp, TrendingDown, RotateCcw, Briefcase } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { selectCurrentUser } from '@/lib/features/auth/authSlice'
import {
    useGetWorkerWithSummaryQuery,
    useGetAssignmentsByWorkerQuery,
    useGetMaterialTrackingReportQuery
} from '@/lib/api/jobWorkerApi'
import { ClientOnly } from '@/components/ui/ClientOnly'

export default function JobWorkerDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const workerId = params.id as string
    const user = useSelector(selectCurrentUser)

    const [assignmentFilters, setAssignmentFilters] = useState({
        status: '',
        jobType: '',
        dateFrom: '',
        dateTo: ''
    })

    const { data: workerData, isLoading: workerLoading } = useGetWorkerWithSummaryQuery(workerId)
    const { data: assignmentsData, isLoading: assignmentsLoading } = useGetAssignmentsByWorkerQuery({
        workerId,
        ...assignmentFilters
    })
    const { data: materialReport, isLoading: materialLoading } = useGetMaterialTrackingReportQuery({
        workerId
    })

    const worker = workerData?.data?.worker
    const assignments = assignmentsData?.data || []
    const materials = materialReport?.data || []

    // Derived stats for header cards (real-time from assignments & materials)
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter((a: any) =>
        ['assigned', 'in_progress', 'on_hold'].includes(a.status)
    ).length

    const totalMaterialsRemaining =
        materials.reduce(
            (sum: number, m: any) => sum + (m.totalRemaining ?? m.quantityRemaining ?? 0),
            0
        ) || 0

    const totalAmountPending =
        assignments.reduce((sum: number, a: any) => {
            if (a.paymentStatus === 'pending' || a.paymentStatus === 'partial') {
                return sum + (a.totalAmount || 0)
            }
            return sum
        }, 0) || 0

    if (workerLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                </div>
            </AppLayout>
        )
    }

    if (!worker) {
        return (
            <AppLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Worker not found</p>
                    <Button onClick={() => router.push('/job-workers')} className="mt-4">
                        Back to Workers
                    </Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <ClientOnly>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/job-workers')}
                                className="flex items-center space-x-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{worker.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{worker.workerCode}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/job-workers?edit=${workerId}`)}
                                className="flex items-center space-x-2"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {totalAssignments}
                                    </p>
                                </div>
                                <Briefcase className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Assignments</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {activeAssignments}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Materials Remaining</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {totalMaterialsRemaining.toFixed(2)}
                                    </p>
                                </div>
                                <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payment</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        ₹{totalAmountPending.toFixed(2)}
                                    </p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>

                    {/* Worker Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Worker Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                                <p className="text-base text-gray-900 dark:text-white mt-1">{worker.phoneNumber}</p>
                            </div>
                            {worker.email && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-base text-gray-900 dark:text-white mt-1">{worker.email}</p>
                                </div>
                            )}
                            {worker.address?.fullAddress && (
                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-base text-gray-900 dark:text-white mt-1">{worker.address.fullAddress}</p>
                                </div>
                            )}
                            {worker.specialization && worker.specialization.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Specialization</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {worker.specialization.map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 text-xs font-medium rounded bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {worker.skillLevel && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Skill Level</p>
                                    <p className="text-base text-gray-900 dark:text-white mt-1 capitalize">{worker.skillLevel}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Complete Materials Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        {/* Assignment-wise Material Details */}
                        {assignments.length > 0 && (
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                                    Materials by Assignment (Detailed View)
                                </h3>
                                <div className="space-y-4">
                                    {assignments.map((assignment) => {
                                        const assignmentMaterials = assignment.materials || []
                                        const assignmentTotalGiven = assignmentMaterials.reduce(
                                            (sum: number, m: any) => sum + (m.quantityGiven || 0),
                                            0
                                        )
                                        const assignmentTotalUsed = assignmentMaterials.reduce(
                                            (sum: number, m: any) => sum + (m.quantityUsed || 0),
                                            0
                                        )
                                        const assignmentTotalReturned = assignmentMaterials.reduce(
                                            (sum: number, m: any) => sum + (m.quantityReturned || 0),
                                            0
                                        )
                                        const assignmentTotalRemaining = assignmentMaterials.reduce(
                                            (sum: number, m: any) => sum + (m.quantityRemaining || 0),
                                            0
                                        )

                                        return (
                                            <div
                                                key={assignment._id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {assignment.assignmentNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            {assignment.jobType} •{' '}
                                                            {new Date(assignment.assignedDate).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1 text-xs font-medium rounded-full ${assignment.status === 'completed'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : assignment.status === 'in_progress'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {assignment.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Assignment Summary */}
                                                {assignmentMaterials.length > 0 && (
                                                    <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {assignmentTotalGiven.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Used</p>
                                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                                                {assignmentTotalUsed.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Returned</p>
                                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                {assignmentTotalReturned.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                                                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                                                {assignmentTotalRemaining.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {assignmentMaterials.length > 0 && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Item Name
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Unit
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Assigned
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Used
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Returned
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Remaining
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                        Wasted
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                                {assignmentMaterials.map((mat: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                        <td className="px-3 py-2">
                                                                            <div className="text-gray-900 dark:text-white font-medium">
                                                                                {mat.itemName}
                                                                            </div>
                                                                            {mat.itemCode && (
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {mat.itemCode}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                                                            {mat.unit}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-semibold">
                                                                            {(mat.quantityGiven || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 font-semibold">
                                                                            {(mat.quantityUsed || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                                                                            {(mat.quantityReturned || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400 font-bold">
                                                                            {(mat.quantityRemaining || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                                                            {(mat.quantityWasted || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assignments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h2>
                        </div>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <select
                                    value={assignmentFilters.status}
                                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, status: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">All Status</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <select
                                    value={assignmentFilters.jobType}
                                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, jobType: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">All Job Types</option>
                                    <option value="printing">Printing</option>
                                    <option value="dyeing">Dyeing</option>
                                    <option value="washing">Washing</option>
                                    <option value="finishing">Finishing</option>
                                    <option value="cutting">Cutting</option>
                                    <option value="packing">Packing</option>
                                    <option value="stitching">Stitching</option>
                                </select>
                                <input
                                    type="date"
                                    value={assignmentFilters.dateFrom}
                                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, dateFrom: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="From Date"
                                />
                                <input
                                    type="date"
                                    value={assignmentFilters.dateTo}
                                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, dateTo: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="To Date"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Assignment #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Job Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Assigned Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {assignments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No assignments found
                                            </td>
                                        </tr>
                                    ) : (
                                        assignments.map((assignment) => (
                                            <tr key={assignment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {assignment.assignmentNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {assignment.jobType}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${assignment.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : assignment.status === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {assignment.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(assignment.assignedDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                                                    ₹{assignment.totalAmount?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/job-workers/${workerId}/assignments/${assignment._id}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </ClientOnly>
        </AppLayout>
    )
}

