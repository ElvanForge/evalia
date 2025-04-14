import { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface QuizImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * Simple image component specifically for quiz questions
 * Deliberately avoids fancy features or caching mechanisms to prevent stuttering
 */
export function QuizImage({ src, alt, className = '' }: QuizImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Skip rendering if no source
  if (!src) {
    return (
      <div className="flex items-center justify-center bg-muted/20 rounded-md h-[300px]">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }
  
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setIsLoading(false);
    setHasError(true);
  };
  
  // Process the URL directly without any cache busting
  let imageUrl = src;
  
  // If it's not an absolute URL or doesn't start with /, assume it's in uploads/images
  if (!src.startsWith('http') && !src.startsWith('/')) {
    imageUrl = `/uploads/images/${src}`;
  }
  
  return (
    <div className="relative quiz-image-container">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {hasError && (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-md h-[50vh]">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">Image failed to load</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs break-all">{src}</p>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''} ${hasError ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}