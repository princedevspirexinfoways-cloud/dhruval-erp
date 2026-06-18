'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useGetGoodsReturnsQuery,
  useGetChallanReturnSummaryQuery,
} from '@/lib/api/goodsReturnsApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { selectTheme } from '@/lib/features/ui/uiSlice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const GoodsReturnsPage = () => {
  const router = useRouter();
  const theme = useSelector(selectTheme);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState<'all' | 'pending' | 'approved' | 'processed' | 'rejected' | 'cancelled'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [challanFilter, setChallanFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('returnDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // API Queries
  const { data: returnsData, isLoading, error, refetch } = useGetGoodsReturnsQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    returnStatus: returnStatusFilter !== 'all' ? returnStatusFilter : undefined,
    returnReason: reasonFilter !== 'all' ? reasonFilter : undefined,
    challanNumber: challanFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
    search: searchTerm || undefined,
  });

  const returns = returnsData?.data || [];
  const pagination = returnsData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  const totalReturns = pagination.total || returns.length;

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
    const colors: Record<string, { light: string; dark: string }> = {
      damaged: { light: 'bg-red-100 text-red-800 border-red-200', dark: 'bg-red-900/30 text-red-400 border-red-700' },
      defective: { light: 'bg-orange-100 text-orange-800 border-orange-200', dark: 'bg-orange-900/30 text-orange-400 border-orange-700' },
      quality_issue: { light: 'bg-yellow-100 text-yellow-800 border-yellow-200', dark: 'bg-yellow-900/30 text-yellow-400 border-yellow-700' },
      wrong_item: { light: 'bg-purple-100 text-purple-800 border-purple-200', dark: 'bg-purple-900/30 text-purple-400 border-purple-700' },
      expired: { light: 'bg-gray-100 text-gray-800 border-gray-200', dark: 'bg-gray-700 text-gray-300 border-gray-600' },
      other: { light: 'bg-blue-100 text-blue-800 border-blue-200', dark: 'bg-blue-900/30 text-blue-400 border-blue-700' },
    };
    return colors[reason] || colors.other;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      pending: { light: 'bg-yellow-100 text-yellow-800 border-yellow-200', dark: 'bg-yellow-900/30 text-yellow-400 border-yellow-700' },
      approved: { light: 'bg-green-100 text-green-800 border-green-200', dark: 'bg-green-900/30 text-green-400 border-green-700' },
      processed: { light: 'bg-blue-100 text-blue-800 border-blue-200', dark: 'bg-blue-900/30 text-blue-400 border-blue-700' },
      rejected: { light: 'bg-red-100 text-red-800 border-red-200', dark: 'bg-red-900/30 text-red-400 border-red-700' },
      cancelled: { light: 'bg-gray-100 text-gray-800 border-gray-200', dark: 'bg-gray-700 text-gray-300 border-gray-600' },
    };
    return colors[status] || colors.pending;
  };

  // Calculate summary stats
  const totalReturned = returns.reduce((sum, ret) => sum + (ret.returnedQuantity || 0), 0);
  const totalValue = returns.reduce((sum, ret) => sum + (ret.totalValue || 0), 0);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, returnStatusFilter, reasonFilter, challanFilter, dateFrom, dateTo]);

  if (error) {
    return (
      <AppLayout>
        <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border`}>
            <p className={theme === 'dark' ? 'text-red-400' : 'text-red-800'}>
              Error loading goods returns. Please try again.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`min-h-screen transition-theme ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <RotateCcw className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Goods Returns
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manage and track all goods returns
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className={theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-300' : ''}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/inventory/enhanced')}
                  className={theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-300' : ''}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Inventory
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Returns
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {totalReturns}
                  </p>
                </div>
                <FileText className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Returned
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {totalReturned.toLocaleString()}
                  </p>
                </div>
                <Package className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Value
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <DollarSign className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={`rounded-lg border p-4 mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by item, challan..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg ${theme === 'dark'
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
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                    }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Return Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Return Status
                </label>
                <select
                  value={returnStatusFilter}
                  onChange={(e) => setReturnStatusFilter(e.target.value as any)}
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                    }`}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Reason Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Return Reason
                </label>
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                    }`}
                >
                  <option value="all">All Reasons</option>
                  <option value="damaged">Damaged</option>
                  <option value="defective">Defective</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Challan Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Challan Number
                </label>
                <input
                  type="text"
                  value={challanFilter}
                  onChange={(e) => setChallanFilter(e.target.value)}
                  placeholder="Filter by challan..."
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>

              {/* Date From */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                    }`}
                />
              </div>

              {/* Date To */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Returns Table */}
          <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading returns...</p>
              </div>
            ) : returns.length === 0 ? (
              <div className="p-12 text-center">
                <Package className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No goods returns found
                </p>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {searchTerm || challanFilter || statusFilter !== 'all' || returnStatusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by creating a goods return from inventory'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Return Number
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Item
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Challan
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Returned Quantity
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Reason
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Status
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Value
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Date
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                      {returns.map((returnItem) => {
                        const reasonColors = getReasonBadgeColor(returnItem.returnReason);
                        const statusColors = getStatusBadgeColor(returnItem.returnStatus);
                        return (
                          <tr
                            key={returnItem._id}
                            className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                          >
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              <div className="text-sm font-medium">{returnItem.returnNumber}</div>
                            </td>
                            <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              <div className="text-sm font-medium">{returnItem.itemName}</div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {returnItem.itemCode}
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              <div className="text-sm font-medium">{returnItem.originalChallanNumber}</div>
                              {returnItem.originalChallanDate && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatDate(returnItem.originalChallanDate)}
                                </div>
                              )}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                              <div className="text-sm font-medium">
                                {returnItem.returnedQuantity} {returnItem.unit}
                              </div>
                              {returnItem.returnedValue && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatCurrency(returnItem.returnedValue)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={`${theme === 'dark' ? reasonColors.dark : reasonColors.light} border`}
                              >
                                {returnItem.returnReason.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={`${theme === 'dark' ? statusColors.dark : statusColors.light} border`}
                              >
                                {returnItem.returnStatus}
                              </Badge>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              <div className="text-sm font-medium">
                                {formatCurrency(returnItem.totalValue || 0)}
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                              <div className="text-sm">{formatDate(returnItem.returnDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // View details - can be implemented later
                                    toast('View details feature coming soon', { icon: 'ℹ️' });
                                  }}
                                  className={theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      toast.loading('Downloading challan...', { id: 'download-challan' });
                                      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                                      const response = await fetch(`${baseUrl}/goods-returns/${returnItem._id}/challan/pdf`, {
                                        method: 'GET',
                                        credentials: 'include'
                                      });

                                      if (!response.ok) {
                                        console.error('Failed to download challan:', response.statusText);
                                        toast.error('Failed to download challan. Please try again.', { id: 'download-challan' });
                                        return;
                                      }

                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `Goods-Return-Challan-${returnItem.returnNumber || returnItem._id}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                      window.URL.revokeObjectURL(url);
                                      toast.success('Challan downloaded successfully', { id: 'download-challan' });
                                    } catch (error) {
                                      console.error('Error downloading challan:', error);
                                      toast.error('Error downloading challan. Please try again.', { id: 'download-challan' });
                                    }
                                  }}
                                  className={theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}
                                  title="Download Challan PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPrev}
                        className={theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={clsx(
                                pagination.page === pageNum
                                  ? theme === 'dark'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-500 text-white'
                                  : theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : ''
                              )}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!pagination.hasNext}
                        className={theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GoodsReturnsPage;

