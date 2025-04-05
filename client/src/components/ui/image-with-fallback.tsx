import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getFallbackImage, formatImageUrl } from '@/lib/image-utils';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Enhanced image component with multiple fallback strategies
 * 
 * Features:
 * - Automatically adds cache busting parameter
 * - Tries multiple fallback strategies if image fails to load
 * - Optional custom fallback image
 * - Loading state indicator
 * - Error handling and reporting
 * - Enhanced recovery system with 7 fallback approaches
 */
export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Add cache busting and prepare the image URL
  useEffect(() => {
    if (!src) return;
    
    setLoading(true);
    setError(false);
    setAttemptCount(0);
    
    // Reset to original source when the src prop changes
    const timestamp = Date.now();
    const hasQuery = src.includes('?');
    const separator = hasQuery ? '&' : '?';
    const newSrc = `${src}${separator}t=${timestamp}`;
    setImageSrc(newSrc);
    
    // Log initial image loading attempt for debugging
    console.log(`Loading image: ${newSrc} (original: ${src})`);
  }, [src]);

  const handleError = () => {
    setLoading(false);
    
    console.log(`Image failed to load (attempt ${attemptCount + 1}): ${imageSrc}`);
    
    try {
      // Extract information from the source
      let baseUrl = '';
      let pathname = '';
      let filename = '';
      
      try {
        // Handle both absolute and relative URLs
        const url = src.startsWith('http') 
          ? new URL(src)
          : new URL(src, window.location.origin);
        
        baseUrl = url.origin;
        pathname = url.pathname;
        
        // Extract the filename, handling potential directory paths
        const pathParts = pathname.split('/');
        filename = pathParts[pathParts.length - 1];
      } catch (e) {
        // If URL parsing fails, try a simpler approach
        const parts = src.split('/');
        filename = parts[parts.length - 1] || '';
        baseUrl = window.location.origin;
      }
      
      // Remove any query parameters from the filename
      filename = filename.split('?')[0];
      
      // Progressive fallback strategy
      if (attemptCount === 0) {
        // Try direct API endpoint with cache busting
        const apiUrl = `${baseUrl}/api/images/${filename}?t=${Date.now()}`;
        console.log(`Fallback strategy 1: Using API endpoint: ${apiUrl}`);
        setImageSrc(apiUrl);
        setAttemptCount(1);
        return;
      } 
      else if (attemptCount === 1) {
        // Try direct static file path
        const staticUrl = `${baseUrl}/uploads/images/${filename}?t=${Date.now()}`;
        console.log(`Fallback strategy 2: Using static path: ${staticUrl}`);
        setImageSrc(staticUrl);
        setAttemptCount(2);
        return;
      }
      else if (attemptCount === 2) {
        // Try API with explicit fallback parameter
        const fallbackUrl = `${baseUrl}/api/images/${filename}?fallback=true&t=${Date.now()}`;
        console.log(`Fallback strategy 3: Using API with fallback: ${fallbackUrl}`);
        setImageSrc(fallbackUrl);
        setAttemptCount(3);
        return;
      }
      else if (attemptCount === 3) {
        // Try relative API path
        const relativeUrl = `/api/images/${filename}?t=${Date.now()}`;
        console.log(`Fallback strategy 4: Using relative API path: ${relativeUrl}`);
        setImageSrc(relativeUrl);
        setAttemptCount(4);
        return;
      }
      else if (attemptCount === 4) {
        // Try relative uploads path
        const uploadsUrl = `/uploads/images/${filename}?direct=1&t=${Date.now()}`;
        console.log(`Fallback strategy 5: Using direct uploads path: ${uploadsUrl}`);
        setImageSrc(uploadsUrl);
        setAttemptCount(5);
        return;
      }
      else if (attemptCount === 5 && fallbackSrc) {
        // Try provided fallback
        console.log(`Fallback strategy 6: Using provided fallback: ${fallbackSrc}`);
        setImageSrc(fallbackSrc);
        setAttemptCount(6);
        return;
      }
      else if (attemptCount === 5 || attemptCount === 6) {
        // Last resort: Use the placeholder parameter
        const placeholderUrl = `${baseUrl}/api/images/${filename}?placeholder=true`;
        console.log(`Fallback strategy 7: Using placeholder: ${placeholderUrl}`);
        setImageSrc(placeholderUrl);
        setAttemptCount(7);
        return;
      }
    } catch (e) {
      console.error('Error during image recovery:', e);
    }
    
    // If all fallbacks have failed or an error occurred, show error state
    setError(true);
    if (onError) onError();
    console.error(`Failed to load image after all attempts: ${src}`);
  };

  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
    console.log(`Successfully loaded image: ${imageSrc}`);
  };

  return (
    <div className={cn('relative', containerClassName)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      
      {error && (
        <div className={cn(
          'flex items-center justify-center bg-muted/20 text-muted-foreground text-sm',
          className
        )}>
          <span>Image not available</span>
        </div>
      )}
      
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            error ? 'hidden' : '',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}