import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImageProps, getFullImageUrl } from "@/lib/image-utils";

export default function ImageTest() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [testImages] = useState([
    '/uploads/images/test-image.svg',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBiYTJiMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMHB4Ij5UZXN0PC90ZXh0Pjwvc3ZnPg==',
    'https://via.placeholder.com/300x200?text=External+Image'
  ]);

  const processUrl = () => {
    setProcessedUrl(getFullImageUrl(imageUrl));
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center">Image Utility Test Page</h1>
      
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
                  <img 
                    {...getImageProps({
                      src: processedUrl,
                      alt: "Processed image",
                      className: "max-h-[300px] max-w-full object-contain rounded"
                    })}
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
                  <img 
                    {...getImageProps({
                      src: url,
                      alt: `Test image ${index + 1}`,
                      className: "max-h-[200px] max-w-full object-contain rounded"
                    })}
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