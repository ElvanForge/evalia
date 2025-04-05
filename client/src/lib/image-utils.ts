/**
 * Utilities for working with images in the application
 */

/**
 * Formats an image path for use with the API
 * Handles both local and external images
 * 
 * @param imagePath The path or filename of the image
 * @param options Additional formatting options
 * @returns Properly formatted image URL
 */
export function formatImageUrl(
  imagePath: string | null | undefined,
  options: {
    addCacheBusting?: boolean;
    enableFallback?: boolean;
    fullUrl?: boolean;
  } = {}
): string {
  const { 
    addCacheBusting = true, 
    enableFallback = true,
    fullUrl = false
  } = options;
  
  // Return an empty string if no path provided
  if (!imagePath) return '';
  
  // If it's already a full URL, return it as is (possibly with cache busting)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's an API path but doesn't start with /api, prepend it
  let path = imagePath;
  if (!path.startsWith('/api/') && !path.startsWith('/uploads/')) {
    path = `/api/images/${path}`;
  }
  
  // Add query parameters
  const params = new URLSearchParams();
  
  // Add cache busting if requested
  if (addCacheBusting) {
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