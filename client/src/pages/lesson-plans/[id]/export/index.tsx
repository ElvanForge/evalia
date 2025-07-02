import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  FileDown, 
  FileText, 
  Book, 
  Download,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SectionHeader from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Lesson plan types
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

export default function ExportLessonPlanPage() {
  const [, params] = useRoute("/lesson-plans/:id/export");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [exportedContent, setExportedContent] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"docx" | "pdf">("docx");
  
  const lessonPlanId = params?.id ? parseInt(params.id) : 0;

  // Fetch lesson plan data
  const { data: lessonPlan, isLoading: lessonPlanLoading, isError: lessonPlanError } = useQuery<LessonPlan>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  // Export content mutation for preview
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
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while formatting the lesson plan for export.",
        variant: "destructive",
      });
      setIsExporting(false);
    },
  });

  // Load export content when the page loads
  useEffect(() => {
    if (lessonPlanId) {
      exportMutation.mutate();
    }
  }, [lessonPlanId]);

  const downloadDocx = async () => {
    try {
      setIsExporting(true);
      console.log(`Starting DOCX download for lesson plan ${lessonPlanId}`);
      
      // Request the DOCX file from the server with credentials
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/export?format=docx`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Export response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate DOCX file';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Export error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please log in to export this lesson plan.",
            variant: "destructive",
          });
          setLocation("/auth");
          return;
        }
        
        if (response.status === 429) {
          toast({
            title: "API limit reached",
            description: "Please try again later. The OpenAI API quota has been exceeded.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if the response is actually a binary file
      const contentType = response.headers.get('content-type');
      console.log(`Response content type: ${contentType}`);
      
      if (!contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        // If it's not a DOCX file, it might be an error response in JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Server returned unexpected response');
        } catch (parseError) {
          throw new Error('Server returned unexpected response format');
        }
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      console.log(`Downloaded blob size: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create and click a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lessonPlan?.title || 'lesson-plan'}.docx`.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('DOCX download completed successfully');
      toast({
        title: "Download started",
        description: "Your lesson plan is being downloaded as a DOCX file.",
      });
    } catch (error) {
      console.error('Error downloading DOCX file:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to generate DOCX file. Please try again.",
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
      
      // Request the PDF file from the server with credentials
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/export?format=pdf`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`PDF export response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate PDF file';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('PDF export error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse PDF error response:', parseError);
        }
        
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please log in to export this lesson plan.",
            variant: "destructive",
          });
          setLocation("/auth");
          return;
        }
        
        if (response.status === 429) {
          toast({
            title: "API limit reached",
            description: "Please try again later. The OpenAI API quota has been exceeded.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Check content type to determine how to handle the response
      const contentType = response.headers.get('content-type');
      console.log(`PDF response content type: ${contentType}`);
      
      // If the server returns JSON (fallback), create a text file with the content
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('PDF export returned JSON fallback, creating markdown file');
        
        if (!data.content) {
          throw new Error('No content received from server');
        }
        
        // Create a blob with the content
        const blob = new Blob([data.content], { type: 'text/markdown' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lessonPlan?.title || 'lesson-plan'}.md`.replace(/\s+/g, '-').toLowerCase();
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: "Your lesson plan is being downloaded as a Markdown file. PDF conversion is not available.",
        });
        return;
      }
      
      // Get the blob from the response for actual PDF
      const blob = await response.blob();
      
      // Create and click a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lessonPlan?.title || 'lesson-plan'}.pdf`.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your lesson plan is being downloaded as a PDF file.",
      });
    } catch (error) {
      console.error('Error downloading PDF file:', error);
      toast({
        title: "Download failed",
        description: "Failed to generate PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (lessonPlanLoading || isExporting) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {isExporting ? "Formatting lesson plan for export..." : "Loading lesson plan..."}
        </p>
      </div>
    );
  }

  if (lessonPlanError || !lessonPlan) {
    return (
      <div className="container py-8">
        <SectionHeader title="Error" subtitle="Failed to load lesson plan" />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load lesson plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the lesson plan. Please try again later.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/lesson-plans")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Lesson Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Set page title
    document.title = `Evalia - Export ${lessonPlan?.title || 'Lesson Plan'}`;
  }, [lessonPlan]);

  const { user, isLoading: authLoading } = useAuth();

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
                  <span className="text-xs text-muted-foreground">Word Document</span>
                </Button>

                <Button
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  className="h-auto py-6 flex flex-col items-center justify-center"
                  onClick={() => setExportFormat('pdf')}
                >
                  <FileDown className="h-8 w-8 mb-2" />
                  <span className="font-semibold">PDF</span>
                  <span className="text-xs text-muted-foreground">Portable Document</span>
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

                {lessonPlan.gradeLevel && (
                  <div>
                    <span className="text-sm font-medium">Grade Level:</span>
                    <Badge variant="outline" className="ml-2">{lessonPlan.gradeLevel}</Badge>
                  </div>
                )}

                {lessonPlan.duration && (
                  <div>
                    <span className="text-sm font-medium">Duration:</span>
                    <Badge variant="outline" className="ml-2">{lessonPlan.duration}</Badge>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {new Date(lessonPlan.createdAt).toLocaleDateString()}
                  </span>
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