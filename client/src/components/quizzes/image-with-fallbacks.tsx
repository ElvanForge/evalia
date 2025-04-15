import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileImage, RefreshCcw } from 'lucide-react';

interface ImageWithFallbacksProps {
  questionId: number;
  questionIndex: number;
  imageUrl: string;
  isLoading: boolean;
}

/**
 * Enhanced component for displaying images with multiple fallback strategies
 * to handle various deployment environments and image formats
 * 
 * This component will try different approaches to load an image:
 * 1. Direct URL loading
 * 2. Loading via API endpoints
 * 3. Base64 conversion for blob URLs
 * 4. Case-insensitive filename matching
 */
const ImageWithFallbacks = ({ 
  questionId, 
  questionIndex, 
  imageUrl, 
  isLoading 
}: ImageWithFallbacksProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [manualRetry, setManualRetry] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Check if it's a blob URL that can be used directly
  const isBlobUrl = imageUrl?.startsWith('blob:');
  const isDataUrl = imageUrl?.startsWith('data:');
  const isHttpUrl = imageUrl?.startsWith('http');
  
  // Check for various problematic URL patterns
  const isStoredBlobUrl = imageUrl?.includes('/uploads/images/blob:');
  const isClipboardPattern = imageUrl?.includes('clipboard-');
  const isImagePattern = imageUrl?.match(/image-\d+/i);
  
  // Get the current environment
  const isProduction = window?.location?.hostname !== 'localhost';
  
  // Generate a timestamp for cache busting
  const timestamp = Date.now();
  
  // This object is for debugging purposes only
  const imageDebugInfo = {
    originalUrl: imageUrl || 'undefined',
    isBlobUrl,
    isDataUrl,
    isHttpUrl,
    isStoredBlobUrl,
    isClipboardPattern,
    isImagePattern: !!isImagePattern,
    environment: isProduction ? 'production' : 'development',
    domainName: window?.location?.hostname || 'unknown',
    attempts,
    currentStrategy: loadingStrategy
  };
  
  // Extract filename from the URL, handling various formats
  const extractFilename = (url: string): string | null => {
    if (!url) return null;
    
    // Try various regex patterns to extract the filename
    
    // Pattern 1: Extract from path (most common)
    const pathMatch = url.match(/\/([^\/]+)(\?|$)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1];
    
    // Pattern 2: Extract from blob URL format
    const blobMatch = url.match(/\/uploads\/images\/blob:.*\/(.*?)(\?|$)/);
    if (blobMatch && blobMatch[1]) return blobMatch[1];
    
    // Pattern 3: For image-timestamp pattern
    const imageMatch = url.match(/(image-\d+-\d+\.\w+)(\?|$)/i);
    if (imageMatch && imageMatch[1]) return imageMatch[1];
    
    // If no patterns match, return the original URL
    return url;
  };
  
  // Generate strategies based on the image URL type
  const getStrategies = () => {
    // First, get the filename (if possible)
    const extractedFilename = extractFilename(imageUrl);
    console.log('Extracted filename:', extractedFilename);
    
    // Special strategies for blob URLs which don't work in production
    if (isStoredBlobUrl || isBlobUrl) {
      console.warn('Handling blob URL:', imageUrl);
      
      // For stored blob URLs or direct blob URLs, try to extract the filename if possible
      if (extractedFilename && extractedFilename !== imageUrl) {
        console.log('Will attempt loading blob image with extracted name:', extractedFilename);
        
        return [
          // Strategy 1: Try direct path with cache busting and the extracted filename
          () => `/uploads/images/${extractedFilename}?t=${timestamp}`,
          
          // Strategy 2: Via API endpoint with cache busting
          () => `/api/images/${encodeURIComponent(extractedFilename)}?t=${timestamp}`,
          
          // Strategy 3: Via quiz image endpoint with cache busting
          () => `/api/quiz-image/${encodeURIComponent(extractedFilename)}?t=${timestamp}`,
          
          // Strategy 4: Debug endpoint - try to find similar files
          () => `/api/image-debug/find?path=${encodeURIComponent(extractedFilename)}&t=${timestamp}`
        ];
      }
      
      // For direct blob URLs in development, we can use them directly
      if (isBlobUrl && !isProduction) {
        return [() => imageUrl];
      }
      
      // Otherwise, we'll try the debug endpoint as a last resort
      return [
        () => `/api/image-debug/find?path=${encodeURIComponent(imageUrl)}&t=${timestamp}`
      ];
    }
    
    // Data URLs can be used directly everywhere
    if (isDataUrl) {
      return [() => imageUrl];
    }
    
    // For clipboard images, try multiple paths
    if (isClipboardPattern || isImagePattern) {
      return [
        // Strategy 1: Try direct path with cache busting
        () => `/uploads/images/${extractedFilename || imageUrl}?t=${timestamp}`,
        
        // Strategy 2: Via API endpoint with better CORS handling
        () => `/api/images/${encodeURIComponent(extractedFilename || imageUrl)}?t=${timestamp}`,
        
        // Strategy 3: Via quiz image endpoint with fallback handling
        () => `/api/quiz-image/${encodeURIComponent(extractedFilename || imageUrl)}?t=${timestamp}`,
        
        // Strategy 4: Try case-insensitive searching via debug endpoint
        () => `/api/image-debug/find?path=${encodeURIComponent(extractedFilename || imageUrl)}&t=${timestamp}`
      ];
    }
    
    // External HTTP URLs - try direct first, then proxy if CORS issues occur
    if (isHttpUrl) {
      return [
        // Strategy 1: Use external URL directly
        () => imageUrl,
        
        // Strategy 2: Try via proxy for CORS issues
        () => `/api/quiz-image/${encodeURIComponent(imageUrl)}?t=${timestamp}`,
      ];
    }
    
    // Default: For all other cases, try multiple strategies
    return [
      // Strategy 1: Direct path with cache busting
      () => {
        if (imageUrl?.includes('/uploads/images/')) {
          return `${imageUrl.includes('?') ? imageUrl : `${imageUrl}?t=${timestamp}`}`;
        }
        return `/uploads/images/${imageUrl}?t=${timestamp}`;
      },
      
      // Strategy 2: Via regular images API endpoint (optimized)
      () => `/api/images/${encodeURIComponent(imageUrl)}?t=${timestamp}`,
      
      // Strategy 3: Via specialized quiz image endpoint (more fallbacks)
      () => `/api/quiz-image/${encodeURIComponent(imageUrl)}?t=${timestamp}`,
      
      // Strategy 4: With full URL path
      () => {
        const origin = window.location.origin;
        if (imageUrl?.startsWith('/')) {
          return `${origin}${imageUrl}?t=${timestamp}`;
        }
        return `${origin}/uploads/images/${imageUrl}?t=${timestamp}`;
      },
      
      // Strategy 5: Debug endpoint - try to find similar files
      () => `/api/image-debug/find?path=${encodeURIComponent(imageUrl)}&t=${timestamp}`
    ];
  };
  
  // Compute strategies dynamically based on the URL type
  const strategies = getStrategies();
  
  // Handle debug endpoint responses
  const handleDebugResponse = async (url: string) => {
    try {
      if (!url.includes('/api/image-debug/find')) return null;
      
      // It's a debug endpoint, let's parse the response
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Debug endpoint response:', data);
      
      if (data.success && data.url) {
        // Found a match! Update the image source
        console.log('Debug endpoint found matching image:', data.url);
        return data.url;
      }
      
      return null;
    } catch (error) {
      console.error('Error handling debug response:', error);
      return null;
    }
  };
  
  // Function to force reload the image
  const forceReload = () => {
    setManualRetry(prev => prev + 1);
    setLoadFailed(false);
    setLoadingStrategy(0);
    setAttempts(0);
  };
  
  useEffect(() => {
    if (isLoading || !imageUrl) return;
    
    // Reset states when image URL changes or manual retry is triggered
    setLoadFailed(false);
    setLoadingStrategy(0);
    setAttempts(0);
    
    // If there are no strategies, mark as failed immediately
    if (strategies.length === 0) {
      console.error('No loading strategies available for image:', imageDebugInfo);
      setLoadFailed(true);
      return;
    }
    
    // Apply the first strategy
    const url = strategies[0]();
    console.log(`[IMG] Strategy 1/${strategies.length} for ${imageUrl}: ${url}`);
    
    // If it's a debug endpoint, we need to fetch it and use the response
    if (url.includes('/api/image-debug/find')) {
      handleDebugResponse(url).then(newUrl => {
        if (newUrl) {
          setImageSrc(newUrl);
        } else {
          // Debug endpoint couldn't find the image, mark as failed
          console.error('Debug endpoint could not find image:', imageDebugInfo);
          setLoadFailed(true);
        }
      });
    } else {
      setImageSrc(url);
    }
  }, [imageUrl, isLoading, manualRetry]);
  
  const handleError = async () => {
    // Increment attempts counter
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Try next strategy if current one fails
    const nextStrategy = loadingStrategy + 1;
    
    if (nextStrategy < strategies.length) {
      const url = strategies[nextStrategy]();
      console.log(`[IMG] Strategy ${nextStrategy + 1}/${strategies.length} for ${imageUrl}: ${url}`);
      
      // If it's a debug endpoint, we need to fetch it and use the response
      if (url.includes('/api/image-debug/find')) {
        const newUrl = await handleDebugResponse(url);
        if (newUrl) {
          setLoadingStrategy(nextStrategy);
          setImageSrc(newUrl);
          return;
        }
        // If debug endpoint failed, try next strategy if available
        if (nextStrategy + 1 < strategies.length) {
          setLoadingStrategy(nextStrategy + 1);
          setImageSrc(strategies[nextStrategy + 1]());
          return;
        }
      } else {
        setLoadingStrategy(nextStrategy);
        setImageSrc(url);
        return;
      }
    }
    
    // If all strategies failed, mark as failed
    console.error('[IMG] All loading strategies failed:', imageDebugInfo);
    setLoadFailed(true);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // No image available
  if (!imageUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }
  
  // Failed state with helpful information
  if (loadFailed) {
    const isBlobProblem = isStoredBlobUrl || (isBlobUrl && isProduction);
    
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
        <FileImage className="w-12 h-12 text-red-600 mb-2" />
        <p className="text-red-600 font-medium mb-2">Failed to load image</p>
        
        {isBlobProblem ? (
          <div className="text-gray-500 text-xs text-center">
            <p className="mb-2">
              This image is using a temporary blob URL that cannot be loaded in a deployed environment.
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Re-upload the image using a file upload instead of copy/paste or 
              drag-and-drop when creating quiz questions.
            </p>
            <button 
              onClick={forceReload}
              className="mt-2 flex items-center justify-center px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
            >
              <RefreshCcw className="w-3 h-3 mr-1" /> Try again
            </button>
          </div>
        ) : (
          <div className="text-gray-500 text-xs text-center">
            <p className="mb-2">
              The image could not be loaded after {attempts} attempts.
            </p>
            <p className="font-mono text-[10px] overflow-auto max-w-full break-all">
              {imageUrl}
            </p>
            <button 
              onClick={forceReload}
              className="mt-3 flex items-center justify-center px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
            >
              <RefreshCcw className="w-3 h-3 mr-1" /> Try again
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Render the image using the current strategy
  return (
    <div className="w-full flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
      <img
        ref={imageRef}
        src={imageSrc}
        alt={`Question ${questionIndex + 1}`}
        className="max-w-full max-h-[65vh] object-contain"
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous" // Critical for CORS issues
      />
    </div>
  );
};

export default ImageWithFallbacks;

// Make the component available as a named export too
export { ImageWithFallbacks };