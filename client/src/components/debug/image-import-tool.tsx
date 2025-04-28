import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Check, AlertTriangle } from 'lucide-react';
import ImageWithFallbacks from '@/components/quizzes/image-with-fallbacks';

/**
 * Tool for importing/uploading missing images directly
 * This can be used to quickly replace missing images identified by the diagnostic tools
 */
export default function ImageImportTool() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Reset any previous upload status
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!file || !targetId) {
      toast({
        title: "Error",
        description: "Please select a file and enter a question ID",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('questionId', targetId);

      const response = await fetch('/api/debug/upload-replacement-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccess(true);
        toast({
          title: "Success",
          description: "Image uploaded and associated with question",
          variant: "default"
        });
        console.log('Upload success:', data);
      } else {
        const errorData = await response.json();
        toast({
          title: "Upload failed",
          description: errorData.error || "An error occurred during upload",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Import Tool</CardTitle>
        <CardDescription>
          Replace missing images by uploading a new version
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-id">Question ID</Label>
            <Input
              id="question-id"
              placeholder="Enter question ID to update"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the ID of the question with the missing image
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-upload">Select Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Select a JPG, PNG, or other image file to upload
            </p>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="h-40 border rounded-md overflow-hidden">
                <ImageWithFallbacks
                  src={previewUrl}
                  alt="Image preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {file?.name} ({file ? Math.round(file.size / 1024) : 0} KB)
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setPreviewUrl(null);
            setTargetId('');
            setUploadSuccess(false);
          }}
          disabled={!file && !targetId}
        >
          Clear
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !targetId || uploading || uploadSuccess}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : uploadSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}