import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Clock, 
  Download, 
  Book, 
  FileEdit, 
  FileText,
  ArrowUpRight,
  Loader2,
  Upload
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SectionHeader from "@/components/section-header";
import { formatDistanceToNow } from "date-fns";

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

// Material types
interface LessonPlanMaterial {
  id: number;
  lessonPlanId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function ViewLessonPlanPage() {
  const [, params] = useRoute("/lesson-plans/:id");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const lessonPlanId = params?.id ? parseInt(params.id) : 0;

  // Fetch lesson plan data
  const { data: lessonPlan, isLoading: lessonPlanLoading, isError: lessonPlanError } = useQuery<LessonPlan>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  // Fetch class details if associated with a class
  const { data: classDetails } = useQuery({
    queryKey: [`/api/classes/${lessonPlan?.classId}`],
    enabled: !!lessonPlan?.classId,
    refetchOnWindowFocus: false,
  });

  // Fetch materials for this lesson plan
  const { data: materials } = useQuery<LessonPlanMaterial[]>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}/materials`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  // Export lesson plan mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      setIsExporting(true);
      const response = await apiRequest("GET", `/api/lesson-plans/${lessonPlanId}/export`);
      return response.json();
    },
    onSuccess: (data) => {
      // Create a Blob from the content
      const blob = new Blob([data.content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Create a download link and trigger download
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
        title: "Export successful",
        description: "Your lesson plan has been exported successfully.",
      });
      setIsExporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while exporting the lesson plan.",
        variant: "destructive",
      });
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  if (lessonPlanLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const actionButtons = (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        onClick={() => setLocation(`/lesson-plans/${lessonPlanId}/edit`)}
      >
        <FileEdit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button
        className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90"
        disabled={!lessonPlan.content || isExporting}
        onClick={handleExport}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Export
          </>
        )}
      </Button>
    </div>
  );

  useEffect(() => {
    // Set page title
    document.title = `Evalia - ${lessonPlan?.title || 'Lesson Plan'}`;
  }, [lessonPlan]);

  const { user, isLoading: authLoading } = useAuth();

  if (!user && !authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view this lesson plan.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/auth/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-[#ede8dd]">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title={lessonPlan.title} 
              subtitle="Lesson Plan Details" 
              rightContent={actionButtons}
            />
            
            <div className="flex mb-6">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => setLocation("/lesson-plans")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Lesson Plans
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>{lessonPlan.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Last updated {formatDistanceToNow(new Date(lessonPlan.updatedAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                        <Badge variant="outline">{lessonPlan.subject}</Badge>
                        {lessonPlan.gradeLevel && (
                          <Badge variant="outline">{lessonPlan.gradeLevel}</Badge>
                        )}
                        {lessonPlan.duration && (
                          <Badge variant="outline">{lessonPlan.duration}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lessonPlan.content ? (
                      <div className="rounded-md border p-4">
                        <MarkdownDisplay content={lessonPlan.content} />
                      </div>
                    ) : (
                      <div className="text-center py-20 border rounded-md">
                        <Book className="h-16 w-16 mx-auto text-muted mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          This lesson plan doesn't have any content yet. Edit the lesson plan to add content
                          or generate it with our AI assistant.
                        </p>
                        <Button
                          onClick={() => setLocation(`/lesson-plans/${lessonPlanId}/edit`)}
                        >
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit Lesson Plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Subject</h4>
                        <p className="text-muted-foreground">{lessonPlan.subject}</p>
                      </div>
                      
                      {lessonPlan.gradeLevel && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Grade Level</h4>
                          <p className="text-muted-foreground">{lessonPlan.gradeLevel}</p>
                        </div>
                      )}
                      
                      {lessonPlan.duration && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Duration</h4>
                          <p className="text-muted-foreground">{lessonPlan.duration}</p>
                        </div>
                      )}
                      
                      {classDetails && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Associated Class</h4>
                          <p className="text-muted-foreground">{classDetails.name}</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Created</h4>
                        <p className="text-muted-foreground">
                          {new Date(lessonPlan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Last Updated</h4>
                        <p className="text-muted-foreground">
                          {new Date(lessonPlan.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {materials && materials.length > 0 ? (
                      <div className="space-y-3">
                        {materials.map((material) => (
                          <div 
                            key={material.id}
                            className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-grow">
                              <div className="font-medium text-sm truncate" title={material.fileName}>
                                {material.fileName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(material.fileSize / 1024).toFixed(0)} KB
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0"
                              onClick={() => window.open(material.fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No materials uploaded</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setLocation(`/lesson-plans/${lessonPlanId}/edit?tab=materials`)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Materials
                        </Button>
                      </div>
                    )}
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