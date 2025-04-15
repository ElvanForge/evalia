import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ImageCleanupTool() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('blob');

  const runCleanup = async (type: 'blob' | 'all') => {
    setIsLoading(true);
    setResults(null);
    
    try {
      // Use the debug endpoint (no auth required) for testing
      const response = await fetch('/api/debug/image-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cleanupType: type }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setResults(data);
      
      toast({
        title: 'Image Cleanup Complete',
        description: data.message,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error during image cleanup:', error);
      
      toast({
        title: 'Error During Cleanup',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Database Cleanup
        </CardTitle>
        <CardDescription>
          Fix problematic image URLs stored in the database to ensure all quiz images display correctly
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            This tool will inspect and fix image URLs in the database. It can:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Remove broken blob URLs (which don't work after page refresh)</li>
              <li>Fix path issues in image URLs</li>
              <li>Verify images exist on disk</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="blob" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blob">Remove Blob URLs</TabsTrigger>
            <TabsTrigger value="all">Fix All Image URLs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="blob" className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This option will <strong>only remove blob URLs</strong> from the database.
              Blob URLs are browser-specific temporary URLs that point to in-memory objects and stop working
              after page refresh or when accessed from a different browser.
            </p>
            
            <Button 
              onClick={() => runCleanup('blob')} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeTab === 'blob' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing Blob URLs...
                </>
              ) : (
                'Remove Blob URLs'
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="all" className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This option will check <strong>all image URLs</strong> in the database, fixing path issues
              and removing references to images that don't exist on disk.
            </p>
            
            <Button 
              onClick={() => runCleanup('all')} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeTab === 'all' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing All Image URLs...
                </>
              ) : (
                'Fix All Image URLs'
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        {results && (
          <>
            <Separator className="my-4" />
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Results</h3>
              
              {results.success ? (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      {results.message}
                    </p>
                  </div>
                  
                  {results.removedCount !== undefined && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800">
                        {results.removedCount}
                      </Badge>
                      {' '}blob URLs removed from the database
                    </p>
                  )}
                  
                  {results.result && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800">
                          {results.result.fixed}
                        </Badge>
                        {' '}image URLs fixed
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800">
                          {results.result.removed}
                        </Badge>
                        {' '}broken image URLs removed
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      Error: {results.error || 'Failed to process image cleanup'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          This tool is for administrators and developers only.
        </p>
      </CardFooter>
    </Card>
  );
}