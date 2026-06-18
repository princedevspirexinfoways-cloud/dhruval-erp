export interface ISticker {
  _id: string;
  stickerId: string;
  companyId: string;
  type: 'saree' | 'fabric_roll' | 'garment' | 'batch' | 'custom';
  designNumber: string;
  sku: string;
  batchNumber: string;
  color: string;
  size?: string;
  gsm?: number;
  quantity: number;
  unit: 'pieces' | 'meters' | 'kg' | 'rolls';
  barcodeData: string;
  qrCodeData: string;
  barcodeImage: string;
  qrCodeImage: string;
  stickerTemplate: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    textColor: string;
    fontSize: number;
  };
  printSettings: {
    printerName: string;
    copies: number;
    printQuality: 'draft' | 'normal' | 'high';
    paperSize: string;
  };
  status: 'pending' | 'printed' | 'applied' | 'damaged' | 'reprinted';
  printHistory: Array<{
    printedAt: string;
    printedBy: string;
    printerName: string;
    copies: number;
    status: 'success' | 'failed';
    errorMessage?: string;
  }>;
  appliedTo: {
    itemType: 'inventory' | 'dispatch' | 'production';
    itemId: string;
    appliedAt: string;
    appliedBy: string;
    location: string;
  };
  reprintReason?: string;
  reprintCount: number;
  maxReprints: number;
  expiryDate?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStickerFormData {
  type: 'saree' | 'fabric_roll' | 'garment' | 'batch' | 'custom';
  designNumber: string;
  sku: string;
  batchNumber: string;
  color: string;
  size?: string;
  gsm?: number;
  quantity: number;
  unit: 'pieces' | 'meters' | 'kg' | 'rolls';
  stickerTemplate: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    textColor: string;
    fontSize: number;
  };
  printSettings: {
    printerName: string;
    copies: number;
    printQuality: 'draft' | 'normal' | 'high';
    paperSize: string;
  };
}

export interface IStickerTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  isDefault?: boolean;
}

export interface IStickerFilters {
  type?: string;
  status?: string;
  companyId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IStickerStats {
  total: number;
  pending: number;
  printed: number;
  applied: number;
  damaged: number;
  reprinted: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface IPrintHistory {
  printedAt: string;
  printedBy: string;
  printerName: string;
  copies: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface IStickerReport {
  totalStickers: number;
  printStatus: Record<string, number>;
  applicationStatus: Record<string, number>;
  reprintAnalysis: {
    totalReprints: number;
    reprintedStickers: number;
    reprintReasons: Record<string, number>;
  };
}




