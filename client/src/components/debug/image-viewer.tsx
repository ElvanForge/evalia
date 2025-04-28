import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { clearImageCache } from '@/lib/force-base64-images';
import { ImageWithFallbacks } from '@/components/quizzes/image-with-fallbacks';

interface ImageInfo {
  filename: string;
  path: string;
  apiPath: string;
  size: number;
  lastModified: string;
  isFile: boolean;
}

export function ImageDebugger() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [basePathTab, setBasePathTab] = useState<string>('uploads');

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/images-list');
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }
      const data = await response.json();
      setImages(data.files || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleRefresh = () => {
    // Clear the image cache to ensure we're loading fresh images
    clearImageCache();
    fetchImages();
  };

  const handleSelectImage = (image: ImageInfo) => {
    setSelectedImage(image);
  };

  const handleCloseImageView = () => {
    setSelectedImage(null);
  };

  const getBasePath = (path: string) => {
    if (path.startsWith('/uploads/')) return 'uploads';
    if (path.startsWith('/api/')) return 'api';
    return 'custom';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Image Viewer</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          View and test all uploaded images
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p className="mb-4">{error}</p>
            <Button variant="outline" onClick={fetchImages}>Retry</Button>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No images found</p>
          </div>
        ) : (
          <div>
            <Tabs defaultValue="uploads" value={basePathTab} onValueChange={setBasePathTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="uploads">Uploads Path</TabsTrigger>
                <TabsTrigger value="api">API Path</TabsTrigger>
                <TabsTrigger value="all">All Images</TabsTrigger>
              </TabsList>
              
              <TabsContent value="uploads" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images
                  .filter(img => getBasePath(img.path) === 'uploads')
                  .map((image, index) => (
                    <ImageCard 
                      key={`uploads-${index}`}
                      image={image}
                      onSelect={handleSelectImage}
                    />
                  ))}
              </TabsContent>
              
              <TabsContent value="api" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images
                  .filter(img => getBasePath(img.path) === 'api')
                  .map((image, index) => (
                    <ImageCard 
                      key={`api-${index}`}
                      image={image}
                      onSelect={handleSelectImage}
                    />
                  ))}
              </TabsContent>
              
              <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <ImageCard 
                    key={`all-${index}`}
                    image={image}
                    onSelect={handleSelectImage}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {selectedImage && (
          <ImageDetailView 
            image={selectedImage}
            onClose={handleCloseImageView}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface ImageCardProps {
  image: ImageInfo;
  onSelect: (image: ImageInfo) => void;
}

function ImageCard({ image, onSelect }: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const formattedSize = formatFileSize(image.size);
  const date = new Date(image.lastModified);
  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

  // Add a cache-busting parameter to ensure we get a fresh image
  const imageSrc = image.path.includes('?') 
    ? `${image.path}&t=${Date.now()}` 
    : `${image.path}?t=${Date.now()}`;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div 
        className="h-40 bg-muted relative cursor-pointer"
        onClick={() => onSelect(image)}
      >
        <ImageWithFallbacks
          src={imageSrc}
          alt={image.filename}
          className="w-full h-full object-contain"
        />
      </div>
      <CardContent className="p-3 flex-grow">
        <div className="text-sm font-medium mb-1 truncate" title={image.filename}>
          {image.filename}
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Size: {formattedSize}</div>
          <div className="truncate" title={formattedDate}>Modified: {formattedDate}</div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onSelect(image)}
        >
          View
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ImageDetailViewProps {
  image: ImageInfo;
  onClose: () => void;
}

function ImageDetailView({ image, onClose }: ImageDetailViewProps) {
  const [tab, setTab] = useState<'preview' | 'info'>('preview');

  // Add a cache-busting parameter to ensure we get a fresh image
  const imageSrc = image.path.includes('?') 
    ? `${image.path}&t=${Date.now()}` 
    : `${image.path}?t=${Date.now()}`;
    
  const apiSrc = image.apiPath.includes('?') 
    ? `${image.apiPath}&t=${Date.now()}` 
    : `${image.apiPath}?t=${Date.now()}`;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle>{image.filename}</CardTitle>
          <CardDescription>
            {formatFileSize(image.size)} • Modified: {new Date(image.lastModified).toLocaleString()}
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="preview" value={tab} onValueChange={(v) => setTab(v as 'preview' | 'info')}>
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="info">Image Info</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="flex-grow overflow-auto p-6 pt-0">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Standard Path</h3>
                <div className="border rounded-md overflow-hidden">
                  <ImageWithFallbacks
                    src={imageSrc}
                    alt={image.filename}
                    className="w-full h-auto max-h-[300px] object-contain p-2"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">API Path</h3>
                <div className="border rounded-md overflow-hidden">
                  <ImageWithFallbacks
                    src={apiSrc}
                    alt={image.filename}
                    className="w-full h-auto max-h-[300px] object-contain p-2"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Image URLs</h3>
              <div className="space-y-2">
                <div className="text-xs p-2 bg-muted rounded-md overflow-x-auto">
                  <p className="font-mono">Standard: {imageSrc}</p>
                </div>
                <div className="text-xs p-2 bg-muted rounded-md overflow-x-auto">
                  <p className="font-mono">API: {apiSrc}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="flex-grow overflow-auto p-6 pt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">File Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4 py-1">Filename:</td>
                      <td className="font-mono">{image.filename}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Size:</td>
                      <td>{formatFileSize(image.size)}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Last Modified:</td>
                      <td>{new Date(image.lastModified).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">Path:</td>
                      <td className="font-mono break-all">{image.path}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4 py-1">API Path:</td>
                      <td className="font-mono break-all">{image.apiPath}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}