/**
 * Utilities for working with images in the application
 */

/**
 * Formats an image path for use with the API
 * Handles both local and external images with enhanced caching controls and fallbacks
 * 
 * @param imagePath The path or filename of the image
 * @param options Additional formatting options
 * @returns Properly formatted image URL
 */
export function formatImageUrl(
  imagePath: string | null | undefined,
  options: {
    addCacheBusting?: boolean;
    enhancedCacheBusting?: boolean;
    enableFallback?: boolean;
    fullUrl?: boolean;
    forceBase64?: boolean;
  } = {}
): string {
  const { 
    addCacheBusting = true, 
    enhancedCacheBusting = false,
    enableFallback = true,
    fullUrl = false,
    forceBase64 = false
  } = options;
  
  // Return an empty string if no path provided
  if (!imagePath) return '';
  
  // If it's a data URL or external URL, return it as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If external URL but we still want cache busting, add it
    if (addCacheBusting) {
      const url = new URL(imagePath);
      url.searchParams.append('t', Date.now().toString());
      return url.toString();
    }
    return imagePath;
  }
  
  // If forcing base64 mode, extract filename and redirect to base64 endpoint
  if (forceBase64) {
    const filename = imagePath.split('/').pop()?.split('?')[0];
    if (filename) {
      return `/api/images/base64/${filename}`;
    }
  }
  
  // If it's an API path but doesn't start with /api, prepend it
  let path = imagePath;
  if (!path.startsWith('/api/') && !path.startsWith('/uploads/')) {
    // Prefer direct uploads path for better caching and reliability
    if (path.includes('image-') || path.includes('.jpg') || path.includes('.jpeg') || path.includes('.png') || path.includes('.gif')) {
      path = `/uploads/images/${path.split('/').pop()}`;
    } else {
      path = `/api/images/${path}`;
    }
  }
  
  // Add query parameters
  const params = new URLSearchParams();
  
  // Enhanced cache busting with multiple parameters for more aggressive cache invalidation
  if (enhancedCacheBusting) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    params.append('v', timestamp.toString());
    params.append('r', randomStr);
    params.append('fresh', 'true'); // Signal to CDN and browsers to fetch fresh
    
    console.log(`Loading image with enhanced cache busting: ${path}?${params.toString()} (original: ${imagePath}${addCacheBusting ? '?t=' + Date.now() : ''})`);
  } 
  // Simple cache busting
  else if (addCacheBusting) {
    params.append('t', Date.now().toString());
  }
  
  // Add fallback if requested
  if (enableFallback) {
    params.append('fallback', 'true');
  }
  
  // Construct the final URL
  const queryString = params.toString();
  const separator = path.includes('?') ? '&' : '?';
  const finalPath = queryString ? `${path}${separator}${queryString}` : path;
  
  // If full URL is requested, prepend the current origin
  if (fullUrl && typeof window !== 'undefined') {
    return `${window.location.origin}${finalPath}`;
  }
  
  return finalPath;
}

/**
 * Gets a default fallback image for the specified entity type
 * 
 * @param type Type of entity that needs a fallback image
 * @returns URL to a fallback image
 */
export function getFallbackImage(type: 'student' | 'teacher' | 'quiz' | 'class' | 'assignment' | 'generic' = 'generic'): string {
  // Use a colored SVG for different entity types
  // Colors match the application theme
  const colors = {
    student: '#0ba2b0',
    teacher: '#0ba2b0',
    quiz: '#0ba2b0',
    class: '#0ba2b0',
    assignment: '#0ba2b0',
    generic: '#0ba2b0',
  };
  
  const labels = {
    student: 'Student',
    teacher: 'Teacher',
    quiz: 'Quiz',
    class: 'Class',
    assignment: 'Assignment',
    generic: 'Image',
  };
  
  // Create an SVG data URI with the appropriate styling
  const color = colors[type];
  const label = labels[type];
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
    <rect width="300" height="200" fill="%23ede8dd"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${color}" font-size="24px" font-family="Arial, sans-serif">${label}</text>
  </svg>`;
}

/**
 * Get the full URL for an image, including the origin
 * 
 * @param url The relative URL of the image
 * @returns The full URL including origin
 */
export function getFullImageUrl(url: string | null | undefined): string {
  return formatImageUrl(url, { fullUrl: true });
}

/**
 * Get image props for use with <img> elements
 * 
 * @param options Options for formatting the image URL
 * @returns Props object to spread onto an <img> element
 */
export function getImageProps(options: {
  src?: string | null;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  addCacheBusting?: boolean;
  enableFallback?: boolean;
  type?: 'student' | 'teacher' | 'quiz' | 'class' | 'assignment' | 'generic';
}) {
  const {
    src,
    alt = '',
    className = '',
    width,
    height,
    addCacheBusting = true,
    enableFallback = true,
    type = 'generic'
  } = options;

  // Format URL with appropriate options
  const formattedSrc = formatImageUrl(src, {
    addCacheBusting,
    enableFallback
  });

  // Get fallback for onError handler
  const fallbackImage = getFallbackImage(type);

  return {
    src: formattedSrc || fallbackImage,
    alt,
    className,
    width,
    height,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      // If the image fails to load and it's not already the fallback, 
      // replace with fallback image
      if (e.currentTarget.src !== fallbackImage) {
        e.currentTarget.src = fallbackImage;
      }
    }
  };
}