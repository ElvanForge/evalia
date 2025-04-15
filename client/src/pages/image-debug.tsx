import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, FileImage, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ImageDebugPage() {
  const [searchPath, setSearchPath] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const { data: imageList, isLoading: isLoadingImages } = useQuery({
    queryKey: ["/api/image-debug/list"],
    queryFn: async () => {
      const response = await fetch("/api/image-debug/list");
      if (!response.ok) {
        throw new Error("Error fetching image list");
      }
      return response.json();
    }
  });
  
  const findImage = async () => {
    if (!searchPath) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/image-debug/find?path=${encodeURIComponent(searchPath)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching for image:", error);
      setSearchResults({ success: false, error: String(error) });
    } finally {
      setIsSearching(false);
    }
  };
  
  const testImageInQuiz = async (imagePath: string) => {
    setSearchPath(imagePath);
    await findImage();
  };
  
  return (
    <Layout title="Image Debug Tools">
      <div className="container mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-6 bg-[#0ba2b0] text-white p-4 rounded-lg">
          Image Debugging Tools
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Image</CardTitle>
              <CardDescription>
                Test how an image URL/path is resolved by the image-finding API (used by quizzes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input 
                  value={searchPath}
                  onChange={(e) => setSearchPath(e.target.value)}
                  placeholder="Enter image path or URL"
                  className="flex-1"
                />
                <Button 
                  onClick={findImage}
                  disabled={isSearching || !searchPath}
                >
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Find"}
                </Button>
              </div>
              
              {searchResults && (
                <div className="mt-4 border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="mr-2">
                      {searchResults.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">
                      {searchResults.success ? "Image Found" : "Image Not Found"}
                    </h3>
                  </div>
                  
                  {searchResults.success && (
                    <div>
                      <p className="mb-2">
                        <strong>Method:</strong> {searchResults.method}
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="border rounded p-2">
                          <p className="text-sm font-medium mb-1">URL:</p>
                          <code className="text-xs bg-gray-100 p-1 rounded block overflow-x-auto">
                            {searchResults.url}
                          </code>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-100 p-2 text-sm font-medium">
                            Preview:
                          </div>
                          <div className="p-4 flex justify-center">
                            <img 
                              src={searchResults.url} 
                              alt="Found image" 
                              className="max-h-48 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = `/uploads/images/${searchPath.split('/').pop()}?v=${Date.now()}`;
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!searchResults.success && (
                    <div>
                      <p className="text-red-500 mb-2">{searchResults.error}</p>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm">
                          <strong>Searched Path:</strong> {searchResults.searchedPath}
                        </p>
                        <p className="text-sm">
                          <strong>Filename:</strong> {searchResults.fileName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Images</CardTitle>
              <CardDescription>
                List of all images in the uploads directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingImages ? (
                <div className="flex justify-center items-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-80">
                  {imageList?.success ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Found {imageList.count} files in {imageList.directory}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {imageList.files.map((file: any) => (
                          <div 
                            key={file.name} 
                            className="border rounded-lg p-2 flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                              {file.isDirectory ? (
                                <FileImage className="h-6 w-6 text-gray-400" />
                              ) : (
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "N/A"} • {new Date(file.modified).toLocaleString() || "Unknown date"}
                              </p>
                              
                              <div className="flex gap-2 mt-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => testImageInQuiz(file.url)}
                                >
                                  Test in quiz
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  asChild
                                >
                                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    Open
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60">
                      <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                      <p className="text-center text-muted-foreground">
                        Error loading image list: {imageList?.error}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}