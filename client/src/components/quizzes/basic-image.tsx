import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface BasicImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * A very simple and direct image component that doesn't use any advanced caching
 * or loading methods that might cause stuttering/flickering.
 */
export function BasicImage({ src, alt, className = '' }: BasicImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Direct source without any manipulation
  const directSrc = src;
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error(`Failed to load image: ${src}`);
  };
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {hasError && (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-md h-[50vh]">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">Image failed to load</p>
        </div>
      )}
      
      {!hasError && (
        <img
          src={directSrc}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      )}
    </div>
  );
}