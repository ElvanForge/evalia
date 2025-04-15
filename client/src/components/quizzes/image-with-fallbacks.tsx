import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/image-utils';

interface ImageWithFallbacksProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

/**
 * Component that handles image loading with fallbacks and retries
 * 
 * It will:
 * 1. Attempt to load the optimized image URL
 * 2. If that fails, try direct loading without optimization
 * 3. If that fails, show an error message with retry button
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
  
  // Get the optimized image URL when src changes or when retry is clicked
  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    
    // First try with optimized URL
    const optimizedUrl = optimizeImageUrl(src);
    setImageSrc(optimizedUrl || src);
  }, [src, retries]);
  
  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };
  
  const handleImageError = () => {
    // If optimized URL failed and we haven't tried the original yet
    if (imageSrc !== src && src) {
      console.log('Optimized image failed to load, trying original source');
      setImageSrc(src);
    } else {
      setLoading(false);
      setError(true);
      console.error(`Image failed to load: ${src}`);
    }
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