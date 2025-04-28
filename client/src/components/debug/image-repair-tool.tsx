import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ImageOff, ImageIcon, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface ImageStats {
  total: number;
  blob: number;
  data: number;
  path: number;
  problematic: number;
  problematicUrls?: string[];
}

interface ScanProgress {
  percentage: number;
  complete: boolean;
  fixed: number;
}

interface FixResult {
  id: number;
  oldUrl: string;
  newUrl?: string;
  method?: string;
  success: boolean;
  attempted?: boolean;
  reason?: string;
  error?: string;
}

interface FixResponse {
  totalProcessed: number;
  fixedCount: number;
  results: FixResult[];
}

export default function ImageRepairTool() {
  const [isScanning, setIsScanning] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    percentage: 0,
    complete: false,
    fixed: 0
  });
  const [fixResults, setFixResults] = useState<FixResponse | null>(null);

  const { data: imageStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<ImageStats>({
    queryKey: ['/api/debug/image-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/debug/image-stats');
      return response.json();
    }
  });

  const startImageScan = async (clean: boolean) => {
    try {
      setIsScanning(true);
      setScanProgress({
        percentage: 0,
        complete: false,
        fixed: 0
      });

      // Start the scan process
      await apiRequest('POST', '/api/debug/scan-images', { clean });

      // Set up event source to track progress
      const eventSource = new EventSource('/api/debug/scan-progress');
      
      eventSource.onmessage = (event) => {
        const progress = JSON.parse(event.data) as ScanProgress;
        setScanProgress(progress);
        
        if (progress.complete) {
          eventSource.close();
          setIsScanning(false);
          toast({
            title: 'Scan Complete',
            description: `Fixed ${progress.fixed} problematic image references`,
          });
          refetchStats();
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setIsScanning(false);
        toast({
          title: 'Error',
          description: 'Failed to track scan progress',
          variant: 'destructive'
        });
      };
    } catch (error) {
      setIsScanning(false);
      toast({
        title: 'Error',
        description: 'Failed to start image scan',
        variant: 'destructive'
      });
    }
  };

  const fireImageFixer = async () => {
    try {
      setIsFiring(true);
      setFixResults(null);
      
      const response = await apiRequest('POST', '/api/debug/fix-image-urls');
      const result = await response.json() as FixResponse;
      
      setFixResults(result);
      toast({
        title: 'Fix Complete',
        description: `Fixed ${result.fixedCount} out of ${result.totalProcessed} images`,
      });
      
      // Refresh stats
      refetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fix image URLs',
        variant: 'destructive'
      });
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="mr-2 h-5 w-5" />
            Image Reference Repair Tool
          </CardTitle>
          <CardDescription>
            Fix problematic image URLs stored in the database that might not be accessible in deployed environments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <StatCard 
                  title="Total Images" 
                  value={imageStats?.total || 0} 
                  icon={<ImageIcon className="h-4 w-4" />}
                />
                <StatCard 
                  title="Data URLs" 
                  value={imageStats?.data || 0} 
                  icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                />
                <StatCard 
                  title="File Paths" 
                  value={imageStats?.path || 0} 
                  icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                />
                <StatCard 
                  title="Blob URLs" 
                  value={imageStats?.blob || 0} 
                  icon={<XCircle className="h-4 w-4 text-amber-500" />}
                />
                <StatCard 
                  title="Problematic" 
                  value={imageStats?.problematic || 0} 
                  icon={<XCircle className="h-4 w-4 text-destructive" />}
                />
              </div>
              
              {imageStats?.problematic ? (
                <Alert className="bg-amber-50">
                  <AlertTitle className="text-amber-800">Problematic Images Detected</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    {imageStats.problematic} images have problematic URLs that may not work in deployed environments.
                    Use the repair tools below to fix them.
                  </AlertDescription>
                </Alert>
              ) : imageStats?.total ? (
                <Alert className="bg-green-50">
                  <AlertTitle className="text-green-800">All Images Look Good!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    All image references appear to be using proper URLs that should work in deployed environments.
                  </AlertDescription>
                </Alert>
              ) : null}
              
              {imageStats?.problematicUrls && imageStats.problematicUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Problematic Image URLs:</h4>
                  <div className="bg-muted p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                    {imageStats.problematicUrls.map((url, i) => (
                      <div key={i} className="mb-1">{url}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {isScanning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Scanning and fixing images...</span>
                <span>{scanProgress.percentage}%</span>
              </div>
              <Progress value={scanProgress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Fixed {scanProgress.fixed} problematic references so far
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-4 gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => refetchStats()}
            disabled={isLoadingStats || isScanning}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => startImageScan(false)}
            disabled={isScanning || isLoadingStats}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Scan Only
          </Button>
          
          <Button
            variant="default"
            onClick={() => startImageScan(true)}
            disabled={isScanning || isLoadingStats || (imageStats?.problematic === 0)}
          >
            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            {isScanning ? "Processing..." : "Scan & Fix Images"}
          </Button>
          
          <Button
            variant="destructive"
            onClick={fireImageFixer}
            disabled={isFiring || isLoadingStats || isScanning || (imageStats?.problematic === 0)}
          >
            {isFiring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageOff className="mr-2 h-4 w-4" />}
            {isFiring ? "Processing..." : "Fix Blob URLs"}
          </Button>
        </CardFooter>
      </Card>
      
      {fixResults && (
        <Card>
          <CardHeader>
            <CardTitle>Fix Results</CardTitle>
            <CardDescription>
              Fixed {fixResults.fixedCount} out of {fixResults.totalProcessed} images
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {fixResults.results.map((result, i) => (
                <div key={i} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Question ID: {result.id}</div>
                    {result.success ? (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">Fixed</div>
                    ) : (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">Failed</div>
                    )}
                  </div>
                  <div className="text-xs font-mono bg-muted p-2 rounded mb-2 truncate">
                    Old: {result.oldUrl}
                  </div>
                  {result.newUrl && (
                    <div className="text-xs font-mono bg-muted/50 p-2 rounded mb-2 truncate">
                      New: {result.newUrl}
                    </div>
                  )}
                  {result.method && (
                    <div className="text-xs text-muted-foreground">
                      Method: {result.method}
                    </div>
                  )}
                  {result.reason && (
                    <div className="text-xs text-amber-600 mt-1">
                      {result.reason}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-xs text-destructive mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex flex-col">
      <div className="text-xs text-muted-foreground mb-1 flex items-center">
        {icon}
        <span className="ml-1">{title}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}