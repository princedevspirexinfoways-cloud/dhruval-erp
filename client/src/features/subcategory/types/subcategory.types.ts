export interface Subcategory {
    _id: string;
    companyId?: string | null;
    categoryId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    createdBy: string;
    lastModifiedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubcategoryRequest {
    companyId?: string;
    categoryId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

export interface UpdateSubcategoryRequest {
    categoryId?: string;
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
}
















