export interface Unit {
    _id: string;
    companyId: string;
    name: string;
    symbol: string;
    description?: string;
    baseUnit?: string;
    conversionFactor: number;
    isActive: boolean;
    createdBy: string;
    lastModifiedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUnitRequest {
    companyId?: string;
    name: string;
    symbol: string;
    description?: string;
    baseUnit?: string;
    conversionFactor?: number;
}

export interface UpdateUnitRequest {
    name?: string;
    symbol?: string;
    description?: string;
    baseUnit?: string;
    conversionFactor?: number;
    isActive?: boolean;
}
