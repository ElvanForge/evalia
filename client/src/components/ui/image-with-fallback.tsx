import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  }, [src]);

  const handleError = () => {
    setLoading(false);
    
    // If we're on our first attempt, try with the fallback option
    if (attemptCount === 0) {
      // Use the API's fallback parameter to request a placeholder from server
      const apiSrc = src.startsWith('/api/') 
        ? `${src}${src.includes('?') ? '&' : '?'}fallback=true&t=${Date.now()}`
        : null;
      
      if (apiSrc) {
        console.log('Image failed to load, trying server fallback:', apiSrc);
        setImageSrc(apiSrc);
        setAttemptCount(1);
        return;
      }
    }
    
    // If we've tried server fallback or it's not available, try the provided fallback
    if (attemptCount === 1 && fallbackSrc) {
      console.log('Server fallback failed, using custom fallback image');
      setImageSrc(fallbackSrc);
      setAttemptCount(2);
      return;
    }
    
    // If all fallbacks have failed, show error state
    setError(true);
    if (onError) onError();
    console.error(`Failed to load image: ${src}`);
  };

  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };

  return (
    <div className={cn('relative', containerClassName)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      
      {error && !fallbackSrc && (
        <div className={cn(
          'flex items-center justify-center bg-muted/20 text-muted-foreground text-sm',
          className
        )}>
          <span>Failed to load image</span>
        </div>
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            error && !fallbackSrc ? 'hidden' : '',
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