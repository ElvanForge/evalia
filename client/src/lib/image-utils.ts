/**
 * Utility functions for handling image URLs and paths
 */

/**
 * Ensures an image URL is properly formatted with the correct origin
 * 
 * @param imageUrl The original image URL
 * @returns A properly formatted image URL
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  
  // If already starts with data: (data URL) or http(s): (absolute URL), return as is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For uploaded images that come from our server
  if (imageUrl.includes('/uploads/')) {
    // Normalize path to ensure it starts with a slash
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    
    // If the path contains '/uploads/' twice, fix it
    if ((normalizedPath.match(/\/uploads\//g) || []).length > 1) {
      const fixedPath = normalizedPath.substring(normalizedPath.lastIndexOf('/uploads/'));
      console.log('Fixed duplicate uploads path:', fixedPath);
      return `${window.location.origin}${fixedPath}`;
    }
    
    return `${window.location.origin}${normalizedPath}`;
  }
  
  // If it's any other relative path, ensure it has the correct origin
  if (!imageUrl.startsWith(`${window.location.origin}`)) {
    return imageUrl.startsWith('/')
      ? `${window.location.origin}${imageUrl}`
      : `${window.location.origin}/${imageUrl}`;
  }
  
  return imageUrl;
}

/**
 * Component props for images with error handling
 */
export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

/**
 * Creates an image element with proper URL handling and error fallback
 * 
 * @param props Image properties including src, alt, and optional fallbackSrc
 * @returns Image HTML attributes with processed src and onError handler
 */
export function getImageProps(props: ImageWithFallbackProps): React.ImgHTMLAttributes<HTMLImageElement> {
  const { src, alt, fallbackSrc, ...rest } = props;
  
  // Process the URL before setting it
  const processedSrc = getFullImageUrl(src);
  console.log("Image processing:", { 
    original: src, 
    processed: processedSrc,
    origin: window.location.origin
  });
  
  return {
    src: processedSrc,
    alt,
    onLoad: (e) => {
      console.log("Image loaded successfully:", processedSrc);
    },
    onError: (e) => {
      console.error("Image failed to load:", processedSrc, "Original:", src);
      const target = e.target as HTMLImageElement;
      
      // Special case for uploads folder to ensure correct path
      if (src && src.includes('/uploads/')) {
        // Try to normalize the uploads path to fix any path issues
        const uploadsIndex = src.lastIndexOf('/uploads/');
        if (uploadsIndex >= 0) {
          const correctPath = src.substring(uploadsIndex);
          const fixedUrl = `${window.location.origin}${correctPath}`;
          console.log("Trying corrected uploads path:", fixedUrl);
          
          if (fixedUrl !== target.src) {
            target.src = fixedUrl;
            return;
          }
        }
      }
      
      // Try correcting the URL with absolute path
      if (src && !src.startsWith('data:') && !src.startsWith('http')) {
        // Try a different URL format
        const absoluteUrl = `${window.location.origin}${src.startsWith('/') ? src : '/' + src}`;
        if (absoluteUrl !== target.src) {
          console.log("Trying absolute URL:", absoluteUrl);
          target.src = absoluteUrl;
          return;
        }
      }
      
      // If we have a fallback and it's different from the current src, use it
      if (fallbackSrc && fallbackSrc !== target.src) {
        console.log("Using fallback image:", fallbackSrc);
        target.src = fallbackSrc;
      }
    },
    ...rest
  };
}