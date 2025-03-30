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
  
  // Start with the processed original URL
  const [currentSrc, setCurrentSrc] = useState<string>(getFullImageUrl(src || ''));
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [finallyLoaded, setFinallyLoaded] = useState<boolean>(false);
  
  const maxRetries = 3;

  // Reset states when src changes
  useEffect(() => {
    setCurrentSrc(getFullImageUrl(src || ''));
    setRetryCount(0);
    setHasError(false);
    setFinallyLoaded(false);
  }, [src]);

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
      // First attempt: For quiz images, try to fix the path
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        // Extract the filename
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          const fixedUrl = `${window.location.origin}/uploads/images/${filename}`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using direct path: ${fixedUrl}`);
          setCurrentSrc(fixedUrl);
          return;
        }
      }
    } 
    else if (nextRetryCount === 2) {
      // Second attempt: Try cache busting
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          const cacheBustUrl = `${window.location.origin}/uploads/images/${filename}?v=${Date.now()}`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using cache bust: ${cacheBustUrl}`);
          setCurrentSrc(cacheBustUrl);
          return;
        }
      }
    }
    else if (nextRetryCount === 3) {
      // Third attempt: Try direct access with query param
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          const directUrl = `${window.location.origin}/uploads/images/${filename}?direct=1`;
          console.log(`Image recovery attempt ${nextRetryCount}: Using direct access: ${directUrl}`);
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