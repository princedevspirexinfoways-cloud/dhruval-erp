'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useGetScrapsQuery,
  useGetScrapSummaryQuery,
  useMarkAsDisposedMutation,
  useDeleteScrapMutation,
} from '@/lib/api/scrapApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { selectTheme } from '@/lib/features/ui/uiSlice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  TrendingDown,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ScrapPage = () => {
  const router = useRouter();
  const theme = useSelector(selectTheme);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disposed' | 'cancelled'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('scrapDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // API Queries
  const { data: scrapsData, isLoading, error, refetch } = useGetScrapsQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    scrapReason: reasonFilter !== 'all' ? reasonFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  });

  const { data: summaryData } = useGetScrapSummaryQuery({});

  const [markAsDisposed] = useMarkAsDisposedMutation();
  const [deleteScrap] = useDeleteScrapMutation();

  const scraps = scrapsData?.data?.scraps || [];
  const pagination = scrapsData?.data || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const summary = summaryData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getReasonBadgeColor = (reason: string) => {
    const colors: Record<string, string> = {
      damaged: 'bg-red-100 text-red-800 border-red-200',
      defective: 'bg-orange-100 text-orange-800 border-orange-200',
      expired: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      obsolete: 'bg-gray-100 text-gray-800 border-gray-200',
      production_waste: 'bg-purple-100 text-purple-800 border-purple-200',
      quality_reject: 'bg-pink-100 text-pink-800 border-pink-200',
      other: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[reason] || colors.other;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Active' },
      disposed: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Disposed' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
    };
    return badges[status] || badges.active;
  };

  const handleMarkAsDisposed = async (scrapId: string) => {
    if (!confirm('Are you sure you want to mark this scrap as disposed?')) return;

    try {
      await markAsDisposed({
        scrapId,
        disposalData: {
          disposalMethod: 'destroyed',
          disposalNotes: 'Marked as disposed',
        },
      }).unwrap();
      toast.success('Scrap marked as disposed successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to mark scrap as disposed');
    }
  };

  const handleDeleteScrap = async (scrapId: string) => {
    if (!confirm('Are you sure you want to cancel this scrap? This will restore inventory stock.')) return;

    try {
      await deleteScrap(scrapId).unwrap();
      toast.success('Scrap cancelled successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel scrap');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredScraps = scraps.filter((scrap: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      scrap.itemName?.toLowerCase().includes(search) ||
      scrap.itemCode?.toLowerCase().includes(search) ||
      scrap.scrapNumber?.toLowerCase().includes(search) ||
      scrap.scrapReasonDetails?.toLowerCase().includes(search)
    );
  });

  return (
    <AppLayout>
      <div className={`min-h-screen transition-theme ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          {/* Header */}
          <div className="mb-6">
            <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-orange-600' : 'bg-orange-500'}`}>
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Scrap Management
                    </h1>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Manage and track inventory items moved to scrap
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/inventory/enhanced')}
                    className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Go to Inventory
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Scrap Quantity</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {summary.totalScrapQuantity?.toLocaleString() || 0}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
              </div>
              <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Scrap Value</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(summary.totalScrapValue || 0)}
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
              <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active Scraps</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {pagination.total || 0}
                    </p>
                  </div>
                  <Package className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>By Reason</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {summary.byReason?.length || 0}
                    </p>
                  </div>
                  <TrendingDown className={`w-8 h-8 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={`rounded-lg border p-4 mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by item name, code, or scrap number..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                      theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="disposed">Disposed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Reason Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <select
                  value={reasonFilter}
                  onChange={(e) => {
                    setReasonFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Reasons</option>
                  <option value="damaged">Damaged</option>
                  <option value="defective">Defective</option>
                  <option value="expired">Expired</option>
                  <option value="obsolete">Obsolete</option>
                  <option value="production_waste">Production Waste</option>
                  <option value="quality_reject">Quality Reject</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-theme ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setReasonFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Scraps Table */}
          <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('scrapNumber')}
                    >
                      <div className="flex items-center gap-2">
                        Scrap Number
                        {sortBy === 'scrapNumber' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('itemName')}
                    >
                      <div className="flex items-center gap-2">
                        Item Name
                        {sortBy === 'itemName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center gap-2">
                        Quantity
                        {sortBy === 'quantity' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Reason
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('scrapDate')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortBy === 'scrapDate' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('totalValue')}
                    >
                      <div className="flex items-center gap-2">
                        Value
                        {sortBy === 'totalValue' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading scraps...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredScraps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Trash2 className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No scraps found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredScraps.map((scrap: any) => {
                      const statusBadge = getStatusBadge(scrap.status);
                      return (
                        <tr
                          key={scrap._id}
                          className={`hover:${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm font-medium">{scrap.scrapNumber}</div>
                          </td>
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm font-medium">{scrap.itemName}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              {scrap.itemCode}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm font-medium">
                              {scrap.quantity?.toLocaleString()} {scrap.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getReasonBadgeColor(scrap.scrapReason)}>
                              {scrap.scrapReason?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm">{formatDate(scrap.scrapDate)}</div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm font-medium">{formatCurrency(scrap.totalValue || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={statusBadge.color}>
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {scrap.status === 'active' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsDisposed(scrap._id)}
                                  className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50"
                                  title="Mark as Disposed"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/inventory/enhanced/${scrap.inventoryItemId}`)}
                                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                                title="View Item"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {scrap.status === 'active' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteScrap(scrap._id)}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                                  title="Cancel Scrap"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} scraps
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? '' : theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                      className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ScrapPage;













