import { Company, CompanyFilters } from './types'

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatPhoneNumber = (phone: string, countryCode: string = '+91'): string => {
  if (phone.startsWith('+')) return phone
  return `${countryCode} ${phone}`
}

export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export const validateCIN = (cin: string): boolean => {
  if (!cin) return true // CIN is optional
  const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
  return cinRegex.test(cin)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/
  return pincodeRegex.test(pincode)
}

export const getCompanyStatusColor = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : 'bg-red-100 text-red-800 border-red-200'
}

export const getCompanyStatusIcon = (isActive: boolean): string => {
  return isActive ? 'CheckCircle' : 'XCircle'
}

export const filterCompanies = (companies: Company[], filters: CompanyFilters): Company[] => {
  return companies.filter(company => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = 
        company.companyName.toLowerCase().includes(searchTerm) ||
        company.companyCode.toLowerCase().includes(searchTerm) ||
        company.legalName.toLowerCase().includes(searchTerm) ||
        company.registrationDetails.gstin.toLowerCase().includes(searchTerm) ||
        company.contactInfo.emails.some(email => 
          email.email.toLowerCase().includes(searchTerm)
        )
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active'
      if (company.isActive !== isActive) return false
    }

    // State filter
    if (filters.state) {
      const matchesState = company.addresses?.registeredOffice?.state
        ?.toLowerCase()
        .includes(filters.state.toLowerCase())
      if (!matchesState) return false
    }

    // City filter
    if (filters.city) {
      const matchesCity = company.addresses?.registeredOffice?.city
        ?.toLowerCase()
        .includes(filters.city.toLowerCase())
      if (!matchesCity) return false
    }

    // Date range filter
    if (filters.registrationDateFrom) {
      const companyDate = new Date(company.createdAt)
      const fromDate = new Date(filters.registrationDateFrom)
      if (companyDate < fromDate) return false
    }

    if (filters.registrationDateTo) {
      const companyDate = new Date(company.createdAt)
      const toDate = new Date(filters.registrationDateTo)
      if (companyDate > toDate) return false
    }

    return true
  })
}

export const sortCompanies = (companies: Company[], sortBy: string, sortOrder: 'asc' | 'desc'): Company[] => {
  return [...companies].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'name':
        aValue = a.companyName.toLowerCase()
        bValue = b.companyName.toLowerCase()
        break
      case 'code':
        aValue = a.companyCode.toLowerCase()
        bValue = b.companyCode.toLowerCase()
        break
      case 'created':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'updated':
        aValue = new Date(a.updatedAt)
        bValue = new Date(b.updatedAt)
        break
      default:
        aValue = a.companyName.toLowerCase()
        bValue = b.companyName.toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

export const generateCompanyCode = (companyName: string): string => {
  // Generate a company code from company name
  const words = companyName.trim().split(/\s+/)
  let code = ''
  
  if (words.length === 1) {
    code = words[0].substring(0, 4).toUpperCase()
  } else if (words.length === 2) {
    code = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase()
  } else {
    code = words.slice(0, 3).map(word => word.charAt(0)).join('').toUpperCase()
  }
  
  // Add random numbers to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${code}${randomNum}`
}

export const getCompanyDisplayName = (company: Company): string => {
  return `${company.companyName} (${company.companyCode})`
}

export const getCompanyAddress = (company: Company, type: 'registered' | 'factory' = 'registered'): string => {
  const address = type === 'registered'
    ? company.addresses?.registeredOffice
    : company.addresses?.factoryAddress

  if (!address) return 'Address not available'

  return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
}

export const getCompanyPrimaryContact = (company: Company): { email?: string; phone?: string } => {
  const primaryEmail = company.contactInfo?.emails?.find(email => email.type === 'primary')?.email
  const primaryPhone = company.contactInfo?.phones?.find(phone => phone.type === 'primary')

  return {
    email: primaryEmail || company.contactInfo?.emails?.[0]?.email,
    phone: (primaryPhone?.number || primaryPhone?.phone) || (company.contactInfo?.phones?.[0]?.number || company.contactInfo?.phones?.[0]?.phone)
  }
}

export const isCompanyDataComplete = (company: Company): boolean => {
  return !!(
    company.companyName &&
    company.legalName &&
    company.companyCode &&
    company.registrationDetails?.gstin &&
    company.registrationDetails?.pan &&
    company.addresses?.registeredOffice?.street &&
    company.addresses?.registeredOffice?.city &&
    company.addresses?.registeredOffice?.state &&
    company.addresses?.registeredOffice?.pincode &&
    company.contactInfo?.emails?.length > 0 &&
    company.contactInfo?.phones?.length > 0
  )
}

export const getCompanyCompletionPercentage = (company: Company): number => {
  const requiredFields = [
    company.companyName,
    company.legalName,
    company.companyCode,
    company.registrationDetails?.gstin,
    company.registrationDetails?.pan,
    company.addresses?.registeredOffice?.street,
    company.addresses?.registeredOffice?.city,
    company.addresses?.registeredOffice?.state,
    company.addresses?.registeredOffice?.pincode,
    company.contactInfo?.emails?.length > 0 ? 'email' : null,
    company.contactInfo?.phones?.length > 0 ? 'phone' : null
  ]

  const optionalFields = [
    company.registrationDetails?.cin,
    company.registrationDetails?.udyogAadhar,
    company.registrationDetails?.iecCode,
    company.addresses?.factoryAddress?.street,
    company.bankAccounts?.length,
    company.licenses?.length
  ]

  const completedRequired = requiredFields.filter(field => field).length
  const completedOptional = optionalFields.filter(field => field).length

  const requiredWeight = 0.8
  const optionalWeight = 0.2

  const requiredScore = (completedRequired / requiredFields.length) * requiredWeight
  const optionalScore = (completedOptional / optionalFields.length) * optionalWeight

  return Math.round((requiredScore + optionalScore) * 100)
}
