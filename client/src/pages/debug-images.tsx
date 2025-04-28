import React, { useEffect } from 'react';
import { ImageDebugger } from '@/components/debug/image-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, ThumbsUp, Database, Wrench, AlertTriangle } from 'lucide-react';
import { clearImageCache } from '@/lib/force-base64-images';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout';

export default function DebugImagesPage() {
  const { toast } = useToast();

  const handleClearImageCache = () => {
    clearImageCache();
    toast({
      title: 'Image Cache Cleared',
      description: 'All cached images have been cleared. Refresh the page to reload them.',
    });
  };

  // Query for getting image stats
  const { 
    data: imageStats, 
    isLoading: isLoadingStats, 
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/debug/image-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/debug/image-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch image statistics');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching image statistics:', error);
        throw error;
      }
    },
    retry: 1
  });

  // Fix image URLs mutation
  const fixImageUrlsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/debug/fix-image-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Failed to fix image URLs');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Image URLs Fixed',
        description: `Successfully fixed ${data.fixedCount} image URLs.`,
      });
      refetchStats();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to fix image URLs. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Clean images from database mutation
  const cleanImagesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/debug/scan-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clean: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean images');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Image Cleanup Started',
        description: 'Image cleanup process has started. This may take a moment.',
      });
      
      // Poll progress
      const checkProgress = setInterval(async () => {
        try {
          const response = await fetch('/api/debug/scan-progress');
          if (response.ok) {
            const progress = await response.json();
            
            if (progress.complete) {
              clearInterval(checkProgress);
              toast({
                title: 'Image Cleanup Complete',
                description: `Fixed ${progress.fixed} problematic image entries.`,
              });
              refetchStats();
            }
          }
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }, 1000);
      
      // Clear interval after 30 seconds to prevent indefinite polling
      setTimeout(() => {
        clearInterval(checkProgress);
      }, 30000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to clean images. Please try again.',
        variant: 'destructive',
      });
    }
  });

  return (
    <Layout title="Image Diagnostics">
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Image Diagnostics</h1>
              <p className="text-muted-foreground">
                View and troubleshoot images used throughout the application
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClearImageCache}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => fixImageUrlsMutation.mutate()}
                disabled={fixImageUrlsMutation.isPending}
              >
                {fixImageUrlsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Fix URLs
              </Button>
              
              <Button
                variant="outline"
                onClick={() => cleanImagesMutation.mutate()}
                disabled={cleanImagesMutation.isPending}
              >
                {cleanImagesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Clean DB
              </Button>
            </div>
          </div>
          
          {statsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load image statistics. You may need to authenticate or refresh the page.
              </AlertDescription>
            </Alert>
          )}
          
          {imageStats && imageStats.problematic > 0 && (
            <Alert className="bg-amber-50 border-amber-500">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700">Problematic Images Detected</AlertTitle>
              <AlertDescription className="text-amber-700">
                {imageStats.problematic} images have problematic URLs (blob URLs or invalid paths).
                Use the "Fix URLs" button to attempt automatic repair.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Total Images</CardTitle>
                <CardDescription>Total quiz questions with images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    imageStats?.total || 0
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">URL Types</CardTitle>
                <CardDescription>Breakdown of image URL types</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="font-medium">Data URLs</div>
                      <div className="text-2xl font-bold text-blue-500">{imageStats?.data || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium">File Paths</div>
                      <div className="text-2xl font-bold text-green-500">{imageStats?.path || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium">Blob URLs</div>
                      <div className="text-2xl font-bold text-red-500">{imageStats?.blob || 0}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Problematic</CardTitle>
                <CardDescription>Images needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    imageStats?.problematic || 0
                  )}
                </div>
                {imageStats?.problematic === 0 && (
                  <div className="flex items-center mt-2 text-green-500">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">All images are healthy</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="viewer">
            <TabsList>
              <TabsTrigger value="viewer">Image Viewer</TabsTrigger>
              <TabsTrigger value="problems">Problem Diagnosis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="viewer" className="p-0 border-0">
              <Card>
                <CardContent className="pt-6">
                  <ImageDebugger />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="problems" className="p-0 border-0">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Diagnosis</CardTitle>
                  <CardDescription>
                    Review and fix problematic image URLs stored in the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : statsError ? (
                    <div className="text-center text-destructive p-8">
                      Failed to load image statistics
                    </div>
                  ) : (imageStats?.problematicUrls?.length || 0) > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        The following image URLs are problematic and may not display properly.
                        Use the "Fix URLs" button to attempt automatic repair.
                      </div>
                      
                      <div className="border rounded-md">
                        <div className="bg-accent p-2 rounded-t-md text-sm font-medium">
                          Problematic Image URLs
                        </div>
                        <div className="p-2 max-h-[300px] overflow-auto">
                          {imageStats.problematicUrls.map((url: string, index: number) => (
                            <div key={index} className="text-sm font-mono p-1 border-b last:border-0">
                              {url}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={() => fixImageUrlsMutation.mutate()}
                          disabled={fixImageUrlsMutation.isPending}
                        >
                          {fixImageUrlsMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            <>
                              <Wrench className="h-4 w-4 mr-2" />
                              Fix All URLs
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <ThumbsUp className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">All Images Are Healthy</h3>
                      <p className="text-muted-foreground max-w-md">
                        No problematic image URLs were detected in the database.
                        All quiz questions use valid image paths or data URLs.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}