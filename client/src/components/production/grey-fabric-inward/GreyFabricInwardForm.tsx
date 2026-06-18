"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  useCreateGreyFabricInwardMutation,
  useUpdateGreyFabricInwardMutation,
  GreyFabricInward,
  CreateGreyFabricInwardRequest,
} from "@/lib/api/greyFabricInwardApi";
import { useGetAllCompaniesQuery } from "@/lib/features/companies/companiesApi";
import { useGetPurchaseOrdersQuery } from "@/lib/api/purchaseOrdersApi";
import { useGetWarehousesQuery } from "@/lib/api/warehousesApi";
import { useGetCustomersQuery } from "@/lib/api/customersApi";
import { useGetSalesOrdersQuery } from "@/lib/api/salesApi";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsSuperAdmin,
} from "@/lib/features/auth/authSlice";
import { selectTheme } from "@/lib/features/ui/uiSlice";
import { X, Save, Package, AlertCircle, Plus } from "lucide-react";

interface GreyFabricInwardFormProps {
  grn?: GreyFabricInward | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GreyFabricInwardForm({
  grn,
  onClose,
  onSuccess,
}: GreyFabricInwardFormProps) {
  // User and company info
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const theme = useSelector(selectTheme);
  const userCompanyId = (user as any)?.companyAccess?.[0]?.companyId;

  const [formData, setFormData] = useState<CreateGreyFabricInwardRequest>({
    purchaseOrderId: "none",
    companyId: userCompanyId || "",
    fabricType: "cotton",
    fabricColor: "",
    fabricWeight: 0,
    fabricWidth: 0,
    quantity: 0,
    unit: "meters",
    quality: "A",
    expectedAt: "",
    remarks: "",
    images: [],
    costBreakdown: {
      fabricCost: 0,
      transportationCost: 0,
      inspectionCost: 0,
    },
    entryType: "direct_stock_entry",
    materialSource: "own_material",
    clientMaterialInfo: {
      clientId: "",
      clientName: "",
      clientOrderId: "",
      clientOrderNumber: "",
      clientMaterialCode: "",
      clientBatchNumber: "",
      clientLotNumber: "",
      clientProvidedDate: "",
      clientInstructions: "",
      clientQualitySpecs: "",
      returnRequired: false,
      returnDeadline: "",
      clientContactPerson: "",
      clientContactPhone: "",
      clientContactEmail: "",
    },
    greyStockLots: [],
  });

  const [showLotSection, setShowLotSection] = useState(false);
  const [newLot, setNewLot] = useState({
    lotNumber: "",
    lotQuantity: 0,
    lotUnit: "meters",
    qualityGrade: "A",
    costPerUnit: 0,
    warehouseId: "",
    warehouseName: "",
    rackNumber: "",
    shelfNumber: "",
    binNumber: "",
    expiryDate: "",
    remarks: "",
  });

  const [lotCounter, setLotCounter] = useState(1);

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    userCompanyId || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any>(null);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");

  // RTK Query hooks
  const [createGrn, { isLoading: isCreating }] =
    useCreateGreyFabricInwardMutation();
  const [updateGrn, { isLoading: isUpdating }] =
    useUpdateGreyFabricInwardMutation();
  const { data: companiesData } = useGetAllCompaniesQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const {
    data: purchaseOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetPurchaseOrdersQuery(
    {
      companyId: selectedCompanyId,
      page: 1,
      limit: 100,
    },
    {
      skip: !selectedCompanyId,
    }
  );

  // Get warehouses for selected company
  const { data: warehousesData, isLoading: warehousesLoading } =
    useGetWarehousesQuery(
      {
        companyId: formData.companyId,
        page: 1,
        limit: 100,
      },
      {
        skip: !formData.companyId,
      }
    );

  // Get customers for selected company (when material source is client_provided)
  const { data: customersData, isLoading: customersLoading } =
    useGetCustomersQuery(
      {
        companyId: selectedCompanyId,
        page: 1,
        limit: 100,
      },
      {
        skip:
          !selectedCompanyId || formData.materialSource !== "client_provided",
      }
    );

  // Get sales orders for client material source
  const {
    data: salesOrdersData,
    isLoading: salesOrdersLoading,
    error: salesOrdersError,
  } = useGetSalesOrdersQuery(
    {
      page: 1,
      limit: 100,
      // Remove status filter to get all orders (draft, confirmed, etc.)
      companyId: selectedCompanyId, // Filter by selected company
    },
    {
      skip: !selectedCompanyId, // Skip if no company selected
    }
  );

  // Debug sales orders data
  console.log("Sales Orders Debug:", {
    selectedCompanyId,
    salesOrdersLoading,
    salesOrdersError,
    salesOrdersData: salesOrdersData?.data?.orders?.length || 0,
    materialSource: formData.materialSource,
    orderStatuses: salesOrdersData?.data?.orders?.map((o) => o.status) || [],
  });

  // Set selectedCompanyId for non-super admin users
  useEffect(() => {
    if (!isSuperAdmin && userCompanyId && !selectedCompanyId) {
      setSelectedCompanyId(userCompanyId);
    }
  }, [isSuperAdmin, userCompanyId, selectedCompanyId]);

  // Reset lot warehouse selection and counter when company changes
  useEffect(() => {
    if (formData.companyId && newLot.warehouseId) {
      setNewLot((prev) => ({
        ...prev,
        warehouseId: "",
        warehouseName: "",
      }));
    }
    // Reset lot counter when company changes
    setLotCounter(1);
  }, [formData.companyId]);

  const isEdit = !!grn;
  const isLoading = isCreating || isUpdating;
  const isFormDisabled =
    formData.entryType === "purchase_order" &&
    (!purchaseOrders?.data?.data?.length ||
      !!ordersError ||
      formData.purchaseOrderId === "loading" ||
      formData.purchaseOrderId === "error" ||
      formData.purchaseOrderId === "no-data");

  useEffect(() => {
    if (grn) {
      setFormData({
        purchaseOrderId: grn.purchaseOrderId || "none",
        companyId: grn.companyId || userCompanyId || "",
        entryType: grn.entryType || "direct_stock_entry",
        fabricType:
          (grn.fabricType as
            | "cotton"
            | "polyester"
            | "viscose"
            | "blend"
            | "other") || "cotton",
        fabricColor: grn.fabricColor,
        fabricWeight: grn.fabricWeight,
        fabricWidth: grn.fabricWidth,
        quantity:
          typeof grn.quantity === "number"
            ? grn.quantity
            : grn.quantity.receivedQuantity,
        unit: grn.unit,
        quality: grn.quality,
        expectedAt: grn.expectedAt || "",
        remarks: grn.remarks || "",
        images: grn.images || [],
        costBreakdown: {
          fabricCost: grn.costBreakdown?.fabricCost || 0,
          transportationCost: grn.costBreakdown?.transportationCost || 0,
          inspectionCost: grn.costBreakdown?.inspectionCost || 0,
        },
        materialSource: grn.materialSource || "own_material",
        clientMaterialInfo: grn.clientMaterialInfo || {
          clientId: "",
          clientName: "",
          clientOrderId: "",
          clientOrderNumber: "",
          clientMaterialCode: "",
          clientBatchNumber: "",
          clientLotNumber: "",
          clientProvidedDate: "",
          clientInstructions: "",
          clientQualitySpecs: "",
          returnRequired: false,
          returnDeadline: "",
          clientContactPerson: "",
          clientContactPhone: "",
          clientContactEmail: "",
        },
        greyStockLots: grn.greyStockLots || [],
      });
    }
  }, [grn, userCompanyId]);

  // Auto-populate form when PO is selected
  useEffect(() => {
    if (formData.purchaseOrderId && purchaseOrders?.data?.data) {
      const selectedOrder = purchaseOrders.data.data.find(
        (po: any) => po._id === formData.purchaseOrderId
      );
      if (selectedOrder) {
        setSelectedPO(selectedOrder);

        // Auto-populate form data from selected PO
        if (selectedOrder.items && selectedOrder.items.length > 0) {
          const selectedItem =
            selectedOrder.items[selectedItemIndex] || selectedOrder.items[0];

          // Map item name to valid fabric type enum
          const mapToFabricType = (
            itemName: string
          ): "cotton" | "polyester" | "viscose" | "blend" | "other" => {
            const name = itemName.toLowerCase();
            if (name.includes("cotton")) return "cotton";
            if (name.includes("polyester")) return "polyester";
            if (name.includes("viscose")) return "viscose";
            if (name.includes("blend")) return "blend";
            return "other";
          };

          setFormData((prev) => ({
            ...prev,
            fabricType: mapToFabricType(selectedItem.itemName || ""),
            fabricColor: selectedItem.itemName || prev.fabricColor,
            fabricWeight: selectedItem.specifications
              ? parseFloat(selectedItem.specifications) || prev.fabricWeight
              : prev.fabricWeight,
            fabricWidth: selectedItem.quantity || prev.fabricWidth,
            quantity: selectedItem.quantity || prev.quantity,
            unit: prev.unit, // Keep existing unit
            costBreakdown: {
              ...prev.costBreakdown,
              fabricCost:
                selectedItem.unitPrice || prev.costBreakdown.fabricCost,
            },
          }));
        }

        // Auto-populate supplier info if available
        if (selectedOrder.supplier) {
          setFormData((prev) => ({
            ...prev,
            remarks: `Supplier: ${
              selectedOrder.supplier?.supplierName || "N/A"
            }\nPO Number: ${
              (selectedOrder as any).poNumber || "N/A"
            }\nExpected Delivery: ${
              selectedOrder.expectedDeliveryDate
                ? new Date(
                    selectedOrder.expectedDeliveryDate
                  ).toLocaleDateString()
                : "N/A"
            }`,
          }));
        }
      }
    }
  }, [formData.purchaseOrderId, purchaseOrders?.data?.data]);

  // Re-populate form when selected item index changes
  useEffect(() => {
    if (selectedPO && selectedPO.items && selectedPO.items.length > 0) {
      const selectedItem =
        selectedPO.items[selectedItemIndex] || selectedPO.items[0];

      // Map item name to valid fabric type enum
      const mapToFabricType = (
        itemName: string
      ): "cotton" | "polyester" | "viscose" | "blend" | "other" => {
        const name = itemName.toLowerCase();
        if (name.includes("cotton")) return "cotton";
        if (name.includes("polyester")) return "polyester";
        if (name.includes("viscose")) return "viscose";
        if (name.includes("blend")) return "blend";
        return "other";
      };

      setFormData((prev) => ({
        ...prev,
        fabricType: mapToFabricType(selectedItem.itemName || ""),
        fabricColor: selectedItem.itemName || prev.fabricColor,
        fabricWeight: selectedItem.specifications
          ? parseFloat(selectedItem.specifications) || prev.fabricWeight
          : prev.fabricWeight,
        fabricWidth: selectedItem.quantity || prev.fabricWidth,
        quantity: selectedItem.quantity || prev.quantity,
        unit: prev.unit, // Keep existing unit
        costBreakdown: {
          ...prev.costBreakdown,
          fabricCost: selectedItem.unitPrice || prev.costBreakdown.fabricCost,
        },
      }));
    }
  }, [selectedItemIndex, selectedPO]);

  // Auto-populate client details when client is selected
  useEffect(() => {
    if (selectedClientId && customersData?.data) {
      const selectedClient = customersData.data.find(
        (client: any) => client._id === selectedClientId
      );
      if (selectedClient) {
        setFormData((prev) => ({
          ...prev,
          clientMaterialInfo: {
            ...prev.clientMaterialInfo,
            clientId: selectedClient._id,
            clientName: selectedClient.customerName,
            clientContactPerson: selectedClient.contactInfo?.primaryPhone || "",
            clientContactPhone: selectedClient.contactInfo?.primaryPhone || "",
            clientContactEmail: selectedClient.contactInfo?.primaryEmail || "",
            returnRequired: prev.clientMaterialInfo?.returnRequired || false,
          },
        }));
      }
    }
  }, [selectedClientId, customersData]);

  // Auto-populate form when sales order is selected
  useEffect(() => {
    if (selectedSalesOrderId && salesOrdersData?.data?.orders) {
      const selectedOrder = salesOrdersData.data.orders.find(
        (order: any) => order._id === selectedSalesOrderId
      );
      if (selectedOrder) {
        setSelectedSalesOrder(selectedOrder);

        // Auto-populate client information from sales order
        const customerId =
          typeof selectedOrder.customerId === "string"
            ? selectedOrder.customerId
            : selectedOrder.customerId?._id;

        const customerName =
          selectedOrder.customerName ||
          (typeof selectedOrder.customerId === "object"
            ? selectedOrder.customerId?.customerName
            : "");

        setFormData((prev) => ({
          ...prev,
          clientMaterialInfo: {
            ...prev.clientMaterialInfo,
            clientId: customerId || "",
            clientName: customerName || "",
            clientOrderId: selectedOrder._id,
            clientOrderNumber: selectedOrder.orderNumber,
            clientProvidedDate: new Date().toISOString().split("T")[0],
            clientContactPerson:
              selectedOrder.customerDetails?.phone ||
              selectedOrder.customerPhone ||
              "",
            clientContactPhone:
              selectedOrder.customerDetails?.phone ||
              selectedOrder.customerPhone ||
              "",
            clientContactEmail:
              selectedOrder.customerDetails?.email ||
              selectedOrder.customerEmail ||
              "",
            returnRequired: false,
            salesOrderId: selectedOrder._id,
            salesOrderNumber: selectedOrder.orderNumber,
            salesOrderDate: new Date(selectedOrder.orderDate).toISOString(),
            salesOrderStatus: selectedOrder.status,
          },
        }));

        // Auto-populate material details from first order item
        if (selectedOrder.orderItems && selectedOrder.orderItems.length > 0) {
          const firstItem = selectedOrder.orderItems[0];

          // Map item name to fabric type
          const mapToFabricType = (
            itemName: string
          ): "cotton" | "polyester" | "viscose" | "blend" | "other" => {
            const name = itemName.toLowerCase();
            if (name.includes("cotton")) return "cotton";
            if (name.includes("polyester")) return "polyester";
            if (name.includes("viscose")) return "viscose";
            if (name.includes("blend")) return "blend";
            return "other";
          };

          setFormData((prev) => ({
            ...prev,
            fabricType: mapToFabricType(
              firstItem.itemName || firstItem.name || ""
            ),
            fabricColor: firstItem.itemName || firstItem.name || "",
            quantity: firstItem.quantity || 0,
            unit: firstItem.unit || "meters",
            costBreakdown: {
              ...prev.costBreakdown,
              fabricCost:
                firstItem.unitPrice || firstItem.rate || firstItem.price || 0,
            },
            remarks: `Sales Order: ${
              selectedOrder.orderNumber
            }\nCustomer: ${customerName}\nOrder Date: ${new Date(
              selectedOrder.orderDate
            ).toLocaleDateString()}`,
          }));
        }
      }
    }
  }, [selectedSalesOrderId, salesOrdersData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    console.log("=== VALIDATION DEBUG ===");
    console.log("Entry type:", formData.entryType);
    console.log("Purchase Order ID:", formData.purchaseOrderId);
    console.log("Company ID:", formData.companyId);
    console.log("Fabric Type:", formData.fabricType);
    console.log("Fabric Color:", formData.fabricColor);
    console.log("Fabric Weight:", formData.fabricWeight);
    console.log("Fabric Width:", formData.fabricWidth);
    console.log("Quantity:", formData.quantity);
    console.log("Unit:", formData.unit);
    console.log("Quality:", formData.quality);

    // Only require purchase order for purchase order entries
    if (
      formData.entryType === "purchase_order" &&
      (!formData.purchaseOrderId ||
        formData.purchaseOrderId === "loading" ||
        formData.purchaseOrderId === "error" ||
        formData.purchaseOrderId === "no-data" ||
        formData.purchaseOrderId === "none")
    ) {
      newErrors.purchaseOrderId = "Purchase Order is required";
      console.log("❌ Purchase Order validation failed");
    }

    // Validate client material info when material source is client_provided
    if (formData.materialSource === "client_provided") {
      if (!selectedSalesOrderId || selectedSalesOrderId === "none") {
        if (!formData.clientMaterialInfo?.clientId) {
          newErrors.clientId =
            "Either select a sales order or manually select a client for client-provided material";
        }
      }
      if (!formData.clientMaterialInfo?.clientName) {
        newErrors.clientName =
          "Client name is required for client-provided material";
      }
    }
    if (!formData.companyId) {
      newErrors.companyId = "Company is required";
    }
    if (!formData.fabricType) newErrors.fabricType = "Fabric Type is required";
    if (!formData.fabricColor)
      newErrors.fabricColor = "Fabric Color is required";
    if (formData.fabricWeight <= 0)
      newErrors.fabricWeight = "Fabric Weight must be greater than 0";
    if (formData.fabricWidth <= 0)
      newErrors.fabricWidth = "Fabric Width must be greater than 0";
    if (formData.quantity <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (!formData.unit) newErrors.unit = "Unit is required";
    if (!formData.quality) newErrors.quality = "Quality is required";
    if ((formData.costBreakdown?.fabricCost || 0) < 0)
      newErrors.fabricCost = "Fabric Cost cannot be negative";
    if ((formData.costBreakdown?.transportationCost || 0) < 0)
      newErrors.transportationCost = "Transportation Cost cannot be negative";
    if ((formData.costBreakdown?.inspectionCost || 0) < 0)
      newErrors.inspectionCost = "Inspection Cost cannot be negative";

    console.log("Validation errors found:", Object.keys(newErrors).length);
    console.log("Errors:", newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data:", formData);
    console.log("Entry type:", formData.entryType);
    console.log("Grey stock lots:", formData.greyStockLots);
    console.log("Company ID:", formData.companyId);
    console.log("Purchase Order ID:", formData.purchaseOrderId);

    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    console.log("Current errors:", errors);

    if (!isValid) {
      console.log("Form validation failed, stopping submission");
      alert(
        `Form validation failed! Please check the following fields:\n${Object.keys(
          errors
        ).join(", ")}`
      );
      return;
    }

    // Check if required data is available (only for purchase order entries)
    if (formData.entryType === "purchase_order") {
      if (!purchaseOrders?.data?.data || purchaseOrders.data.data.length === 0) {
        alert(
          "No purchase orders available. Please create a purchase order first."
        );
        return;
      }

      // Check if valid IDs are selected (not special values)
      if (
        formData.purchaseOrderId === "loading" ||
        formData.purchaseOrderId === "error" ||
        formData.purchaseOrderId === "no-data" ||
        formData.purchaseOrderId === "none"
      ) {
        alert("Please select a valid purchase order.");
        return;
      }
    }

    // For client-provided materials, ensure client is selected (either via sales order or manually)
    if (formData.materialSource === "client_provided") {
      if (!selectedSalesOrderId || selectedSalesOrderId === "none") {
        if (!formData.clientMaterialInfo?.clientId) {
          alert(
            "Please select a sales order or manually select a client for client-provided material."
          );
          return;
        }
      }
    }

    // For direct stock entry, check if lots are added
    if (
      formData.entryType === "direct_stock_entry" &&
      (!formData.greyStockLots || formData.greyStockLots.length === 0)
    ) {
      alert("Please add at least one lot for direct stock entry.");
      return;
    }

    // Prepare form data for submission
    const submissionData = {
      ...formData,
      // Convert "none" to undefined for purchase order
      purchaseOrderId:
        formData.purchaseOrderId === "none"
          ? undefined
          : formData.purchaseOrderId,
    };

    console.log("Using form data:", submissionData);

    try {
      // Debug: Log the data being sent
      console.log("Form data being sent:", submissionData);
      console.log("Is Edit:", isEdit);
      console.log("GRN exists:", !!grn);

      if (isEdit && grn) {
        console.log("Updating GRN with ID:", grn._id);
        await updateGrn({
          id: grn._id,
          data: submissionData,
        }).unwrap();
      } else {
        console.log("Creating new GRN...");
        // Use actual form data
        const result = await createGrn(submissionData).unwrap();
        console.log("GRN created successfully:", result);
      }
      console.log("GRN operation completed successfully");
      onSuccess();
    } catch (error: any) {
      console.error("=== API ERROR ===");
      console.error("Error saving GRN:", error);
      console.error("Error details:", error?.data || error?.message || error);

      // Better error handling
      let errorMessage = "Error saving GRN. Please try again.";

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 401) {
        errorMessage = "Authentication required. Please login again.";
      } else if (error?.status === 403) {
        errorMessage = "You do not have permission to create GRN entries.";
      } else if (error?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      alert(errorMessage);
      console.log("Error alert shown to user");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      // Handle nested object properties
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as any) || {}),
          [child]: value,
        },
      }));
    } else {
      // Handle top-level properties
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Auto-generate lot number
  const generateLotNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const counter = lotCounter.toString().padStart(3, "0");

    return `LOT-${year}${month}${day}-${counter}`;
  };

