/**
 * Utility functions to clean request data
 * Converts empty strings to undefined for optional ObjectId fields
 */

/**
 * Clean empty strings from ObjectId fields - convert to undefined
 */
export function cleanObjectIdFields(data: any, fields: string[]): any {
  const cleaned = { ...data };
  
  for (const field of fields) {
    if (cleaned[field] === '' || cleaned[field] === null) {
      cleaned[field] = undefined;
    }
  }
  
  return cleaned;
}

/**
 * Clean empty strings from all optional string fields - convert to undefined
 */
export function cleanOptionalStringFields(data: any, fields: string[]): any {
  const cleaned = { ...data };
  
  for (const field of fields) {
    if (cleaned[field] === '' || (cleaned[field] && typeof cleaned[field] === 'string' && cleaned[field].trim() === '')) {
      cleaned[field] = undefined;
    }
  }
  
  return cleaned;
}





