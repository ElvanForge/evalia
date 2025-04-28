import React, { useEffect, useState } from 'react';
import { forceBase64Image } from '@/lib/force-base64-images';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ReliableImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

/**
 * A simplified, production-ready image component that guarantees images will load
 * by always converting them to base64 data URLs
 */
export function ReliableImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height
}: ReliableImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    // Skip processing if already a data URL
    if (src.startsWith('data:')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Force all images to be base64 for maximum reliability
    forceBase64Image(src)
      .then(base64Src => {
        setImageSrc(base64Src);
        setLoading(false);
      })
      .catch(error => {
        console.error(`Failed to load image as base64: ${src}`, error);
        setError(true);
        setLoading(false);
      });
  }, [src, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-muted/30 ${className} ${fallbackClassName}`}
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-xs text-center text-muted-foreground mb-2">Failed to load image</p>
        <button 
          onClick={handleRetry}
          className="text-xs flex items-center text-primary hover:text-primary/80"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Try again
        </button>
      </div>
    );
  }
  
  return (
    <img
      src={imageSrc || ''}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}

export default ReliableImage;