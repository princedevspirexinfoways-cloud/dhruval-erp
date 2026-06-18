export interface MaterialItem {
    itemId: string
    itemName: string
    quantity: number
    unit: string
    rate?: number
}

export interface ChallanFormData {
    challanNumber: string
    challanDate: string
    category: string
    subcategory: string
    itemName: string
    attributeName: string
    price: number
    lotNumber: string
}

export interface PartyFormData {
    partyName: string
    partyGstNumber: string
    partyAddress: string
}

export interface TransportFormData {
    transportName: string
    transportNumber: string
}

export interface JobWorkFormErrors {
    [key: string]: string
}

