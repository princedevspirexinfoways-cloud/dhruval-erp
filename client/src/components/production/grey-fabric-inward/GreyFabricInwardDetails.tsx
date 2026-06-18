'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GreyFabricInward,
  useAddQualityCheckMutation,
  useMarkAsReceivedMutation
} from '@/lib/api/greyFabricInwardApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectCurrentCompanyId } from '@/lib/features/auth/authSlice';
import { 
  X, 
  Edit, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Image as ImageIcon
} from 'lucide-react';

interface GreyFabricInwardDetailsProps {
  grn: GreyFabricInward;
  onClose: () => void;
  onEdit: () => void;
}

export function GreyFabricInwardDetails({ grn, onClose, onEdit }: GreyFabricInwardDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showQualityForm, setShowQualityForm] = useState(false);

  // Get user and company info
  const user = useSelector(selectCurrentUser);
  const companyId = useSelector(selectCurrentCompanyId);

  const [addQualityCheck] = useAddQualityCheckMutation();
  const [markAsReceived] = useMarkAsReceivedMutation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkAsReceived = async () => {
    // Check authentication
    if (!user || !companyId) {
      alert('Authentication required. Please login again.');
      return;
    }

    try {
      await markAsReceived({
        id: grn._id,
        receivedAt: new Date().toISOString()
      }).unwrap();
      onClose();
    } catch (error: any) {
      console.error('Error marking as received:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.data?.message || 
                          error?.message || 
                          'Failed to mark GRN as received. Please try again.';
      
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            GRN Details - {grn.grnNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fabric">Fabric Details</TabsTrigger>
            <TabsTrigger value="quality">Quality Checks</TabsTrigger>
            <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">GRN Number:</span>
                    <span className="font-medium">{grn.grnNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Production Order:</span>
                    <span className="font-medium">{grn.productionOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{grn.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{grn.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(grn.status)}>
                      {getStatusText(grn.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Grade:</span>
                    <Badge className={getQualityColor(grn.quality)}>
                      {grn.quality}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(grn.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {grn.expectedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected:</span>
                      <span className="font-medium">
                        {new Date(grn.expectedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {grn.receivedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Received:</span>
                      <span className="font-medium">
                        {new Date(grn.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(grn.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {grn.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{grn.remarks}</p>
                </CardContent>
              </Card>
            )}

            {grn.images && grn.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {grn.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`GRN Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fabric" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fabric Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fabric Type</label>
                      <p className="text-lg font-semibold">{grn.fabricType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fabric Color</label>
                      <p className="text-lg font-semibold">{grn.fabricColor}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fabric Weight</label>
                      <p className="text-lg font-semibold">{grn.fabricWeight} GSM</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fabric Width</label>
                      <p className="text-lg font-semibold">{grn.fabricWidth} inches</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Quantity</label>
                      <p className="text-lg font-semibold">{typeof grn.quantity === 'number' ? grn.quantity : grn.quantity.receivedQuantity} {grn.unit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Quality Grade</label>
                      <Badge className={getQualityColor(grn.quality)}>
                        {grn.quality}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Quality Checks</h3>
              {grn.status === 'received' && (
                <Button onClick={() => setShowQualityForm(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Quality Check
                </Button>
              )}
            </div>

            {grn.qualityChecks && grn.qualityChecks.length > 0 ? (
              <div className="space-y-4">
                {grn.qualityChecks.map((check, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Quality Check #{index + 1}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {new Date(check.checkedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Checked By</label>
                          <p className="font-medium">{check.checkedBy}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Parameters</label>
                          <div className="space-y-1">
                            <p className="text-sm">Color Fastness: {check.parameters.colorFastness}/5</p>
                            <p className="text-sm">Tensile Strength: {check.parameters.tensileStrength} N</p>
                            <p className="text-sm">Tear Strength: {check.parameters.tearStrength} N</p>
                            <p className="text-sm">Shrinkage: {check.parameters.shrinkage}%</p>
                          </div>
                        </div>
                      </div>
                      {check.defects && check.defects.length > 0 && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-600">Defects Found</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {check.defects.map((defect, defectIndex) => (
                              <Badge key={defectIndex} variant="destructive" className="text-xs">
                                {defect}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {check.notes && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-600">Notes</label>
                          <p className="text-sm text-gray-700 mt-1">{check.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No quality checks performed yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fabric Cost:</span>
                    <span className="font-medium">₹{grn.costBreakdown?.fabricCost?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transportation Cost:</span>
                    <span className="font-medium">₹{grn.costBreakdown?.transportationCost?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inspection Cost:</span>
                    <span className="font-medium">₹{grn.costBreakdown?.inspectionCost?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Cost:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{grn.costBreakdown?.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {grn.status === 'pending' && (
            <Button onClick={handleMarkAsReceived}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Received
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
