import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,

  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  FileImage, 
  FileType, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type ImageFile = {
  filename: string;
  path: string;
  apiPath: string;
  size: number;
  lastModified: string;
  isFile: boolean;
}

export function ImageDebugger() {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoadingBase64, setIsLoadingBase64] = useState(false);
  
  // Fetch list of all images
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/images-list'],
    queryFn: async () => {
      const response = await fetch('/api/images-list');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    }
  });
  
  // Fetch base64 data for a selected image
  const loadBase64Data = async (image: ImageFile) => {
    if (!image) return;
    
    setIsLoadingBase64(true);
    setBase64Data(null);
    
    try {
      const response = await fetch(image.apiPath);
      if (!response.ok) {
        throw new Error('Failed to fetch base64 data');
      }
      const data = await response.json();
      setBase64Data(data.data);
    } catch (error) {
      console.error('Error loading base64 data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load base64 data for this image',
        variant: 'destructive'
      });
      setBase64Data(null);
    } finally {
      setIsLoadingBase64(false);
    }
  };
  
  // Handle image selection
  const handleSelectImage = (image: ImageFile) => {
    setSelectedImage(image);
    loadBase64Data(image);
  };
  
  // Filter images based on search text
  const filteredImages = React.useMemo(() => {
    if (!data?.files) return [];
    
    let filtered = data.files;
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((img: ImageFile) => 
        img.filename.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tab filter (future enhancement)
    if (activeTab === 'images') {
      filtered = filtered.filter((img: ImageFile) => {
        const ext = img.filename.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
      });
    } else if (activeTab === 'documents') {
      filtered = filtered.filter((img: ImageFile) => {
        const ext = img.filename.split('.').pop()?.toLowerCase();
        return ['pdf', 'doc', 'docx', 'txt'].includes(ext || '');
      });
    }
    
    return filtered;
  }, [data, searchText, activeTab]);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Determine file type badge color
  const getFileBadgeColor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'bg-blue-500';
    } else if (ext === 'svg') {
      return 'bg-purple-500';
    } else if (['pdf', 'doc', 'docx'].includes(ext || '')) {
      return 'bg-red-500';
    } else {
      return 'bg-gray-500';
    }
  };
  
  // Get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };
  
  // Copy image URL to clipboard
  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL Copied',
      description: 'Image URL copied to clipboard'
    });
  };
  
  // Copy base64 data to clipboard
  const copyBase64Data = () => {
    if (!base64Data) return;
    
    navigator.clipboard.writeText(base64Data);
    toast({
      title: 'Copied',
      description: 'Base64 data copied to clipboard'
    });
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* List of images */}
      <div className="col-span-1 md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Images</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>
              {data?.count || 0} files found
            </CardDescription>
            
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive p-4">
                  Error loading images
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  No images found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredImages.map((image: ImageFile) => (
                    <div
                      key={image.filename}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedImage?.filename === image.filename
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectImage(image)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded bg-background flex items-center justify-center overflow-hidden">
                          {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                            image.filename.split('.').pop()?.toLowerCase() || ''
                          ) ? (
                            <img
                              src={image.path}
                              alt={image.filename}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/icon-image-broken.svg';
                              }}
                            />
                          ) : (
                            <FileType className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-medium truncate">
                            {image.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={getFileBadgeColor(image.filename)}
                        >
                          {getFileExtension(image.filename)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Image details and preview */}
      <div className="col-span-1 md:col-span-2">
        <Card className="h-full">
          {selectedImage ? (
            <>
              <CardHeader>
                <CardTitle>{selectedImage.filename}</CardTitle>
                <CardDescription>
                  Last modified: {formatDate(selectedImage.lastModified)}
                </CardDescription>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center">
                    <FileImage className="mr-1 h-3 w-3" />
                    {formatFileSize(selectedImage.size)}
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center">
                    {selectedImage.isFile ? (
                      <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {selectedImage.isFile ? 'File exists' : 'Missing'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyImageUrl(selectedImage.path)}
                  >
                    Copy URL
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedImage.path, '_blank')}
                  >
                    Open in new tab
                  </Button>
                  
                  {base64Data ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyBase64Data}
                    >
                      Copy Base64
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="details">
                      <FileType className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="base64" disabled={!base64Data && !isLoadingBase64}>
                      <Download className="h-4 w-4 mr-2" />
                      Base64
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="min-h-[400px]">
                    <div className="flex items-center justify-center h-[400px] bg-background/50 rounded-md">
                      {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                        selectedImage.filename.split('.').pop()?.toLowerCase() || ''
                      ) ? (
                        <div className="relative max-h-[380px] max-w-full overflow-auto">
                          <img
                            src={selectedImage.path}
                            alt={selectedImage.filename}
                            className="max-h-[380px] max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/icon-image-broken.svg';
                              toast({
                                title: 'Image Error',
                                description: 'Failed to load image from path. Try the Base64 view.',
                                variant: 'destructive'
                              });
                            }}
                          />
                        </div>
                      ) : ['pdf'].includes(
                        selectedImage.filename.split('.').pop()?.toLowerCase() || ''
                      ) ? (
                        <div className="flex flex-col items-center justify-center">
                          <FileType className="h-16 w-16 text-muted-foreground mb-4" />
                          <div className="text-center">
                            <p className="text-muted-foreground">PDF document</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.open(selectedImage.path, '_blank')}
                            >
                              Open Document
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <FileType className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Preview not available for this file type
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="min-h-[400px]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">File Information</h3>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-3 gap-1 text-sm">
                          <div className="text-muted-foreground">Filename:</div>
                          <div className="col-span-2 font-mono">{selectedImage.filename}</div>
                          
                          <div className="text-muted-foreground">Size:</div>
                          <div className="col-span-2">{formatFileSize(selectedImage.size)}</div>
                          
                          <div className="text-muted-foreground">Last Modified:</div>
                          <div className="col-span-2">{formatDate(selectedImage.lastModified)}</div>
                          
                          <div className="text-muted-foreground">Type:</div>
                          <div className="col-span-2">
                            {selectedImage.filename.split('.').pop()?.toUpperCase() || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Path Information</h3>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-3 gap-1 text-sm">
                          <div className="text-muted-foreground">Full Path:</div>
                          <div className="col-span-2 font-mono break-all">{selectedImage.path}</div>
                          
                          <div className="text-muted-foreground">API Path:</div>
                          <div className="col-span-2 font-mono break-all">{selectedImage.apiPath}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="base64" className="min-h-[400px]">
                    {isLoadingBase64 ? (
                      <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : base64Data ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Base64 Data</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyBase64Data}
                          >
                            Copy Base64
                          </Button>
                        </div>
                        
                        <div className="h-[350px] overflow-auto bg-background/50 p-4 rounded-md">
                          <div className="font-mono text-xs break-all">
                            {base64Data}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                          <p className="text-muted-foreground mb-4">
                            Base64 data not available
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => loadBase64Data(selectedImage)}
                          >
                            Retry Loading
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Image Selected</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Select an image from the list to view details, preview, and analyze
                its content.
              </p>
              
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading images...</span>
                </div>
              ) : filteredImages.length === 0 ? (
                <Button onClick={() => refetch()}>Refresh Image List</Button>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}