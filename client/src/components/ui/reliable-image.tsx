/**
 * ReliableImage component
 * 
 * Provides multiple fallback methods to ensure images load correctly:
 * 1. First tries to load from normal URL with cache-busting
 * 2. If that fails, attempts to fetch the image as base64 from the API
 * 3. Shows a proper placeholder when all methods fail
 */
import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface ReliableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;              // Original source URL
  alt: string;              // Alt text for the image
  className?: string;       // Optional CSS class
  fallbackClassName?: string; // Optional CSS class for fallback elements
  showLoader?: boolean;     // Whether to show a loader during loading
}

export function ReliableImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  showLoader = true,
  ...props
}: ReliableImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [base64Mode, setBase64Mode] = useState(false);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  
  // Add cache busting parameter to URL
  const cacheBustedSrc = src.includes('?') 
    ? `${src}&t=${Date.now()}` 
    : `${src}?t=${Date.now()}`;

  // Extract filename from the image path
  const getFilenameFromPath = (path: string): string => {
    // Remove query parameters first
    const cleanPath = path.split('?')[0];
    // Get the last part of the path (the filename)
    return cleanPath.split('/').pop() || '';
  };

  // Function to fetch image as base64 when standard loading fails
  const fetchImageAsBase64 = async (imageUrl: string) => {
    try {
      // Extract the filename from the path
      const filename = getFilenameFromPath(imageUrl);
      if (!filename) return null;
      
      console.log(`Fetching image as base64: ${filename}`);
      
      const response = await fetch(`/api/images/base64/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image as base64: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`Successfully loaded image as base64: ${filename}`);
        return data.data;
      } else {
        console.error(`Base64 image error: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching image as base64:', error);
      return null;
    }
  };

  // Handle initial image loading error
  const handleImageError = async () => {
    console.log(`Standard image loading failed for: ${src}`);
    setError(true);
    
    // Try to load as base64 instead
    if (!base64Mode) {
      setBase64Mode(true);
      const data = await fetchImageAsBase64(src);
      setBase64Data(data);
      setLoading(false);
    }
  };
  
  // Handle successful image load
  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    setBase64Mode(false);
    setBase64Data(null);
  }, [src]);

  // Render base64 image if we have it
  if (base64Mode && base64Data) {
    return (
      <img
        src={base64Data}
        alt={alt}
        className={className}
        onLoad={handleImageLoad}
        {...props}
      />
    );
  }
  
  // Render error state if all attempts failed
  if (error && base64Mode && !base64Data) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-muted rounded-md ${fallbackClassName}`}>
        <ImageOff className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">{alt || 'Image failed to load'}</p>
      </div>
    );
  }
  
  // Standard image with fallbacks
  return (
    <>
      {loading && showLoader && (
        <div className={`flex items-center justify-center ${fallbackClassName || className}`}>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <img
        src={cacheBustedSrc}
        alt={alt}
        className={`${loading ? 'hidden' : ''} ${className}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        {...props}
      />
    </>
  );
}