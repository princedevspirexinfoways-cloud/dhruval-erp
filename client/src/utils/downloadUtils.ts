/**
 * Enhanced download utilities for production PWA
 * Handles various download scenarios and browser compatibility
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
  fallbackToNewTab?: boolean;
  showToast?: boolean;
}

/**
 * Download a blob with enhanced error handling and fallbacks
 */
export const downloadBlob = (
  blob: Blob, 
  filename: string, 
  options: DownloadOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const { fallbackToNewTab = true, showToast = false } = options;

      // Method 1: IE/Edge specific
      if ('msSaveBlob' in navigator) {
        (navigator as any).msSaveBlob(blob, filename);
        resolve(true);
        return;
      }

      // Method 2: Modern browsers
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up the link
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      link.rel = 'noopener noreferrer';

      // Add to DOM temporarily
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
      }, 100);

      resolve(true);

    } catch (error) {
      console.error('Blob download failed:', error);
      
      if (options.fallbackToNewTab) {
        try {
          // Fallback: Open blob in new tab
          const url = window.URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          
          if (newWindow) {
            // Clean up URL after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (fallbackError) {
          console.error('Fallback download failed:', fallbackError);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    }
  });
};

/**
 * Download from URL with enhanced error handling
 */
export const downloadFromUrl = (
  url: string, 
  filename?: string, 
  options: DownloadOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const { fallbackToNewTab = true } = options;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      link.rel = 'noopener noreferrer';
      
      if (filename) {
        link.download = filename;
      }
      
      // For external URLs, always open in new tab
      if (!url.startsWith(window.location.origin)) {
        link.target = '_blank';
      }

      // Add to DOM temporarily
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (cleanupError) {
          console.warn('Link cleanup error:', cleanupError);
        }
      }, 100);

      resolve(true);

    } catch (error) {
      console.error('URL download failed:', error);
      
      if (options.fallbackToNewTab) {
        try {
          // Fallback: Open in new window
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          resolve(!!newWindow);
        } catch (fallbackError) {
          console.error('Fallback URL open failed:', fallbackError);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    }
  });
};

/**
 * Download CSV data
 */
export const downloadCSV = (
  data: any[], 
  filename: string = 'export.csv',
  options: DownloadOptions = {}
): Promise<boolean> => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return Promise.resolve(false);
    }

    // Generate CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        // Escape CSV values
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return downloadBlob(blob, filename, options);
  } catch (error) {
    console.error('CSV download failed:', error);
    return Promise.resolve(false);
  }
};

/**
 * Download JSON data
 */
export const downloadJSON = (
  data: any, 
  filename: string = 'export.json',
  options: DownloadOptions = {}
): Promise<boolean> => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    
    return downloadBlob(blob, filename, options);
  } catch (error) {
    console.error('JSON download failed:', error);
    return Promise.resolve(false);
  }
};

/**
 * Download text content
 */
export const downloadText = (
  content: string, 
  filename: string = 'export.txt',
  options: DownloadOptions = {}
): Promise<boolean> => {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    return downloadBlob(blob, filename, options);
  } catch (error) {
    console.error('Text download failed:', error);
    return Promise.resolve(false);
  }
};

/**
 * Check if downloads are supported in current environment
 */
export const isDownloadSupported = (): {
  blob: boolean;
  url: boolean;
  download: boolean;
  msSaveBlob: boolean;
  overall: boolean;
} => {
  const support = {
    blob: typeof Blob !== 'undefined',
    url: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
    download: 'download' in document.createElement('a'),
    msSaveBlob: 'msSaveBlob' in navigator
  };

  return {
    ...support,
    overall: support.blob && (support.url || support.msSaveBlob)
  };
};

/**
 * Enhanced download with retry mechanism
 */
export const downloadWithRetry = async (
  downloadFn: () => Promise<boolean>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await downloadFn();
      if (success) {
        return true;
      }
    } catch (error) {
      console.warn(`Download attempt ${attempt} failed:`, error);
    }

    if (attempt < maxRetries) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
};

/**
 * Copy download URL to clipboard as fallback
 */
export const copyDownloadUrlToClipboard = async (url: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error);
    return false;
  }
};

/**
 * Download with comprehensive fallback strategy
 */
export const downloadWithFallback = async (
  url: string,
  filename?: string,
  options: DownloadOptions = {}
): Promise<{ success: boolean; method: string }> => {
  // Try direct download first
  const directSuccess = await downloadFromUrl(url, filename, { ...options, fallbackToNewTab: false });
  if (directSuccess) {
    return { success: true, method: 'direct' };
  }

  // Try opening in new tab
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      return { success: true, method: 'new_tab' };
    }
  } catch (error) {
    console.warn('New tab fallback failed:', error);
  }

  // Final fallback: copy URL to clipboard
  const clipboardSuccess = await copyDownloadUrlToClipboard(url);
  if (clipboardSuccess) {
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'none' };
};
