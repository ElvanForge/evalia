import { joinUrlPaths } from '@/lib/utils';

/**
 * Utility functions for handling image loading and processing
 */

/**
 * Generate a cache-busting URL for images
 * Important for making sure we load fresh versions in production
 * @param url The base image URL
 * @returns The URL with a cache-busting query parameter
 */
export function getCacheBustedImageUrl(url: string): string {
  if (!url) return '';
  
  // Add a timestamp parameter to bust cache
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Format a quiz image URL to ensure it includes the /api/images/ path
 * @param imageUrl The raw image URL from the database
 * @returns A properly formatted API URL
 */
export function formatQuizImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  
  // If it already has the /api/images/ prefix, use it as is
  if (imageUrl.startsWith('/api/images/')) {
    return getCacheBustedImageUrl(imageUrl);
  }
  
  // If it has the /uploads/images/ prefix, convert it
  if (imageUrl.startsWith('/uploads/images/')) {
    const filename = imageUrl.split('/').pop();
    return getCacheBustedImageUrl(`/api/images/${filename}`);
  }
  
  // If it's just a filename, assume it's in the uploads/images directory
  if (!imageUrl.includes('/')) {
    return getCacheBustedImageUrl(`/api/images/${imageUrl}`);
  }
  
  // Default case: return the original with cache busting
  return getCacheBustedImageUrl(imageUrl);
}

/**
 * Get a fully qualified image URL with appropriate processing
 * @param src Raw image URL or path
 * @returns Processed image URL
 */
export function getFullImageUrl(src: string): string {
  if (!src) return '';
  
  // Handle relative vs. absolute URLs
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src; // Already absolute
  }
  
  // For uploads, prefer the API endpoint
  if (src.includes('/uploads/images/') || src.startsWith('/uploads/images/')) {
    const filename = src.split('/').pop() || '';
    return joinUrlPaths('/api/images', filename);
  }
  
  // If just filename, route through API
  if (!src.includes('/')) {
    return joinUrlPaths('/api/images', src);
  }
  
  // Ensure path starts with /
  return src.startsWith('/') ? src : `/${src}`;
}

/**
 * Try loading an image at the given URL
 * @param url The image URL to test
 * @returns A promise that resolves to true if the image can be loaded, false otherwise
 */
export function testImageLoading(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = url;
  });
}

/**
 * Generate multiple fallback URLs for an image
 * @param imageUrl The original image URL
 * @returns An array of possible fallback URLs to try
 */
export function generateFallbackUrls(imageUrl: string): string[] {
  if (!imageUrl) return [];
  
  const fallbacks: string[] = [];
  
  // First prioritize the direct API endpoint
  if (!imageUrl.startsWith('/api/images/')) {
    const filename = imageUrl.split('/').pop();
    if (filename) {
      fallbacks.push(getCacheBustedImageUrl(`/api/images/${filename}`));
    }
  }
  
  // Then try the original url
  fallbacks.push(getCacheBustedImageUrl(imageUrl));
  
  // Try with different file extensions if the image is a filename
  const filename = imageUrl.split('/').pop();
  if (filename && !filename.includes('?')) {
    const basename = filename.split('.')[0];
    
    // Try different extensions with API path
    ['png', 'jpg', 'jpeg', 'gif', 'webp'].forEach(ext => {
      if (!filename.toLowerCase().endsWith(`.${ext}`)) {
        fallbacks.push(getCacheBustedImageUrl(`/api/images/${basename}.${ext}`));
      }
    });
  }
  
  return fallbacks;
}

/**
 * Load an image with fallbacks
 * @param imageUrl The original image URL
 * @param onSuccess Callback for successful loading
 * @param onError Callback for failed loading after all attempts
 */
export async function loadImageWithFallbacks(
  imageUrl: string,
  onSuccess: (url: string) => void,
  onError: () => void
): Promise<void> {
  if (!imageUrl) {
    onError();
    return;
  }
  
  const fallbackUrls = generateFallbackUrls(imageUrl);
  let loaded = false;
  
  // Try each URL in sequence
  for (const url of fallbackUrls) {
    if (await testImageLoading(url)) {
      onSuccess(url);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.error('All image loading attempts failed for:', imageUrl);
    onError();
  }
}

/**
 * Helper function that returns props for an image component
 * with consistent formatting and proper cache busting
 * 
 * @param imageUrl The source URL for the image
 * @param alt The alt text for the image
 * @param isQuizImage Whether this is a quiz image (will use API endpoint)
 * @returns Props object for an image component
 */
export function getImageProps(imageUrl: string | null | undefined, alt: string, isQuizImage: boolean = false) {
  if (!imageUrl) {
    return {
      src: '',
      alt
    };
  }
  
  // Process URL based on type
  const processedUrl = isQuizImage ? formatQuizImageUrl(imageUrl) : getCacheBustedImageUrl(imageUrl);
  
  return {
    src: processedUrl,
    alt,
    loading: 'lazy' as const,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error(`Image failed to load: ${processedUrl}`);
      
      // Try to set a fallback data URI if needed
      // e.target.src = '...fallback data URI...';
    }
  };
}