import React, { useState, useEffect } from 'react';
import { getFullImageUrl, formatQuizImageUrl, loadImageWithFallbacks } from '@/lib/image-utils';
import { normalizeUrlPath, joinUrlPaths } from '@/lib/utils';

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
    
    // Special handling for quiz images - use direct API endpoint immediately with cache busting
    if (isQuizImage && src) {
      const filename = src.split(/[\/\\]/).pop();
      const cleanFilename = filename?.split('?')[0] || '';
      
      // Use direct API endpoint for quiz images from the start with proper path joining and cache busting
      if (cleanFilename) {
        const timestamp = Date.now(); // Add timestamp to prevent caching
        const apiPath = joinUrlPaths('/api/images', cleanFilename) + `?t=${timestamp}`;
        const apiUrl = `${window.location.origin}${apiPath}`;
        console.log(`Quiz image: Using direct API endpoint with cache busting: [${src}] => [${apiUrl}]`);
        
        // For deployed environments, ensure we're using https if the page is loaded over https
        if (window.location.protocol === 'https:' && !apiUrl.startsWith('https:')) {
          const secureUrl = apiUrl.replace('http:', 'https:');
          console.log(`Converted to secure URL: ${secureUrl}`);
          setCurrentSrc(secureUrl);
        } else {
          setCurrentSrc(apiUrl);
        }
      } else {
        // Fallback to normal processing if we can't extract a filename
        const processedUrl = getFullImageUrl(src);
        console.log(`ImageWithFallback: Processing URL [${src}] => [${processedUrl}]`);
        setCurrentSrc(processedUrl);
      }
    } else {
      // Normal image processing for non-quiz images with cache busting for uploads
      const processedUrl = getFullImageUrl(src);
      const finalUrl = processedUrl.includes('/uploads/') || processedUrl.includes('/api/images/') 
        ? `${processedUrl}${processedUrl.includes('?') ? '&' : '?'}t=${Date.now()}` 
        : processedUrl;
      
      console.log(`ImageWithFallback: Processing URL [${src}] => [${finalUrl}]`);
      
      // For deployed environments, ensure we're using https if the page is loaded over https
      if (window.location.protocol === 'https:' && finalUrl.startsWith('http:')) {
        const secureUrl = finalUrl.replace('http:', 'https:');
        console.log(`Converted to secure URL: ${secureUrl}`);
        setCurrentSrc(secureUrl);
      } else {
        setCurrentSrc(finalUrl);
      }
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
          // Use path joining to ensure proper URL formatting
          const apiPath = joinUrlPaths('/api/images', cleanFilename);
          let apiUrl = `${window.location.origin}${apiPath}`;
          
          // Ensure HTTPS for deployed environments
          if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) {
            apiUrl = apiUrl.replace('http:', 'https:');
          }
          
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
          // Use path joining with cache busting
          const apiPath = joinUrlPaths('/api/images', cleanFilename) + `?t=${Date.now()}`;
          let cacheBustUrl = `${window.location.origin}${apiPath}`;
          
          // Ensure HTTPS for deployed environments
          if (window.location.protocol === 'https:' && cacheBustUrl.startsWith('http:')) {
            cacheBustUrl = cacheBustUrl.replace('http:', 'https:');
          }
          
          console.log(`Image recovery attempt ${nextRetryCount}: Using API with cache bust: ${cacheBustUrl}`);
          setCurrentSrc(cacheBustUrl);
          return;
        }
      }
    }
    else if (nextRetryCount === 3) {
      // Third attempt: Try with case insensitive matching
      if (isQuizImage || (src && (src.includes('/uploads/') || src.includes('uploads/')))) {
        const filename = src.split(/[\/\\]/).pop();
        if (filename) {
          // Clean up any query parameters
          const cleanFilename = filename.split('?')[0];
          
          // First try the direct uploads path
          const uploadsPath = joinUrlPaths('/uploads/images', cleanFilename) + `?direct=1&t=${Date.now()}`;
          let directUrl = `${window.location.origin}${uploadsPath}`;
          
          // Ensure HTTPS for deployed environments
          if (window.location.protocol === 'https:' && directUrl.startsWith('http:')) {
            directUrl = directUrl.replace('http:', 'https:');
          }
          
          console.log(`Image recovery attempt ${nextRetryCount}: Using uploads path: ${directUrl}`);
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