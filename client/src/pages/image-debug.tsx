import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/Layout';

export default function ImageDebugPage() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch quiz questions with images
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all quizzes
        const quizzesRes = await apiRequest('GET', '/api/quizzes');
        const quizzes = await quizzesRes.json();
        
        // Get questions for the first quiz
        if (quizzes.length > 0) {
          const questionsRes = await apiRequest('GET', `/api/quizzes/${quizzes[0].id}/questions`);
          const questions = await questionsRes.json();
          
          // Filter questions with images
          const questionsWithImages = questions.filter((q: any) => q.imageUrl);
          setQuizQuestions(questionsWithImages);
          
          // Extract image URLs
          const urls = questionsWithImages.map((q: any) => q.imageUrl);
          setImageUrls(urls);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch quiz data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Function to process an image URL (similar to what happens in quiz-runner)
  const processImageUrl = (url: string): string => {
    // Strip any existing query parameters
    const baseUrl = url.split('?')[0];
    
    // Add timestamp for cache busting
    return `${baseUrl}?v=${Date.now()}&debug=true`;
  };
  
  // Function to get the direct upload path version
  const getDirectUploadPath = (url: string): string => {
    let filename = '';
    
    // Extract filename based on various patterns
    if (url.includes('/uploads/images/')) {
      const parts = url.split('/uploads/images/');
      filename = parts[1]?.split('?')[0] || '';
    } else if (url.includes('/api/images/')) {
      const parts = url.split('/api/images/');
      filename = parts[1]?.split('?')[0] || '';
    } else if (url.includes('/') || url.includes('\\')) {
      const parts = url.split(/[\/\\]/);
      filename = parts[parts.length - 1].split('?')[0];
    } else {
      filename = url.split('?')[0];
    }
    
    return `/uploads/images/${filename}?v=${Date.now()}&t=${Math.random().toString(36).substring(2, 8)}`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Image Debug Tool</h1>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Quiz Images</CardTitle>
                <CardDescription>
                  Examining {quizQuestions.length} questions with images
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quizQuestions.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No quiz questions with images found
                  </div>
                ) : (
                  <div className="space-y-8">
                    {quizQuestions.map((question, index) => (
                      <div key={question.id} className="border p-4 rounded-lg">
                        <div className="font-medium mb-2">Question {index + 1}: {question.question}</div>
                        <div className="text-sm text-muted-foreground mb-4">
                          <div>Original URL: {question.imageUrl}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Original image */}
                          <div className="space-y-2 border rounded-md p-4">
                            <div className="font-medium">Original Image</div>
                            <div className="bg-muted/30 p-2 rounded min-h-[200px] flex items-center justify-center">
                              <ImageWithFallback
                                src={question.imageUrl}
                                alt={`Original format`}
                                className="max-h-[200px] max-w-full object-contain rounded"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground break-all">
                              URL: {question.imageUrl}
                            </div>
                          </div>
                          
                          {/* Processed image - direct upload path */}
                          <div className="space-y-2 border rounded-md p-4">
                            <div className="font-medium">Direct Upload Path</div>
                            <div className="bg-muted/30 p-2 rounded min-h-[200px] flex items-center justify-center">
                              <ImageWithFallback
                                src={getDirectUploadPath(question.imageUrl)}
                                alt={`Direct upload path`}
                                className="max-h-[200px] max-w-full object-contain rounded"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground break-all">
                              URL: {getDirectUploadPath(question.imageUrl)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Test Specific Image</CardTitle>
                <CardDescription>
                  Enter a specific image URL to test
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testImage">Image URL</Label>
                    <Input 
                      id="testImage" 
                      placeholder="Enter image URL or filename"
                      value={imageUrls[0] || ''}
                      onChange={(e) => setImageUrls([e.target.value])}
                    />
                  </div>
                  
                  {imageUrls[0] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Original format */}
                      <div className="space-y-2 border rounded-md p-4">
                        <div className="font-medium">Original Format</div>
                        <div className="bg-muted/30 p-2 rounded min-h-[200px] flex items-center justify-center">
                          <ImageWithFallback
                            src={imageUrls[0]}
                            alt="Original format"
                            className="max-h-[200px] max-w-full object-contain rounded"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          URL: {imageUrls[0]}
                        </div>
                      </div>
                      
                      {/* Direct upload path */}
                      <div className="space-y-2 border rounded-md p-4">
                        <div className="font-medium">Direct Upload Path</div>
                        <div className="bg-muted/30 p-2 rounded min-h-[200px] flex items-center justify-center">
                          <ImageWithFallback
                            src={getDirectUploadPath(imageUrls[0])}
                            alt="Direct upload path"
                            className="max-h-[200px] max-w-full object-contain rounded"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          URL: {getDirectUploadPath(imageUrls[0])}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}