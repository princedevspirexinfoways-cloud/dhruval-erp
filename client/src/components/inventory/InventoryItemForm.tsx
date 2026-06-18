'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { WarehouseSelector } from './WarehouseSelector';
import { QuickCreateCategory } from './QuickCreateCategory';
import { QuickCreateUnit } from './QuickCreateUnit';
import { useGetWarehouseByIdQuery } from '@/lib/api/warehousesApi';
import { useGetCategoriesQuery } from '@/features/category/api/categoryApi';
import { useGetUnitsQuery } from '@/features/unit/api/unitApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Plus } from 'lucide-react';

interface InventoryItemFormProps {
  item?: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  theme: 'light' | 'dark';
}

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isSubmitting = false,
  theme
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState(item?.warehouseId || '');
  const [selectedCategory, setSelectedCategory] = useState(item?.category?.primary || '');
  const [selectedUnit, setSelectedUnit] = useState(item?.stock?.unit || '');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);

  // Get theme from Redux
  const currentTheme = useSelector((state: RootState) => state.ui.theme);

  // Get warehouse details to extract company ID (must be defined before using it)
  const { data: warehouseData } = useGetWarehouseByIdQuery(selectedWarehouse, {
    skip: !selectedWarehouse
  });

  const warehouse = warehouseData?.data;

  // Get company ID from warehouse or user
  const companyIdFromWarehouse = warehouse?.companyId;
  const companyIdFromUser = useSelector((state: RootState) => state.auth.user?.companyAccess?.[0]?.companyId);
  const effectiveCompanyId = companyIdFromWarehouse || companyIdFromUser;

  // Fetch categories and units - refetch when dialogs open/close to get latest data
  const { data: categoriesData, refetch: refetchCategories } = useGetCategoriesQuery(
    effectiveCompanyId ? { companyId: effectiveCompanyId.toString() } : {},
    { skip: false }
  );
  const { data: unitsData, refetch: refetchUnits } = useGetUnitsQuery(
    effectiveCompanyId ? { companyId: effectiveCompanyId.toString() } : {},
    { skip: false }
  );

  const categories = categoriesData?.data || [];
  const units = unitsData?.data || [];

  // Handle item changes (for editing)
  useEffect(() => {
    if (item) {
      console.log('Form initialized with item:', item);
      setSelectedWarehouse(item.warehouseId || '');
      setSelectedCategory(item.category?.primary || '');
      setSelectedUnit(item.stock?.unit || '');
    }
  }, [item]);

  // Handle category creation callback
  const handleCategoryCreated = async (categoryId: string) => {
    // Refetch categories to ensure the new one is in the list
    await refetchCategories();
    setSelectedCategory(categoryId);
  };

  // Handle unit creation callback
  const handleUnitCreated = async (unitId: string) => {
    // Refetch units to ensure the new one is in the list
    await refetchUnits();
    setSelectedUnit(unitId);
  };

  // Refetch when dialogs close to get latest data
  useEffect(() => {
    if (!showCategoryDialog) {
      refetchCategories();
    }
  }, [showCategoryDialog, refetchCategories]);

  useEffect(() => {
    if (!showUnitDialog) {
      refetchUnits();
    }
  }, [showUnitDialog, refetchUnits]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate warehouse selection
    if (!selectedWarehouse) {
      alert('Please select a warehouse first');
      return;
    }

    // Validate category selection
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    // Validate unit selection
    if (!selectedUnit) {
      alert('Please select a unit');
      return;
    }

    // Validate company ID is available
    if (!warehouse?.companyId) {
      alert('Company ID not available from selected warehouse. Please try again.');
      return;
    }

    // Get category name from selected category ID
    const selectedCategoryObj = categories.find((cat: any) => cat._id === selectedCategory);
    const categoryName = selectedCategoryObj?.name || selectedCategory;

    // Get unit symbol/name from selected unit ID
    const selectedUnitObj = units.find((unit: any) => unit._id === selectedUnit);
    const unitValue = selectedUnitObj?.symbol || selectedUnitObj?.name || selectedUnit;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Add warehouse selection, category (name), unit (symbol), and company ID
    data.warehouseId = selectedWarehouse;
    data.category = categoryName; // Use the category name
    data.unit = unitValue; // Use the unit symbol/name
    data.companyId = warehouse.companyId.toString(); // Auto-get company ID from warehouse

    console.log('Form data being submitted:', data);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Item Name *
            </Label>
            <Input
              name="itemName"
              defaultValue={item?.itemName || ''}
              required
              placeholder="Enter item name"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Item Code
            </Label>
            <Input
              name="itemCode"
              defaultValue={item?.itemCode || ''}
              placeholder="Auto-generated if empty"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                Category *
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowCategoryDialog(true)}
                className={`h-7 px-2 ${currentTheme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className={currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-blue-50 border-blue-200'}>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className={`${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-[10060]`}>
                {categories.map((cat: any) => (
                  <SelectItem
                    key={cat._id}
                    value={cat._id}
                    className={currentTheme === 'dark' ? 'text-white hover:bg-gray-700' : 'hover:bg-gray-50'}
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="category" value={selectedCategory} />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Product Type
            </Label>
            <Input
              name="productType"
              defaultValue={item?.productType || ''}
              placeholder="e.g., cotton, silk, etc."
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="itemDescription"
            defaultValue={item?.itemDescription || ''}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter item description"
          />
        </div>
      </div>

      {/* Warehouse Selection */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Warehouse
        </h3>

        <div className="grid grid-cols-1 gap-6">
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onWarehouseChange={setSelectedWarehouse}
            onAddWarehouse={() => {
              // Handle add warehouse
              console.log('Add warehouse clicked');
            }}
          />
        </div>
      </div>


      {/* Specifications */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              GSM
            </Label>
            <Input
              name="gsm"
              type="number"
              defaultValue={item?.specifications?.gsm || ''}
              placeholder="Fabric weight"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Width (inches)
            </Label>
            <Input
              name="width"
              type="number"
              step="0.01"
              defaultValue={item?.specifications?.width || ''}
              placeholder="Fabric width"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Color
            </Label>
            <Input
              name="color"
              defaultValue={item?.specifications?.color || ''}
              placeholder="e.g., Blue, Red"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Design
            </Label>
            <Input
              name="design"
              defaultValue={item?.specifications?.design || ''}
              placeholder="e.g., Geometric, Floral"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Finish
            </Label>
            <select
              name="finish"
              defaultValue={item?.specifications?.finish || ''}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">Select Finish</option>
              <option value="Glossy">Glossy</option>
              <option value="Matte">Matte</option>
              <option value="Textured">Textured</option>
              <option value="Smooth">Smooth</option>
            </select>
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Length (meters)
            </Label>
            <Input
              name="length"
              type="number"
              step="0.01"
              defaultValue={item?.specifications?.length || ''}
              placeholder="Fabric length"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* Stock Information */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Stock Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Current Stock *
            </Label>
            <Input
              name="currentStock"
              type="number"
              defaultValue={item?.stock?.currentStock || ''}
              required
              placeholder="Available quantity"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                Unit *
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowUnitDialog(true)}
                className={`h-7 px-2 ${currentTheme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            <Select
              value={selectedUnit}
              onValueChange={setSelectedUnit}
            >
              <SelectTrigger className={currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-blue-50 border-blue-200'}>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent className={`${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-[10060]`}>
                {units.map((unit: any) => (
                  <SelectItem
                    key={unit._id}
                    value={unit._id}
                    className={currentTheme === 'dark' ? 'text-white hover:bg-gray-700' : 'hover:bg-gray-50'}
                  >
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="unit" value={selectedUnit} />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Reorder Level
            </Label>
            <Input
              name="reorderLevel"
              type="number"
              defaultValue={item?.stock?.reorderLevel || ''}
              placeholder="When to reorder"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Max Stock Level
            </Label>
            <Input
              name="maxStockLevel"
              type="number"
              defaultValue={item?.stock?.maxStockLevel || ''}
              placeholder="Maximum storage capacity"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Min Stock Level
            </Label>
            <Input
              name="minStockLevel"
              type="number"
              defaultValue={item?.stock?.minStockLevel || ''}
              placeholder="Minimum stock level"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>


        </div>
      </div>

      {/* Pricing */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Pricing Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Cost Price (₹)
            </Label>
            <Input
              name="costPrice"
              type="number"
              step="0.01"
              defaultValue={item?.pricing?.costPrice || ''}
              placeholder="Purchase cost per unit"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Selling Price (₹)
            </Label>
            <Input
              name="sellingPrice"
              type="number"
              step="0.01"
              defaultValue={item?.pricing?.sellingPrice || ''}
              placeholder="Sale price per unit"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              MRP (₹)
            </Label>
            <Input
              name="mrp"
              type="number"
              step="0.01"
              defaultValue={item?.pricing?.mrp || ''}
              placeholder="Maximum retail price"
              className={`w-full ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* Quality */}
      <div className={`rounded-lg border p-6 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${currentTheme === 'dark' ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
          Quality Control
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className={currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
              Quality Grade
            </Label>
            <select
              name="qualityGrade"
              defaultValue={item?.quality?.qualityGrade || ''}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="">Select Grade</option>
              <option value="A">A (Premium)</option>
              <option value="B">B (Standard)</option>
              <option value="C">C (Basic)</option>
            </select>
          </div>


        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={currentTheme === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
        </Button>
      </div>

      {/* Quick Create Dialogs */}
      <QuickCreateCategory
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
      <QuickCreateUnit
        open={showUnitDialog}
        onOpenChange={setShowUnitDialog}
        onUnitCreated={handleUnitCreated}
      />
    </form>
  );
};
