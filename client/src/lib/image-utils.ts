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
    // Clean the path to ensure consistent format
    // First, get just the part from /uploads/ onward
    let cleanedPath;
    
    if (imageUrl.includes('/uploads/images/')) {
      // Extract just the filename if it includes the full path
      const parts = imageUrl.split('/uploads/images/');
      const filename = parts[parts.length - 1];
      cleanedPath = `/uploads/images/${filename}`;
    } else {
      // Normalize path to ensure it starts with a slash
      cleanedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
      
      // If the path contains '/uploads/' twice, fix it
      if ((cleanedPath.match(/\/uploads\//g) || []).length > 1) {
        cleanedPath = cleanedPath.substring(cleanedPath.lastIndexOf('/uploads/'));
      }
    }
    
    // Log for debugging
    console.log('Processing image path:', { original: imageUrl, cleaned: cleanedPath });
    
    return `${window.location.origin}${cleanedPath}`;
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
      
      // Special case for quiz images and uploads folder
      if (src && src.includes('/uploads/')) {
        // First recovery attempt: for quiz images, ensure we have the correct path format
        if (src.includes('/uploads/images/')) {
          // Extract just the filename
          const parts = src.split('/uploads/images/');
          const filename = parts[parts.length - 1];
          // Construct the direct URL to the image
          const directUrl = `${window.location.origin}/uploads/images/${filename}`;
          
          console.log("Quiz image recovery attempt with direct path:", directUrl);
          if (directUrl !== target.src) {
            target.src = directUrl;
            return;
          }
        }
        
        // Second recovery attempt: Try to normalize the uploads path for any uploads
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
        
        // Third recovery attempt: try a direct query parameter approach for server cache busting
        const cacheBustUrl = `${window.location.origin}/uploads/images/${src.split('/').pop()}?t=${Date.now()}`;
        console.log("Trying cache-busted URL:", cacheBustUrl);
        if (cacheBustUrl !== target.src) {
          target.src = cacheBustUrl;
          return;
        }
      }
      
      // Try correcting the URL with absolute path for any path
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