/**
 * Helper function to force all images to be loaded as base64 from the server
 * This guarantees images will work in all environments, especially in production
 */

/**
 * Forces an image URL to be loaded as base64 from the server
 * This is useful for environments where normal URL loading fails (e.g., production)
 * 
 * @param url The original image URL
 * @returns Promise that resolves to a base64 data URL
 */
export async function forceBase64Image(url: string): Promise<string> {
  // Skip if already a data URL
  if (url.startsWith('data:')) {
    return url;
  }

  try {
    // Extract filename for endpoint
    let filename = url;
    
    // Handle blob URLs by extracting UUID
    if (url.startsWith('blob:')) {
      const uuidMatch = url.match(/([a-f0-9-]{36})/i);
      if (uuidMatch && uuidMatch[1]) {
        filename = uuidMatch[1];
      }
    }
    
    // Extract just the filename component
    if (filename.includes('/')) {
      filename = filename.split('/').pop() || filename;
    }
    
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    // Set parameters to help server identify the image
    const params = new URLSearchParams();
    params.append('originalUrl', url);
    params.append('timestamp', Date.now().toString());
    params.append('fallbackToAny', 'true');  // Allow fallback in production
    
    // Request the image as base64
    const response = await fetch(`/api/images/base64/${encodeURIComponent(filename)}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch base64 image: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`Successfully fetched ${filename} as base64 via ${data.source || 'server'}`);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch base64 image');
    }
  } catch (error) {
    console.error('Error forcing base64 image:', error);
    throw error;
  }
}

/**
 * Forces all image elements within a container to use base64 data URLs
 * Call this function on page load to ensure all images work in production
 * 
 * @param container The container element (defaults to document.body)
 */
export function forceAllImagesBase64(container: HTMLElement = document.body) {
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    const originalSrc = img.getAttribute('src');
    if (!originalSrc || originalSrc.startsWith('data:')) return;
    
    // Show loading state while we fetch the base64 version
    img.setAttribute('data-original-src', originalSrc);
    
    // Apply loading styling
    img.style.opacity = '0.5';
    
    // Fetch base64 version
    forceBase64Image(originalSrc)
      .then(base64Src => {
        img.setAttribute('src', base64Src);
        img.style.opacity = '1';
      })
      .catch(error => {
        console.error(`Failed to load image ${originalSrc}:`, error);
        // Leave original src in place on error
        img.style.opacity = '1';
      });
  });
}