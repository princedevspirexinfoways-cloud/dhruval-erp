import mongoose, { Schema, model } from 'mongoose';

export interface IJobWorkType extends mongoose.Document {
    companyId: mongoose.Types.ObjectId | null;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const JobWorkTypeSchema = new Schema<IJobWorkType>(
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
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        icon: {
            type: String,
            trim: true,
            maxlength: 50,
        },
        color: {
            type: String,
            trim: true,
            maxlength: 20,
            default: '#6b7280', // default gray color
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
        collection: 'job_work_types',
    }
);

// Compound index for company-wise unique job work type names (sparse to allow null companyId)
JobWorkTypeSchema.index({ companyId: 1, name: 1 }, { unique: true, sparse: true });

// Text search index
JobWorkTypeSchema.index({ name: 'text', description: 'text' });

export default model<IJobWorkType>('JobWorkType', JobWorkTypeSchema);















