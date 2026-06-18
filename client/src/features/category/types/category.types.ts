export interface Category {
    _id: string;
    companyId: string;
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

export interface CreateCategoryRequest {
    companyId?: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
}
