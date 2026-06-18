'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { CrudModal } from '@/components/ui/CrudModal';
import { 
  useGetPreProcessingBatchesQuery,
  useUpdatePreProcessingStatusMutation,
  useCreatePreProcessingBatchMutation,
  PreProcessingBatch,
  CreatePreProcessingBatchRequest
} from '@/lib/api/preProcessingApi';
import { useGetCompaniesQuery } from '@/lib/api/greyFabricInwardApi';
import { useGetInventoryItemsQuery, InventoryItem } from '@/lib/api/inventoryApi';
import { 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Factory,
  Package,
  Truck,
  Droplets,
  RefreshCw,
  Activity,
  Plus,
  Eye,
  ExternalLink,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  useInitializeFlowMutation,
  useStartStageMutation,
  useCompleteStageMutation,
  useHoldStageMutation,
  useResumeStageMutation
} from '@/lib/api/productionFlowApi';

export default function PreProcessingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Stage update modal state
  const [isStageUpdateModalOpen, setIsStageUpdateModalOpen] = useState(false);
  const [selectedBatchForStageUpdate, setSelectedBatchForStageUpdate] = useState<any>(null);
  const [newStageNumber, setNewStageNumber] = useState<number>(2);
  const [stageUpdateNotes, setStageUpdateNotes] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<Array<{
    item: InventoryItem;
    quantity: number;
    unit: string;
  }>>([]);
  const [selectedFabricMaterials, setSelectedFabricMaterials] = useState<Array<{
    item: InventoryItem;
    quantity: number;
    unit: 'meters' | 'yards' | 'pieces';
  }>>([]);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [rawMaterialsForSelectedFabric, setRawMaterialsForSelectedFabric] = useState<InventoryItem[]>([]);
  const [isLoadingRawMaterials, setIsLoadingRawMaterials] = useState(false);

  // Use RTK Query hooks
  const { 
    data: batchesResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useGetPreProcessingBatchesQuery();
  
  const [updateStatus] = useUpdatePreProcessingStatusMutation();
  const [createBatch, { isLoading: creating }] = useCreatePreProcessingBatchMutation();
  const [initializeFlow] = useInitializeFlowMutation();
  const [startStage] = useStartStageMutation();
  const [completeStage] = useCompleteStageMutation();
  const [holdStage] = useHoldStageMutation();
  const [resumeStage] = useResumeStageMutation();
  const { data: companies = [] } = useGetCompaniesQuery();
  const { data: inventoryResponse, isLoading: inventoryLoading } = useGetInventoryItemsQuery({ 
    limit: 100, 
    companyId: formData.companyId || undefined,
    search: inventorySearchTerm || undefined
  });
  
  const inventoryItems = inventoryResponse?.data?.data || [];

  const batches = batchesResponse?.data || [];

  // Auto-fetch fabric materials when company is selected
  useEffect(() => {
    if (formData.companyId && inventoryItems.length > 0) {
      console.log('Total inventory items for company:', inventoryItems.length);
      console.log('Sample inventory items:', inventoryItems.slice(0, 3));
      
      // Filter fabric materials for the selected company - more flexible filtering
      const fabricItems = inventoryItems.filter(item => {
        const categoryMatch = item.category?.primary?.toLowerCase().includes('fabric');
        const nameMatch = item.itemName?.toLowerCase().includes('fabric');
        const typeMatch = item.productType?.toLowerCase().includes('fabric');
        
        // Also check for common fabric-related terms
        const cottonMatch = item.itemName?.toLowerCase().includes('cotton') || 
                          item.productType?.toLowerCase().includes('cotton') ||
                          item.category?.primary?.toLowerCase().includes('cotton');
        const polyesterMatch = item.itemName?.toLowerCase().includes('polyester') || 
                             item.productType?.toLowerCase().includes('polyester') ||
                             item.category?.primary?.toLowerCase().includes('polyester');
        const linenMatch = item.itemName?.toLowerCase().includes('linen') || 
                          item.productType?.toLowerCase().includes('linen') ||
                          item.category?.primary?.toLowerCase().includes('linen');
        const silkMatch = item.itemName?.toLowerCase().includes('silk') || 
                         item.productType?.toLowerCase().includes('silk') ||
                         item.category?.primary?.toLowerCase().includes('silk');
        
        return categoryMatch || nameMatch || typeMatch || cottonMatch || polyesterMatch || linenMatch || silkMatch;
      });
      
      console.log('Available fabric materials for company:', fabricItems);
      console.log('Fabric items count:', fabricItems.length);
    }
  }, [formData.companyId, inventoryItems]);

  // Function to fetch raw materials based on selected fabric
  const fetchRawMaterialsForFabric = async (fabricItem: InventoryItem) => {
    setIsLoadingRawMaterials(true);
    try {
      // Filter raw materials that are commonly used with the selected fabric
      const rawMaterials = inventoryItems.filter(item => {
        // Exclude fabric items
        const isNotFabric = !item.category?.primary?.toLowerCase().includes('fabric') && 
                           !item.itemName?.toLowerCase().includes('fabric') &&
                           !item.productType?.toLowerCase().includes('fabric');
        
        // Include chemicals, dyes, auxiliaries, and other raw materials
        const isRawMaterial = item.category?.primary?.toLowerCase().includes('chemical') ||
                              item.category?.primary?.toLowerCase().includes('dye') ||
                              item.category?.primary?.toLowerCase().includes('auxiliary') ||
                              item.category?.primary?.toLowerCase().includes('raw') ||
                              item.itemName?.toLowerCase().includes('chemical') ||
                              item.itemName?.toLowerCase().includes('dye') ||
                              item.itemName?.toLowerCase().includes('auxiliary') ||
                              item.productType?.toLowerCase().includes('chemical') ||
                              item.productType?.toLowerCase().includes('dye');
        
        return isNotFabric && (isRawMaterial || item.category?.primary?.toLowerCase().includes('material'));
      });
      
      setRawMaterialsForSelectedFabric(rawMaterials);
      console.log('Raw materials for fabric:', fabricItem.itemName, rawMaterials);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      toast.error('Failed to fetch raw materials');
    } finally {
      setIsLoadingRawMaterials(false);
    }
  };

  // Auto-fetch raw materials when fabric is selected
  useEffect(() => {
    if (selectedFabricMaterials.length > 0 && formData.companyId) {
      // Fetch raw materials for the most recently selected fabric
      const latestFabric = selectedFabricMaterials[selectedFabricMaterials.length - 1];
      fetchRawMaterialsForFabric(latestFabric.item);
    } else {
      setRawMaterialsForSelectedFabric([]);
    }
  }, [selectedFabricMaterials, formData.companyId]);

  // Form submission handler
  const handleCreateBatch = async () => {
    try {
      // Validate required basic fields
      if (!formData.processType || !formData.processName || !formData.companyId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate required Input Material fields (multiple fabric materials)
      if (selectedFabricMaterials.length === 0) {
        toast.error('Please select at least one fabric material from inventory');
        return;
      }

      const invalidFabric = selectedFabricMaterials.find(fabric => 
        fabric.quantity <= 0 || !fabric.unit
      );

      if (invalidFabric) {
        toast.error('Please enter valid quantity and unit for all selected fabric materials');
        return;
      }

      // Transform form data to match API structure
      const batchData: CreatePreProcessingBatchRequest = {
        productionOrderId: formData.productionOrderId || '',
        productionOrderNumber: formData.productionOrderNumber || '',
        greyFabricInwardId: formData.greyFabricInwardId || '',
        grnNumber: formData.grnNumber || '',
        processType: (formData.processType as 'desizing' | 'bleaching' | 'scouring' | 'mercerizing' | 'combined') || 'desizing',
        processName: formData.processName || '',
        processDescription: formData.processDescription || '',
        inputMaterials: selectedFabricMaterials.map(fabric => ({
          fabricType: fabric.item.itemName,
          fabricGrade: fabric.item.quality?.qualityGrade || 'Grade A',
          gsm: fabric.item.specifications?.gsm || 0,
          width: fabric.item.specifications?.width || 0,
          color: fabric.item.specifications?.color || 'Grey',
          quantity: fabric.quantity,
          unit: fabric.unit,
          weight: fabric.item.specifications?.weight || 0,
          inventoryItemId: fabric.item._id,
        })) as any,
        chemicalRecipe: {
          recipeName: `${formData.processType} Recipe`,
          recipeVersion: '1.0',
          chemicals: selectedInventoryItems.map(selected => ({
            chemicalId: selected.item._id,
            chemicalName: selected.item.itemName,
            quantity: selected.quantity,
            unit: selected.unit as 'kg' | 'liters' | 'grams' | 'ml',
            concentration: 0,
            temperature: 0,
            ph: 0
          })),
          totalRecipeCost: selectedInventoryItems.reduce((total, selected) => 
            total + (selected.item.pricing.costPrice * selected.quantity), 0
          ),
        },
        processParameters: {
          temperature: {
            min: Number(formData['processParameters.temperature.min']) || 0,
            max: Number(formData['processParameters.temperature.max']) || 0,
            actual: Number(formData['processParameters.temperature.actual']) || 0,
            unit: formData['processParameters.temperature.unit'] || 'celsius',
          },
          pressure: {
            min: Number(formData['processParameters.pressure.min']) || 0,
            max: Number(formData['processParameters.pressure.max']) || 0,
            actual: Number(formData['processParameters.pressure.actual']) || 0,
            unit: formData['processParameters.pressure.unit'] || 'bar',
          },
          ph: {
            min: Number(formData['processParameters.ph.min']) || 0,
            max: Number(formData['processParameters.ph.max']) || 0,
            actual: Number(formData['processParameters.ph.actual']) || 0,
          },
          time: {
            planned: Number(formData['processParameters.time.planned']) || 0,
            unit: formData['processParameters.time.unit'] || 'minutes',
          },
          speed: {
            planned: Number(formData['processParameters.speed.planned']) || 0,
            unit: formData['processParameters.speed.unit'] || 'm/min',
          },
        },
        machineAssignment: {
          machineId: formData['machineAssignment.machineId'] || '',
          machineName: formData['machineAssignment.machineName'] || '',
          machineType: formData['machineAssignment.machineType'] || '',
          capacity: Number(formData['machineAssignment.capacity']) || 0,
          efficiency: Number(formData['machineAssignment.efficiency']) || 0,
        },
        workerAssignment: {
          workers: [],
          supervisorId: formData['workerAssignment.supervisorId'] || '',
          supervisorName: formData['workerAssignment.supervisorName'] || '',
        },
        timing: {
          plannedStartTime: formData['timing.plannedStartTime'] ? new Date(formData['timing.plannedStartTime']).toISOString() : new Date().toISOString(),
          plannedEndTime: formData['timing.plannedEndTime'] ? new Date(formData['timing.plannedEndTime']).toISOString() : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          plannedDuration: 120,
          setupTime: 30,
          cleaningTime: 15,
          downtime: 0,
        },
        qualityControl: {
          preProcessCheck: {
            fabricCondition: formData['qualityControl.preProcessCheck.fabricCondition'] || 'good',
            defects: [],
            notes: formData['qualityControl.preProcessCheck.notes'] || '',
            checkedBy: formData['qualityControl.preProcessCheck.checkedBy'] || '',
            checkedByName: formData['qualityControl.preProcessCheck.checkedByName'] || '',
            checkDate: new Date().toISOString(),
          },
          inProcessCheck: {
            temperature: Number(formData['qualityControl.inProcessCheck.temperature']) || 0,
            ph: Number(formData['qualityControl.inProcessCheck.ph']) || 0,
            color: formData['qualityControl.inProcessCheck.color'] || '',
            consistency: formData['qualityControl.inProcessCheck.consistency'] || 'good',
            notes: formData['qualityControl.inProcessCheck.notes'] || '',
            checkedBy: formData['qualityControl.inProcessCheck.checkedBy'] || '',
            checkedByName: formData['qualityControl.inProcessCheck.checkedByName'] || '',
            checkTime: new Date().toISOString(),
          },
          postProcessCheck: {
            whiteness: Number(formData['qualityControl.postProcessCheck.whiteness']) || 0,
            absorbency: formData['qualityControl.postProcessCheck.absorbency'] || 'good',
            strength: Number(formData['qualityControl.postProcessCheck.strength']) || 0,
            shrinkage: Number(formData['qualityControl.postProcessCheck.shrinkage']) || 0,
            defects: [],
            qualityGrade: formData['qualityControl.postProcessCheck.qualityGrade'] || 'A',
            notes: formData['qualityControl.postProcessCheck.notes'] || '',
            checkedBy: formData['qualityControl.postProcessCheck.checkedBy'] || '',
            checkedByName: formData['qualityControl.postProcessCheck.checkedByName'] || '',
            checkDate: new Date().toISOString(),
          },
        },
        outputMaterial: {
          quantity: selectedFabricMaterials.reduce((total, fabric) => total + fabric.quantity, 0),
          unit: selectedFabricMaterials[0]?.unit || 'meters',
          weight: selectedFabricMaterials.reduce((total, fabric) => total + (fabric.quantity * (fabric.item.specifications?.weight || 0)), 0),
          gsm: selectedFabricMaterials.length > 0 ? selectedFabricMaterials[0].item.specifications?.gsm || 0 : 0,
          width: selectedFabricMaterials.length > 0 ? selectedFabricMaterials[0].item.specifications?.width || 0 : 0,
          color: 'White',
          quality: 'A',
          defects: [],
          location: {
            warehouseId: formData['outputMaterial.location.warehouseId'] || '',
            warehouseName: formData['outputMaterial.location.warehouseName'] || '',
          },
        },
        wasteManagement: {
          wasteGenerated: [],
          totalWasteCost: 0,
          environmentalCompliance: true,
        },
        costs: {
          chemicalCost: selectedInventoryItems.reduce((total, selected) => 
            total + (selected.item.pricing.costPrice * selected.quantity), 0
          ),
          laborCost: 0,
          machineCost: 0,
          utilityCost: 0,
          wasteDisposalCost: 0,
          totalCost: selectedInventoryItems.reduce((total, selected) => 
            total + (selected.item.pricing.costPrice * selected.quantity), 0
          ),
          costPerUnit: 0,
        },
        notes: formData.notes || '',
      };

      const response = await createBatch(batchData);
      
      if (response.data?.success) {
        toast.success('Pre-processing batch created successfully!');
        // Auto-initialize production flow and start Pre-Processing stage (2) if production order is provided
        if (formData.productionOrderId) {
          try {
            await initializeFlow(formData.productionOrderId).unwrap().catch(() => {});
            await startStage({ 
              productionOrderId: formData.productionOrderId,
              stageNumber: 2,
              data: {}
            }).unwrap();
            toast.success('Production flow updated: Pre-Processing started');
          } catch (e) {
            console.error('Flow update failed', e);
            toast.error('Could not update production flow');
          }
        }
        setShowCreateForm(false);
        setFormData({});
        refetch();
      } else {
        toast.error('Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    }
  };

  // Form fields configuration
  const formFields = [
    {
      name: 'companyId',
      label: 'Company',
      type: 'select' as const,
      required: true,
      options: companies.map(company => ({
        value: company._id,
        label: `${company.companyName} (${company.companyCode})`
      }))
    },
    {
      name: 'productionOrderId',
      label: 'Production Order ID (Optional)',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter production order ID if available'
    },
    {
      name: 'productionOrderNumber',
      label: 'Production Order Number (Optional)',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter production order number if available'
    },
    {
      name: 'greyFabricInwardId',
      label: 'Grey Fabric Inward ID (Optional)',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter grey fabric inward ID if available'
    },
    {
      name: 'grnNumber',
      label: 'GRN Number (Optional)',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter GRN number if available'
    },
    {
      name: 'processType',
      label: 'Process Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'desizing', label: 'Desizing' },
        { value: 'bleaching', label: 'Bleaching' },
        { value: 'scouring', label: 'Scouring' },
        { value: 'mercerizing', label: 'Mercerizing' },
        { value: 'combined', label: 'Combined Process' },
      ]
    },
    {
      name: 'processName',
      label: 'Process Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter process name'
    },
    {
      name: 'processDescription',
      label: 'Process Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter process description',
      rows: 3
    },
    {
      name: 'inputMaterial.fabricType',
      label: 'Fabric Type',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Cotton, Polyester, Linen'
    },
    {
      name: 'inputMaterial.fabricGrade',
      label: 'Fabric Grade',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Grade A, Grade B'
    },
    {
      name: 'inputMaterial.gsm',
      label: 'GSM (Grams per Square Meter)',
      type: 'number' as const,
      required: true,
      placeholder: 'Enter GSM value'
    },
    {
      name: 'inputMaterial.width',
      label: 'Fabric Width (inches)',
      type: 'number' as const,
      required: true,
      placeholder: 'Enter width in inches'
    },
    {
      name: 'inputMaterial.quantity',
      label: 'Quantity',
      type: 'number' as const,
      required: true,
      placeholder: 'Enter quantity'
    },
    {
      name: 'inputMaterial.unit',
      label: 'Unit',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'meters', label: 'Meters' },
        { value: 'yards', label: 'Yards' },
        { value: 'pieces', label: 'Pieces' },
      ]
    },
    {
      name: 'inputMaterial.color',
      label: 'Fabric Color',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Grey, White, Blue'
    },
    {
      name: 'inputMaterial.weight',
      label: 'Weight (kg)',
      type: 'number' as const,
      required: false,
      placeholder: 'Enter weight in kg'
    },
    // Process Parameters Section
    {
      name: 'processParameters.temperature.min',
      label: 'Temperature Min (°C)',
      type: 'number' as const,
      required: false,
      placeholder: 'Minimum temperature'
    },
    {
      name: 'processParameters.temperature.max',
      label: 'Temperature Max (°C)',
      type: 'number' as const,
      required: false,
      placeholder: 'Maximum temperature'
    },
    {
      name: 'processParameters.temperature.actual',
      label: 'Temperature Actual (°C)',
      type: 'number' as const,
      required: false,
      placeholder: 'Actual temperature'
    },
    {
      name: 'processParameters.pressure.min',
      label: 'Pressure Min (bar)',
      type: 'number' as const,
      required: false,
      placeholder: 'Minimum pressure'
    },
    {
      name: 'processParameters.pressure.max',
      label: 'Pressure Max (bar)',
      type: 'number' as const,
      required: false,
      placeholder: 'Maximum pressure'
    },
    {
      name: 'processParameters.pressure.actual',
      label: 'Pressure Actual (bar)',
      type: 'number' as const,
      required: false,
      placeholder: 'Actual pressure'
    },
    {
      name: 'processParameters.ph.min',
      label: 'pH Min',
      type: 'number' as const,
      required: false,
      placeholder: 'Minimum pH'
    },
    {
      name: 'processParameters.ph.max',
      label: 'pH Max',
      type: 'number' as const,
      required: false,
      placeholder: 'Maximum pH'
    },
    {
      name: 'processParameters.ph.actual',
      label: 'pH Actual',
      type: 'number' as const,
      required: false,
      placeholder: 'Actual pH'
    },
    {
      name: 'processParameters.time.planned',
      label: 'Planned Time (minutes)',
      type: 'number' as const,
      required: false,
      placeholder: 'Planned processing time'
    },
    {
      name: 'processParameters.speed.planned',
      label: 'Planned Speed (m/min)',
      type: 'number' as const,
      required: false,
      placeholder: 'Planned processing speed'
    },
    // Machine Assignment Section
    {
      name: 'machineAssignment.machineId',
      label: 'Machine ID',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter machine ID'
    },
    {
      name: 'machineAssignment.machineName',
      label: 'Machine Name',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter machine name'
    },
    {
      name: 'machineAssignment.machineType',
      label: 'Machine Type',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter machine type'
    },
    {
      name: 'machineAssignment.capacity',
      label: 'Machine Capacity',
      type: 'number' as const,
      required: false,
      placeholder: 'Enter machine capacity'
    },
    {
      name: 'machineAssignment.efficiency',
      label: 'Machine Efficiency (%)',
      type: 'number' as const,
      required: false,
      placeholder: 'Enter efficiency percentage'
    },
    // Worker Assignment Section
    {
      name: 'workerAssignment.supervisorId',
      label: 'Supervisor ID',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter supervisor ID'
    },
    {
      name: 'workerAssignment.supervisorName',
      label: 'Supervisor Name',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter supervisor name'
    },
    // Output Material Section
    {
      name: 'outputMaterial.location.warehouseId',
      label: 'Warehouse ID',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter warehouse ID'
    },
    {
      name: 'outputMaterial.location.warehouseName',
      label: 'Warehouse Name',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter warehouse name'
    },
    {
      name: 'timing.plannedStartTime',
      label: 'Planned Start Time',
      type: 'datetime-local' as const,
      required: true,
      placeholder: 'Select start date and time'
    },
    {
      name: 'timing.plannedEndTime',
      label: 'Planned End Time',
      type: 'datetime-local' as const,
      required: true,
      placeholder: 'Select end date and time'
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter any additional notes',
      rows: 3
    }
  ];

  const handleViewDetails = (batch: any) => {
    router.push(`/production/pre-processing/${batch._id}`);
  };

  const handleAddInventoryItem = (item: InventoryItem) => {
    const existingItem = selectedInventoryItems.find(selected => selected.item._id === item._id);
    if (!existingItem) {
      setSelectedInventoryItems([...selectedInventoryItems, {
        item,
        quantity: 1,
        unit: item.stock.unit
      }]);
    }
  };

  const handleRemoveInventoryItem = (itemId: string) => {
    setSelectedInventoryItems(selectedInventoryItems.filter(selected => selected.item._id !== itemId));
  };

  const handleUpdateInventoryQuantity = (itemId: string, quantity: number) => {
    setSelectedInventoryItems(selectedInventoryItems.map(selected => 
      selected.item._id === itemId 
        ? { ...selected, quantity: Math.max(0, quantity) }
        : selected
    ));
  };

  const handleStatusToggle = async (batchId: string, currentStatus: string) => {
    try {
      setUpdatingStatus(batchId);
      
      // Determine next status based on current status
      let nextStatus: string;
      switch (currentStatus) {
        case 'pending':
          nextStatus = 'in_progress';
          break;
        case 'in_progress':
          nextStatus = 'completed';
          break;
        case 'completed':
          nextStatus = 'pending';
          break;
        case 'on_hold':
          nextStatus = 'in_progress';
          break;
        default:
          nextStatus = 'in_progress';
      }

      const response = await updateStatus({
        id: batchId,
        data: {
        status: nextStatus as any,
        notes: `Status changed from ${currentStatus} to ${nextStatus} via toggle`,
        changeReason: `Toggle status change from ${currentStatus} to ${nextStatus}`
      }
      });

      if (response.data?.success) {
        toast.success(`Status updated to ${getStatusText(nextStatus)}`);

        // Mirror status to Production Flow stage 2 if production order exists
        const updatedBatch = batches.find(b => b._id === batchId);
        const orderId = (updatedBatch as any)?.productionOrderId;
        if (orderId) {
          try {
            if (nextStatus === 'in_progress') {
              await resumeStage({ productionOrderId: orderId as any, stageNumber: 2, data: {} }).unwrap().catch(async () => {
                await startStage({ productionOrderId: orderId as any, stageNumber: 2, data: {} }).unwrap();
              });
            } else if (nextStatus === 'completed') {
              await completeStage({ productionOrderId: orderId as any, stageNumber: 2, data: {} }).unwrap();
            } else if (nextStatus === 'on_hold' || nextStatus === 'quality_hold') {
              await holdStage({ productionOrderId: orderId as any, stageNumber: 2, data: { reason: nextStatus } }).unwrap();
            }
          } catch (e) {
            console.error('Failed to sync production flow stage', e);
            toast.error('Failed to sync production flow');
          }
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle opening stage update modal
  const handleOpenStageUpdateModal = (batch: any) => {
    setSelectedBatchForStageUpdate(batch);
    setNewStageNumber(2); // Default to Pre-Processing stage (2)
    setStageUpdateNotes('');
    setIsStageUpdateModalOpen(true);
  };

  // Handle stage update
  const handleStageUpdate = async () => {
    if (!selectedBatchForStageUpdate) return;

    try {
      setUpdatingStage(true);
      
      // Try to get production order ID from different possible fields
      const orderId = selectedBatchForStageUpdate.productionOrderId || 
                     selectedBatchForStageUpdate.productionOrderNumber ||
                     selectedBatchForStageUpdate.orderId;
      
      if (!orderId) {
        toast.error('No production order found for this batch. Please ensure the batch is linked to a production order.');
        console.log('Batch data:', selectedBatchForStageUpdate);
        return;
      }

      // Get current user info for logging
      const currentUser = localStorage.getItem('user');
      const userInfo = currentUser ? JSON.parse(currentUser) : { name: 'Unknown User', _id: 'unknown' };

      // Prepare stage action data with comprehensive logging
      const stageActionData = {
        notes: stageUpdateNotes || `Stage updated to ${newStageNumber} by ${userInfo.name}`,
        completedBy: userInfo.name,
        startedBy: userInfo.name,
        actualQuantity: selectedBatchForStageUpdate.quantity || 0,
        qualityNotes: `Stage transition logged by ${userInfo.name} at ${new Date().toISOString()}`,
        reason: `Manual stage update from Pre-Processing to Stage ${newStageNumber}`
      };

      // Log the stage update action
      console.log('Production Stage Update:', {
        batchId: selectedBatchForStageUpdate._id,
        batchNumber: selectedBatchForStageUpdate.batchNumber,
        productionOrderId: orderId,
        fromStage: 2, // Pre-Processing stage
        toStage: newStageNumber,
        updatedBy: userInfo.name,
        userId: userInfo._id,
        timestamp: new Date().toISOString(),
        notes: stageUpdateNotes,
        actionData: stageActionData
      });

      // Complete current stage (Pre-Processing - stage 2)
      await completeStage({ 
        productionOrderId: orderId, 
        stageNumber: 2, 
        data: stageActionData 
      }).unwrap();

      // Start new stage if it's not the last stage
      if (newStageNumber <= 6) { // Max 6 stages based on production flow
        await startStage({ 
          productionOrderId: orderId, 
          stageNumber: newStageNumber, 
          data: stageActionData 
        }).unwrap();
      }

      toast.success(`Production stage updated to Stage ${newStageNumber} successfully`);
      
      // Close modal and reset state
      setIsStageUpdateModalOpen(false);
      setSelectedBatchForStageUpdate(null);
      setStageUpdateNotes('');

    } catch (error: any) {
      console.error('Stage update error:', error);
      toast.error(error?.data?.message || 'Failed to update production stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'quality_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      case 'quality_hold': return 'Quality Hold';
      default: return 'Unknown';
    }
  };

  const getProcessTypeColor = (processType: string) => {
    switch (processType) {
      case 'desizing': return 'bg-blue-100 text-blue-800';
      case 'bleaching': return 'bg-yellow-100 text-yellow-800';
      case 'scouring': return 'bg-green-100 text-green-800';
      case 'mercerizing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pre-Processing</h1>
          <p className="text-gray-600">Desizing and bleaching operations</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4" />
          Create New Batch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Factory className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.filter(b => b.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.length > 0 
                    ? Math.round(batches.reduce((sum, b) => sum + (b.machineAssignment?.efficiency || 0), 0) / batches.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Batches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Pre-Processing Batches
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading batches...</span>
                  </div>
                ) : (
                <div className="space-y-4">
                    {batches.slice(0, 5).map((batch) => (
                      <div key={batch._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{batch.batchNumber}</h3>
                          <Badge className={getStatusColor(batch.status)}>
                            {getStatusText(batch.status)}
                          </Badge>
                          <Badge className={getProcessTypeColor(batch.processType)}>
                            {batch.processType}
                          </Badge>
                        </div>
                          <p className="text-sm text-gray-600">{batch.productionOrderNumber}</p>
                          <p className="text-sm text-gray-500">
                            Temperature: {batch.processParameters?.temperature?.actual || 0}°C / {batch.processParameters?.temperature?.max || 0}°C
                          </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{batch.progress}%</span>
                          </div>
                          <Progress value={batch.progress} className="h-2" />
                        </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Status:</span>
                            <Switch
                              checked={batch.status === 'in_progress' || batch.status === 'completed'}
                              onCheckedChange={() => handleStatusToggle(batch._id, batch.status)}
                              disabled={updatingStatus === batch._id}
                            />
                            {updatingStatus === batch._id && (
                              <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                            )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenStageUpdateModal(batch)}
                          disabled={updatingStage}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                          </div>
                      </div>
                    </div>
                  ))}
                    {batches.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No pre-processing batches found</p>
                        <Button className="mt-4" onClick={() => {/* Add new batch logic */}}>
                          Create First Batch
                        </Button>
                      </div>
                    )}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Process Status */}
            <Card>
              <CardHeader>
                <CardTitle>Process Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Batches</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {batches.filter(b => b.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Today</span>
                    <span className="text-2xl font-bold text-green-600">
                      {batches.filter(b => {
                        const today = new Date().toDateString();
                        return b.status === 'completed' && 
                               new Date(b.updatedAt).toDateString() === today;
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Batches</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {batches.filter(b => b.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On Hold</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {batches.filter(b => b.status === 'on_hold').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                All Pre-Processing Batches
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading batches...</span>
                </div>
              ) : (
              <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch._id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{batch.batchNumber}</h3>
                          <p className="text-gray-600">{batch.productionOrderNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            <Switch
                              checked={batch.status === 'in_progress' || batch.status === 'completed'}
                              onCheckedChange={() => handleStatusToggle(batch._id, batch.status)}
                              disabled={updatingStatus === batch._id}
                            />
                            {updatingStatus === batch._id && (
                              <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                            )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(batch)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStageUpdateModal(batch)}
                          className="flex items-center gap-1"
                          disabled={updatingStage}
                        >
                          <Edit3 className="h-3 w-3" />
                          Update Stage
                        </Button>
                        <Badge className={getStatusColor(batch.status)}>
                          {getStatusText(batch.status)}
                        </Badge>
                        <Badge className={getProcessTypeColor(batch.processType)}>
                          {batch.processType}
                        </Badge>
                          </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Process Type</p>
                        <p className="font-medium">{batch.processType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Temperature</p>
                          <p className="font-medium">
                            {batch.processParameters?.temperature?.actual || 0}°C / {batch.processParameters?.temperature?.max || 0}°C
                          </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Efficiency</p>
                          <p className="font-medium">{batch.machineAssignment?.efficiency || 0}%</p>
                        </div>
                      <div>
                        <p className="text-sm text-gray-500">Production Stage</p>
                        <Badge className="bg-blue-100 text-blue-800">
                          Stage 2 - Pre-Processing
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{batch.progress}%</span>
                        </div>
                        <Progress value={batch.progress} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                      {/* Status Change Log */}
                      {batch.statusChangeLog && batch.statusChangeLog.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Status History</h4>
                          <div className="space-y-1">
                            {batch.statusChangeLog.slice(-3).map((log, index) => (
                              <div key={index} className="text-xs text-gray-500">
                                <span className="font-medium">{log.changedByName}</span> changed status from{' '}
                                <span className="font-medium">{log.fromStatus}</span> to{' '}
                                <span className="font-medium">{log.toStatus}</span> on{' '}
                                <span className="font-medium">
                                  {new Date(log.changeDate).toLocaleString()}
                                </span>
                                {log.notes && (
                                  <span className="block text-gray-400 mt-1">{log.notes}</span>
                                )}
                  </div>
                ))}
              </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {batches.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pre-processing batches found</p>
                      <Button className="mt-4" onClick={() => {/* Add new batch logic */}}>
                        Create First Batch
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Processing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics charts will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Processing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Settings configuration will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create New Batch Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create New Pre-Processing Batch</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({});
                    setSelectedInventoryItems([]);
                    setInventorySearchTerm('');
                  }}
                >
                  Close
                </Button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateBatch(); }} className="space-y-6">
                {/* Basic Form Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formFields.slice(0, 8).map((field) => (
                    <div key={field.name}>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select
                          value={formData[field.name] || ''}
                          onValueChange={(value) => setFormData({...formData, [field.name]: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="bg-white hover:bg-gray-50">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          placeholder={field.placeholder}
                          rows={field.rows || 3}
                        />
                      ) : field.type === 'datetime-local' ? (
                        <input
                          type="datetime-local"
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md"
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border rounded-md"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                  </div>
                </div>

                {/* Input Material Section - Fabric Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    🧵 Fabric Material Selection <span className="text-red-500 text-sm">* Required</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the fabric material that will be processed (e.g., Cotton, Polyester, Linen)
                  </p>
                  
                  {/* Company Selection Status */}
                  {!formData.companyId ? (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Please select a company first to view available fabric materials
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-green-800">
                          ✅ Company selected - {(() => {
                            const fabricItems = inventoryItems.filter(item => {
                              const categoryMatch = item.category?.primary?.toLowerCase().includes('fabric');
                              const nameMatch = item.itemName?.toLowerCase().includes('fabric');
                              const typeMatch = item.productType?.toLowerCase().includes('fabric');
                              
                              // Also check for common fabric-related terms
                              const cottonMatch = item.itemName?.toLowerCase().includes('cotton') || 
                                                item.productType?.toLowerCase().includes('cotton') ||
                                                item.category?.primary?.toLowerCase().includes('cotton');
                              const polyesterMatch = item.itemName?.toLowerCase().includes('polyester') || 
                                                   item.productType?.toLowerCase().includes('polyester') ||
                                                   item.category?.primary?.toLowerCase().includes('polyester');
                              const linenMatch = item.itemName?.toLowerCase().includes('linen') || 
                                                item.productType?.toLowerCase().includes('linen') ||
                                                item.category?.primary?.toLowerCase().includes('linen');
                              const silkMatch = item.itemName?.toLowerCase().includes('silk') || 
                                               item.productType?.toLowerCase().includes('silk') ||
                                               item.category?.primary?.toLowerCase().includes('silk');
                              
                              return categoryMatch || nameMatch || typeMatch || cottonMatch || polyesterMatch || linenMatch || silkMatch;
                            });
                            
                            if (fabricItems.length > 0) {
                              return `${fabricItems.length} fabric materials available`;
                            } else {
                              return `${inventoryItems.length} total materials available (showing all items)`;
                            }
                          })()}
                        </p>
                        {selectedFabricMaterials.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-green-700">
                            {isLoadingRawMaterials ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Fetching raw materials...
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3" />
                                {rawMaterialsForSelectedFabric.length} raw materials available
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multiple Fabric Material Selection */}
                  {formData.companyId && (
                    <div className="space-y-4">
                      {/* Debug Information */}
                      {inventoryItems.length > 0 && (
                        <div className="text-xs text-gray-500 mb-2">
                          Debug: Found {inventoryItems.length} total inventory items for this company
                        </div>
                      )}
                      
                      {/* Add Fabric Material */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-800 mb-3">Add Fabric Material</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Select Fabric <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value=""
                              onValueChange={(value) => {
                                const selectedItem = inventoryItems.find(item => item._id === value);
                                if (selectedItem && !selectedFabricMaterials.find(f => f.item._id === value)) {
                                  const newFabricMaterial = {
                                    item: selectedItem,
                                    quantity: 0,
                                    unit: 'meters' as 'meters' | 'yards' | 'pieces'
                                  };
                                  setSelectedFabricMaterials([...selectedFabricMaterials, newFabricMaterial]);
                                  // Immediately fetch raw materials for this fabric
                                  fetchRawMaterialsForFabric(selectedItem);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select fabric material" />
                              </SelectTrigger>
                              <SelectContent className="z-[10001]">
                                {(() => {
                                  const fabricItems = inventoryItems.filter(item => {
                                    const categoryMatch = item.category?.primary?.toLowerCase().includes('fabric');
                                    const nameMatch = item.itemName?.toLowerCase().includes('fabric');
                                    const typeMatch = item.productType?.toLowerCase().includes('fabric');
                                    
                                    // Also check for common fabric-related terms
                                    const cottonMatch = item.itemName?.toLowerCase().includes('cotton') || 
                                                      item.productType?.toLowerCase().includes('cotton') ||
                                                      item.category?.primary?.toLowerCase().includes('cotton');
                                    const polyesterMatch = item.itemName?.toLowerCase().includes('polyester') || 
                                                         item.productType?.toLowerCase().includes('polyester') ||
                                                         item.category?.primary?.toLowerCase().includes('polyester');
                                    const linenMatch = item.itemName?.toLowerCase().includes('linen') || 
                                                      item.productType?.toLowerCase().includes('linen') ||
                                                      item.category?.primary?.toLowerCase().includes('linen');
                                    const silkMatch = item.itemName?.toLowerCase().includes('silk') || 
                                                     item.productType?.toLowerCase().includes('silk') ||
                                                     item.category?.primary?.toLowerCase().includes('silk');
                                    
                                    return categoryMatch || nameMatch || typeMatch || cottonMatch || polyesterMatch || linenMatch || silkMatch;
                                  });
                                  
                                  // If no fabric items found, show all items as fallback
                                  const itemsToShow = fabricItems.length > 0 ? fabricItems : inventoryItems;
                                  
                                  return itemsToShow
                                    .filter(item => !selectedFabricMaterials.find(f => f.item._id === item._id))
                                    .map((item) => (
                                      <SelectItem key={item._id} value={item._id} className="bg-white hover:bg-gray-50">
                                        {item.itemName} - {item.quality?.qualityGrade || 'N/A'} ({item.specifications?.gsm || 'N/A'} GSM)
                                        {fabricItems.length === 0 && ' (All Items)'}
                                      </SelectItem>
                                    ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Quantity <span className="text-red-500">*</span>
                            </Label>
                            <input
                              type="number"
                              placeholder="Enter quantity"
                              className="w-full px-3 py-2 border rounded-md"
                              onChange={(e) => {
                                const quantity = Number(e.target.value);
                                if (quantity > 0 && selectedFabricMaterials.length > 0) {
                                  const updated = [...selectedFabricMaterials];
                                  updated[updated.length - 1].quantity = quantity;
                                  setSelectedFabricMaterials(updated);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Unit <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (selectedFabricMaterials.length > 0) {
                                  const updated = [...selectedFabricMaterials];
                                  updated[updated.length - 1].unit = value as 'meters' | 'yards' | 'pieces';
                                  setSelectedFabricMaterials(updated);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent className="z-[10001]">
                                <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
                                <SelectItem value="yards" className="bg-white hover:bg-gray-50">Yards</SelectItem>
                                <SelectItem value="pieces" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Selected Fabric Materials List */}
                      {selectedFabricMaterials.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-800">Selected Fabric Materials:</h4>
                          {selectedFabricMaterials.map((fabric, index) => (
                            <div key={fabric.item._id} className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 mb-2">
                                    <div><strong>Fabric:</strong> {fabric.item.itemName}</div>
                                    <div><strong>Grade:</strong> {fabric.item.quality?.qualityGrade || 'N/A'}</div>
                                    <div><strong>GSM:</strong> {fabric.item.specifications?.gsm || 'N/A'}</div>
                                    <div><strong>Width:</strong> {fabric.item.specifications?.width || 'N/A'} inches</div>
                                    <div><strong>Color:</strong> {fabric.item.specifications?.color || 'N/A'}</div>
                                    <div><strong>Weight:</strong> {fabric.item.specifications?.weight || 'N/A'} kg</div>
                                  </div>
                                  <div className="flex gap-4 items-center">
                                    <div>
                                      <Label className="text-xs text-blue-700">Quantity:</Label>
                                      <input
                                        type="number"
                                        value={fabric.quantity}
                                        onChange={(e) => {
                                          const updated = [...selectedFabricMaterials];
                                          updated[index].quantity = Number(e.target.value);
                                          setSelectedFabricMaterials(updated);
                                        }}
                                        className="w-20 px-2 py-1 border rounded text-sm"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-blue-700">Unit:</Label>
                                      <Select
                                        value={fabric.unit}
                                        onValueChange={(value) => {
                                          const updated = [...selectedFabricMaterials];
                                          updated[index].unit = value as 'meters' | 'yards' | 'pieces';
                                          setSelectedFabricMaterials(updated);
                                        }}
                                      >
                                        <SelectTrigger className="w-24 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[10001]">
                                          <SelectItem value="meters" className="bg-white hover:bg-gray-50">Meters</SelectItem>
                                          <SelectItem value="yards" className="bg-white hover:bg-gray-50">Yards</SelectItem>
                                          <SelectItem value="pieces" className="bg-white hover:bg-gray-50">Pieces</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = selectedFabricMaterials.filter((_, i) => i !== index);
                                    setSelectedFabricMaterials(updated);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chemical & Raw Materials Selection Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    🧪 Chemical & Raw Materials Selection
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select chemicals and raw materials needed for the process (e.g., Dyes, Chemicals, Auxiliaries)
                  </p>

                  {/* Recommended Raw Materials for Selected Fabric */}
                  {selectedFabricMaterials.length > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Recommended Raw Materials for Selected Fabric
                        </h4>
                        {isLoadingRawMaterials && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        )}
                      </div>
                      
                      {rawMaterialsForSelectedFabric.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-blue-700 mb-3">
                            Based on your selected fabric, here are the recommended raw materials:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rawMaterialsForSelectedFabric.slice(0, 6).map((item) => (
                              <div key={item._id} className="p-3 bg-white border border-blue-100 rounded-md hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{item.itemName}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="font-medium">Stock:</span> {item.stock.availableStock} {item.stock.unit} • 
                                      <span className="font-medium ml-1">Cost:</span> ₹{item.pricing.costPrice}
                                    </div>
                                    {item.category && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        {item.category.primary}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddInventoryItem(item)}
                                    disabled={selectedInventoryItems.some(selected => selected.item._id === item._id) || item.stock.availableStock <= 0}
                                    className="min-w-16 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {rawMaterialsForSelectedFabric.length > 6 && (
                            <p className="text-xs text-blue-600 mt-2">
                              + {rawMaterialsForSelectedFabric.length - 6} more materials available below
                            </p>
                          )}
                        </div>
                      ) : !isLoadingRawMaterials && (
                        <div className="text-center py-4">
                          <Package className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                          <p className="text-sm text-blue-600">
                            No specific raw materials found for the selected fabric. Browse all available materials below.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Company Selection Warning */}
                  {!formData.companyId && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Please select a company first to view available chemicals and raw materials
                      </p>
                    </div>
                  )}

                  {/* Search and Filter */}
                  {formData.companyId && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Search Raw Materials
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search chemicals, dyes, auxiliaries..."
                          value={inventorySearchTerm}
                          onChange={(e) => setInventorySearchTerm(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setInventorySearchTerm('')}
                          size="sm"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Available Inventory Items */}
                  {formData.companyId && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Available Raw Materials ({inventoryItems.length} items)
                      </Label>
                      {inventoryLoading ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">Loading inventory items...</p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                          {inventoryItems.length > 0 ? (
                            inventoryItems.map((item) => (
                              <div key={item._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{item.itemName}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span className="font-medium">Code:</span> {item.itemCode} • 
                                    <span className="font-medium ml-1">Stock:</span> {item.stock.availableStock} {item.stock.unit} • 
                                    <span className="font-medium ml-1">Cost:</span> ₹{item.pricing.costPrice} per {item.stock.unit}
                                  </div>
                                  {item.category && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Category: {item.category.primary}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">Available</div>
                                    <div className="text-sm font-medium">{item.stock.availableStock} {item.stock.unit}</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddInventoryItem(item)}
                                    disabled={selectedInventoryItems.some(selected => selected.item._id === item._id) || item.stock.availableStock <= 0}
                                    className="min-w-16"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
                                {inventorySearchTerm ? 'No items found matching your search' : 'No raw materials found in inventory'}
                              </p>
                              {inventorySearchTerm && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setInventorySearchTerm('')}
                                  className="mt-2"
                                >
                                  Clear Search
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Inventory Items */}
                  {selectedInventoryItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700">
                          Selected Raw Materials ({selectedInventoryItems.length} items)
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInventoryItems([])}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {selectedInventoryItems.map((selected) => (
                          <div key={selected.item._id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">{selected.item.itemName}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Code:</span> {selected.item.itemCode} • 
                                  <span className="font-medium ml-1">Available:</span> {selected.item.stock.availableStock} {selected.item.stock.unit} • 
                                  <span className="font-medium ml-1">Unit Cost:</span> ₹{selected.item.pricing.costPrice}
                                </div>
                                {selected.item.category && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Category: {selected.item.category.primary}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveInventoryItem(selected.item._id)}
                                className="text-red-600 hover:text-red-700 ml-2"
                              >
                                Remove
                              </Button>
                            </div>
                            
                            {/* Quantity and Cost Section */}
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Label className="text-sm font-medium text-gray-700">Production Quantity:</Label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0.01"
                                    max={selected.item.stock.availableStock}
                                    step="0.01"
                                    value={selected.quantity}
                                    onChange={(e) => handleUpdateInventoryQuantity(selected.item._id, Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-sm border rounded-md text-center"
                                    placeholder="0.00"
                                  />
                                  <span className="text-sm text-gray-600 font-medium">{selected.unit}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Total Cost</div>
                                <div className="text-sm font-bold text-green-600">
                                  ₹{(selected.item.pricing.costPrice * selected.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Stock Warning */}
                            {selected.quantity > selected.item.stock.availableStock && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                ⚠️ Quantity exceeds available stock ({selected.item.stock.availableStock} {selected.unit})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary Section */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Total Items Selected</div>
                            <div className="text-lg font-bold text-blue-600">{selectedInventoryItems.length}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Total Raw Material Cost</div>
                            <div className="text-lg font-bold text-green-600">
                              ₹{selectedInventoryItems.reduce((total, selected) => 
                                total + (selected.item.pricing.costPrice * selected.quantity), 0
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Production Summary */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium text-gray-700 mb-2">Production Summary:</div>
                          <div className="space-y-1 text-xs text-gray-600">
                            {selectedInventoryItems.map((selected) => (
                              <div key={selected.item._id} className="flex justify-between">
                                <span>{selected.item.itemName}:</span>
                                <span>{selected.quantity} {selected.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({});
                      setSelectedInventoryItems([]);
                      setInventorySearchTerm('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {creating ? 'Creating...' : 'Create Batch'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Batch Details: {selectedBatch.batchNumber}</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Batch Number</label>
                        <p className="text-sm">{selectedBatch.batchNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Process Type</label>
                        <p className="text-sm">{selectedBatch.processType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Process Name</label>
                        <p className="text-sm">{selectedBatch.processName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge className={getStatusColor(selectedBatch.status)}>
                          {getStatusText(selectedBatch.status)}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Progress</label>
                        <p className="text-sm">{selectedBatch.progress}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created At</label>
                        <p className="text-sm">{new Date(selectedBatch.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Input Material */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Input Material
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBatch.inputMaterial && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Fabric Type</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.fabricType || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Fabric Grade</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.fabricGrade || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">GSM</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.gsm || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Width</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.width || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Color</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.color || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Quantity</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.quantity || 'N/A'} {selectedBatch.inputMaterial.unit || ''}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Weight</label>
                          <p className="text-sm">{selectedBatch.inputMaterial.weight || 'N/A'} kg</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Process Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Process Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBatch.processParameters && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Temperature</label>
                          <p className="text-sm">
                            {selectedBatch.processParameters.temperature?.min || 'N/A'}°C - {selectedBatch.processParameters.temperature?.max || 'N/A'}°C
                            {selectedBatch.processParameters.temperature?.actual && ` (Actual: ${selectedBatch.processParameters.temperature.actual}°C)`}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Pressure</label>
                          <p className="text-sm">
                            {selectedBatch.processParameters.pressure?.min || 'N/A'} - {selectedBatch.processParameters.pressure?.max || 'N/A'} bar
                            {selectedBatch.processParameters.pressure?.actual && ` (Actual: ${selectedBatch.processParameters.pressure.actual} bar)`}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">pH</label>
                          <p className="text-sm">
                            {selectedBatch.processParameters.ph?.min || 'N/A'} - {selectedBatch.processParameters.ph?.max || 'N/A'}
                            {selectedBatch.processParameters.ph?.actual && ` (Actual: ${selectedBatch.processParameters.ph.actual})`}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Time</label>
                          <p className="text-sm">{selectedBatch.processParameters.time?.planned || 'N/A'} {selectedBatch.processParameters.time?.unit || 'minutes'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Speed</label>
                          <p className="text-sm">{selectedBatch.processParameters.speed?.planned || 'N/A'} {selectedBatch.processParameters.speed?.unit || 'm/min'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chemical Recipe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5" />
                      Chemical Recipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBatch.chemicalRecipe && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Recipe Name</label>
                          <p className="text-sm">{selectedBatch.chemicalRecipe.recipeName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Recipe Version</label>
                          <p className="text-sm">{selectedBatch.chemicalRecipe.recipeVersion || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Recipe Cost</label>
                          <p className="text-sm">₹{selectedBatch.chemicalRecipe.totalRecipeCost || '0'}</p>
                        </div>
                        {selectedBatch.chemicalRecipe.chemicals && selectedBatch.chemicalRecipe.chemicals.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Chemicals Used</label>
                            <div className="space-y-2 mt-2">
                              {selectedBatch.chemicalRecipe.chemicals.map((chemical: any, index: number) => (
                                <div key={index} className="p-2 border rounded bg-gray-50">
                                  <div className="font-medium text-sm">{chemical.chemicalName}</div>
                                  <div className="text-xs text-gray-500">
                                    Quantity: {chemical.quantity} {chemical.unit}
                                  </div>
                                  {chemical.concentration > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Concentration: {chemical.concentration}%
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Machine Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Machine Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBatch.machineAssignment && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Machine ID</label>
                          <p className="text-sm">{selectedBatch.machineAssignment.machineId || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Machine Name</label>
                          <p className="text-sm">{selectedBatch.machineAssignment.machineName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Machine Type</label>
                          <p className="text-sm">{selectedBatch.machineAssignment.machineType || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Capacity</label>
                          <p className="text-sm">{selectedBatch.machineAssignment.capacity || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Efficiency</label>
                          <p className="text-sm">{selectedBatch.machineAssignment.efficiency || 'N/A'}%</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Change History */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Status Change History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBatch.statusChangeLog && selectedBatch.statusChangeLog.length > 0 ? (
                      <div className="space-y-4">
                        {selectedBatch.statusChangeLog.map((log: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  Status changed from <span className="text-red-600">{log.fromStatus}</span> to <span className="text-green-600">{log.toStatus}</span>
                                </p>
                                <p className="text-sm text-gray-600">{log.changeReason}</p>
                                {log.notes && <p className="text-sm text-gray-500 mt-1">{log.notes}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{log.changedByName}</p>
                                <p className="text-xs text-gray-500">{new Date(log.changeDate).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No status change history available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Update Modal */}
      {isStageUpdateModalOpen && selectedBatchForStageUpdate && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Update Production Stage</h2>
                <Button
                  variant="outline"
                  onClick={() => setIsStageUpdateModalOpen(false)}
                  disabled={updatingStage}
                  className="hover:bg-gray-50"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Batch Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-sm text-blue-800 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Batch Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Batch:</span>
                      <span className="text-gray-800">{selectedBatchForStageUpdate.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Order Number:</span>
                      <span className="text-gray-800">{selectedBatchForStageUpdate.productionOrderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Order ID:</span>
                      <span className="text-gray-800">{selectedBatchForStageUpdate.productionOrderId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Status:</span>
                      <Badge className={`${getStatusColor(selectedBatchForStageUpdate.status)}`}>
                        {getStatusText(selectedBatchForStageUpdate.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stage Selection */}
                <div className="relative z-[100000]">
                  <Label htmlFor="stage-select" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowRight className="h-4 w-4" />
                    Select Next Production Stage
                  </Label>
                  <Select value={newStageNumber.toString()} onValueChange={(value) => setNewStageNumber(parseInt(value))}>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100001]">
                      <SelectItem value="3" className="bg-white hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Stage 3 - Dyeing/Printing</span>
                          <span className="text-xs text-gray-500">Batch Process</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="4"  className="bg-white hover:bg-gray-50 hover:bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Stage 4 - Finishing Process</span>
                          <span className="text-xs text-gray-500">Stenter, Coating</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="5"  className="bg-white hover:bg-gray-50 hover:bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Stage 5 - Quality Control</span>
                          <span className="text-xs text-gray-500">Pass/Hold/Reject</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="6"  className="bg-white hover:bg-gray-50 hover:bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-medium">Stage 6 - Cutting & Packing</span>
                          <span className="text-xs text-gray-500">Labels & Cartons</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="stage-notes" className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Edit3 className="h-4 w-4" />
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="stage-notes"
                    placeholder="Add any notes about this stage transition..."
                    value={stageUpdateNotes}
                    onChange={(e) => setStageUpdateNotes(e.target.value)}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleStageUpdate}
                    disabled={updatingStage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updatingStage ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Updating Stage...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Update Stage
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsStageUpdateModalOpen(false)}
                    disabled={updatingStage}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
