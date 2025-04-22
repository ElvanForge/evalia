import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { optimizeImageUrl, blobToDataUrl } from '@/lib/image-utils';

interface ImageWithFallbacksProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

/**
 * Enhanced component that handles image loading with multiple fallbacks and retries:
 * 
 * 1. First attempts to load the optimized image URL
 * 2. If that fails, tries direct loading without optimization
 * 3. If that's a blob URL that fails, tries to fetch via base64 endpoint
 * 4. Shows an error message with retry button if all attempts fail
 */
function ImageWithFallbacks({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height
}: ImageWithFallbacksProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  
  // Get the optimized image URL when src changes or when retry is clicked
  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    setFallbackAttempted(false);
    
    // First try with optimized URL
    const optimizedUrl = optimizeImageUrl(src);
    setImageSrc(optimizedUrl || src);
  }, [src, retries]);
  
  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };
  
  // Function to try fetching the image as base64 from server
  const tryFetchAsBase64 = async (imgSrc: string) => {
    try {
      // Extract filename for API request
      let filename = imgSrc;
      
      // Handle blob URLs by extracting the UUID
      if (imgSrc.startsWith('blob:')) {
        const uuidMatch = imgSrc.match(/([a-f0-9-]{36})/i);
        if (uuidMatch && uuidMatch[1]) {
          console.log(`Extracted UUID ${uuidMatch[1]} from blob URL: ${imgSrc}`);
          filename = uuidMatch[1];
        }
      }
      
      // Remove any path or query components
      if (filename.includes('/')) {
        filename = filename.split('/').pop() || filename;
      }
      
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      
      console.log(`Attempting to fetch as base64: ${filename}`);
      
      const response = await fetch(`/api/images/base64/${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        console.error(`Base64 fetch failed with status: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('Successfully loaded image via base64 API');
        return data.data;
      } else {
        console.error('Base64 API returned error:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error in base64 fallback fetch:', error);
      return null;
    }
  };
  
  // For blob URLs, try to get data directly
  const tryConvertBlobToData = async (blobUrl: string) => {
    try {
      console.log('Converting blob URL to data URL');
      return await blobToDataUrl(blobUrl);
    } catch (error) {
      console.error('Failed to convert blob to data URL:', error);
      return null;
    }
  };
  
  const handleImageError = async () => {
    // If we're already trying a fallback or in error state, don't proceed
    if (fallbackAttempted) {
      setLoading(false);
      setError(true);
      return;
    }
    
    // Mark that we're using fallback to prevent endless retry loops
    setFallbackAttempted(true);
    
    // If optimized URL failed and we haven't tried the original yet
    if (imageSrc !== src && src) {
      console.log('Optimized image failed to load, trying original source');
      setImageSrc(src);
      return; // Exit and let the effect of changing imageSrc retry the load
    }
    
    if (src) {
      console.log(`Standard image loading failed for: ${src}`);
      
      // For blob URLs, first try direct conversion to data URL
      if (src.startsWith('blob:')) {
        const dataUrl = await tryConvertBlobToData(src);
        if (dataUrl) {
          console.log('Successfully converted blob to data URL');
          setImageSrc(dataUrl);
          return;
        }
      }
      
      // As a last resort, try fetching via base64 API
      const base64Data = await tryFetchAsBase64(src);
      if (base64Data) {
        setImageSrc(base64Data);
        return;
      }
    }
    
    // If we get here, all fallbacks have failed
    setLoading(false);
    setError(true);
    console.error(`Image failed to load after all fallback attempts: ${src}`);
  };
  
  const handleRetry = () => {
    setRetries(prev => prev + 1);
  };

  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-xs text-center text-muted-foreground mb-2">Failed to load image</p>
        <button 
          onClick={handleRetry}
          className="text-xs flex items-center text-primary hover:text-primary/80"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Try again
        </button>
      </div>
    );
  }
  
  return (
    <img
      src={imageSrc || ''}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}

// Maintain both named and default exports for backward compatibility
export { ImageWithFallbacks };
export default ImageWithFallbacks;