  const addLot = () => {
    if (!newLot.lotQuantity || !newLot.lotUnit || !newLot.warehouseId) {
      alert(
        "Please fill all required lot fields (Quantity, Unit, and Warehouse)"
      );
      return;
    }

    // Auto-generate lot number
    const autoGeneratedLotNumber = generateLotNumber();

    const lotData = {
      ...newLot,
      lotNumber: autoGeneratedLotNumber,
      totalCost: newLot.lotQuantity * newLot.costPerUnit,
      receivedDate: new Date().toISOString().split("T")[0],
    };

    setFormData((prev) => ({
      ...prev,
      greyStockLots: [...(prev.greyStockLots || []), lotData],
    }));

    // Increment lot counter for next lot
    setLotCounter((prev) => prev + 1);

    // Reset form
    setNewLot({
      lotNumber: "",
      lotQuantity: 0,
      lotUnit: "meters",
      qualityGrade: "A",
      costPerUnit: 0,
      warehouseId: "",
      warehouseName: "",
      rackNumber: "",
      shelfNumber: "",
      binNumber: "",
      expiryDate: "",
      remarks: "",
    });
  };

  const removeLot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      greyStockLots: (prev.greyStockLots || []).filter((_, i) => i !== index),
    }));
  };

  const handleCostChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      costBreakdown: {
        fabricCost: prev.costBreakdown?.fabricCost || 0,
        transportationCost: prev.costBreakdown?.transportationCost || 0,
        inspectionCost: prev.costBreakdown?.inspectionCost || 0,
        [field]: value,
      },
    }));
  };

  const totalCost =
    (formData.costBreakdown?.fabricCost || 0) +
    (formData.costBreakdown?.transportationCost || 0) +
    (formData.costBreakdown?.inspectionCost || 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white dark:bg-gray-800">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg flex items-center justify-center text-white">
              <Package className="h-5 w-5" />
            </div>
            {isEdit ? "Edit GRN Entry" : "Create New GRN Entry"}
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isEdit
              ? "Update your GRN entry details"
              : "Fill in the details to create a new GRN entry"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Workflow Information */}
          <Card className="border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Enhanced GRN Workflow
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    For client-provided materials, you can now link directly to
                    existing sales orders to auto-populate client and material
                    details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  1
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entry Type Selection */}
                <div>
                  <Label
                    htmlFor="entryType"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Entry Type
                  </Label>
                  <Select
                    value={formData.entryType}
                    onValueChange={(value) =>
                      handleInputChange("entryType", value)
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select Entry Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                      <SelectItem
                        value="direct_stock_entry"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Direct Stock Entry
                      </SelectItem>
                      <SelectItem
                        value="purchase_order"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Purchase Order
                      </SelectItem>
                      <SelectItem
                        value="transfer_in"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Transfer In
                      </SelectItem>
                      <SelectItem
                        value="adjustment"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        Adjustment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.entryType && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.entryType}
                    </p>
                  )}
                </div>
                {/* Company Selection - Only for Super Admin */}
                {isSuperAdmin && (
                  <div>
                    <Label htmlFor="companyId">Company *</Label>
                    <Select
                      value={selectedCompanyId}
                      onValueChange={(value) => {
                        setSelectedCompanyId(value);
                        setFormData((prev) => ({
                          ...prev,
                          companyId: value,
                          purchaseOrderId: "none",
                          greyStockLots: [], // Reset lots when company changes
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                        {companiesData?.data?.map((company) => (
                          <SelectItem
                            key={company._id}
                            value={company._id}
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companyId && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.companyId}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="purchaseOrderId">
                    Purchase Order{" "}
                    {formData.entryType === "purchase_order"
                      ? "*"
                      : "(Optional)"}
                  </Label>
                  <Select
                    value={formData.purchaseOrderId}
                    onValueChange={(value) =>
                      handleInputChange("purchaseOrderId", value)
                    }
                    disabled={ordersLoading || !selectedCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          ordersLoading
                            ? "Loading..."
                            : !selectedCompanyId
                            ? "Select Company First"
                            : "Select Purchase Order (Optional)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem
                        value="none"
                        className="bg-white hover:bg-gray-50"
                      >
                        No Purchase Order
                      </SelectItem>
                      {ordersLoading ? (
                        <SelectItem
                          value="loading"
                          disabled
                          className="bg-white hover:bg-gray-50"
                        >
                          Loading purchase orders...
                        </SelectItem>
                      ) : ordersError ? (
                        <SelectItem
                          value="error"
                          disabled
                          className="bg-white hover:bg-gray-50"
                        >
                          Error loading orders
                        </SelectItem>
                      ) : purchaseOrders?.data?.data &&
                        purchaseOrders.data.data.length > 0 ? (
                        purchaseOrders.data.data.map((order: any) => (
                          <SelectItem
                            key={order._id}
                            value={order._id}
                            className="bg-white hover:bg-gray-50"
                          >
                            {order.poNumber} -{" "}
                            {order.supplier?.supplierName || "Unknown Supplier"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="no-data"
                          disabled
                          className="bg-white hover:bg-gray-50"
                        >
                          No purchase orders found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.purchaseOrderId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.purchaseOrderId}
                    </p>
                  )}
                  {ordersError && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Unable to load purchase orders. Please refresh the page.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected PO Information */}
          {selectedPO && (
            <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Selected Purchase Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      PO Number
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedPO.poNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Supplier
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedPO.supplier?.supplierName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Expected Delivery
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(
                        selectedPO.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Items
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedPO.items?.length || 0}
                    </p>
                  </div>
                </div>

                {/* PO Items Preview */}
                {selectedPO.items && selectedPO.items.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Select Item to Auto-populate
                      </Label>
                      {selectedPO.items.length > 1 && (
                        <Select
                          value={selectedItemIndex.toString()}
                          onValueChange={(value) => {
                            setSelectedItemIndex(parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                            {selectedPO.items.map(
                              (item: any, index: number) => (
                                <SelectItem
                                  key={index}
                                  value={index.toString()}
                                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                  {item.itemName} (Qty: {item.quantity}{" "}
                                  {item.unit})
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <span className="font-medium">Item:</span>{" "}
                          {selectedPO.items[selectedItemIndex]?.itemName}
                        </div>
                        <div>
                          <span className="font-medium">Qty:</span>{" "}
                          {selectedPO.items[selectedItemIndex]?.quantity}{" "}
                          {selectedPO.items[selectedItemIndex]?.unit}
                        </div>
                        <div>
                          <span className="font-medium">Rate:</span> ₹
                          {selectedPO.items[selectedItemIndex]?.rate}
                        </div>
                      </div>
                      {selectedPO.items[selectedItemIndex]?.description && (
                        <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-medium">Description:</span>{" "}
                          {selectedPO.items[selectedItemIndex].description}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        💡 This item's details will be auto-populated in the
                        form below
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fabric Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                <div className="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                  2
                </div>
                Fabric Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="fabricType"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Fabric Type *
                  </Label>
                  <Select
                    value={formData.fabricType}
                    onValueChange={(value) =>
                      handleInputChange("fabricType", value)
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                      <SelectValue placeholder="Select Fabric Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                      <SelectItem
                        value="cotton"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Cotton
                      </SelectItem>
                      <SelectItem
                        value="polyester"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Polyester
                      </SelectItem>
                      <SelectItem
                        value="viscose"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Viscose
                      </SelectItem>
                      <SelectItem
                        value="blend"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Blend
                      </SelectItem>
                      <SelectItem
                        value="other"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.fabricType && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.fabricType}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="fabricColor"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Fabric Color *
                  </Label>
                  <Input
                    id="fabricColor"
                    value={formData.fabricColor}
                    onChange={(e) =>
                      handleInputChange("fabricColor", e.target.value)
                    }
                    placeholder="e.g., White, Blue, Red"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.fabricColor && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.fabricColor}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="fabricWeight"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Fabric Weight (GSM) *
                  </Label>
                  <Input
                    id="fabricWeight"
                    type="number"
                    value={formData.fabricWeight}
                    onChange={(e) =>
                      handleInputChange(
                        "fabricWeight",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="e.g., 150"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.fabricWeight && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.fabricWeight}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="fabricWidth"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Fabric Width (inches) *
                  </Label>
                  <Input
                    id="fabricWidth"
                    type="number"
                    value={formData.fabricWidth}
                    onChange={(e) =>
                      handleInputChange(
                        "fabricWidth",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="e.g., 60"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.fabricWidth && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.fabricWidth}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="quantity"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Quantity *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange(
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="e.g., 1000"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="unit"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Unit *
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange("unit", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                      <SelectItem
                        value="meters"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Meters
                      </SelectItem>
                      <SelectItem
                        value="yards"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Yards
                      </SelectItem>
                      <SelectItem
                        value="pieces"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        Pieces
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.unit && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.unit}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="quality"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Quality Grade *
                  </Label>
                  <Select
                    value={formData.quality}
                    onValueChange={(value) =>
                      handleInputChange("quality", value)
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                      <SelectValue placeholder="Select Quality" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                      <SelectItem
                        value="A+"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        A+
                      </SelectItem>
                      <SelectItem
                        value="A"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        A
                      </SelectItem>
                      <SelectItem
                        value="B+"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        B+
                      </SelectItem>
                      <SelectItem
                        value="B"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        B
                      </SelectItem>
                      <SelectItem
                        value="C"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        C
                      </SelectItem>
                      <SelectItem
                        value="D"
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-gray-50 dark:focus:bg-gray-700"
                      >
                        D
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.quality && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.quality}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="expectedAt"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Expected Delivery Date
                  </Label>
                  <Input
                    id="expectedAt"
                    type="datetime-local"
                    value={formData.expectedAt}
                    onChange={(e) =>
                      handleInputChange("expectedAt", e.target.value)
                    }
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="remarks"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Additional notes or remarks..."
                  rows={3}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Grey Stock Lots Section */}
          {formData.entryType === "direct_stock_entry" && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                      3
                    </div>
                    Grey Stock Lots
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowLotSection(!showLotSection)}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showLotSection ? "Hide" : "Add"} Lots
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Lots */}
                {formData.greyStockLots &&
                  formData.greyStockLots.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Added Lots:</h4>
                      {(formData.greyStockLots || []).map((lot, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-blue-600">
                              Lot: {lot.lotNumber}
                            </span>
                            <span className="text-gray-600">
                              {lot.lotQuantity} {lot.lotUnit}
                            </span>
                            <span className="text-gray-600">
                              Grade: {lot.qualityGrade}
                            </span>
                            <span className="text-gray-600">
                              Warehouse: {lot.warehouseName}
                            </span>
                            <span className="text-green-600">
                              ₹{(lot.lotQuantity * lot.costPerUnit).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeLot(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Add Lot Form */}
                {showLotSection && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                    <h4 className="font-medium text-gray-700">Add New Lot</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="lotNumber">Lot Number</Label>
                        <Input
                          id="lotNumber"
                          value={generateLotNumber()}
                          disabled
                          placeholder="Auto-generated"
                          className="bg-gray-100 text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-generated based on date and sequence
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="lotQuantity">Quantity *</Label>
                        <Input
                          id="lotQuantity"
                          type="number"
                          value={newLot.lotQuantity}
                          onChange={(e) =>
                            setNewLot((prev) => ({
                              ...prev,
                              lotQuantity: Number(e.target.value),
                            }))
                          }
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lotUnit">Unit</Label>
                        <Select
                          value={newLot.lotUnit}
                          onValueChange={(value) =>
                            setNewLot((prev) => ({ ...prev, lotUnit: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            <SelectItem
                              value="meters"
                              className="bg-white hover:bg-gray-50"
                            >
                              Meters
                            </SelectItem>
                            <SelectItem
                              value="yards"
                              className="bg-white hover:bg-gray-50"
                            >
                              Yards
                            </SelectItem>
                            <SelectItem
                              value="pieces"
                              className="bg-white hover:bg-gray-50"
                            >
                              Pieces
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="qualityGrade">Quality Grade</Label>
                        <Select
                          value={newLot.qualityGrade}
                          onValueChange={(value) =>
                            setNewLot((prev) => ({
                              ...prev,
                              qualityGrade: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            <SelectItem
                              value="A+"
                              className="bg-white hover:bg-gray-50"
                            >
                              A+
                            </SelectItem>
                            <SelectItem
                              value="A"
                              className="bg-white hover:bg-gray-50"
                            >
                              A
                            </SelectItem>
                            <SelectItem
                              value="B+"
                              className="bg-white hover:bg-gray-50"
                            >
                              B+
                            </SelectItem>
                            <SelectItem
                              value="B"
                              className="bg-white hover:bg-gray-50"
                            >
                              B
                            </SelectItem>
                            <SelectItem
                              value="C"
                              className="bg-white hover:bg-gray-50"
                            >
                              C
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="costPerUnit">Cost Per Unit</Label>
                        <Input
                          id="costPerUnit"
                          type="number"
                          value={newLot.costPerUnit}
                          onChange={(e) =>
                            setNewLot((prev) => ({
                              ...prev,
                              costPerUnit: Number(e.target.value),
                            }))
                          }
                          placeholder="Enter cost per unit"
                        />
                      </div>
                      <div>
                        <Label htmlFor="warehouseId">Warehouse *</Label>
                        <Select
                          value={newLot.warehouseId}
                          onValueChange={(value) => {
                            const selectedWarehouse =
                              warehousesData?.data?.find(
                                (w: any) => w._id === value
                              );
                            setNewLot((prev) => ({
                              ...prev,
                              warehouseId: value,
                              warehouseName:
                                selectedWarehouse?.warehouseName || "",
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                warehousesLoading
                                  ? "Loading..."
                                  : "Select Warehouse"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            {warehousesLoading ? (
                              <SelectItem
                                value="loading"
                                disabled
                                className="bg-white hover:bg-gray-50"
                              >
                                Loading warehouses...
                              </SelectItem>
                            ) : warehousesData?.data &&
                              warehousesData.data.length > 0 ? (
                              warehousesData.data.map((warehouse: any) => (
                                <SelectItem
                                  key={warehouse._id}
                                  value={warehouse._id}
                                  className="bg-white hover:bg-gray-50"
                                >
                                  {warehouse.warehouseName} -{" "}
                                  {warehouse.location}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem
                                value="no-data"
                                disabled
                                className="bg-white hover:bg-gray-50"
                              >
                                No warehouses found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!formData.companyId && (
                          <p className="text-xs text-red-500 mt-1">
                            Please select a company first
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowLotSection(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={addLot}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lot
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Material Source Selection */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                <div className="w-6 h-6 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                  3
                </div>
                Material Source
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Select whether this is your own material or client-provided
                material. For client-provided material, you can link to existing
                sales orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium">
                  Material Source *
                </Label>
                <Select
                  value={formData.materialSource}
                  onValueChange={(value) =>
                    handleInputChange("materialSource", value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                    <SelectValue placeholder="Select material source" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                    <SelectItem
                      value="own_material"
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      Own Material
                    </SelectItem>
                    <SelectItem
                      value="client_provided"
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      Client Provided Material
                    </SelectItem>
                    <SelectItem
                      value="job_work_material"
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      Job Work Material
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.materialSource && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.materialSource}
                  </p>
                )}
              </div>

              {/* Client Material Information - Show only when client_provided is selected */}
              {formData.materialSource === "client_provided" && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Client Material Information
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Select a sales order (draft or confirmed) to automatically
                    populate client and material details, or manually select a
                    client.
                  </p>

                  {/* Sales Order Selection - Primary method for client material */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="salesOrderId"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Select Sales Order *
                    </Label>
                    <Select
                      value={selectedSalesOrderId}
                      onValueChange={(value) => {
                        setSelectedSalesOrderId(value);
                        if (value === "none") {
                          setSelectedSalesOrder(null);
                          setFormData((prev) => ({
                            ...prev,
                            clientMaterialInfo: {
                              ...prev.clientMaterialInfo,
                              clientId: "",
                              clientName: "",
                              clientOrderId: "",
                              clientOrderNumber: "",
                              clientContactPerson: "",
                              clientContactPhone: "",
                              clientContactEmail: "",
                              returnRequired:
                                prev.clientMaterialInfo?.returnRequired ||
                                false,
                            },
                          }));
                        }
                      }}
                      disabled={salesOrdersLoading || !selectedCompanyId}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <SelectValue
                          placeholder={
                            salesOrdersLoading
                              ? "Loading..."
                              : !selectedCompanyId
                              ? "Select Company First"
                              : "Select Sales Order"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                        <SelectItem
                          value="none"
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          No Sales Order
                        </SelectItem>
                        {salesOrdersLoading ? (
                          <SelectItem
                            value="loading"
                            disabled
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Loading sales orders...
                          </SelectItem>
                        ) : salesOrdersData?.data?.orders &&
                          salesOrdersData.data.orders.length > 0 ? (
                          salesOrdersData.data.orders.map((order: any) => (
                            <SelectItem
                              key={order._id}
                              value={order._id}
                              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {order.orderNumber} -{" "}
                                  {order.customerName ||
                                    (typeof order.customerId === "object"
                                      ? order.customerId?.customerName
                                      : "Unknown Customer")}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    order.status === "confirmed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : order.status === "draft"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {order.status?.toUpperCase()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : salesOrdersError ? (
                          <SelectItem
                            value="error"
                            disabled
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600"
                          >
                            Error loading sales orders
                          </SelectItem>
                        ) : (
                          <SelectItem
                            value="no-data"
                            disabled
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            No sales orders found for this company
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.salesOrderId && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {errors.salesOrderId}
                      </p>
                    )}
                    {!salesOrdersLoading &&
                      salesOrdersData?.data?.orders?.length === 0 &&
                      selectedCompanyId && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          No sales orders found. Create a sales order first or
                          use manual client selection.
                        </p>
                      )}
                  </div>

                  {/* Selected Sales Order Details */}
                  {selectedSalesOrder && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <h5 className="font-medium text-green-900 dark:text-green-100 mb-3">
                        Selected Sales Order Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Order Number:
                          </span>
                          <p className="text-green-700 dark:text-green-300">
                            {selectedSalesOrder.orderNumber}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Customer:
                          </span>
                          <p className="text-green-700 dark:text-green-300">
                            {selectedSalesOrder.customerName ||
                              (typeof selectedSalesOrder.customerId === "object"
                                ? selectedSalesOrder.customerId?.customerName
                                : "Unknown")}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Order Date:
                          </span>
                          <p className="text-green-700 dark:text-green-300">
                            {new Date(
                              selectedSalesOrder.orderDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Status:
                          </span>
                          <p className="text-green-700 dark:text-green-300 capitalize">
                            {selectedSalesOrder.status}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Total Amount:
                          </span>
                          <p className="text-green-700 dark:text-green-300">
                            ₹
                            {selectedSalesOrder.orderSummary?.finalAmount?.toLocaleString() ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Items Count:
                          </span>
                          <p className="text-green-700 dark:text-green-300">
                            {selectedSalesOrder.orderItems?.length || 0} items
                          </p>
                        </div>
                      </div>
                      {selectedSalesOrder.orderItems &&
                        selectedSalesOrder.orderItems.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Order Items:
                            </span>
                            <div className="mt-2 space-y-1">
                              {selectedSalesOrder.orderItems.map(
                                (item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30 px-2 py-1 rounded"
                                  >
                                    {item.itemName || item.name} - Qty:{" "}
                                    {item.quantity} {item.unit || ""} @ ₹
                                    {item.unitPrice ||
                                      item.rate ||
                                      item.price ||
                                      0}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientId"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Select Client (Manual) *
                      </Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={(value) => {
                          setSelectedClientId(value);
                          if (value === "none") {
                            setFormData((prev) => ({
                              ...prev,
                              clientMaterialInfo: {
                                ...prev.clientMaterialInfo,
                                clientId: "",
                                clientName: "",
                                clientContactPerson: "",
                                clientContactPhone: "",
                                clientContactEmail: "",
                                returnRequired:
                                  prev.clientMaterialInfo?.returnRequired ||
                                  false,
                              },
                            }));
                          }
                        }}
                        disabled={
                          customersLoading ||
                          !selectedCompanyId ||
                          selectedSalesOrderId !== "none"
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue
                            placeholder={
                              selectedSalesOrderId !== "none"
                                ? "Auto-filled from Sales Order"
                                : customersLoading
                                ? "Loading..."
                                : !selectedCompanyId
                                ? "Select Company First"
                                : "Select Client"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                          {customersLoading ? (
                            <SelectItem
                              value="loading"
                              disabled
                              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Loading clients...
                            </SelectItem>
                          ) : customersData?.data &&
                            customersData.data.length > 0 ? (
                            customersData.data.map((client: any) => (
                              <SelectItem
                                key={client._id}
                                value={client._id}
                                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                {client.customerName} -{" "}
                                {client.contactInfo?.primaryPhone || "No Phone"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem
                              value="no-data"
                              disabled
                              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              No clients found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.clientId && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {errors.clientId}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientName"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Client Name *
                      </Label>
                      <Input
                        id="clientName"
                        value={formData.clientMaterialInfo?.clientName || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientName",
                            e.target.value
                          )
                        }
                        placeholder="Auto-populated from selection"
                        className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        readOnly
                      />
                      {errors.clientName && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {errors.clientName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientOrderId"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Client Order ID
                      </Label>
                      <Input
                        id="clientOrderId"
                        value={formData.clientMaterialInfo?.clientOrderId || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientOrderId",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientOrderNumber"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Client Order Number
                      </Label>
                      <Input
                        id="clientOrderNumber"
                        value={
                          formData.clientMaterialInfo?.clientOrderNumber || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientOrderNumber",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientMaterialCode"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Client Material Code
                      </Label>
                      <Input
                        id="clientMaterialCode"
                        value={
                          formData.clientMaterialInfo?.clientMaterialCode || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientMaterialCode",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientBatchNumber"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Client Batch Number
                      </Label>
                      <Input
                        id="clientBatchNumber"
                        value={
                          formData.clientMaterialInfo?.clientBatchNumber || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientBatchNumber",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clientProvidedDate"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Client Provided Date
                    </Label>
                    <Input
                      id="clientProvidedDate"
                      type="date"
                      value={
                        formData.clientMaterialInfo?.clientProvidedDate || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "clientMaterialInfo.clientProvidedDate",
                          e.target.value
                        )
                      }
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clientInstructions"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Client Instructions
                    </Label>
                    <Textarea
                      id="clientInstructions"
                      value={
                        formData.clientMaterialInfo?.clientInstructions || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "clientMaterialInfo.clientInstructions",
                          e.target.value
                        )
                      }
                      placeholder="Any special instructions from client"
                      rows={3}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clientQualitySpecs"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Client Quality Specifications
                    </Label>
                    <Textarea
                      id="clientQualitySpecs"
                      value={
                        formData.clientMaterialInfo?.clientQualitySpecs || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "clientMaterialInfo.clientQualitySpecs",
                          e.target.value
                        )
                      }
                      placeholder="Quality requirements from client"
                      rows={3}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="returnRequired"
                      checked={
                        formData.clientMaterialInfo?.returnRequired || false
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "clientMaterialInfo.returnRequired",
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <Label
                      htmlFor="returnRequired"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Return Required
                    </Label>
                  </div>

                  {formData.clientMaterialInfo?.returnRequired && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="returnDeadline"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Return Deadline
                      </Label>
                      <Input
                        id="returnDeadline"
                        type="date"
                        value={
                          formData.clientMaterialInfo?.returnDeadline || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.returnDeadline",
                            e.target.value
                          )
                        }
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientContactPerson"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Contact Person
                      </Label>
                      <Input
                        id="clientContactPerson"
                        value={
                          formData.clientMaterialInfo?.clientContactPerson || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientContactPerson",
                            e.target.value
                          )
                        }
                        placeholder="Auto-populated from client selection"
                        className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="clientContactPhone"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Contact Phone
                      </Label>
                      <Input
                        id="clientContactPhone"
                        value={
                          formData.clientMaterialInfo?.clientContactPhone || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "clientMaterialInfo.clientContactPhone",
                            e.target.value
                          )
                        }
                        placeholder="Auto-populated from client selection"
                        className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clientContactEmail"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Contact Email
                    </Label>
                    <Input
                      id="clientContactEmail"
                      type="email"
                      value={
                        formData.clientMaterialInfo?.clientContactEmail || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "clientMaterialInfo.clientContactEmail",
                          e.target.value
                        )
                      }
                      placeholder="Auto-populated from client selection"
                      className="bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      readOnly
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                <div className="w-6 h-6 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                  4
                </div>
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="fabricCost"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Fabric Cost (₹)
                  </Label>
                  <Input
                    id="fabricCost"
                    type="number"
                    value={formData.costBreakdown?.fabricCost || 0}
                    onChange={(e) =>
                      handleCostChange(
                        "fabricCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.fabricCost && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.fabricCost}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="transportationCost"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Transportation Cost (₹)
                  </Label>
                  <Input
                    id="transportationCost"
                    type="number"
                    value={formData.costBreakdown?.transportationCost || 0}
                    onChange={(e) =>
                      handleCostChange(
                        "transportationCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.transportationCost && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.transportationCost}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="inspectionCost"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Inspection Cost (₹)
                  </Label>
                  <Input
                    id="inspectionCost"
                    type="number"
                    value={formData.costBreakdown?.inspectionCost || 0}
                    onChange={(e) =>
                      handleCostChange(
                        "inspectionCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {errors.inspectionCost && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.inspectionCost}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Cost:</span>
                    <span className="text-2xl font-bold">
                      ₹{totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isFormDisabled}
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-700 dark:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading
                ? "Saving..."
                : isFormDisabled
                ? "Setup Required"
                : isEdit
                ? "Update GRN"
                : "Create GRN"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
