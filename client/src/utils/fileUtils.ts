/**
 * Extract file key from a Contabo S3 URL
 */
export const extractFileKeyFromUrl = (url: string): string | null => {
  try {
    // Handle Contabo S3 URLs with format: https://region.contabostorage.com/accessKey:bucket/fileKey
    if (url.includes('contabostorage.com')) {
      const urlParts = url.split('/')
      // Remove the protocol and domain parts, then skip accessKey:bucket part
      const pathParts = urlParts.slice(3) // Remove https://, domain
      if (pathParts.length > 1) {
        // Skip the accessKey:bucket part and return the rest as file key
        return pathParts.slice(1).join('/')
      }
      return null
    }
    
    // Handle other S3-compatible URLs
    if (url.includes('s3.amazonaws.com') || url.includes('amazonaws.com')) {
      const urlParts = url.split('/')
      return urlParts.slice(-1)[0]
    }
    
    return null
  } catch (error) {
    console.error('Error extracting file key:', error)
    return null
  }
}

/**
 * Convert old format URL to new Contabo format
 */
export const convertToContaboUrl = (oldUrl: string): string => {
  try {
    // If it's already in the correct format, return as is
    if (oldUrl.includes('contabostorage.com') && oldUrl.includes(':')) {
      return oldUrl
    }
    
    // If it's in the old format, convert it
    if (oldUrl.includes('contabostorage.com/erp/')) {
      const fileKey = oldUrl.replace('https://usc1.contabostorage.com/erp/', '')
      return `https://usc1.contabostorage.com/a515fceddec13b83b773ba47cb024c02:erp/${fileKey}`
    }
    
    return oldUrl
  } catch (error) {
    console.error('Error converting URL:', error)
    return oldUrl
  }
}

/**
 * Check if a URL is a Contabo S3 URL
 */
export const isContaboUrl = (url: string): boolean => {
  return url.includes('contabostorage.com')
}

/**
 * Check if a URL is an S3-compatible URL
 */
export const isS3Url = (url: string): boolean => {
  return url.includes('contabostorage.com') || 
         url.includes('s3.amazonaws.com') || 
         url.includes('amazonaws.com')
}

/**
 * Generate a fallback image URL
 */
export const getFallbackImageUrl = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzExMC45NTMgMTEwIDEyMCAxMDAuOTUzIDEyMCA5MEMxMjAgNzkuMDQ3IDExMC45NTMgNzAgMTAwIDcwQzg5LjA0NyA3MCA4MCA3OS4wNDcgODAgOTBDODAgMTAwLjk1MyA4OS4wNDcgMTEwIDEwMCAxMTBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzExMC45NTMgMTMwIDEyMCAxMjAuOTUzIDEyMCAxMTBDMTIwIDk5LjA0NyAxMTAuOTUzIDkwIDEwMCA5MEM4OS4wNDcgOTAgODAgOTkuMDQ3IDgwIDExMEM4MCAxMjAuOTUzIDg5LjA0NyAxMzAgMTAwIDEzMFoiIGZpbGw9IiM5QjlBQTAiLz4KPC9zdmc+'
}
