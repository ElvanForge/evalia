import { useEffect } from 'react';
import { ImageDebugger } from '@/components/debug/image-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, ThumbsUp } from 'lucide-react';
import { clearImageCache } from '@/lib/force-base64-images';
import { useToast } from '@/hooks/use-toast';

export default function DebugImagesPage() {
  const { toast } = useToast();

  const handleClearImageCache = () => {
    clearImageCache();
    toast({
      title: 'Image Cache Cleared',
      description: 'All cached images have been cleared. Refresh the page to reload them.',
    });
  };

  // Check that base64 encoding is working on the browser
  const testBase64Encoding = () => {
    try {
      // Create a small test image
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw a simple red dot
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 10, 10);
        
        // Try to convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
          toast({
            title: 'Base64 Encoding Works',
            description: 'Your browser correctly supports base64 image encoding.',
          });
          return true;
        }
      }
      
      toast({
        title: 'Base64 Encoding Failed',
        description: 'Your browser may not fully support base64 image encoding.',
        variant: 'destructive',
      });
      return false;
    } catch (err) {
      console.error('Error testing base64 encoding:', err);
      toast({
        title: 'Base64 Test Error',
        description: 'An error occurred while testing base64 encoding.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Image Debugging Tools</h1>
      <p className="text-muted-foreground">
        Tools for diagnosing and fixing image-related issues
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Image System Tools</CardTitle>
          <CardDescription>
            Utilities to diagnose and fix image loading issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Clear Image Cache</CardTitle>
                <CardDescription>
                  Clear the browser's base64 image cache to force reloading all images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleClearImageCache} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Image Cache
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Test Browser Compatibility</CardTitle>
                <CardDescription>
                  Test if your browser properly supports base64 image encoding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testBase64Encoding} variant="outline">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Test Base64 Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <ImageDebugger />
    </div>
  );
}