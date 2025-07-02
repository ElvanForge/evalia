import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/ui/sidebar";
import SectionHeader from "@/components/section-header";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { Loader2, ChevronLeft, Download, FileText, FileDown, CheckCircle2 } from "lucide-react";

interface LessonPlan {
  id: number;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: string;
  content: string;
  classId?: number;
  teacherId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ExportLessonPlanPageFixed() {
  // ALL HOOKS CALLED AT THE TOP LEVEL - NO CONDITIONS
  const [, params] = useRoute("/lesson-plans/:id/export");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [exportedContent, setExportedContent] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"docx" | "pdf">("docx");
  
  const lessonPlanId = params?.id ? parseInt(params.id) : 0;

  // Query hooks - always called
  const lessonPlanQuery = useQuery<LessonPlan>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  const userLessonPlansQuery = useQuery<LessonPlan[]>({
    queryKey: ['/api/lesson-plans'],
    enabled: !!user && !authLoading,
    refetchOnWindowFocus: false,
  });

  // Mutation hook - always called
  const exportMutation = useMutation({
    mutationFn: async () => {
      setIsExporting(true);
      const response = await apiRequest("GET", `/api/lesson-plans/${lessonPlanId}/export`);
      return response.json();
    },
    onSuccess: (data) => {
      setExportedContent(data.content);
      toast({
        title: "Export formatted",
        description: "Your lesson plan has been formatted for export.",
      });
      setIsExporting(false);
    },
    onError: (error: any) => {
      if (error.message?.includes('403') || error.message?.includes('not authorized') || error.message?.includes('Not authorized')) {
        if (userLessonPlansQuery.data && userLessonPlansQuery.data.length > 0) {
          toast({
            title: "Redirecting to your lesson plan",
            description: "You can only export your own lesson plans. Taking you to one of yours.",
          });
          setLocation(`/lesson-plans/${userLessonPlansQuery.data[0].id}/export`);
          return;
        }
      }
      
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while formatting the lesson plan for export.",
        variant: "destructive",
      });
      setIsExporting(false);
    },
  });

  // Effects - always called
  useEffect(() => {
    if (lessonPlanId) {
      exportMutation.mutate();
    }
  }, [lessonPlanId]);

  useEffect(() => {
    if (lessonPlanQuery.data?.title) {
      document.title = `Evalia - Export ${lessonPlanQuery.data.title}`;
    }
  }, [lessonPlanQuery.data]);

  useEffect(() => {
    if (lessonPlanQuery.isError && userLessonPlansQuery.data && userLessonPlansQuery.data.length > 0) {
      const errorMessage = (lessonPlanQuery.error as any)?.message || '';
      if (errorMessage.includes('401') || errorMessage.includes('403') || 
          errorMessage.includes('Unauthorized') || errorMessage.includes('Not authorized')) {
        
        const timer = setTimeout(() => {
          toast({
            title: "Redirected to your lesson plan",
            description: `Taking you to "${userLessonPlansQuery.data[0].title}" instead.`,
          });
          setLocation(`/lesson-plans/${userLessonPlansQuery.data[0].id}/export`);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [lessonPlanQuery.isError, userLessonPlansQuery.data, setLocation, toast]);

  // Event handlers
  const downloadDocx = async () => {
    try {
      setIsExporting(true);
      console.log(`Starting DOCX download for lesson plan ${lessonPlanId}`);
      
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: JSON.stringify({ format: 'docx' }),
      });
      
      console.log(`DOCX export response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please log in to export this lesson plan.",
            variant: "destructive",
          });
          setLocation("/auth");
          return;
        }
        throw new Error('Failed to generate DOCX file');
      }
      
      const blob = await response.blob();
      console.log(`DOCX blob created successfully, size: ${blob.size} bytes`);
      
      // Create download link with additional attributes for better browser support
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lessonPlanQuery.data?.title || 'lesson-plan'}.docx`;
      link.style.display = 'none';
      link.target = '_blank';
      
      // Force click with user gesture
      document.body.appendChild(link);
      
      // Add a small delay to ensure the link is in the DOM
      setTimeout(() => {
        link.click();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }, 10);
      
      console.log('DOCX download completed successfully');
      toast({
        title: "Download started",
        description: "Your lesson plan is being downloaded as a DOCX file.",
      });
      
    } catch (error: any) {
      console.error('DOCX download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "An error occurred while downloading the DOCX file.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setIsExporting(true);
      console.log(`Starting PDF download for lesson plan ${lessonPlanId}`);
      
      // Method 1: Try direct download URL first (most reliable)
      const directDownloadUrl = `/api/lesson-plans/${lessonPlanId}/download/pdf`;
      console.log(`Trying direct download URL: ${directDownloadUrl}`);
      
      // Use window.location to force download
      window.location.href = directDownloadUrl;
      
      console.log('PDF download initiated via direct URL');
      toast({
        title: "PDF Download Started",
        description: "Check your browser's Downloads folder for the PDF file",
      });
      
    } catch (error: any) {
      console.error('PDF download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "An error occurred while downloading the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Conditional rendering AFTER all hooks
  if (!user && !authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to export this lesson plan.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/auth/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (lessonPlanQuery.isLoading || isExporting) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {isExporting ? "Formatting lesson plan for export..." : "Loading lesson plan..."}
        </p>
      </div>
    );
  }

  if (lessonPlanQuery.isError || !lessonPlanQuery.data) {
    return (
      <div className="container py-8">
        <SectionHeader title="Lesson Plan Not Found" subtitle="This lesson plan doesn't exist or you don't have access to it" />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You can only export lesson plans that belong to you. Let's take you back to your lesson plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This might happen if:
            </p>
            <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
              <li>The lesson plan doesn't exist</li>
              <li>The lesson plan belongs to another teacher</li>
              <li>You don't have permission to access this content</li>
            </ul>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={() => setLocation("/lesson-plans")} className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go to My Lesson Plans
            </Button>
            {userLessonPlansQuery.data && userLessonPlansQuery.data.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setLocation(`/lesson-plans/${userLessonPlansQuery.data[0].id}/export`)}
              >
                Export "{userLessonPlansQuery.data[0].title}"
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  const lessonPlan = lessonPlanQuery.data;

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Export Lesson Plan" 
              subtitle="Download your lesson plan as a formatted document" 
            />
            
            <div className="flex mb-4">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => setLocation(`/lesson-plans/${lessonPlanId}`)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Lesson Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>{lessonPlan.title}</CardTitle>
                        <CardDescription>Preview and download your formatted lesson plan</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Ready for Export</AlertTitle>
                      <AlertDescription>
                        Your lesson plan has been formatted for export. You can review it below before downloading.
                      </AlertDescription>
                    </Alert>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="raw">Raw Content</TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="rounded-md border p-4">
                        <MarkdownDisplay content={exportedContent || lessonPlan.content} />
                      </TabsContent>

                      <TabsContent value="raw">
                        <div className="rounded-md border p-4 bg-muted/20">
                          <textarea
                            readOnly
                            className="w-full h-[500px] bg-transparent font-mono text-sm resize-none outline-none"
                            value={exportedContent || lessonPlan.content}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Download Options</CardTitle>
                    <CardDescription>
                      Select a format and download your lesson plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={exportFormat === 'docx' ? 'default' : 'outline'}
                        className="h-auto py-6 flex flex-col items-center justify-center"
                        onClick={() => setExportFormat('docx')}
                      >
                        <FileText className="h-8 w-8 mb-2" />
                        <span className="font-semibold">DOCX</span>
                      </Button>

                      <Button
                        variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                        className="h-auto py-6 flex flex-col items-center justify-center"
                        onClick={() => setExportFormat('pdf')}
                      >
                        <FileDown className="h-8 w-8 mb-2" />
                        <span className="font-semibold">PDF</span>
                      </Button>
                    </div>

                    <div className="pt-4">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={exportFormat === 'docx' ? downloadDocx : downloadPdf}
                        disabled={!exportedContent}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download {exportFormat.toUpperCase()}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Plan Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Subject:</span>
                        <Badge variant="outline" className="ml-2">{lessonPlan.subject}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Grade Level:</span>
                        <Badge variant="outline" className="ml-2">{lessonPlan.gradeLevel}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Duration:</span>
                        <Badge variant="outline" className="ml-2">{lessonPlan.duration}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}