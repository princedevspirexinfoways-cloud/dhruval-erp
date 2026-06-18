'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  X,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Warehouse,
  Activity
} from 'lucide-react';

interface GreyStockSummaryProps {
  onClose: () => void;
}

interface StockEntry {
  grnNumber: string;
  fabricDetails: {
    fabricType: string;
    color: string;
    gsm: number;
  };
  stockBalance: {
    totalMeters: number;
    totalYards: number;
    totalPieces: number;
    availableMeters: number;
    availableYards: number;
    availablePieces: number;
  };
  supplierName: string;
  lotCount: number;
  activeLots: number;
}

interface StockTotals {
  totalMeters: number;
  totalYards: number;
  totalPieces: number;
  availableMeters: number;
  availableYards: number;
  availablePieces: number;
}

export default function GreyStockSummary({ onClose }: GreyStockSummaryProps) {
  const [stockData, setStockData] = useState<{ stockEntries: StockEntry[], totals: StockTotals } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fabricType: '',
    color: '',
    gsm: ''
  });

  useEffect(() => {
    fetchStockSummary();
  }, [filters]);

  const fetchStockSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.fabricType) params.append('fabricType', filters.fabricType);
      if (filters.color) params.append('color', filters.color);
      if (filters.gsm) params.append('gsm', filters.gsm);

      const response = await fetch(`/api/grey-fabric-inward/stock/summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStockData(data.data);
      }
    } catch (error) {
      console.error('Error fetching stock summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStockStatusBadge = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 20) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStockStatusText = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage >= 80) return 'High Stock';
    if (percentage >= 50) return 'Medium Stock';
    if (percentage >= 20) return 'Low Stock';
    return 'Critical Stock';
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Grey Stock Summary
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Grey Stock Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Fabric Type</label>
            <Input
              placeholder="Filter by fabric type"
              value={filters.fabricType}
              onChange={(e) => setFilters(prev => ({ ...prev, fabricType: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
            <Input
              placeholder="Filter by color"
              value={filters.color}
              onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">GSM</label>
            <Input
              placeholder="Filter by GSM"
              value={filters.gsm}
              onChange={(e) => setFilters(prev => ({ ...prev, gsm: e.target.value }))}
            />
          </div>
        </div>

        {/* Totals Overview */}
        {stockData?.totals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Meters</p>
                    <p className="text-2xl font-bold text-blue-900">{stockData.totals.totalMeters.toLocaleString()}</p>
                    <p className="text-sm text-blue-700">Available: {stockData.totals.availableMeters.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Yards</p>
                    <p className="text-2xl font-bold text-green-900">{stockData.totals.totalYards.toLocaleString()}</p>
                    <p className="text-sm text-green-700">Available: {stockData.totals.availableYards.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Pieces</p>
                    <p className="text-2xl font-bold text-purple-900">{stockData.totals.totalPieces.toLocaleString()}</p>
                    <p className="text-sm text-purple-700">Available: {stockData.totals.availablePieces.toLocaleString()}</p>
                  </div>
                  <Layers className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Stock Entries ({stockData?.stockEntries.length || 0})
          </h3>

          {stockData?.stockEntries.map((entry) => (
            <Card key={entry.grnNumber} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{entry.grnNumber}</h4>
                    <p className="text-sm text-gray-600">{entry.fabricDetails.fabricType} - {entry.fabricDetails.color} (GSM: {entry.fabricDetails.gsm})</p>
                    <p className="text-sm text-gray-500">Supplier: {entry.supplierName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {entry.activeLots}/{entry.lotCount} Active Lots
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Meters</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${getStockStatusColor(entry.stockBalance.availableMeters, entry.stockBalance.totalMeters)}`}>
                        {entry.stockBalance.availableMeters.toLocaleString()}
                      </span>
                      <Badge className={getStockStatusBadge(entry.stockBalance.availableMeters, entry.stockBalance.totalMeters)}>
                        {getStockStatusText(entry.stockBalance.availableMeters, entry.stockBalance.totalMeters)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Total: {entry.stockBalance.totalMeters.toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Yards</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${getStockStatusColor(entry.stockBalance.availableYards, entry.stockBalance.totalYards)}`}>
                        {entry.stockBalance.availableYards.toLocaleString()}
                      </span>
                      <Badge className={getStockStatusBadge(entry.stockBalance.availableYards, entry.stockBalance.totalYards)}>
                        {getStockStatusText(entry.stockBalance.availableYards, entry.stockBalance.totalYards)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Total: {entry.stockBalance.totalYards.toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Pieces</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${getStockStatusColor(entry.stockBalance.availablePieces, entry.stockBalance.totalPieces)}`}>
                        {entry.stockBalance.availablePieces.toLocaleString()}
                      </span>
                      <Badge className={getStockStatusBadge(entry.stockBalance.availablePieces, entry.stockBalance.totalPieces)}>
                        {getStockStatusText(entry.stockBalance.availablePieces, entry.stockBalance.totalPieces)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Total: {entry.stockBalance.totalPieces.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!stockData?.stockEntries || stockData.stockEntries.length === 0) && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stock entries found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

