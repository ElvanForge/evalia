import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ImageWithFallbacks from "@/components/quizzes/image-with-fallbacks";
import ImageRepairTool from "@/components/debug/image-repair-tool";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { optimizeImageUrl, makeSafeImageUrl, isSafeImageUrl } from "@/lib/image-utils";

export default function DebugPage() {
  const { toast } = useToast();
  const [questionImages, setQuestionImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [counts, setCounts] = useState<{
    total: number;
    blob: number;
    data: number;
    path: number;
    problematic: number;
  }>({ 
    total: 0, 
    blob: 0, 
    data: 0, 
    path: 0, 
    problematic: 0 
  });
  const [scanPercentage, setScanPercentage] = useState(0);
  const [scanActive, setScanActive] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState("");
  const [testImageResult, setTestImageResult] = useState<string | null>(null);
  const [testImageLoading, setTestImageLoading] = useState(false);

  const fetchImageStats = async () => {
    setLoadingCounts(true);
    try {
      const response = await fetch('/api/debug/image-stats');
      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch image statistics",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching image stats:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching image statistics",
        variant: "destructive"
      });
    } finally {
      setLoadingCounts(false);
    }
  };

  const fetchQuestionImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/question-images');
      if (response.ok) {
        const data = await response.json();
        setQuestionImages(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch question images",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching question images:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching question images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const scanForBrokenImages = async () => {
    setScanActive(true);
    setScanPercentage(0);
    try {
      const response = await fetch('/api/debug/scan-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clean: false })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Track progress 
      const eventSource = new EventSource('/api/debug/scan-progress');
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setScanPercentage(data.percentage);
        
        if (data.complete) {
          eventSource.close();
          setScanActive(false);
          fetchImageStats();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setScanActive(false);
        toast({
          title: "Scan Interrupted",
          description: "The image scan was interrupted",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error("Error scanning images:", error);
      toast({
        title: "Error",
        description: "An error occurred while scanning images",
        variant: "destructive"
      });
      setScanActive(false);
    }
  };

  const cleanupBrokenImages = async () => {
    if (!confirm("This will attempt to fix all problematic image references. Continue?")) {
      return;
    }

    setScanActive(true);
    setScanPercentage(0);
    try {
      const response = await fetch('/api/debug/scan-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clean: true })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Track progress 
      const eventSource = new EventSource('/api/debug/scan-progress');
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setScanPercentage(data.percentage);
        
        if (data.complete) {
          eventSource.close();
          setScanActive(false);
          toast({
            title: "Cleanup Complete",
            description: `Fixed ${data.fixed || 0} problematic images`,
          });
          fetchImageStats();
          fetchQuestionImages();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setScanActive(false);
        toast({
          title: "Cleanup Interrupted",
          description: "The image cleanup was interrupted",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error("Error cleaning up images:", error);
      toast({
        title: "Error",
        description: "An error occurred while cleaning up images",
        variant: "destructive"
      });
      setScanActive(false);
    }
  };

  const testImage = async () => {
    if (!testImageUrl) {
      toast({
        title: "Error",
        description: "Please enter an image URL to test",
        variant: "destructive"
      });
      return;
    }

    setTestImageLoading(true);
    setTestImageResult(null);
    
    try {
      // First check if it's a safe URL
      const isSafe = isSafeImageUrl(testImageUrl);
      
      // If it's a blob URL, try to convert it
      if (testImageUrl.startsWith('blob:')) {
        try {
          const dataUrl = await makeSafeImageUrl(testImageUrl);
          setTestImageResult(dataUrl);
        } catch (err) {
          console.error("Failed to convert blob URL:", err);
          setTestImageResult(null);
        }
      } else {
        // Otherwise use it directly
        setTestImageResult(testImageUrl);
      }
      
    } catch (error) {
      console.error("Error testing image:", error);
      toast({
        title: "Error",
        description: "An error occurred while testing the image",
        variant: "destructive"
      });
      setTestImageResult(null);
    } finally {
      setTestImageLoading(false);
    }
  };

  useEffect(() => {
    fetchImageStats();
    fetchQuestionImages();
  }, []);

  return (
    <Layout title="Debug Tools">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Debug Tools</h1>
        <p className="text-muted-foreground mb-8">
          These tools are for administrators to diagnose and fix issues with the application.
        </p>

        <Tabs defaultValue="images">
          <TabsList className="mb-4">
            <TabsTrigger value="images">Image Management</TabsTrigger>
            <TabsTrigger value="test">Test Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            {/* New Advanced Image Repair Tool - this will handle all our needs */}
            <div className="mb-6">
              <ImageRepairTool />
            </div>
            
            {/* Legacy image tools kept for compatibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Image Statistics</CardTitle>
                  <CardDescription>
                    Overview of images in the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCounts ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Total Images:</span>
                        <span className="font-semibold">{counts.total}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span>Data URLs:</span>
                        <span className="font-semibold">{counts.data}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>File Paths:</span>
                        <span className="font-semibold">{counts.path}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Blob URLs:</span>
                        <span className="font-semibold text-amber-500">{counts.blob}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Problematic URLs:</span>
                        <span className="font-semibold text-red-500">{counts.problematic}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          onClick={fetchImageStats}
                          disabled={loadingCounts}
                        >
                          {loadingCounts && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Refresh
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Management</CardTitle>
                  <CardDescription>
                    Scan and fix problematic images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scanActive && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span>{scanPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${scanPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={scanForBrokenImages}
                        disabled={scanActive}
                      >
                        {scanActive && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Scan for Problematic Images
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={cleanupBrokenImages}
                        disabled={scanActive || counts.problematic === 0}
                      >
                        {scanActive && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Clean Up Problematic Images
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground mt-4">
                      <p><strong>Note:</strong> Cleaning up will attempt to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Convert blob URLs to data URLs when possible</li>
                        <li>Fix path issues in file references</li>
                        <li>Clear completely broken references</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Question Images</CardTitle>
                <CardDescription>
                  Images used in quiz questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : questionImages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No question images found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {questionImages.map((item, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        <div className="h-40 bg-muted">
                          <ImageWithFallbacks
                            src={item.imageUrl}
                            alt={`Question ${item.id}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="text-sm font-medium truncate">Question #{item.id}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.question}</div>
                          
                          {/* URL type indicator */}
                          <div className="flex mt-2">
                            {item.imageUrl?.startsWith('data:') && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                Data URL
                              </span>
                            )}
                            {item.imageUrl?.startsWith('/') && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                File Path
                              </span>
                            )}
                            {item.imageUrl?.startsWith('blob:') && (
                              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                Blob URL
                              </span>
                            )}
                            {!item.imageUrl?.startsWith('data:') && 
                              !item.imageUrl?.startsWith('/') && 
                              !item.imageUrl?.startsWith('blob:') && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                Problematic
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="outline" 
                    onClick={fetchQuestionImages}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Refresh Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Image URL Tester</CardTitle>
                <CardDescription>
                  Test if an image URL can be properly displayed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-url">Image URL</Label>
                    <Input
                      id="image-url"
                      placeholder="Enter an image URL to test"
                      value={testImageUrl}
                      onChange={(e) => setTestImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={testImage}
                      disabled={testImageLoading || !testImageUrl}
                    >
                      {testImageLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Test Image
                    </Button>
                  </div>

                  {testImageResult && (
                    <div className="mt-4 space-y-4">
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label>Image Preview</Label>
                        <div className="h-60 border rounded-md overflow-hidden">
                          <ImageWithFallbacks
                            src={testImageResult}
                            alt="Test image"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Image URL Type</Label>
                        <div className="flex space-x-2">
                          {testImageResult.startsWith('data:') && (
                            <div className="flex items-center space-x-1 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Data URL (Safe)</span>
                            </div>
                          )}
                          
                          {testImageResult.startsWith('/') && (
                            <div className="flex items-center space-x-1 text-sm text-blue-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>File Path (Safe)</span>
                            </div>
                          )}
                          
                          {testImageResult.startsWith('blob:') && (
                            <div className="flex items-center space-x-1 text-sm text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Blob URL (Unsafe)</span>
                            </div>
                          )}
                          
                          {!testImageResult.startsWith('data:') &&
                            !testImageResult.startsWith('/') &&
                            !testImageResult.startsWith('blob:') && (
                            <div className="flex items-center space-x-1 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Unknown Format (Potentially Unsafe)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>URL Preview (First 100 characters)</Label>
                        <div className="p-3 bg-muted rounded-md text-xs font-mono break-all">
                          {testImageResult.substring(0, 100)}{testImageResult.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}