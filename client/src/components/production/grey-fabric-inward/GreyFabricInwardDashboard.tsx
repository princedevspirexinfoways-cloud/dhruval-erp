'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useGetGreyFabricInwardsQuery,
  useDeleteGreyFabricInwardMutation,
  useMarkAsReceivedMutation,
  GreyFabricInward
} from '@/lib/api/greyFabricInwardApi';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectCurrentCompanyId } from '@/lib/features/auth/authSlice';
import { selectTheme, setTheme } from '@/lib/features/ui/uiSlice';
import { GreyFabricInwardForm } from './GreyFabricInwardForm';
import { GreyFabricInwardDetails } from './GreyFabricInwardDetails';
import { GreyFabricInwardAnalytics } from './GreyFabricInwardAnalytics';
import GreyStockSummary from './GreyStockSummary';
import GreyStockLotDetails from './GreyStockLotDetails';
import toast from 'react-hot-toast';

interface GreyFabricInwardDashboardProps {
  onRefresh?: () => void;
}

export default function GreyFabricInwardDashboard({ onRefresh }: GreyFabricInwardDashboardProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    quality: 'all',
    fabricType: '',
    search: ''
  });
  const [selectedGrn, setSelectedGrn] = useState<GreyFabricInward | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStockSummary, setShowStockSummary] = useState(false);
  const [showLotDetails, setShowLotDetails] = useState(false);

  // Get user and company info
  const user = useSelector(selectCurrentUser);
  const companyId = useSelector(selectCurrentCompanyId);
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();

  // RTK Query hooks
  const {
    data: grnData,
    isLoading,
    error,
    refetch
  } = useGetGreyFabricInwardsQuery({
    page,
    limit,
    filters: {
      ...filters,
      status: filters.status === 'all' ? '' : filters.status,
      quality: filters.quality === 'all' ? '' : filters.quality
    }
  });

  const [deleteGrn] = useDeleteGreyFabricInwardMutation();
  const [markAsReceived] = useMarkAsReceivedMutation();

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const handleThemeToggle = () => {
    console.log('=== DASHBOARD THEME TOGGLE ===')
    console.log('Current theme from Redux:', theme)
    console.log('Document has dark class:', document.documentElement.classList.contains('dark'))
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Switching to theme:', newTheme)
    
    // Update localStorage first
    localStorage.setItem('theme', newTheme)
    console.log('Updated localStorage with theme:', newTheme)
    
    // Force immediate DOM update to ensure synchronization
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      console.log('Added dark class to document and body')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      console.log('Removed dark class from document and body')
    }
    
    // Dispatch the Redux action after DOM update
    dispatch(setTheme(newTheme));
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#ffffff')
      console.log('Updated meta theme-color')
    }
    
    // Force a re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }))
    
    console.log('Final document classes:', document.documentElement.className)
    console.log('Final body classes:', document.body.className)
    
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme enabled`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this GRN entry?')) {
      try {
        await deleteGrn(id).unwrap();
        handleRefresh();
      } catch (error) {
        console.error('Error deleting GRN:', error);
      }
    }
  };

  const handleMarkAsReceived = async (id: string) => {
    // Check authentication
    if (!user || !companyId) {
      alert('Authentication required. Please login again.');
      return;
    }

    try {
      await markAsReceived({
        id,
        receivedAt: new Date().toISOString()
      }).unwrap();
      handleRefresh();
    } catch (error: any) {
      console.error('Error marking as received:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.data?.message || 
                          error?.message || 
                          'Failed to mark GRN as received. Please try again.';
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Received';
      case 'in_transit': return 'In Transit';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'A+': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'B+': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'D': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error loading GRN data</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Grey Fabric Inward</h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg mb-4">GRN Entry and fabric inspection management</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 dark:bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live System</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="text-sm">{grnData?.total || 0} Total GRNs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{grnData?.data?.filter(grn => grn.status === 'received').length || 0} Received</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              onClick={handleThemeToggle}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              {theme === 'light' ? 'Dark' : 'Light'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStockSummary(!showStockSummary)}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <Package className="h-4 w-4" />
              Stock Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              Analytics
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              New GRN Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Summary Section */}
      {showStockSummary && (
        <GreyStockSummary onClose={() => setShowStockSummary(false)} />
      )}

      {/* Analytics Section */}
      {showAnalytics && (
        <GreyFabricInwardAnalytics />
      )}

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search GRN, PO, Customer..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                  <SelectItem value="all" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">All Status</SelectItem>
                  <SelectItem value="pending" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">Pending</SelectItem>
                  <SelectItem value="in_transit" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">In Transit</SelectItem>
                  <SelectItem value="received" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">Received</SelectItem>
                  <SelectItem value="rejected" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
              <Select
                value={filters.quality}
                onValueChange={(value) => setFilters(prev => ({ ...prev, quality: value }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="All Quality" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                  <SelectItem value="all" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">All Quality</SelectItem>
                  <SelectItem value="A+" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">A+</SelectItem>
                  <SelectItem value="A" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">A</SelectItem>
                  <SelectItem value="B+" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">B+</SelectItem>
                  <SelectItem value="B" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">B</SelectItem>
                  <SelectItem value="C" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">C</SelectItem>
                  <SelectItem value="D" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fabric Type</label>
              <Input
                placeholder="Fabric Type"
                value={filters.fabricType}
                onChange={(e) => setFilters(prev => ({ ...prev, fabricType: e.target.value }))}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN List */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">GRN Entries ({grnData?.total || 0})</CardTitle>
            <Button variant="outline" onClick={handleRefresh} className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grnData?.data?.map((grn) => (
              <div key={grn._id} className="rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 group border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {grn.grnNumber?.slice(-2) || 'GR'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{grn.grnNumber}</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">{grn.productionOrderNumber} - {grn.customerName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Supplier: {grn.supplierName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${getStatusColor(grn.status)} px-3 py-1 font-medium shadow-sm`}>
                      {getStatusText(grn.status)}
                    </Badge>
                    <Badge className={`${getQualityColor(grn.quality)} px-3 py-1 font-medium shadow-sm`}>
                      Grade: {grn.quality}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fabric Type</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{grn.fabricType}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Entry Type</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {grn.entryType?.replace('_', ' ') || 'Purchase Order'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{typeof grn.quantity === 'number' ? grn.quantity : grn.quantity.receivedQuantity} {grn.unit}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">₹{grn.costBreakdown?.totalCost?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expected/Received</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {grn.status === 'received' && grn.receivedAt
                        ? new Date(grn.receivedAt).toLocaleDateString()
                        : grn.expectedAt
                        ? new Date(grn.expectedAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {grn.greyStockLots && grn.greyStockLots.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lots</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{grn.greyStockLots.length} Lots</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {grn.greyStockLots.map((lot: any, index: number) => (
                          <span key={index}>
                            {lot.lotNumber}
                            {index < (grn.greyStockLots?.length || 0) - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  {grn.stockBalance && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stock Balance</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {grn.stockBalance.totalMeters || 0}m / {grn.stockBalance.totalYards || 0}y
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Available: {grn.stockBalance.availableMeters || 0}m
                      </p>
                    </div>
                  )}
                </div>

                {grn.remarks && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remarks</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{grn.remarks}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGrn(grn);
                        setShowDetails(true);
                      }}
                      className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {grn.stockStatus === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGrn(grn);
                          setShowLotDetails(true);
                        }}
                        className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <Package className="h-4 w-4" />
                        Stock
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGrn(grn);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {grn.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsReceived(grn._id)}
                        className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Received
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(grn._id)}
                      className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {grnData?.data?.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No GRN entries found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {grnData && grnData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, grnData.total)} of {grnData.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(grnData.totalPages, prev + 1))}
                  disabled={page === grnData.totalPages}
                  className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showForm && (
        <GreyFabricInwardForm
          grn={selectedGrn}
          onClose={() => {
            setShowForm(false);
            setSelectedGrn(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedGrn(null);
            handleRefresh();
          }}
        />
      )}

      {showDetails && selectedGrn && (
        <GreyFabricInwardDetails
          grn={selectedGrn}
          onClose={() => {
            setShowDetails(false);
            setSelectedGrn(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
        />
      )}

      {showLotDetails && selectedGrn && (
        <GreyStockLotDetails
          grn={selectedGrn}
          onClose={() => {
            setShowLotDetails(false);
            setSelectedGrn(null);
          }}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
