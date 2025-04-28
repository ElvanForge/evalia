import { useState, useEffect } from 'react';
import { ReliableImage } from '@/components/reliable-image';
import { forceBase64Image } from '@/lib/force-base64-images';

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
 * Enhanced component that handles image loading with multiple fallbacks and retries:
 * 
 * 1. Always converts images to base64 for consistent rendering in all environments
 * 2. Shows a loading state while fetching and processing the image
 * 3. Provides a retry button if image loading fails
 * 4. Looks much nicer with proper styling for all states
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
  // Always default to allowing fallbacks for quiz questions
  // since image accuracy is less critical than ensuring something displays
  const allowFallbacks = true;

  const [preloadComplete, setPreloadComplete] = useState(false);

  // Preload the image immediately on component mount to ensure it loads
  useEffect(() => {
    if (src) {
      const preloadImage = async () => {
        await forceBase64Image(src, allowFallbacks);
        setPreloadComplete(true);
      };
      
      preloadImage();
    } else {
      setPreloadComplete(true);
    }
  }, [src, allowFallbacks]);

  return (
    <ReliableImage
      src={src}
      alt={alt}
      className={className}
      fallbackClassName={fallbackClassName}
      width={width}
      height={height}
      withFallbacks={allowFallbacks}
    />
  );
}

// Export as both default and named export to ensure compatibility
export { ImageWithFallbacks };
export default ImageWithFallbacks;