import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DirectBase64ImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

/**
 * Component that loads and displays images directly as base64
 * This is a fallback approach for environments where URL-based image loading fails
 */
export function DirectBase64Image({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height,
}: DirectBase64ImageProps) {
  const [base64Data, setBase64Data] = useState<string | null>(null);
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
      setBase64Data(src);
      setLoading(false);
      return;
    }

    // Extract the filename from the image URL path
    const getFilenameFromPath = (path: string) => {
      // Remove any query parameters
      const pathWithoutQuery = path.split('?')[0];
      
      // Get the last part of the path
      const parts = pathWithoutQuery.split('/');
      return parts[parts.length - 1];
    };

    const fetchBase64 = async () => {
      try {
        // Extract filename or use full URL as fallback
        const filename = getFilenameFromPath(src);
        console.log(`Fetching base64 data for ${filename}`);
        
        // Attempt to fetch the base64 data directly from server
        const response = await fetch(`/api/images/base64/${filename}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch base64 data for ${filename}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setBase64Data(data.data);
          setError(false);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error) {
        console.error('Error fetching base64 data:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBase64();
  }, [src, retryCount]);

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
  if (error || !base64Data) {
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
      src={base64Data}
      alt={alt}
      className={className}
      style={{ width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto' }}
    />
  );
}