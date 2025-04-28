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
  // Never use placeholder images for quiz questions
  // Only show the exact image that is requested or an error state
  const allowFallbacks = false;

  const [preloadComplete, setPreloadComplete] = useState(false);

  // Preload the image immediately on component mount to ensure it loads
  useEffect(() => {
    if (src) {
      // If the source is already a base64 data URL, no need to preload
      if (src.startsWith('data:')) {
        setPreloadComplete(true);
        return;
      }
      
      const preloadImage = async () => {
        // Always force reload when src changes to ensure we get the latest image
        // This is critical for quiz editing when uploading new images
        await forceBase64Image(src, allowFallbacks, true);
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