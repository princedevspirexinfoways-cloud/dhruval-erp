'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Package, AlertCircle } from 'lucide-react';
import { useCreateBatchMutation, CreateBatchRequest } from '@/lib/api/productionBatches';
import { useGetAllCompaniesQuery } from '@/lib/features/companies/companiesApi';
import { useGetInventoryItemsQuery } from '@/lib/api/inventoryApi';
import { useGetGreyFabricInwardsQuery } from '@/lib/api/greyFabricInwardApi';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/lib/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
// import { useToast } from '@/hooks/use-toast';

function CreateBatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  // const { toast } = useToast();
  const [createBatch, { isLoading: loading }] = useCreateBatchMutation();

  // Check authentication state
  const { isAuthenticated, user, token } = useSelector((state: any) => state.auth);

  // Company selection state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    grnId?: string;
    grnNumber?: string;
    materialSource?: 'own_material' | 'client_provided' | 'job_work_material';
    clientInfo?: {
      clientId: string;
      clientName: string;
      clientOrderId?: string;
      clientOrderNumber?: string;
    };
  }>>([]);

  // Get companies list
  const { data: companiesData, isLoading: companiesLoading } = useGetAllCompaniesQuery();
  const companies = companiesData?.data || [];

  // Get inventory items for selected company
  const { data: inventoryData, isLoading: inventoryLoading } = useGetInventoryItemsQuery({
    companyId: selectedCompanyId,
    limit: 100
  });
  const inventoryItems = inventoryData?.data?.data || [];

  // Get GRNs for selected company
  const { data: grnsData, isLoading: grnsLoading } = useGetGreyFabricInwardsQuery({
    filters: {
      companyId: selectedCompanyId
    },
    limit: 100
  });
  const grns = grnsData?.data || [];

  // GRN mapping state
  const [showGRNMapping, setShowGRNMapping] = useState(false);
  const [selectedMaterialForGRN, setSelectedMaterialForGRN] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateBatchRequest>({
    companyId: selectedCompanyId,
    productSpecifications: {
      productType: '',
      fabricType: '',
      gsm: undefined,
      width: undefined,
      length: undefined,
      color: '',
      colorCode: '',
      design: '',
      pattern: '',
      fabricComposition: '',
      shrinkage: undefined,
      colorFastness: undefined,
      tensileStrength: undefined
    },
    plannedQuantity: 0,
    unit: 'meters',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalPlannedDuration: 10080, // 7 days in minutes
    priority: 'medium'
  });

  // Handle duplicate functionality
  useEffect(() => {
    const isDuplicate = searchParams.get('duplicate') === 'true';
    if (isDuplicate) {
      setFormData(prev => ({
        ...prev,
        productSpecifications: {
          ...prev.productSpecifications,
          productType: searchParams.get('productType') || prev.productSpecifications.productType,
          fabricType: searchParams.get('fabricType') || prev.productSpecifications.fabricType,
        },
        plannedQuantity: parseInt(searchParams.get('plannedQuantity') || '0') || prev.plannedQuantity,
        unit: searchParams.get('unit') || prev.unit,
        priority: (searchParams.get('priority') as any) || prev.priority,
        plannedStartDate: searchParams.get('plannedStartDate') || prev.plannedStartDate,
        plannedEndDate: searchParams.get('plannedEndDate') || prev.plannedEndDate,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle company selection change
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setFormData(prev => ({
      ...prev,
      companyId
    }));
    // Clear selected materials when company changes
    setSelectedMaterials([]);
  };

  // GRN mapping functions
  const handleGRNMapping = (materialIndex: number) => {
    setSelectedMaterialForGRN(materialIndex);
    setShowGRNMapping(true);
  };

  const handleGRNSelection = (grnId: string, grnNumber: string, materialSource: 'own_material' | 'client_provided' | 'job_work_material', clientInfo?: any) => {
    if (selectedMaterialForGRN !== null) {
      setSelectedMaterials(prev => prev.map((material, index) =>
        index === selectedMaterialForGRN
          ? {
            ...material,
            grnId,
            grnNumber,
            materialSource,
            clientInfo: materialSource === 'client_provided' ? clientInfo : undefined
          }
          : material
      ));
    }
    setShowGRNMapping(false);
    setSelectedMaterialForGRN(null);
  };

  const removeGRNMapping = (materialIndex: number) => {
    setSelectedMaterials(prev => prev.map((material, index) =>
      index === materialIndex
        ? {
          ...material,
          grnId: undefined,
          grnNumber: undefined,
          materialSource: undefined,
          clientInfo: undefined
        }
        : material
    ));
  };

  // Add material to the batch
  const addMaterial = (itemId: string) => {
    const item = inventoryItems.find(item => item._id === itemId);
    if (item) {
      const newMaterial = {
        itemId: item._id,
        itemName: item.itemName,
        quantity: 0,
        unit: item.stock.unit,
        unitCost: item.pricing.costPrice
      };
      setSelectedMaterials(prev => [...prev, newMaterial]);
    }
  };

  // Remove material from the batch
  const removeMaterial = (itemId: string) => {
    setSelectedMaterials(prev => prev.filter(material => material.itemId !== itemId));
  };

  // Update material quantity
  const updateMaterialQuantity = (itemId: string, quantity: number) => {
    setSelectedMaterials(prev => prev.map(material =>
      material.itemId === itemId ? { ...material, quantity } : material
    ));
  };

  const calculateDuration = () => {
    const startDate = new Date(formData.plannedStartDate);
    const endDate = new Date(formData.plannedEndDate);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    handleInputChange('totalPlannedDuration', durationMinutes);
  };

  // Check authentication on component mount
  React.useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      console.error('User not authenticated, redirecting to login');
      dispatch(logout());
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, user, token, dispatch, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication before submitting
    if (!isAuthenticated || !user || !token) {
      console.error('User not authenticated');
      dispatch(logout());
      router.push('/auth/login');
      return;
    }

    if (!selectedCompanyId) {
      console.error('Please select a company');
      return;
    }

    // Validate that at least one input material is selected
    if (selectedMaterials.length === 0) {
      alert('Please add at least one input material to create a batch');
      return;
    }

    // Validate that all selected materials have valid quantities
    const invalidMaterials = selectedMaterials.filter(material =>
      !material.quantity || material.quantity <= 0
    );

    if (invalidMaterials.length > 0) {
      alert('Please enter valid quantities for all selected materials');
      return;
    }

    try {
      // Include selected materials in the batch data
      const batchData = {
        ...formData,
        companyId: selectedCompanyId,
        inputMaterials: selectedMaterials.map(material => {
          const inventoryItem = inventoryItems.find(item => item._id === material.itemId);
          return {
            itemId: material.itemId,
            itemName: material.itemName,
            category: inventoryItem?.category?.primary || 'raw_material',
            quantity: material.quantity,
            unit: material.unit,
            unitCost: material.unitCost,
            totalCost: material.quantity * material.unitCost
          };
        })
      };

      console.log('Creating batch with data:', {
        companyId: selectedCompanyId,
        inputMaterials: batchData.inputMaterials,
        inputMaterialsLength: batchData.inputMaterials.length,
        hasAuth: !!token,
        userId: user._id,
        fullBatchData: batchData
      });

      const batch = await createBatch(batchData).unwrap();

      console.log('Production batch created successfully:', batch);
      console.log('Batch ID:', batch._id);
      console.log('Batch data structure:', JSON.stringify(batch, null, 2));

      if (batch._id) {
        router.push(`/production/batches/${batch._id}`);
      } else {
        console.error('Batch ID is undefined, redirecting to batches list');
        router.push('/production/batches');
      }
    } catch (error: any) {
      console.error('Error creating batch:', error);

      // Handle authentication errors
      if (error?.status === 401 || error?.data?.message?.includes('not authenticated')) {
        console.error('Authentication failed, logging out user');
        dispatch(logout());
        router.push('/auth/login');
        return;
      }

      // Handle other errors
      const errorMessage = error?.data?.message || error?.message || 'Failed to create production batch';
      console.error('Failed to create production batch:', errorMessage);

      // Show error message to user
      alert(`Error: ${errorMessage}`);
    }
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated || !user || !token) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">



      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Production Batch</h1>
          <p className="text-muted-foreground">
            Create a new production batch with specifications and timeline
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Company Selection</CardTitle>
            <CardDescription>
              Select the company for this production batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={handleCompanyChange}
                disabled={companiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={companiesLoading ? "Loading companies..." : "Select a company"} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {companies.map((company) => (
                    <SelectItem key={company._id} value={company._id} className="bg-white hover:bg-gray-50">
                      {company.companyName} ({company.companyCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Material Inputs */}
        {selectedCompanyId && (
          <Card>
            <CardHeader>
              <CardTitle>Input Materials</CardTitle>
              <CardDescription>
                Select materials from inventory stock for this production batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-gray-50/50 rounded-lg p-4">
              {/* Add Material Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Add Material from Inventory</Label>
                  <span className="text-xs text-gray-500">
                    Only raw materials, components, and spare parts
                  </span>
                </div>
                <div className="relative border border-gray-200 rounded-md p-2 bg-white">
                  <Select
                    onValueChange={addMaterial}
                    disabled={inventoryLoading || inventoryItems.length === 0}
                  >
                    <SelectTrigger className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder={
                        inventoryLoading
                          ? "Loading inventory..."
                          : inventoryItems.length === 0
                            ? "No items available"
                            : "Select a material to add"
                      } />
                    </SelectTrigger>
                    <SelectContent
                      className="max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-md z-[9999]"
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={4}
                    >
                      {inventoryItems
                        .filter(item => item.stock.availableStock > 0)
                        .filter(item => !selectedMaterials.some(m => m.itemId === item._id))
                        .filter(item => {
                          // Only allow raw materials and components as input materials
                          const category = item.category?.primary || '';
                          return ['raw_material', 'component', 'spare_parts'].includes(category);
                        })
                        .map((item) => (
                          <SelectItem
                            key={item._id}
                            value={item._id}
                            className="bg-white hover:bg-gray-50 cursor-pointer focus:bg-blue-50 active:bg-blue-100 py-2 px-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{item.itemName}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {item.stock.availableStock} {item.stock.unit} available
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {item.category?.primary || 'raw_material'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {inventoryItems
                  .filter(item => item.stock.availableStock > 0)
                  .filter(item => !selectedMaterials.some(m => m.itemId === item._id))
                  .filter(item => {
                    const category = item.category?.primary || '';
                    return ['raw_material', 'component', 'spare_parts'].includes(category);
                  }).length === 0 && !inventoryLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      No available raw materials to add. Only raw materials, components, and spare parts can be used as input materials.
                    </p>
                  )}
              </div>

              {/* Selected Materials */}
              {selectedMaterials.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Selected Materials ({selectedMaterials.length})</Label>
                    <span className="text-sm text-gray-500">
                      Total Cost: ₹{selectedMaterials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMaterials.map((material) => {
                      const inventoryItem = inventoryItems.find(item => item._id === material.itemId);
                      return (
                        <div key={material.itemId} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{material.itemName}</div>
                              <div className="text-sm text-gray-500">
                                Available: {inventoryItem?.stock.availableStock} {material.unit} |
                                Cost: ₹{material.unitCost}/{material.unit}
                              </div>
                              {/* GRN Mapping Info */}
                              {material.grnNumber && (
                                <div className="mt-1 text-xs">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-2">
                                    GRN: {material.grnNumber}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full ${material.materialSource === 'client_provided'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {material.materialSource === 'client_provided' ? 'Client Material' : 'Own Material'}
                                  </span>
                                  {material.clientInfo && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 ml-2">
                                      Client: {material.clientInfo.clientName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Label htmlFor={`quantity-${material.itemId}`} className="text-sm whitespace-nowrap">Quantity:</Label>
                              <Input
                                id={`quantity-${material.itemId}`}
                                type="number"
                                min="0"
                                max={inventoryItem?.stock.availableStock || 0}
                                value={material.quantity}
                                onChange={(e) => updateMaterialQuantity(material.itemId, parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500 whitespace-nowrap">{material.unit}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {/* GRN Mapping Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleGRNMapping(selectedMaterials.indexOf(material))}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                {material.grnNumber ? 'Change GRN' : 'Map GRN'}
                              </Button>
                              {/* Remove GRN Mapping */}
                              {material.grnNumber && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGRNMapping(selectedMaterials.indexOf(material))}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  Remove GRN
                                </Button>
                              )}
                              {/* Remove Material */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(material.itemId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">No Materials Selected</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add at least one input material from the dropdown above to create a batch
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Required
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details for the production batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productionOrderId">Production Order ID</Label>
                  <Input
                    id="productionOrderId"
                    placeholder="Optional"
                    value={formData.productionOrderId || ''}
                    onChange={(e) => handleInputChange('productionOrderId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerOrderId">Customer Order ID</Label>
                  <Input
                    id="customerOrderId"
                    placeholder="Optional"
                    value={formData.customerOrderId || ''}
                    onChange={(e) => handleInputChange('customerOrderId', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedQuantity">Planned Quantity *</Label>
                  <Input
                    id="plannedQuantity"
                    type="number"
                    required
                    value={formData.plannedQuantity}
                    onChange={(e) => handleInputChange('plannedQuantity', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
                      <SelectItem value="yards" className="bg-white hover:bg-gray-50">Yards</SelectItem>
                      <SelectItem value="pieces" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
                      <SelectItem value="kg" className="bg-white hover:bg-gray-50">Kilograms</SelectItem>
                      <SelectItem value="lbs" className="bg-white hover:bg-gray-50">Pounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="low" className="bg-white hover:bg-gray-50">Low</SelectItem>
                    <SelectItem value="medium" className="bg-white hover:bg-gray-50">Medium</SelectItem>
                    <SelectItem value="high" className="bg-white hover:bg-gray-50">High</SelectItem>
                    <SelectItem value="urgent" className="bg-white hover:bg-gray-50">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                Production schedule and duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedStartDate">Start Date *</Label>
                  <Input
                    id="plannedStartDate"
                    type="date"
                    required
                    value={formData.plannedStartDate}
                    onChange={(e) => {
                      handleInputChange('plannedStartDate', e.target.value);
                      calculateDuration();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedEndDate">End Date *</Label>
                  <Input
                    id="plannedEndDate"
                    type="date"
                    required
                    value={formData.plannedEndDate}
                    onChange={(e) => {
                      handleInputChange('plannedEndDate', e.target.value);
                      calculateDuration();
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPlannedDuration">Total Duration (minutes)</Label>
                <Input
                  id="totalPlannedDuration"
                  type="number"
                  value={formData.totalPlannedDuration}
                  onChange={(e) => handleInputChange('totalPlannedDuration', parseInt(e.target.value))}
                  readOnly
                />
                <p className="text-sm text-gray-500">
                  Calculated automatically based on start and end dates
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Product Specifications</CardTitle>
            <CardDescription>
              Detailed specifications for the product to be manufactured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Input
                  id="productType"
                  required
                  placeholder="e.g., Cotton Shirt"
                  value={formData.productSpecifications.productType}
                  onChange={(e) => handleInputChange('productSpecifications.productType', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabricType">Fabric Type *</Label>
                <Input
                  id="fabricType"
                  required
                  placeholder="e.g., Cotton"
                  value={formData.productSpecifications.fabricType}
                  onChange={(e) => handleInputChange('productSpecifications.fabricType', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsm">GSM</Label>
                <Input
                  id="gsm"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.productSpecifications.gsm || ''}
                  onChange={(e) => handleInputChange('productSpecifications.gsm', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.productSpecifications.width || ''}
                  onChange={(e) => handleInputChange('productSpecifications.width', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="e.g., 200"
                  value={formData.productSpecifications.length || ''}
                  onChange={(e) => handleInputChange('productSpecifications.length', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Navy Blue"
                  value={formData.productSpecifications.color || ''}
                  onChange={(e) => handleInputChange('productSpecifications.color', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorCode">Color Code</Label>
                <Input
                  id="colorCode"
                  placeholder="e.g., #1B365D"
                  value={formData.productSpecifications.colorCode || ''}
                  onChange={(e) => handleInputChange('productSpecifications.colorCode', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="design">Design</Label>
                <Input
                  id="design"
                  placeholder="e.g., Striped"
                  value={formData.productSpecifications.design || ''}
                  onChange={(e) => handleInputChange('productSpecifications.design', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  placeholder="e.g., Solid"
                  value={formData.productSpecifications.pattern || ''}
                  onChange={(e) => handleInputChange('productSpecifications.pattern', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricComposition">Fabric Composition</Label>
              <Textarea
                id="fabricComposition"
                placeholder="e.g., 100% Cotton"
                value={formData.productSpecifications.fabricComposition || ''}
                onChange={(e) => handleInputChange('productSpecifications.fabricComposition', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shrinkage">Shrinkage (%)</Label>
                <Input
                  id="shrinkage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 5"
                  value={formData.productSpecifications.shrinkage || ''}
                  onChange={(e) => handleInputChange('productSpecifications.shrinkage', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorFastness">Color Fastness (1-5)</Label>
                <Input
                  id="colorFastness"
                  type="number"
                  min="1"
                  max="5"
                  placeholder="e.g., 4"
                  value={formData.productSpecifications.colorFastness || ''}
                  onChange={(e) => handleInputChange('productSpecifications.colorFastness', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tensileStrength">Tensile Strength (N)</Label>
                <Input
                  id="tensileStrength"
                  type="number"
                  placeholder="e.g., 250"
                  value={formData.productSpecifications.tensileStrength || ''}
                  onChange={(e) => handleInputChange('productSpecifications.tensileStrength', parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCompanyId || selectedMaterials.length === 0}
            title={
              !selectedCompanyId
                ? 'Please select a company'
                : selectedMaterials.length === 0
                  ? 'Please add at least one input material'
                  : 'Create batch'
            }
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Batch'}
          </Button>
        </div>
      </form>

      {/* GRN Mapping Modal */}
      {showGRNMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Map Material to GRN</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGRNMapping(false);
                  setSelectedMaterialForGRN(null);
                }}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select a GRN to map to the selected material. This will help track material source and client information.
              </p>

              <div className="space-y-2">
                <Label>Available GRNs</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {grnsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading GRNs...</div>
                  ) : grns.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No GRNs available</div>
                  ) : (
                    grns.map((grn: any) => (
                      <div
                        key={grn._id}
                        className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleGRNSelection(
                          grn._id,
                          grn.grnNumber,
                          grn.materialSource,
                          grn.materialSource === 'client_provided' ? {
                            clientId: grn.clientMaterialInfo?.clientId,
                            clientName: grn.clientMaterialInfo?.clientName,
                            clientOrderId: grn.clientMaterialInfo?.clientOrderId,
                            clientOrderNumber: grn.clientMaterialInfo?.clientOrderNumber
                          } : undefined
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{grn.grnNumber}</div>
                            <div className="text-sm text-gray-500">
                              {grn.fabricDetails?.fabricType} - {grn.fabricDetails?.color} |
                              {grn.quantity} {grn.unit}
                            </div>
                            <div className="text-xs">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full mr-2 ${grn.materialSource === 'client_provided'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                {grn.materialSource === 'client_provided' ? 'Client Material' : 'Own Material'}
                              </span>
                              {grn.materialSource === 'client_provided' && grn.clientMaterialInfo?.clientName && (
                                <span className="text-purple-600">
                                  Client: {grn.clientMaterialInfo.clientName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {grn.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateBatchPage() {
  return (
    <AppLayout>
      <CreateBatchPageContent />
    </AppLayout>
  );
}
