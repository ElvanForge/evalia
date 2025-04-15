import React, { useState, useEffect } from 'react';

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
  
  // Strategies for image loading
  const strategies = [
    // Strategy 1: Direct URL with cache busting
    () => `/uploads/images/${imageUrl}?t=${Date.now()}`,
    
    // Strategy 2: Via API endpoint with cache busting
    () => `/api/quiz-image/${encodeURIComponent(imageUrl)}?t=${Date.now()}`,
    
    // Strategy 3: Absolute URL if the image is already a full URL
    () => imageUrl.startsWith('http') ? imageUrl : '',
    
    // Strategy 4: As a last resort, try without cache busting
    () => `/uploads/images/${imageUrl}`
  ];
  
  useEffect(() => {
    if (isLoading || !imageUrl) return;
    
    // Reset states when image URL changes
    setLoadFailed(false);
    setLoadingStrategy(0);
    
    const url = strategies[0]();
    setImageSrc(url);
  }, [imageUrl, isLoading]);
  
  const handleError = () => {
    // Try next strategy if current one fails
    const nextStrategy = loadingStrategy + 1;
    
    if (nextStrategy < strategies.length) {
      setLoadingStrategy(nextStrategy);
      setImageSrc(strategies[nextStrategy]());
    } else {
      console.error('All image loading strategies failed for:', imageUrl);
      setLoadFailed(true);
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
        <p className="text-red-600 font-medium mb-2">Failed to load image</p>
        <p className="text-gray-500 text-xs text-center">
          The image could not be loaded after multiple attempts.
          <br />
          Filename: {imageUrl}
        </p>
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