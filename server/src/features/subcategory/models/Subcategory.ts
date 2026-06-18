import mongoose, { Schema, model } from 'mongoose';

export interface ISubcategory extends mongoose.Document {
    companyId: mongoose.Types.ObjectId | null;
    categoryId: mongoose.Types.ObjectId;
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

const SubcategorySchema = new Schema<ISubcategory>(
    {
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: false,
            index: true,
            default: null,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
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
            default: '#6b7280',
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
        collection: 'subcategories',
    }
);

// Compound index for category-wise unique subcategory names
SubcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });

// Text search index
SubcategorySchema.index({ name: 'text', description: 'text' });

export default model<ISubcategory>('Subcategory', SubcategorySchema);
















