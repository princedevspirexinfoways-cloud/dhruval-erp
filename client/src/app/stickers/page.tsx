'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';

import { 
  Tag, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  QrCode,
  Barcode,
  FileText
} from 'lucide-react';
import { 
  useGetAllStickersQuery, 
  useCreateStickerMutation, 
  useUpdateStickerMutation, 
  useDeleteStickerMutation,
  usePrintStickerMutation,
  useGenerateStickerMutation
} from '@/lib/features/stickers/stickerApi';
import { Can } from '@/lib/casl/Can';

const StickerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<any>(null);

  // RTK Query hooks
  const { data: stickerData, isLoading, error } = useGetAllStickersQuery({
    type: typeFilter || undefined,
    status: statusFilter || undefined
  });

  const [createSticker] = useCreateStickerMutation();
  const [updateSticker] = useUpdateStickerMutation();
  const [deleteSticker] = useDeleteStickerMutation();
  const [printSticker] = usePrintStickerMutation();
  const [generateSticker] = useGenerateStickerMutation();

  const stickers = stickerData?.data || [];

  const filteredStickers = stickers.filter(sticker => {
    const matchesSearch = !searchTerm || 
      sticker.designNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sticker.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sticker.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || sticker.type === typeFilter;
    const matchesStatus = !statusFilter || sticker.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateSticker = async (formData: any) => {
    try {
      await createSticker(formData).unwrap();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create sticker:', error);
    }
  };

  const handleUpdateSticker = async (id: string, formData: any) => {
    try {
      await updateSticker({ id, data: formData }).unwrap();
      setSelectedSticker(null);
    } catch (error) {
      console.error('Failed to update sticker:', error);
    }
  };

  const handleDeleteSticker = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sticker?')) {
      try {
        await deleteSticker(id).unwrap();
      } catch (error) {
        console.error('Failed to delete sticker:', error);
      }
    }
  };

  const handlePrintSticker = async (id: string) => {
    try {
      await printSticker({ id, copies: 1 }).unwrap();
    } catch (error) {
      console.error('Failed to print sticker:', error);
    }
  };

  const handleGenerateSticker = async (formData: any) => {
    try {
      await generateSticker(formData).unwrap();
    } catch (error) {
      console.error('Failed to generate sticker:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'printed': return 'bg-blue-100 text-blue-800';
      case 'applied': return 'bg-green-100 text-green-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      case 'reprinted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'saree': return 'bg-pink-100 text-pink-800';
      case 'fabric_roll': return 'bg-indigo-100 text-indigo-800';
      case 'garment': return 'bg-teal-100 text-teal-800';
      case 'batch': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading sticker data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sticker & Label Management</h1>
        <Can I="create" a="Sticker">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Sticker
          </Button>
        </Can>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stickers</p>
                <p className="text-2xl font-bold text-gray-900">{stickers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Printer className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Printed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stickers.filter(s => s.status === 'printed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applied</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stickers.filter(s => s.status === 'applied').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Barcode className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stickers.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="saree">Saree</option>
                <option value="fabric_roll">Fabric Roll</option>
                <option value="garment">Garment</option>
                <option value="batch">Batch</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="printed">Printed</option>
                <option value="applied">Applied</option>
                <option value="damaged">Damaged</option>
                <option value="reprinted">Reprinted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search design, SKU, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Can I="read" a="Sticker">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </Can>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stickers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Stickers ({filteredStickers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Sticker ID</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Design/SKU</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Batch</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Quantity</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStickers.map((sticker) => (
                  <tr key={sticker._id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="font-mono text-sm">{sticker.stickerId}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge className={getTypeColor(sticker.type)}>
                        {sticker.type?.replace('_', ' ') || 'Unknown Type'}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div>
                        <div className="font-medium">{sticker.designNumber}</div>
                        <div className="text-sm text-gray-500">{sticker.sku}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="font-mono text-sm">{sticker.batchNumber}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div>
                        <div className="font-medium">{sticker.quantity}</div>
                        <div className="text-sm text-gray-500">{sticker.unit}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge className={getStatusColor(sticker.status)}>
                        {sticker.status}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex gap-2">
                        <Can I="read" a="Sticker">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSticker(sticker)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        {sticker.status === 'pending' && (
                          <Can I="update" a="Sticker">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintSticker(sticker._id)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </Can>
                        )}
                        
                        <Can I="update" a="Sticker">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSticker(sticker)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="delete" a="Sticker">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteSticker(sticker._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Can I="create" a="Sticker">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCreateModal(true)}
              >
                Generate Single Sticker
              </Button>
              <Button variant="outline" className="w-full">
                Bulk Generate
              </Button>
              <Button variant="outline" className="w-full">
                Batch Generate
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Sticker">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Print Status Report
              </Button>
              <Button variant="outline" className="w-full">
                Application Status
              </Button>
              <Button variant="outline" className="w-full">
                Reprint Analysis
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Sticker">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Export to CSV
              </Button>
              <Button variant="outline" className="w-full">
                Export to PDF
              </Button>
              <Button variant="outline" className="w-full">
                Export to Excel
              </Button>
            </CardContent>
          </Card>
        </Can>
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Sticker</h2>
            {/* Form would go here */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerPage;
