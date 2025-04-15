import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageWithFallbacksProps {
  questionId: number;
  questionIndex: number;
  imageUrl: string | null | undefined;
  isLoading?: boolean;
}

export function ImageWithFallbacks({
  questionId,
  questionIndex,
  imageUrl,
  isLoading = false
}: ImageWithFallbacksProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setError('No image URL provided');
      setIsImageLoading(false);
      return;
    }

    // Reset states when image URL changes
    setIsImageLoading(true);
    setError(null);
    
    // Start with the original URL
    const initialUrl = addCacheBusting(imageUrl);
    setCurrentSrc(initialUrl);
    
    // Try to get the most reliable URL using our debug API
    const fetchBestUrl = async () => {
      try {
        // Extract the filename for the API request
        const filename = imageUrl.split(/[\/\\]/).pop()?.split('?')[0];
        
        if (filename) {
          const response = await fetch(`/api/image-debug/find?path=${encodeURIComponent(filename)}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.url) {
              console.log(`Debug API found better URL for question ${questionId}: ${data.url}`);
              setCurrentSrc(data.url);
            }
          }
        }
      } catch (err) {
        console.error(`Error finding best image URL for question ${questionId}:`, err);
        // Keep using the initial URL, don't change state
      }
    };
    
    fetchBestUrl();
  }, [imageUrl, questionId]);

  // Helper to add cache busting
  const addCacheBusting = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  };

  // Handle image load error with multiple fallback strategies
  const handleImageError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    console.error(`Failed to load image for question ${questionId}: ${currentSrc}`);
    
    // If we have an image URL, try various fallbacks
    if (imageUrl) {
      // FALLBACK 1: Try without cache busting parameters
      if (imageUrl.includes('?')) {
        const baseUrl = imageUrl.split('?')[0];
        console.log(`Trying fallback URL without cache params: ${baseUrl}`);
        setCurrentSrc(baseUrl);
        return; // Give this a chance to load
      }
      
      // FALLBACK 2: Try extracting just the filename and use direct path
      const filename = imageUrl.split('/').pop();
      if (filename) {
        // Try the direct path
        const directPath = `/uploads/images/${filename}`;
        console.log(`Trying direct filename path: ${directPath}`);
        setCurrentSrc(directPath);
        return; // Give this a chance to load
      }
      
      // FALLBACK 3: Try the API endpoint as a last resort
      try {
        const response = await fetch(`/api/image-debug/find?path=${encodeURIComponent(imageUrl)}`);
        const data = await response.json();
        
        if (data.success && data.url) {
          console.log(`Found image via debug API: ${data.url}`);
          setCurrentSrc(data.url);
        } else {
          console.error('All fallbacks failed, image cannot be displayed');
          setError('Image could not be loaded');
          setIsImageLoading(false);
        }
      } catch (err) {
        console.error('Error in fallback API call:', err);
        setError('Image could not be loaded');
        setIsImageLoading(false);
      }
    }
  };

  return (
    <div className="relative">
      {isImageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/10 rounded-md z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error ? (
        <div className="flex items-center justify-center h-[60vh] w-full bg-muted/20 rounded-md">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <img
          key={`question-image-${questionId}-${questionIndex}-${currentSrc}`}
          src={currentSrc}
          alt={`Question ${questionIndex + 1}`}
          className="rounded-md object-contain max-h-[62vh] w-auto max-w-[98%] z-10"
          onLoad={() => setIsImageLoading(false)}
          onError={handleImageError}
        />
      )}
    </div>
  );
}