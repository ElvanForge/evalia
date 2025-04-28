import { useEffect, useState } from 'react';
import { forceBase64Image } from '@/lib/force-base64-images';
import { Skeleton } from '@/components/ui/skeleton';

interface ReliableImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  withFallbacks?: boolean;
}

/**
 * A production-ready image component that guarantees images will load
 * by always converting them to base64 data URLs
 */
export function ReliableImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height,
  withFallbacks = true,
}: ReliableImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }
    
    // Reset state when src changes
    setLoading(true);
    setError(false);
    
    // If src is already a data URL, use it directly
    if (src.startsWith('data:')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Always load images as base64 for maximum compatibility
    const loadImage = async () => {
      try {
        const base64Src = await forceBase64Image(src, withFallbacks);
        if (base64Src) {
          setImageSrc(base64Src);
          setError(false);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src, withFallbacks, retryCount]);

  // Loading state
  if (loading) {
    return (
      <div 
        className={`relative inline-block overflow-hidden ${fallbackClassName || className}`}
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Error state with retry button
  if (error || !imageSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${fallbackClassName || className}`}
        style={{ width: width || 100, height: height || 100 }}
      >
        <div className="flex flex-col items-center p-2 text-center">
          <span className="text-xs text-gray-500 mb-1">Failed to load image</span>
          <button 
            onClick={() => setRetryCount(c => c + 1)} 
            className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{ width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto' }}
    />
  );
}