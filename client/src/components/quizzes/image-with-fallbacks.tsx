import React, { useState, useEffect } from 'react';
import { Loader2, FileImage } from 'lucide-react';

interface ImageWithFallbacksProps {
  questionId: number;
  questionIndex: number;
  imageUrl: string;
  isLoading: boolean;
}

// Component that tries multiple strategies to load an image
const ImageWithFallbacks = ({ 
  questionId, 
  questionIndex, 
  imageUrl, 
  isLoading 
}: ImageWithFallbacksProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(0);
  
  // Check if it's a blob URL that can be used directly
  const isBlobUrl = imageUrl?.startsWith('blob:');
  const isDataUrl = imageUrl?.startsWith('data:');
  const isHttpUrl = imageUrl?.startsWith('http');
  
  // Check if the blob URL appears to be saved in the database (common deployment issue)
  const isStoredBlobUrl = imageUrl?.includes('/uploads/images/blob:');
  
  // Generate strategies based on the image URL type
  const getStrategies = () => {
    // Handle stored blob URLs (deployment issue) - these can't be loaded directly
    if (isStoredBlobUrl) {
      // We need to show a fallback since stored blob URLs are not valid on the server
      // For such URLs, we want to immediately fail so we return an empty array
      console.error('Found stored blob URL which cannot be loaded on server:', imageUrl);
      return [];
    }
    
    // Blob URLs can be used directly in the browser but not on the server
    if (isBlobUrl) {
      return [
        // Strategy 1: Use blob URL directly
        () => imageUrl,
      ];
    }
    
    // Data URLs can be used directly
    if (isDataUrl) {
      return [
        // Strategy 1: Use data URL directly
        () => imageUrl,
      ];
    }
    
    // HTTP/HTTPS URLs can be used directly
    if (isHttpUrl) {
      return [
        // Strategy 1: Use external URL directly
        () => imageUrl,
        // Strategy 2: Try via proxy for CORS issues
        () => `/api/quiz-image/${encodeURIComponent(imageUrl)}?t=${Date.now()}`,
      ];
    }
    
    // For relative paths or local files, try multiple strategies
    return [
      // Strategy 1: Direct URL with cache busting
      () => {
        // If the URL already includes a path like /uploads/images/, don't prepend it again
        if (imageUrl?.includes('/uploads/images/')) {
          return `${imageUrl.includes('?') ? imageUrl : `${imageUrl}?t=${Date.now()}`}`;
        }
        return `/uploads/images/${imageUrl}?t=${Date.now()}`;
      },
      
      // Strategy 2: Via API endpoint with cache busting
      () => `/api/quiz-image/${encodeURIComponent(imageUrl)}?t=${Date.now()}`,
      
      // Strategy 3: As a last resort, try without cache busting
      () => {
        if (imageUrl?.includes('/uploads/images/')) {
          return imageUrl;
        }
        return `/uploads/images/${imageUrl}`;
      }
    ];
  };
  
  // Compute strategies dynamically based on the URL type
  const strategies = getStrategies();
  
  useEffect(() => {
    if (isLoading || !imageUrl) return;
    
    // Reset states when image URL changes
    setLoadFailed(false);
    setLoadingStrategy(0);
    
    // If there are no strategies (e.g., for stored blob URLs), mark as failed immediately
    if (strategies.length === 0) {
      console.error(`No loading strategies available for image: ${imageUrl}`);
      setLoadFailed(true);
      return;
    }
    
    // Apply the first strategy
    const url = strategies[0]();
    console.log(`Trying image loading strategy 1 for ${imageUrl}: ${url}`);
    setImageSrc(url);
  }, [imageUrl, isLoading, strategies.length]);
  
  const handleError = () => {
    // Try next strategy if current one fails
    const nextStrategy = loadingStrategy + 1;
    
    if (nextStrategy < strategies.length) {
      const url = strategies[nextStrategy]();
      console.log(`Trying image loading strategy ${nextStrategy + 1} for ${imageUrl}: ${url}`);
      setLoadingStrategy(nextStrategy);
      setImageSrc(url);
    } else {
      console.error('All image loading strategies failed for:', imageUrl);
      setLoadFailed(true);
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!imageUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }
  
  if (loadFailed) {
    const isBlobProblem = isStoredBlobUrl || imageUrl?.includes('blob:');
    
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
        <FileImage className="w-12 h-12 text-red-600 mb-2" />
        <p className="text-red-600 font-medium mb-2">Failed to load image</p>
        
        {isBlobProblem ? (
          <div className="text-gray-500 text-xs text-center">
            <p className="mb-2">
              This image is using a temporary blob URL that cannot be loaded in a deployed environment.
            </p>
            <p>
              <strong>Solution:</strong> Re-upload the image using a file upload instead of copy/paste or 
              drag-and-drop when creating quiz questions.
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-xs text-center">
            The image could not be loaded after multiple attempts.
            <br />
            Filename: {imageUrl}
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
      <img
        src={imageSrc}
        alt={`Question ${questionIndex + 1}`}
        className="max-w-full max-h-[65vh] object-contain"
        onError={handleError}
      />
    </div>
  );
};

export default ImageWithFallbacks;

// Make the component available as a named export too
export { ImageWithFallbacks };