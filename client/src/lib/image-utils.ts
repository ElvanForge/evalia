/**
 * Utility functions for handling images in a way that works across
 * both development and production environments
 */

/**
 * Converts a blob URL to a data URL
 * This is critical for ensuring images can be loaded in production environments
 * where blob URLs are not accessible after a page refresh or deployment
 */
export async function blobToDataUrl(blobUrl: string): Promise<string> {
  try {
    // Don't convert if it's already a data URL or a server path
    if (blobUrl.startsWith('data:') || blobUrl.startsWith('/')) {
      return blobUrl;
    }

    // Fetch the blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob to data URL:', error);
    return blobUrl; // Return original URL on error
  }
}

/**
 * Determines if an image URL is safe for use in both development and production
 */
export function isSafeImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  // Data URLs are safe
  if (url.startsWith('data:')) return true;
  
  // Server paths (starting with /) are safe
  if (url.startsWith('/')) return true;
  
  // Blob URLs are NOT safe for persistence
  if (url.startsWith('blob:')) return false;
  
  // External URLs (http/https) are generally safe
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Any other format is considered unsafe
  return false;
}

/**
 * Makes an image URL safe for storage in the database by converting
 * blob URLs to data URLs when necessary
 */
export async function makeSafeImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  
  // If it's a blob URL, convert it to a data URL
  if (url.startsWith('blob:')) {
    try {
      return await blobToDataUrl(url);
    } catch (error) {
      console.error('Failed to convert blob URL to data URL:', error);
      return null;
    }
  }
  
  // Otherwise, return as is
  return url;
}

/**
 * Optimizes an image URL for display by adding cache busting and proper path
 */
export function optimizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  
  // No need to modify data URLs
  if (url.startsWith('data:')) return url;
  
  // No need to modify blob URLs
  if (url.startsWith('blob:')) return url;
  
  // No need to modify external URLs
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // For server paths, ensure they start with / and add cache busting
  let optimizedUrl = url;
  if (!optimizedUrl.startsWith('/')) {
    optimizedUrl = '/' + optimizedUrl;
  }
  
  // If path doesn't start with /uploads, add it
  if (!optimizedUrl.startsWith('/uploads/')) {
    if (optimizedUrl.includes('uploads/')) {
      // Fix path that has 'uploads/' but not at the beginning
      const parts = optimizedUrl.split('uploads/');
      optimizedUrl = '/uploads/' + parts[parts.length - 1];
    } else {
      // Add /uploads/images/ if it's just a filename
      if (!optimizedUrl.includes('/')) {
        optimizedUrl = '/uploads/images/' + optimizedUrl;
      }
    }
  }
  
  // Add cache busting parameter
  const hasParams = optimizedUrl.includes('?');
  return `${optimizedUrl}${hasParams ? '&' : '?'}v=${Date.now()}`;
}

/**
 * Gets a full image URL with the correct prefix based on environment
 */
export function getFullImageUrl(url: string | null): string {
  if (!url) return '';

  // If already a full URL or data URL, return as is
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Ensure URL starts with /
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  // Return full URL
  return url;
}

/**
 * Gets appropriate image element properties based on URL type
 */
export function getImageProps({ 
  src, 
  alt, 
  className = '',
  width,
  height
}: {
  src: string | null,
  alt: string,
  className?: string,
  width?: number,
  height?: number
}) {
  if (!src) {
    return {
      src: '/placeholder-image.png',  // Placeholder image
      alt,
      className: `${className} placeholder-image`, 
      width,
      height
    };
  }

  // For data URLs
  if (src.startsWith('data:')) {
    return {
      src,
      alt,
      className,
      width,
      height,
      loading: 'lazy' as const
    };
  }

  // For blob URLs
  if (src.startsWith('blob:')) {
    return {
      src,
      alt,
      className,
      width,
      height
    };
  }

  // For server paths (assume these are static assets)
  if (src.startsWith('/')) {
    // Add cache busting for server images
    const cacheBuster = `${src.includes('?') ? '&' : '?'}v=${Date.now()}`;
    return {
      src: `${src}${cacheBuster}`,
      alt,
      className,
      width,
      height,
      loading: 'lazy' as const
    };
  }

  // For external URLs
  if (src.startsWith('http')) {
    return {
      src,
      alt,
      className,
      width,
      height,
      crossOrigin: 'anonymous' as const,
      referrerPolicy: 'no-referrer' as const
    };
  }

  // Default case - treat as a server path
  const fixedPath = src.startsWith('/') ? src : `/${src}`;
  const cacheBuster = `${fixedPath.includes('?') ? '&' : '?'}v=${Date.now()}`;
  
  return {
    src: `${fixedPath}${cacheBuster}`,
    alt,
    className,
    width,
    height,
    loading: 'lazy' as const
  };
}