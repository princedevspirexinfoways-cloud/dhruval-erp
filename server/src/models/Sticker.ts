import mongoose, { Document, Schema } from 'mongoose';

export interface ISticker extends Document {
  stickerId: string;
  companyId: mongoose.Types.ObjectId;
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
    printedAt: Date;
    printedBy: mongoose.Types.ObjectId;
    printerName: string;
    copies: number;
    status: 'success' | 'failed';
    errorMessage?: string;
  }>;
  appliedTo: {
    itemType: 'inventory' | 'dispatch' | 'production';
    itemId: mongoose.Types.ObjectId;
    appliedAt: Date;
    appliedBy: mongoose.Types.ObjectId;
    location: string;
  };
  reprintReason?: string;
  reprintCount: number;
  maxReprints: number;
  expiryDate?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stickerSchema = new Schema<ISticker>({
  stickerId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  type: {
    type: String,
    enum: ['saree', 'fabric_roll', 'garment', 'batch', 'custom'],
    required: true
  },
  designNumber: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  gsm: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['pieces', 'meters', 'kg', 'rolls'],
    required: true
  },
  barcodeData: {
    type: String,
    required: true,
    trim: true
  },
  qrCodeData: {
    type: String,
    required: true,
    trim: true
  },
  barcodeImage: {
    type: String,
    required: true
  },
  qrCodeImage: {
    type: String,
    required: true
  },
  stickerTemplate: {
    width: {
      type: Number,
      required: true,
      min: 10,
      max: 1000
    },
    height: {
      type: Number,
      required: true,
      min: 10,
      max: 1000
    },
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    textColor: {
      type: String,
      default: '#000000'
    },
    fontSize: {
      type: Number,
      default: 12,
      min: 8,
      max: 72
    }
  },
  printSettings: {
    printerName: {
      type: String,
      required: true,
      trim: true
    },
    copies: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    printQuality: {
      type: String,
      enum: ['draft', 'normal', 'high'],
      default: 'normal'
    },
    paperSize: {
      type: String,
      default: 'A4',
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'printed', 'applied', 'damaged', 'reprinted'],
    default: 'pending'
  },
  printHistory: [{
    printedAt: {
      type: Date,
      required: true
    },
    printedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    printerName: {
      type: String,
      required: true
    },
    copies: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    errorMessage: {
      type: String,
      trim: true
    }
  }],
  appliedTo: {
    itemType: {
      type: String,
      enum: ['inventory', 'dispatch', 'production']
    },
    itemId: {
      type: Schema.Types.ObjectId
    },
    appliedAt: {
      type: Date
    },
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      type: String,
      trim: true
    }
  },
  reprintReason: {
    type: String,
    trim: true
  },
  reprintCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxReprints: {
    type: Number,
    default: 3,
    min: 1
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
stickerSchema.index({ companyId: 1, stickerId: 1 });
stickerSchema.index({ companyId: 1, sku: 1 });
stickerSchema.index({ companyId: 1, batchNumber: 1 });
stickerSchema.index({ companyId: 1, status: 1 });
stickerSchema.index({ companyId: 1, type: 1 });
stickerSchema.index({ barcodeData: 1 });
stickerSchema.index({ qrCodeData: 1 });

export default mongoose.model<ISticker>('Sticker', stickerSchema);



