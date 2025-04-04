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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PageTitle from "@/components/page-title";
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
      
      // Request the DOCX file from the server
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/export?format=docx`, {
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate DOCX file');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
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
      
      toast({
        title: "Download started",
        description: "Your lesson plan is being downloaded as a DOCX file.",
      });
    } catch (error) {
      console.error('Error downloading DOCX file:', error);
      toast({
        title: "Download failed",
        description: "Failed to generate DOCX file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setIsExporting(true);
      
      // Request the PDF file from the server
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/export?format=pdf`, {
        headers: {
          Accept: 'application/pdf',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF file');
      }
      
      // If the server returns JSON (fallback), create a text file with the content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
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
      
      // Get the blob from the response
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
        <PageTitle title="Error" subtitle="Failed to load lesson plan" />
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

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => setLocation(`/lesson-plans/${lessonPlanId}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <PageTitle title="Export Lesson Plan" subtitle="Download your lesson plan as a formatted document" />
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
  );
}