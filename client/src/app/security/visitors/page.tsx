'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Phone,
  Building,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { selectCurrentUser, selectIsSuperAdmin } from '@/lib/features/auth/authSlice'
import {
  useGetVisitorsQuery,
  useGetVisitorStatsQuery,
  useCreateVisitorMutation,
  useUpdateVisitorMutation,
  useDeleteVisitorMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation
} from '@/lib/api/visitorsApi'
import { DataTable } from '@/components/ui/DataTable'
import { StatsCards } from '@/components/ui/StatsCards'
import { DetailViewModal } from '@/components/modals/DetailViewModal'
import { CreateEditModal } from '@/components/modals/CreateEditModal'
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingSpinner'
import clsx from 'clsx'

export default function SecurityVisitorsPage() {
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = useSelector(selectIsSuperAdmin)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [visitorToEdit, setVisitorToEdit] = useState<any>(null)

  // Fetch visitors data from API
  const { data: visitorsData, isLoading, error } = useGetVisitorsQuery({
    page,
    limit: 20,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined
  })

  // Fetch visitor statistics
  const { data: visitorStats } = useGetVisitorStatsQuery({})

  // Mutations
  const [createVisitor] = useCreateVisitorMutation()
  const [updateVisitor] = useUpdateVisitorMutation()
  const [deleteVisitor] = useDeleteVisitorMutation()
  const [checkInVisitor] = useCheckInVisitorMutation()
  const [checkOutVisitor] = useCheckOutVisitorMutation()

  const visitors = visitorsData?.data || []
  const pagination = visitorsData?.pagination

  // Form fields for create/edit
  const visitorFields = [
    { name: 'visitorName', label: 'Visitor Name', type: 'text' as const, required: true },
    { name: 'visitorEmail', label: 'Email', type: 'email' as const },
    { name: 'visitorPhone', label: 'Phone Number', type: 'tel' as const, required: true },
    { name: 'company', label: 'Company/Organization', type: 'text' as const },
    { name: 'idNumber', label: 'ID Number', type: 'text' as const, required: true },
    {
      name: 'idType',
      label: 'ID Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'aadhar', label: 'Aadhar Card' },
        { value: 'pan', label: 'PAN Card' },
        { value: 'driving_license', label: 'Driving License' },
        { value: 'passport', label: 'Passport' },
        { value: 'voter_id', label: 'Voter ID' }
      ]
    },
    {
      name: 'visitType',
      label: 'Visit Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'business', label: 'Business Meeting' },
        { value: 'interview', label: 'Interview' },
        { value: 'delivery', label: 'Delivery' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'official', label: 'Official Work' },
        { value: 'personal', label: 'Personal Visit' }
      ]
    },
    { name: 'hostName', label: 'Host/Contact Person', type: 'text' as const, required: true },
    { name: 'hostDepartment', label: 'Host Department', type: 'text' as const },
    { name: 'hostPhone', label: 'Host Phone', type: 'tel' as const },
    { name: 'purpose', label: 'Purpose of Visit', type: 'textarea' as const, required: true },
    { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text' as const },
    { name: 'expectedDuration', label: 'Expected Duration (hours)', type: 'number' as const }
  ]

  // CRUD Handlers
  const handleView = (visitor: any) => {
    setSelectedVisitor(visitor)
    setShowDetailModal(true)
  }

  const handleEdit = (visitor: any) => {
    setVisitorToEdit(visitor)
    setShowEditModal(true)
  }

  const handleDelete = async (visitor: any) => {
    if (window.confirm(`Are you sure you want to delete visitor ${visitor.visitorName}?`)) {
      try {
        await deleteVisitor(visitor._id).unwrap()
      } catch (error) {
        console.error('Failed to delete visitor:', error)
      }
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await createVisitor({
        ...data,
        companyId: user?.companyId,
      }).unwrap()
    } catch (error) {
      console.error('Failed to create visitor:', error)
      throw error
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      await updateVisitor({
        visitorId: visitorToEdit._id,
        visitorData: data,
      }).unwrap()
    } catch (error) {
      console.error('Failed to update visitor:', error)
      throw error
    }
  }

  const handleCheckIn = async (visitor: any) => {
    try {
      await checkInVisitor(visitor._id).unwrap()
    } catch (error) {
      console.error('Failed to check in visitor:', error)
    }
  }

  const handleCheckOut = async (visitor: any) => {
    try {
      await checkOutVisitor(visitor._id).unwrap()
    } catch (error) {
      console.error('Failed to check out visitor:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1"
    switch (status) {
      case 'checked_in':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'checked_out':
        return `${baseClasses} bg-gray-100 text-gray-600`
      case 'overstayed':
        return `${baseClasses} bg-red-100 text-red-600`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <UserCheck className="h-3 w-3" />
      case 'checked_out':
        return <UserX className="h-3 w-3" />
      case 'overstayed':
        return <AlertTriangle className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Visitors',
      value: visitorStats?.data?.totalVisitors || 0,
      change: {
        value: visitorStats?.data?.visitorsGrowth || 0,
        type: (visitorStats?.data?.visitorsGrowth || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        label: 'vs last month'
      },
      icon: <Users className="h-6 w-6" />,
      color: 'blue' as const
    },
    {
      title: 'Currently Inside',
      value: visitorStats?.data?.currentlyInside || 0,
      icon: <UserCheck className="h-6 w-6" />,
      color: 'green' as const
    },
    {
      title: 'Today\'s Visitors',
      value: visitorStats?.data?.todayVisitors || 0,
      change: {
        value: visitorStats?.data?.todayGrowth || 0,
        type: (visitorStats?.data?.todayGrowth || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        label: 'vs yesterday'
      },
      icon: <Calendar className="h-6 w-6" />,
      color: 'purple' as const
    },
    {
      title: 'Pending Approvals',
      value: visitorStats?.data?.pendingApprovals || 0,
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const
    }
  ]

  // Table columns
  const columns = [
    {
      key: 'visitorName',
      label: 'Visitor',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.company || 'Individual'}</div>
        </div>
      )
    },
    {
      key: 'visitorPhone',
      label: 'Contact',
      render: (value: string, row: any) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.visitorEmail}</div>
        </div>
      )
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'hostName',
      label: 'Host',
      render: (value: string, row: any) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.hostDepartment}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string, row: any) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full',
          value === 'checked_in' && 'bg-green-100 text-green-600',
          value === 'checked_out' && 'bg-gray-100 text-gray-600',
          value === 'pending' && 'bg-yellow-100 text-yellow-600',
          value === 'approved' && 'bg-blue-100 text-blue-600',
          value === 'rejected' && 'bg-red-100 text-red-600'
        )}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'checkInTime',
      label: 'Check In',
      sortable: true,
      render: (value: string) => value ? formatTime(value) : '-'
    },
    {
      key: 'checkOutTime',
      label: 'Check Out',
      sortable: true,
      render: (value: string) => value ? formatTime(value) : '-'
    }
  ]

  // Detail view sections
  const getDetailSections = (visitor: any) => [
    {
      title: 'Visitor Information',
      fields: [
        { label: 'Name', value: visitor?.visitorName, type: 'text' as const },
        { label: 'Email', value: visitor?.visitorEmail, type: 'text' as const },
        { label: 'Phone', value: visitor?.visitorPhone, type: 'text' as const },
        { label: 'Company', value: visitor?.company, type: 'text' as const },
        { label: 'ID Type', value: visitor?.idType, type: 'badge' as const },
        { label: 'ID Number', value: visitor?.idNumber, type: 'text' as const }
      ]
    },
    {
      title: 'Visit Details',
      fields: [
        { label: 'Visit Type', value: visitor?.visitType, type: 'badge' as const },
        { label: 'Purpose', value: visitor?.purpose, type: 'text' as const },
        { label: 'Expected Duration', value: `${visitor?.expectedDuration || 0} hours`, type: 'text' as const },
        { label: 'Vehicle Number', value: visitor?.vehicleNumber, type: 'text' as const },
        { label: 'Status', value: visitor?.status, type: 'badge' as const }
      ]
    },
    {
      title: 'Host Information',
      fields: [
        { label: 'Host Name', value: visitor?.hostName, type: 'text' as const },
        { label: 'Department', value: visitor?.hostDepartment, type: 'text' as const },
        { label: 'Host Phone', value: visitor?.hostPhone, type: 'text' as const }
      ]
    },
    {
      title: 'Visit Timeline',
      fields: [
        { label: 'Registration Time', value: visitor?.createdAt, type: 'date' as const },
        { label: 'Check In Time', value: visitor?.checkInTime, type: 'date' as const },
        { label: 'Check Out Time', value: visitor?.checkOutTime, type: 'date' as const },
        { label: 'Total Duration', value: visitor?.totalDuration ? `${visitor.totalDuration} minutes` : 'Ongoing', type: 'text' as const }
      ]
    }
  ]

  const getVisitorTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (type) {
      case 'business':
        return `${baseClasses} bg-blue-100 text-blue-600`
      case 'contractor':
        return `${baseClasses} bg-purple-100 text-purple-600`
      case 'official':
        return `${baseClasses} bg-green-100 text-green-600`
      case 'personal':
        return `${baseClasses} bg-yellow-100 text-yellow-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`
    }
  }

  const getDuration = (checkIn: string, checkOut: string | null) => {
    const checkInTime = new Date(checkIn)
    const checkOutTime = checkOut ? new Date(checkOut) : new Date()
    const diffMs = checkOutTime.getTime() - checkInTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <LoadingSpinner size="lg" text="Loading visitors..." />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
          <ErrorState
            title="Error Loading Visitors"
            message="Failed to load visitor data. Please try again."
            icon={<Shield className="h-12 w-12 text-red-500" />}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  Visitor Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage all facility visitors ({visitors.length} visitors)
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Register Visitor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards cards={statsCards} />

        {/* Data Table */}
        <DataTable
          data={visitors}
          columns={columns}
          loading={isLoading}
          error={error ? 'Failed to load visitors' : undefined}
          searchable={true}
          filterable={false}
          pagination={pagination}
          onPageChange={setPage}
          onSearch={setSearchTerm}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={true}
        />

        {/* Modals */}
        <DetailViewModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`${selectedVisitor?.visitorName || 'Visitor'} Details`}
          sections={getDetailSections(selectedVisitor)}
          actions={{
            onEdit: () => {
              setShowDetailModal(false)
              handleEdit(selectedVisitor)
            },
            onDelete: () => {
              setShowDetailModal(false)
              handleDelete(selectedVisitor)
            },
            customActions: selectedVisitor?.status === 'checked_in' ? [
              {
                label: 'Check Out',
                onClick: () => {
                  setShowDetailModal(false)
                  handleCheckOut(selectedVisitor)
                },
                variant: 'danger' as const
              }
            ] : selectedVisitor?.status === 'pending' ? [
              {
                label: 'Check In',
                onClick: () => {
                  setShowDetailModal(false)
                  handleCheckIn(selectedVisitor)
                },
                variant: 'primary' as const
              }
            ] : undefined
          }}
        />

        <CreateEditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          title="Register New Visitor"
          fields={visitorFields}
          submitText="Register Visitor"
        />

        <CreateEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setVisitorToEdit(null)
          }}
          onSubmit={handleUpdate}
          title="Edit Visitor"
          fields={visitorFields}
          initialData={visitorToEdit}
          submitText="Update Visitor"
        />
      </div>
    </AppLayout>
  )
}
