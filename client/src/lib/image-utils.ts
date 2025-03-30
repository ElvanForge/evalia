/**
 * Utility functions for handling image URLs and paths
 */
import { normalizeUrlPath, joinUrlPaths } from './utils';

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
  if (imageUrl.includes('/uploads/') || imageUrl.includes('uploads/')) {
    // Extract just the filename from the path
    const filenameWithParams = imageUrl.split(/[\/\\]/).pop() || '';
    const filename = filenameWithParams.split('?')[0]; // Remove any query parameters
    
    if (filename) {
      // Use the new direct API endpoint with normalized path
      const apiEndpoint = joinUrlPaths('/api/images', filename) + `?t=${Date.now()}`;
      
      // Log for debugging
      console.log('Processing image path:', { 
        original: imageUrl, 
        filename: filename,
        apiEndpoint: apiEndpoint,
        fullUrl: `${window.location.origin}${apiEndpoint}`
      });
      
      return `${window.location.origin}${apiEndpoint}`;
    }
    
    // Fallback to traditional method if filename extraction fails
    let cleanedPath;
    
    if (imageUrl.includes('/uploads/images/') || imageUrl.includes('uploads/images/')) {
      // Extract just the filename if it includes the full path
      let parts = [];
      if (imageUrl.includes('/uploads/images/')) {
        parts = imageUrl.split('/uploads/images/');
      } else {
        parts = imageUrl.split('uploads/images/');
      }
      const filename = parts[parts.length - 1];
      cleanedPath = joinUrlPaths('/uploads/images', filename);
    } else {
      // Normalize path to ensure it starts with a slash and has no double slashes
      cleanedPath = normalizeUrlPath(imageUrl);
      
      // If the path contains '/uploads/' twice, fix it
      if ((cleanedPath.match(/\/uploads\//g) || []).length > 1) {
        cleanedPath = cleanedPath.substring(cleanedPath.lastIndexOf('/uploads/'));
      }
    }
    
    console.log('Fallback to traditional image path:', { 
      original: imageUrl, 
      cleaned: cleanedPath,
      fullUrl: `${window.location.origin}${cleanedPath}`
    });
    
    return `${window.location.origin}${cleanedPath}`;
  }
  
  // Handle the special case where the URL might be just the filename
  if (!imageUrl.includes('/') && (
      imageUrl.endsWith('.jpg') || 
      imageUrl.endsWith('.jpeg') || 
      imageUrl.endsWith('.png') || 
      imageUrl.endsWith('.gif') || 
      imageUrl.endsWith('.svg')
    )) {
    // Use the API endpoint directly for simple filenames
    const apiEndpoint = joinUrlPaths('/api/images', imageUrl) + `?t=${Date.now()}`;
    console.log('Detected image filename, using API endpoint:', apiEndpoint);
    return `${window.location.origin}${apiEndpoint}`;
  }
  
  // If it's any other relative path, ensure it has the correct origin
  if (!imageUrl.startsWith(`${window.location.origin}`)) {
    // Normalize the path first to eliminate double slashes
    const normalizedPath = normalizeUrlPath(imageUrl);
    const fullUrl = `${window.location.origin}${normalizedPath}`;
    
    console.log('Converting relative URL to absolute:', {
      original: imageUrl,
      normalized: normalizedPath,
      absolute: fullUrl
    });
    
    return fullUrl;
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
  
  // Default fallback image as SVG for quizzes if none provided
  const defaultFallback = fallbackSrc || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZGU4ZGQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzBiYTJiMCIgZm9udC1zaXplPSIxNnB4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkltYWdlIGNvdWxkIG5vdCBiZSBsb2FkZWQ8L3RleHQ+PC9zdmc+";
  
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
      if (rest.onLoad) {
        rest.onLoad(e as any);
      }
    },
    onError: (e) => {
      console.error("Image failed to load:", processedSrc, "Original:", src);
      const target = e.target as HTMLImageElement;
      let retryAttempts = 0;
      const maxRetries = 4;
      
      const attemptRecover = () => {
        // Don't retry more than X times to prevent infinite loops
        if (retryAttempts >= maxRetries) {
          console.log(`Max retries (${maxRetries}) reached, using fallback image`);
          target.src = defaultFallback;
          return;
        }
        
        retryAttempts++;
        
        // Special case for quiz images where URLs might be relative or just filenames
        if (!src?.includes('/') && src?.includes('.')) {
          // Likely just a filename - try using the direct API endpoint
          const apiPath = joinUrlPaths('/api/images', src) + `?t=${Date.now()}`;
          const apiUrl = `${window.location.origin}${apiPath}`;
          console.log(`Attempt ${retryAttempts}: Using direct API for filename:`, apiUrl);
          target.src = apiUrl;
          return;
        }
        
        // Special case for quiz images and uploads folder
        if (src && (src.includes('/uploads/') || src.includes('uploads/'))) {
          // Get the filename from the source URL
          const extractedFilename = src.split(/[\/\\]/).pop();
          
          // First recovery attempt: use the direct API endpoint with the filename
          if (extractedFilename) {
            // Clean up any query parameters
            const cleanFilename = extractedFilename.split('?')[0];
            // Use the API endpoint with cache busting and proper path joining
            const apiPath = joinUrlPaths('/api/images', cleanFilename) + `?t=${Date.now()}`;
            const apiUrl = `${window.location.origin}${apiPath}`;
            
            console.log(`Attempt ${retryAttempts}: Using direct API endpoint:`, apiUrl);
            target.src = apiUrl;
            return;
          }
          
          // Second recovery attempt: Try to normalize the uploads path for any uploads
          const uploadsIndex = Math.max(
            src.lastIndexOf('/uploads/'), 
            src.lastIndexOf('uploads/')
          );
          
          if (uploadsIndex >= 0) {
            // Extract the filename from the normalized path
            const path = src.substring(uploadsIndex);
            const pathFilename = path.split(/[\/\\]/).pop();
            
            if (pathFilename) {
              // Clean up any query parameters
              const cleanFilename = pathFilename.split('?')[0];
              // Use the API endpoint with normalized path
              const apiPath = joinUrlPaths('/api/images', cleanFilename) + `?t=${Date.now()}`;
              const apiUrl = `${window.location.origin}${apiPath}`;
              
              console.log(`Attempt ${retryAttempts}: Using API with normalized filename:`, apiUrl);
              target.src = apiUrl;
              return;
            }
            
            // If we couldn't extract a filename, fall back to the legacy approach with proper normalization
            const correctPath = normalizeUrlPath(path);
            const fixedUrl = `${window.location.origin}${correctPath}`;
            console.log(`Attempt ${retryAttempts}: Using corrected uploads path:`, fixedUrl);
            target.src = fixedUrl;
            return;
          }
          
          // Third recovery attempt: try the uploads static route directly with proper path joining
          if (extractedFilename) {
            const cleanFilename = extractedFilename.split('?')[0];
            const uploadsPath = joinUrlPaths('/uploads/images', cleanFilename) + `?direct=1&t=${Date.now()}`;
            const cacheBustUrl = `${window.location.origin}${uploadsPath}`;
            console.log(`Attempt ${retryAttempts}: Using legacy static URL:`, cacheBustUrl);
            target.src = cacheBustUrl;
            return;
          }
        }
        
        // Try correcting the URL with absolute path for any path
        if (src && !src.startsWith('data:') && !src.startsWith('http')) {
          // Use our URL normalization utilities
          const normalizedPath = normalizeUrlPath(src);
          const absoluteUrl = `${window.location.origin}${normalizedPath}`;
          console.log(`Attempt ${retryAttempts}: Using normalized absolute URL:`, absoluteUrl);
          target.src = absoluteUrl;
          return;
        }
        
        // If we've tried everything and nothing worked, use the fallback
        console.log(`No recovery options left, using fallback image:`, defaultFallback);
        target.src = defaultFallback;
      };
      
      // Start the recovery process
      attemptRecover();
      
      // Call original onError if provided
      if (rest.onError) {
        rest.onError(e as any);
      }
    },
    ...rest
  };
}