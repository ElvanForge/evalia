import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '@/lib/image-utils';

// Default fallback image as SVG data URI
const DEFAULT_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZGU4ZGQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzBiYTJiMCIgZm9udC1zaXplPSIxNnB4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkltYWdlIGNvdWxkIG5vdCBiZSBsb2FkZWQ8L3RleHQ+PC9zdmc+";

// Different fallback for quiz images
const QUIZ_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZGU4ZGQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzBiYTJiMCIgZm9udC1zaXplPSIxNnB4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPlF1aXogaW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZDwvdGV4dD48L3N2Zz4=";

export interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad' | 'src'> {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string; 
  isQuizImage?: boolean;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

/**
 * A React component that handles image loading with automatic error recovery and fallbacks.
 * This is particularly useful for quiz images and other uploads that might have inconsistent paths.
 */
export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  isQuizImage = false,
  onLoadSuccess,
  onLoadError,
  className,
  ...rest
}: ImageWithFallbackProps) {
  // Default fallback based on image type
  const defaultFallback = fallbackSrc || (isQuizImage ? QUIZ_FALLBACK : DEFAULT_FALLBACK);
  
  // Start with the original URL
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [finallyLoaded, setFinallyLoaded] = useState<boolean>(false);
  
  const maxRetries = 3; // Maximum number of retries before using fallback

  // Reset states when src changes
  useEffect(() => {
    if (!src) {
      setCurrentSrc(defaultFallback);
      setHasError(true);
      return;
    }
    
    // Special handling for quiz images - use direct API endpoint immediately
    if (isQuizImage && src) {
      const filename = src.split(/[\/\\]/).pop();
      const cleanFilename = filename?.split('?')[0] || '';
      
      // Use direct API endpoint for quiz images from the start
      if (cleanFilename) {
        const apiUrl = `${window.location.origin}/api/images/${cleanFilename}`;
        console.log(`Quiz image: Using direct API endpoint: [${src}] => [${apiUrl}]`);
        setCurrentSrc(apiUrl);
      } else {
        // Fallback to normal processing if we can't extract a filename
        const processedUrl = getFullImageUrl(src);
        console.log(`ImageWithFallback: Processing URL [${src}] => [${processedUrl}]`);
        setCurrentSrc(processedUrl);
      }
    } else {
      // Normal image processing for non-quiz images
      const processedUrl = getFullImageUrl(src);
      console.log(`ImageWithFallback: Processing URL [${src}] => [${processedUrl}]`);
      setCurrentSrc(processedUrl);
    }
    
    setRetryCount(0);
    setHasError(false);
    setFinallyLoaded(false);
  }, [src, isQuizImage, defaultFallback]);

  const handleError = () => {
    if (retryCount >= maxRetries) {
      // We've tried enough, use the fallback
      setCurrentSrc(defaultFallback);
      setHasError(true);
      setFinallyLoaded(true);
      if (onLoadError) onLoadError();
      return;
    }

    const nextRetryCount = retryCount + 1;
    setRetryCount(nextRetryCount);
    
    if (!src) {
      setCurrentSrc(defaultFallback);
      setHasError(true);
      return;
    }

    // Different recovery strategies based on retry count
    if (nextRetryCount === 1) {
      // First attempt: For quiz images, try the direct API endpoint
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        // Extract the filename
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          // Clean up any query parameters
          const cleanFilename = filename.split('?')[0];
          const apiUrl = `${window.location.origin}/api/images/${cleanFilename}`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using direct API: ${apiUrl}`);
          setCurrentSrc(apiUrl);
          return;
        }
      }
    } 
    else if (nextRetryCount === 2) {
      // Second attempt: Try the API with cache busting
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          // Clean up any query parameters
          const cleanFilename = filename.split('?')[0];
          const cacheBustUrl = `${window.location.origin}/api/images/${cleanFilename}?t=${Date.now()}`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using API with cache bust: ${cacheBustUrl}`);
          setCurrentSrc(cacheBustUrl);
          return;
        }
      }
    }
    else if (nextRetryCount === 3) {
      // Third attempt: Fall back to the legacy path with direct access
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          // Clean up any query parameters
          const cleanFilename = filename.split('?')[0];
          const directUrl = `${window.location.origin}/uploads/images/${cleanFilename}?direct=1`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using legacy path: ${directUrl}`);
          setCurrentSrc(directUrl);
          return;
        }
      }
    }

    // If no specific recovery strategy worked, use fallback
    setCurrentSrc(defaultFallback);
    setHasError(true);
  };

  const handleLoad = () => {
    // Only trigger the success callback if we actually loaded the original image, not the fallback
    if (!hasError && currentSrc !== defaultFallback) {
      setFinallyLoaded(true);
      if (onLoadSuccess) onLoadSuccess();
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={`${className || ''} ${hasError ? 'image-error' : ''}`}
      {...rest}
    />
  );
}