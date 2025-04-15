import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Image, Search, FileImage, HardDrive, RefreshCw } from 'lucide-react';
import ImageWithFallbacks from '@/components/quizzes/image-with-fallbacks';
import Layout from '@/pages/layout';
import { useQuery } from '@tanstack/react-query';

export default function ImageDebugPage() {
  const { toast } = useToast();
  const [searchPath, setSearchPath] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch list of all available images
  const { data: availableImages, error, isLoading, refetch } = useQuery({
    queryKey: ['/api/image-debug/list'],
    queryFn: async () => {
      const res = await fetch('/api/image-debug/list');
      if (!res.ok) throw new Error('Failed to fetch images');
      return res.json();
    }
  });

  const handleSearch = async () => {
    if (!searchPath.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an image path or filename to search',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/image-debug/find?path=${encodeURIComponent(searchPath)}`);
      const data = await res.json();
      setSearchResults(data);
      
      if (data.success) {
        toast({
          title: 'Image Found',
          description: `Found image using method: ${data.method}`,
        });
      } else {
        toast({
          title: 'Image Not Found',
          description: data.error || 'Could not locate the image',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error searching for image:', error);
      toast({
        title: 'Search Error',
        description: 'An error occurred while searching for the image',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-6">Image Debug Tools</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find Image Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Image
              </CardTitle>
              <CardDescription>
                Search for an image by path or filename to test how it's resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center mb-4">
                <Input
                  placeholder="Enter image path or filename"
                  value={searchPath}
                  onChange={(e) => setSearchPath(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              {searchResults && (
                <div className="mt-4">
                  {searchResults.success ? (
                    <div className="space-y-4">
                      <Alert variant="default" className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Image Found</AlertTitle>
                        <AlertDescription className="text-green-700">
                          Found using method: <span className="font-semibold">{searchResults.method}</span>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="border rounded-md p-4 bg-gray-50">
                        <h3 className="text-sm font-medium mb-2">Image Preview</h3>
                        <div className="h-48 flex items-center justify-center bg-white border rounded">
                          <img 
                            src={searchResults.url} 
                            alt="Found image" 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="mt-2 text-xs font-mono overflow-x-auto p-2 bg-gray-100 rounded">
                          <p>URL: {searchResults.url}</p>
                          {searchResults.debug && (
                            <p>Path: {searchResults.debug.checkedPath}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Image Not Found</AlertTitle>
                      <AlertDescription>
                        {searchResults.error || 'Could not locate the image file'}
                        <p className="text-xs font-mono mt-1">
                          Searched for: {searchResults.searchedPath || searchPath}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Test Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Test Image Component
              </CardTitle>
              <CardDescription>
                Test the image component with debug information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults?.success ? (
                <div className="border rounded-md p-2">
                  <ImageWithFallbacks 
                    questionId={999}
                    questionIndex={0}
                    imageUrl={searchPath}
                    isLoading={false}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Image className="h-12 w-12 mb-2 opacity-20" />
                  <p>Search for an image to test the component</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Available Images */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Available Images
            </CardTitle>
            <CardDescription>
              All images found in the uploads directory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load available images</AlertDescription>
              </Alert>
            ) : availableImages?.success ? (
              <div>
                <div className="mb-2 text-sm">
                  <span className="font-medium">{availableImages.count}</span> images found in <span className="font-mono text-xs">{availableImages.directory}</span>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableImages.files.slice(0, 50).map((file: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 text-sm font-mono truncate max-w-[200px]">{file.name}</td>
                          <td className="px-4 py-2 text-sm">
                            {typeof file.size === 'number' 
                              ? `${Math.round(file.size / 1024)} KB` 
                              : 'Unknown'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSearchPath(file.name);
                                  handleSearch();
                                }}
                              >
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(file.url, '_blank');
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {availableImages.files.length > 50 && (
                    <div className="px-4 py-2 text-sm text-gray-500 border-t">
                      Showing 50 of {availableImages.files.length} images
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No images found in the upload directory
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            Note: This page shows all available images in the uploads directory and helps diagnose image loading issues.
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}