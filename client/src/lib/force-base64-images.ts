/**
 * Force Base64 Images Utility
 * 
 * This utility helps with image loading issues by storing and managing
 * base64 data for images. It provides a cache system to avoid repeated network
 * requests and ensures images are displayed consistently.
 */

// Store base64 data for images
type ImageCache = {
  [key: string]: string;
};

// In-memory cache for base64 image data
let imageCache: ImageCache = {};

/**
 * Clear the entire image cache
 */
export function clearImageCache(): void {
  imageCache = {};
  console.log('Image cache cleared');
}

/**
 * Get a base64 data URL for an image from cache or fetch it from the server
 * 
 * @param {string} imagePath - The path of the image to fetch
 * @param {boolean} bypassCache - Whether to bypass the cache and force a new fetch
 * @returns {Promise<string | null>} - A Promise that resolves to the base64 data URL or null if not found
 */
export async function getBase64Image(imagePath: string, bypassCache = false): Promise<string | null> {
  if (!imagePath) return null;
  
  // If it's already a data URL, return it directly
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Clean up the path
  const cleanPath = imagePath.split('?')[0];
  
  // Check the cache first unless we're bypassing it
  if (!bypassCache && imageCache[cleanPath]) {
    console.log(`Using cached base64 data for ${cleanPath}`);
    return imageCache[cleanPath];
  }
  
  try {
    console.log(`Fetching base64 data for ${cleanPath}`);
    // Extract the filename from the path
    const filename = cleanPath.split('/').pop();
    
    if (!filename) {
      console.error('Invalid image path:', cleanPath);
      return null;
    }
    
    // Make the API request to get base64 data
    const response = await fetch(`/api/images/base64/${encodeURIComponent(filename)}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch base64 data for ${filename}:`, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.data) {
      // Store in cache for future use
      imageCache[cleanPath] = data.data;
      return data.data;
    }
    
    console.error('No base64 data received for', filename);
    return null;
  } catch (error) {
    console.error('Error fetching base64 image:', error);
    return null;
  }
}

/**
 * Try multiple methods to load an image, with fallbacks
 * 
 * @param {string} imagePath - The path of the image to try loading
 * @returns {Promise<string | null>} - A Promise that resolves to a usable image URL or null if all methods fail
 */
export async function getImageWithFallbacks(imagePath: string): Promise<string | null> {
  if (!imagePath) return null;
  
  // Skip processing for data URLs
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Try to use the API debug finder first for path-based images
  if (!imagePath.startsWith('blob:') && !imagePath.startsWith('data:')) {
    try {
      const response = await fetch(`/api/image-debug/find?path=${encodeURIComponent(imagePath)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.url) {
          console.log(`Found image via debug API: ${data.url} (method: ${data.method})`);
          return data.url;
        }
      }
    } catch (error) {
      console.error('Error using image debug finder:', error);
    }
  }
  
  // Try to get base64 data as a fallback
  try {
    const base64Data = await getBase64Image(imagePath);
    if (base64Data) {
      return base64Data;
    }
  } catch (error) {
    console.error('Error getting base64 data:', error);
  }
  
  // Return the original path as a last resort
  return imagePath;
}

/**
 * Add a base64 image to the cache directly
 * 
 * @param {string} path - The path to associate with this base64 data
 * @param {string} base64Data - The base64 data URL
 */
export function addToImageCache(path: string, base64Data: string): void {
  if (!path || !base64Data) return;
  
  const cleanPath = path.split('?')[0];
  imageCache[cleanPath] = base64Data;
}

/**
 * Get all entries from the image cache
 * 
 * @returns {ImageCache} - The current image cache
 */
export function getImageCache(): ImageCache {
  return { ...imageCache };
}