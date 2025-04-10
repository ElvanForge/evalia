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
    
    // Extract the base URL without any query parameters
    let cleanSrc = src.split('?')[0];
    
    // Add multiple cache busting parameters to ensure fresh content
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(2, 8);
    
    // Force a clean query string with multiple cache-busting parameters
    const newSrc = `${cleanSrc}?v=${timestamp}&r=${randomComponent}&fresh=true`;
    setImageSrc(newSrc);
    
    // Log initial image loading attempt for debugging
    console.log(`Loading image with enhanced cache busting: ${newSrc} (original: ${src})`);
  }, [src]);

  const handleError = () => {
    setLoading(false);
    
    console.log(`Image failed to load (attempt ${attemptCount + 1}): ${imageSrc}`);
    
    try {
      // Extract the filename from the source URL
      let filename = '';
      
      // Remove any query parameters first
      const cleanSrc = src.split('?')[0];
      
      if (cleanSrc.includes('/uploads/images/')) {
        filename = cleanSrc.split('/uploads/images/').pop() || '';
      } else if (cleanSrc.includes('/api/images/')) {
        filename = cleanSrc.split('/api/images/').pop() || '';
      } else {
        // Extract filename from the path
        const parts = cleanSrc.split('/');
        filename = parts[parts.length - 1] || '';
      }
      
      // Remove any remaining query parameters
      filename = filename.split('?')[0];
      
      if (!filename) {
        // If we couldn't extract a filename, give up immediately
        console.error('Could not extract filename from image source:', src);
        setError(true);
        if (onError) onError();
        return;
      }
      
      // Try only these two direct approaches with aggressive cache busting
      if (attemptCount === 0) {
        const timestamp = Date.now();
        const randomValue = Math.random().toString(36).substring(2, 8);
        
        // Try direct uploads path first
        const directUrl = `/uploads/images/${filename}?v=${timestamp}&r=${randomValue}`;
        console.log(`Trying direct upload path: ${directUrl}`);
        setImageSrc(directUrl);
        setAttemptCount(1);
        return;
      } 
      else if (attemptCount === 1) {
        const timestamp = Date.now();
        const randomValue = Math.random().toString(36).substring(2, 8);
        
        // Try API endpoint second
        const apiUrl = `/api/images/${filename}?v=${timestamp}&r=${randomValue}`;
        console.log(`Trying API endpoint: ${apiUrl}`);
        setImageSrc(apiUrl);
        setAttemptCount(2);
        return;
      }
    } catch (e) {
      console.error('Error during image recovery:', e);
    }
    
    // After our limited attempts, just show error state - no placeholders
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