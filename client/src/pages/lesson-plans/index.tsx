import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PlusCircle, FileEdit, Trash2, FileText, Clock, Book, ArrowUpRight, ChevronLeft } from "lucide-react";

import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import SectionHeader from "@/components/section-header";
import { useAuth } from "@/hooks/use-auth";

// Type for lesson plan
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

export default function LessonPlansPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = "Evalia - Lesson Plans";
  }, []);

  // Fetch lesson plans
  const { data: lessonPlans, isLoading, isError } = useQuery<LessonPlan[]>({
    queryKey: ["/api/lesson-plans"],
    refetchOnWindowFocus: false,
  });

  // Delete lesson plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lesson-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Lesson plan deleted",
        description: "The lesson plan has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete lesson plan",
        description: error.message || "An error occurred while deleting the lesson plan.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this lesson plan?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!user && !authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the lesson plans.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/auth/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const createButton = (
    <Button onClick={() => setLocation("/lesson-plans/create")} className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90">
      <PlusCircle className="mr-2 h-4 w-4" />
      Create New Lesson Plan
    </Button>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="bg-[#0ba2b0] py-6 px-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-white">Lesson Plans</h1>
              <p className="text-white/80">Create and manage AI-generated lesson plans</p>
            </div>
          </div>
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader 
                title="Lesson Plans" 
                subtitle="Create and manage AI-generated lesson plans"
                rightContent={createButton} 
              />
              <div className="grid gap-6 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-muted/20">
                    <CardHeader className="animate-pulse">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </CardHeader>
                    <CardContent className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                    <CardFooter className="animate-pulse">
                      <div className="h-8 bg-muted rounded w-1/4"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-screen flex overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="bg-[#0ba2b0] py-6 px-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-white">Lesson Plans</h1>
              <p className="text-white/80">Create and manage AI-generated lesson plans</p>
            </div>
          </div>
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader 
                title="Lesson Plans" 
                subtitle="Create and manage AI-generated lesson plans"
                rightContent={createButton} 
              />
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                  <CardDescription>Failed to load lesson plans.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>There was an error loading your lesson plans. Please try again later.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] })}>
                    Retry
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Success state with data
  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="bg-[#0ba2b0] py-6 px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Lesson Plans</h1>
            <p className="text-white/80">Create and manage AI-generated lesson plans</p>
          </div>
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Lesson Plans" 
              subtitle="Create and manage AI-generated lesson plans"
              rightContent={createButton} 
            />

            {lessonPlans?.length === 0 ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>No Lesson Plans Yet</CardTitle>
                  <CardDescription>You haven't created any lesson plans yet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Create your first lesson plan by clicking the "Create New Lesson Plan" button above.
                    Our AI assistant will help you generate content based on your inputs and materials.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setLocation("/lesson-plans/create")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Lesson Plan
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 mt-6">
                {lessonPlans?.map((lessonPlan) => (
                  <Card key={lessonPlan.id} className="overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-[#0ba2b0]/10 p-6 flex-none hidden md:flex items-center justify-center w-32">
                        <Book className="h-16 w-16 text-[#0ba2b0]/70" />
                      </div>
                      <div className="flex-grow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{lessonPlan.title}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(lessonPlan.updatedAt), { addSuffix: true })}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
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
                          <p className="line-clamp-2 text-muted-foreground">
                            {lessonPlan.content
                              ? lessonPlan.content.substring(0, 150) + (lessonPlan.content.length > 150 ? "..." : "")
                              : "No content generated yet. Click 'Edit' to add content or generate with AI."}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/lesson-plans/${lessonPlan.id}`)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View lesson plan details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/lesson-plans/${lessonPlan.id}/edit`)}
                                  >
                                    <FileEdit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit this lesson plan</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(lessonPlan.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete this lesson plan</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-[#0ba2b0] hover:bg-[#0ba2b0]/90"
                                  disabled={!lessonPlan.content}
                                  onClick={() => setLocation(`/lesson-plans/${lessonPlan.id}/export`)}
                                >
                                  <ArrowUpRight className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Export as DOCX/PDF</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}