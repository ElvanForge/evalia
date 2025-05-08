import { useState, useEffect } from 'react';
import { DirectBase64Image } from './direct-base64-image';
import { getBase64Image, getImageWithFallbacks } from '@/lib/force-base64-images';

interface ImageWithFallbacksProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  questionId?: number;
  questionIndex?: number;
}

/**
 * Enhanced component that handles image loading with strict requirements:
 * 
 * 1. Always converts images to base64 for consistent rendering in all environments
 * 2. Shows a loading state while fetching and processing the image
 * 3. Provides a retry button if image loading fails
 * 4. Never uses placeholder images - will only show the actual image or an error
 */
function ImageWithFallbacks({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height,
  questionId,
  questionIndex
}: ImageWithFallbacksProps) {
  // Skip client-side image processing if the image is already base64 data
  if (src && src.startsWith('data:')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto' }}
      />
    );
  }
  
  // Use the DirectBase64Image component which always fetches 
  // the image as base64 directly from the server
  return (
    <DirectBase64Image
      src={src}
      alt={alt}
      className={className}
      fallbackClassName={fallbackClassName}
      width={width}
      height={height}
    />
  );
}

// Export as both default and named export to ensure compatibility
export { ImageWithFallbacks };
export default ImageWithFallbacks;