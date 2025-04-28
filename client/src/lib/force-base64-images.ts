/**
 * Utility for reliable image loading by forcing all images to convert to base64
 * 
 * This ensures consistent behavior across all environments (dev/prod) and
 * avoids CORS and path resolution issues
 */

// Cache of base64 images to avoid repeated server requests
const base64Cache = new Map<string, string>();

/**
 * Convert any image URL to a base64 data URL for reliable display
 * This function will use the server's base64 endpoint to convert images.
 * 
 * @param imageUrl The original image URL
 * @param fallbackToAny Whether to allow fallback to any available image if exact match not found
 * @returns A Promise that resolves to a base64 data URL or null if conversion failed
 */
export async function forceBase64Image(imageUrl: string, fallbackToAny = false): Promise<string | null> {
  // Skip for already base64 images
  if (imageUrl && imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Skip for non-existent images
  if (!imageUrl) {
    console.warn('Attempted to load null or empty image URL');
    return null;
  }
  
  // Check cache first
  if (base64Cache.has(imageUrl)) {
    return base64Cache.get(imageUrl) || null;
  }
  
  console.log(`Attempting to fetch as base64: ${imageUrl}`);
  
  try {
    // Extract filename from path if needed
    let filename = imageUrl;
    if (imageUrl.includes('/')) {
      filename = imageUrl.split('/').pop() || '';
    }
    
    // Remove any query parameters
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    // Create URL with the original URL as a query parameter for better path resolution
    const apiUrl = `/api/images/base64/${encodeURIComponent(filename)}?originalUrl=${encodeURIComponent(imageUrl)}&fallbackToAny=${fallbackToAny}`;
    
    // Fetch the base64 version
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Base64 fetch failed with status: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log(`Successfully loaded image via base64 API`);
      // Cache the result for future use
      base64Cache.set(imageUrl, result.data);
      return result.data;
    } else {
      console.error('Base64 conversion failed:', result.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

/**
 * Preload a batch of images as base64
 * Useful for quiz questions to ensure images are available before displaying
 * 
 * @param imageUrls Array of image URLs to preload
 * @returns A Promise that resolves when all images are preloaded
 */
export async function preloadImagesAsBase64(imageUrls: string[]): Promise<void> {
  // Filter out null/empty/undefined URLs and already cached ones
  const urlsToFetch = imageUrls.filter(url => 
    url && 
    !url.startsWith('data:') && 
    !base64Cache.has(url)
  );
  
  if (urlsToFetch.length === 0) {
    return;
  }
  
  console.log(`Preloading ${urlsToFetch.length} images as base64`);
  
  // Create promises for all images, but don't wait for completion
  const promises = urlsToFetch.map(url => forceBase64Image(url));
  
  // Use Promise.allSettled to handle all promises regardless of success/failure
  await Promise.allSettled(promises);
  
  console.log(`Preloaded ${urlsToFetch.length} images as base64`);
}

/**
 * Check if an image is already cached as base64
 */
export function isImageCached(url: string): boolean {
  return base64Cache.has(url);
}

/**
 * Get the number of cached images
 */
export function getCachedImageCount(): number {
  return base64Cache.size;
}

/**
 * Clear the base64 image cache
 */
export function clearImageCache(): void {
  base64Cache.clear();
}