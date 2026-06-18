import mongoose, { Schema, model } from 'mongoose';

export interface IUnit extends mongoose.Document {
    companyId: mongoose.Types.ObjectId;
    name: string;
    symbol: string;
    description?: string;
    baseUnit?: string;
    conversionFactor: number;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
    {
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: false,
            index: true,
            default: null,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        symbol: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        baseUnit: {
            type: String,
            trim: true,
            maxlength: 50,
            comment: 'Base unit for conversion (e.g., kg for gram, meter for centimeter)',
        },
        conversionFactor: {
            type: Number,
            default: 1,
            min: 0,
            comment: 'Factor to convert to base unit (e.g., 0.001 for gram to kg)',
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lastModifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        collection: 'units',
    }
);

// Compound index for company-wise unique unit names (sparse to allow null companyId)
UnitSchema.index({ companyId: 1, name: 1 }, { unique: true, sparse: true });

// Compound index for company-wise unique unit symbols (sparse to allow null companyId)
UnitSchema.index({ companyId: 1, symbol: 1 }, { unique: true, sparse: true });

// Text search index
UnitSchema.index({ name: 'text', symbol: 'text', description: 'text' });

export default model<IUnit>('Unit', UnitSchema);
