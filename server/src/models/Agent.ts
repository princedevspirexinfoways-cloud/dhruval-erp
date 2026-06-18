import mongoose from 'mongoose';

// Agent Schema - Simplified version for agents
const AgentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  agentCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  agentName: {
    type: String,
    required: true,
    trim: true
  },
  firmName: {
    type: String,
    trim: true
  },
  contactPersonName: {
    type: String,
    required: true,
    trim: true
  },
  contactInfo: {
    primaryPhone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: String,
    primaryEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    whatsapp: {
      type: String,
      trim: true
    },
    fax: String,
    tollFree: String
  },
  addresses: [{
    type: {
      type: String,
      enum: ['office', 'factory', 'warehouse', 'billing'],
      default: 'office'
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  contactPersons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    designation: String,
    phone: String,
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  registrationDetails: {
    gstin: String,
    pan: String
  },
  notes: String,
  tags: [String],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
AgentSchema.index({ companyId: 1, agentCode: 1 }, { unique: true });
AgentSchema.index({ companyId: 1, isActive: 1 });
AgentSchema.index({ 'contactInfo.primaryPhone': 1 });
AgentSchema.index({ 'contactInfo.primaryEmail': 1 });

// Export the Agent model
export const Agent = mongoose.model('Agent', AgentSchema);

// Export types for TypeScript
export interface IAgent extends mongoose.Document {
  companyId: mongoose.Schema.Types.ObjectId;
  agentCode: string;
  agentName: string;
  firmName?: string;
  contactPersonName: string;
  contactInfo: {
    primaryPhone: string;
    alternatePhone?: string;
    primaryEmail: string;
    alternateEmail?: string;
    whatsapp?: string;
    fax?: string;
    tollFree?: string;
  };
  addresses: Array<{
    type: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }>;
  contactPersons: Array<{
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
  }>;
  registrationDetails: {
    gstin?: string;
    pan?: string;
  };
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}











