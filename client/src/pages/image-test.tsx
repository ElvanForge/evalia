import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImageProps, getFullImageUrl } from "@/lib/image-utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageTest() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [testImages] = useState([
    '/uploads/images/test-image.svg',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBiYTJiMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMHB4Ij5UZXN0PC90ZXh0Pjwvc3ZnPg==',
    'https://via.placeholder.com/300x200?text=External+Image'
  ]);

  const processUrl = () => {
    setProcessedUrl(getFullImageUrl(imageUrl));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    console.log("Test upload: Uploading image file:", file.name, file.type, file.size);

    try {
      const uploadResponse = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      console.log("Test upload: Image upload response status:", uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Test upload: Image upload failed:", errorText);
        toast({
          title: "Image Upload Failed",
          description: "Error: " + errorText,
          variant: "destructive",
        });
        setUploadedImageUrl(null);
      } else {
        const uploadResult = await uploadResponse.json();
        console.log("Test upload: Image upload result:", uploadResult);
        setUploadedImageUrl(uploadResult.imageUrl);
        
        toast({
          title: "Image Uploaded Successfully",
          description: `File saved as: ${uploadResult.imageUrl}`,
          variant: "default",
        });
      }
    } catch (uploadError) {
      console.error("Test upload: Error during image upload:", uploadError);
      toast({
        title: "Image Upload Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
      setUploadedImageUrl(null);
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center">Image Utility Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select an image to upload</Label>
              <Input 
                id="file-upload"
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Allowed file types: JPG, PNG, GIF, SVG. Max size: 5MB
              </p>
            </div>
            
            {isUploading && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading image...</span>
              </div>
            )}
            
            {uploadedImageUrl && (
              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <div className="font-medium">Image uploaded successfully!</div>
                </div>
                
                <div className="text-sm break-all bg-muted p-2 rounded">
                  {uploadedImageUrl}
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="text-sm font-medium mb-2">Image Preview:</div>
                  <div className="flex justify-center bg-muted/50 p-4 rounded">
                    <ImageWithFallback
                      src={uploadedImageUrl}
                      alt="Uploaded image"
                      className="max-h-[300px] max-w-full object-contain rounded"
                      isQuizImage={true}
                      onLoadSuccess={() => console.log(`Uploaded image loaded successfully: ${uploadedImageUrl}`)}
                      onLoadError={() => console.log(`Failed to load uploaded image: ${uploadedImageUrl}`)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <div className="text-sm font-medium">Test this URL:</div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setImageUrl(uploadedImageUrl);
                      setProcessedUrl(getFullImageUrl(uploadedImageUrl));
                    }}
                  >
                    Process URL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Image URL Processor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Enter Image URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter an image URL to process"
                />
                <Button onClick={processUrl}>Process</Button>
              </div>
            </div>
            
            {processedUrl && (
              <div className="space-y-2">
                <Label>Processed URL</Label>
                <div className="p-2 bg-muted rounded-md break-all">
                  {processedUrl}
                </div>
              </div>
            )}
            
            {processedUrl && (
              <div className="space-y-2">
                <Label>Image Preview</Label>
                <div className="border rounded-md p-4 flex justify-center">
                  <ImageWithFallback
                    src={processedUrl}
                    alt="Processed image"
                    className="max-h-[300px] max-w-full object-contain rounded"
                    onLoadSuccess={() => console.log(`Processed image loaded successfully: ${processedUrl}`)}
                    onLoadError={() => console.log(`Failed to load processed image: ${processedUrl}`)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testImages.map((url, index) => (
              <div key={index} className="space-y-2 border rounded-md p-4">
                <div className="font-medium truncate">{url}</div>
                <div className="flex justify-center bg-muted/50 p-2 rounded">
                  <ImageWithFallback
                    src={url}
                    alt={`Test image ${index + 1}`}
                    className="max-h-[200px] max-w-full object-contain rounded"
                    onLoadSuccess={() => console.log(`Test image ${index + 1} loaded successfully: ${url}`)}
                    onLoadError={() => console.log(`Failed to load test image ${index + 1}: ${url}`)}
                  />
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  Processed URL: {getFullImageUrl(url)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}