import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Search } from 'lucide-react';

interface ImageWithFallbacksProps {
  questionId: number;
  questionIndex: number;
  imageUrl: string;
  isLoading?: boolean;
}

export default function ImageWithFallbacks({ 
  questionId, 
  questionIndex, 
  imageUrl, 
  isLoading = false 
}: ImageWithFallbacksProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [finalUrl, setFinalUrl] = useState<string>(imageUrl);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [attempts, setAttempts] = useState<string[]>([]);

  useEffect(() => {
    setStatus('loading');
    setAttempts([]);
    
    if (!imageUrl) {
      setStatus('error');
      return;
    }

    // Try to load the image with the debug API first
    console.log(`Started preloading for next question: ${questionId}`);
    setAttempts(prev => [...prev, `Original URL: ${imageUrl}`]);
    
    // Use our debug API to find the image
    fetch(`/api/image-debug/find?path=${encodeURIComponent(imageUrl.split('?')[0])}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.url) {
          console.log(`Debug API found better URL for question ${questionId}: ${data.url}`);
          setFinalUrl(data.url);
          setDebugInfo(data);
          setAttempts(prev => [...prev, `Debug API found: ${data.url} (${data.method})`]);
          setStatus('success');
        } else {
          console.error('Image not found via debug API');
          setAttempts(prev => [...prev, `Debug API failed: ${data.error || 'Unknown error'}`]);
          
          // Fallback to the original URL with a cache buster
          const cacheBustedUrl = `${imageUrl.split('?')[0]}?v=${Date.now()}`;
          setFinalUrl(cacheBustedUrl);
          setAttempts(prev => [...prev, `Fallback to cache-busted URL: ${cacheBustedUrl}`]);
          
          // Status will be updated by the onLoad/onError handlers
        }
      })
      .catch(err => {
        console.error('Error checking image debug API:', err);
        setAttempts(prev => [...prev, `Debug API error: ${err.message}`]);
        
        // Try the direct URL as a fallback
        const cacheBustedUrl = `${imageUrl.split('?')[0]}?v=${Date.now()}`;
        setFinalUrl(cacheBustedUrl);
        setAttempts(prev => [...prev, `Fallback to cache-busted URL after API error: ${cacheBustedUrl}`]);
      });
      
    // Signal that we successfully tried to preload
    console.log(`Successfully preloaded next question image via standard method: ${questionId}`);
  }, [imageUrl, questionId]);

  const handleImageLoad = () => {
    setStatus('success');
    setAttempts(prev => [...prev, `Successfully loaded image: ${finalUrl}`]);
  };

  const handleImageError = () => {
    setStatus('error');
    setAttempts(prev => [...prev, `Failed to load image: ${finalUrl}`]);
    
    // Try one more fallback - just the filename
    const filename = imageUrl.split('/').pop()?.split('?')[0];
    if (filename) {
      const lastChanceUrl = `/uploads/images/${filename}?v=${Date.now()}`;
      setFinalUrl(lastChanceUrl);
      setAttempts(prev => [...prev, `Last chance fallback: ${lastChanceUrl}`]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Loading state */}
      {(status === 'loading' || isLoading) && (
        <Skeleton className="h-[60vh] w-[95%] rounded-lg" />
      )}
      
      {/* Image with fallback handlers */}
      <img
        key={`question-image-${questionId}-${questionIndex}-${finalUrl}`}
        src={finalUrl}
        alt={`Question ${questionIndex + 1}`}
        className={`rounded-md object-contain max-h-[62vh] w-auto max-w-[98%] z-10 ${
          status === 'loading' || isLoading ? 'hidden' : 'block'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Error state */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg p-4 mt-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-700">Image Failed to Load</h3>
          <p className="text-red-600 text-sm text-center">
            Could not load image for question {questionIndex + 1}
          </p>
          <div className="mt-2 w-full">
            <p className="text-xs text-red-600 font-mono">Original URL: {imageUrl}</p>
            <p className="text-xs text-red-600 font-mono">Final URL: {finalUrl}</p>
          </div>
        </div>
      )}
      
      {/* Debug info - only shown on debug pages */}
      {window.location.pathname.includes('debug') && (
        <div className="mt-4 w-full max-w-2xl border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center mb-2">
            <Search className="h-4 w-4 mr-2 text-gray-500" />
            <h3 className="text-sm font-semibold">Image Debug Information</h3>
            {status === 'success' && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-4 w-4 ml-2 text-red-500" />}
          </div>
          <div className="space-y-1 text-xs font-mono max-h-[200px] overflow-y-auto">
            {attempts.map((attempt, i) => (
              <div key={i} className="p-1 border-b border-gray-100">
                {attempt}
              </div>
            ))}
            {debugInfo && (
              <>
                <div className="p-1 border-b border-gray-100 text-emerald-700">
                  Debug API method: {debugInfo.method}
                </div>
                {debugInfo.debug && (
                  <div className="p-1 border-b border-gray-100 text-emerald-700">
                    Path checked: {debugInfo.debug.checkedPath} (exists: {String(debugInfo.debug.exists)})
                  </div>
                )}
                {debugInfo.allMatches && (
                  <div className="p-1 border-b border-gray-100 text-emerald-700">
                    All matches: {debugInfo.allMatches.join(', ')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}