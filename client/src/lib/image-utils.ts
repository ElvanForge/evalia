/**
 * Utility functions for handling image URLs and paths
 */

/**
 * Ensures an image URL is properly formatted with the correct origin
 * 
 * @param imageUrl The original image URL
 * @returns A properly formatted image URL
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  
  // If already starts with data: (data URL) or http(s): (absolute URL), return as is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If it's a relative path, ensure it has the correct origin
  if (!imageUrl.startsWith(`${window.location.origin}`)) {
    return imageUrl.startsWith('/')
      ? `${window.location.origin}${imageUrl}`
      : `${window.location.origin}/${imageUrl}`;
  }
  
  return imageUrl;
}

/**
 * Component props for images with error handling
 */
export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

/**
 * Creates an image element with proper URL handling and error fallback
 * 
 * @param props Image properties including src, alt, and optional fallbackSrc
 * @returns Image HTML attributes with processed src and onError handler
 */
export function getImageProps(props: ImageWithFallbackProps): React.ImgHTMLAttributes<HTMLImageElement> {
  const { src, alt, fallbackSrc, ...rest } = props;
  
  return {
    src: getFullImageUrl(src),
    alt,
    onError: (e) => {
      console.error("Image failed to load:", src);
      const target = e.target as HTMLImageElement;
      
      // Try correcting the URL first
      if (src && !src.startsWith('data:') && !src.startsWith('http')) {
        const correctedUrl = getFullImageUrl(src);
        if (correctedUrl !== target.src) {
          console.log("Trying corrected URL:", correctedUrl);
          target.src = correctedUrl;
          return;
        }
      }
      
      // If we have a fallback and it's different from the current src, use it
      if (fallbackSrc && fallbackSrc !== target.src) {
        console.log("Using fallback image:", fallbackSrc);
        target.src = fallbackSrc;
      }
    },
    ...rest
  };
}