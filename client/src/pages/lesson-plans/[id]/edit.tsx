import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ChevronLeft, 
  Loader2, 
  Upload, 
  FileText, 
  Sparkles,
  BookText,
  Target,
  ListChecks,
  Clock,
  Pencil,
  Save
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PageTitle from "@/components/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema for editing a lesson plan
const lessonPlanSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  gradeLevel: z.string().optional(),
  duration: z.string().optional(),
  classId: z.string().optional(),
  content: z.string().optional(),
});

type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;

// Schema for generating content
const generateSchema = z.object({
  teacherNotes: z.string().optional(),
  materialIds: z.array(z.number()).optional(),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

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

// Component generation types
type ComponentType = "objectives" | "activities" | "assessment" | "materials" | "standards" | "differentiation";

interface ComponentGenerationForm {
  componentType: ComponentType;
  context: string;
}

export default function EditLessonPlanPage() {
  const [, params] = useRoute("/lesson-plans/:id/edit");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [generatingComponent, setGeneratingComponent] = useState<ComponentType | null>(null);
  const [componentContext, setComponentContext] = useState("");
  const [generatedComponent, setGeneratedComponent] = useState("");
  
  const lessonPlanId = params?.id ? parseInt(params.id) : 0;

  // Fetch lesson plan data
  const { data: lessonPlan, isLoading: lessonPlanLoading, isError: lessonPlanError } = useQuery<LessonPlan>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  // Fetch classes for the dropdown
  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    refetchOnWindowFocus: false,
  });

  // Fetch materials for this lesson plan
  const { data: materials, refetch: refetchMaterials } = useQuery<LessonPlanMaterial[]>({
    queryKey: [`/api/lesson-plans/${lessonPlanId}/materials`],
    enabled: !!lessonPlanId,
    refetchOnWindowFocus: false,
  });

  // Form definition for editing the lesson plan
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeLevel: "",
      duration: "",
      classId: "",
      content: "",
    },
  });

  // Form for content generation
  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      teacherNotes: "",
      materialIds: [],
    },
  });

  // Update form when lesson plan data is loaded
  useEffect(() => {
    if (lessonPlan) {
      form.reset({
        title: lessonPlan.title,
        subject: lessonPlan.subject,
        gradeLevel: lessonPlan.gradeLevel,
        duration: lessonPlan.duration,
        classId: lessonPlan.classId?.toString() || "",
        content: lessonPlan.content,
      });
    }
  }, [lessonPlan, form]);

  // Update lesson plan mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LessonPlanFormValues) => {
      const cleanedData = {
        ...data,
        classId: data.classId ? parseInt(data.classId) : undefined,
      };
      
      const response = await apiRequest("PUT", `/api/lesson-plans/${lessonPlanId}`, cleanedData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lesson plan updated",
        description: "Your lesson plan has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/lesson-plans/${lessonPlanId}`] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update lesson plan",
        description: error.message || "An error occurred while updating the lesson plan.",
        variant: "destructive",
      });
    },
  });

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFormValues) => {
      setIsGenerating(true);
      const response = await apiRequest("POST", `/api/lesson-plans/${lessonPlanId}/generate`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content generated",
        description: "The AI has generated content for your lesson plan.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/lesson-plans/${lessonPlanId}`] });
      setIsGenerating(false);
      setActiveTab("content");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate content",
        description: error.message || "An error occurred while generating content.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Generate component mutation
  const generateComponentMutation = useMutation({
    mutationFn: async (data: ComponentGenerationForm) => {
      const response = await apiRequest("POST", `/api/lesson-plans/${lessonPlanId}/generate-component`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${generatingComponent} generated`,
        description: `The AI has generated ${generatingComponent} content for your lesson plan.`,
      });
      setGeneratedComponent(data.content);
      setGeneratingComponent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate component",
        description: error.message || "An error occurred while generating the component.",
        variant: "destructive",
      });
      setGeneratingComponent(null);
    },
  });

  // Upload material mutation
  const uploadMaterialMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}/materials`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material uploaded",
        description: "Your material has been uploaded successfully.",
      });
      refetchMaterials();
      setUploadingFile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload material",
        description: error.message || "An error occurred while uploading your material.",
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  const onSubmit = (data: LessonPlanFormValues) => {
    updateMutation.mutate(data);
  };

  const onGenerate = (data: GenerateFormValues) => {
    generateMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMaterialMutation.mutate(file);
    }
  };

  const handleGenerateComponent = (type: ComponentType) => {
    setGeneratingComponent(type);
    generateComponentMutation.mutate({
      componentType: type,
      context: componentContext,
    });
  };

  const applyGeneratedComponent = () => {
    if (generatedComponent && lessonPlan) {
      const updatedContent = `${lessonPlan.content || ""}\n\n${generatedComponent}`;
      form.setValue("content", updatedContent);
      updateMutation.mutate({
        ...form.getValues(),
        content: updatedContent,
      });
      setGeneratedComponent("");
    }
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

  useEffect(() => {
    // Set page title
    document.title = `Evalia - Edit ${lessonPlan?.title || 'Lesson Plan'}`;
  }, [lessonPlan]);

  const { user, isLoading: authLoading } = useAuth();

  if (!user && !authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to edit this lesson plan.</CardDescription>
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
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                className="mr-4"
                onClick={() => setLocation("/lesson-plans")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <PageTitle title={`Edit Lesson Plan: ${lessonPlan.title}`} subtitle="Edit details and generate content" />
            </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="generate">Generate with AI</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plan Details</CardTitle>
              <CardDescription>
                Update the basic information for your lesson plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduction to Photosynthesis" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your lesson plan a descriptive title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Biology" {...field} />
                        </FormControl>
                        <FormDescription>
                          The academic subject for this lesson.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Elementary">Elementary</SelectItem>
                              <SelectItem value="Middle School">Middle School</SelectItem>
                              <SelectItem value="High School">High School</SelectItem>
                              <SelectItem value="College">College</SelectItem>
                              <SelectItem value="K-2">K-2</SelectItem>
                              <SelectItem value="3-5">3-5</SelectItem>
                              <SelectItem value="6-8">6-8</SelectItem>
                              <SelectItem value="9-12">9-12</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The grade level for this lesson.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30 minutes">30 minutes</SelectItem>
                              <SelectItem value="45 minutes">45 minutes</SelectItem>
                              <SelectItem value="60 minutes">60 minutes</SelectItem>
                              <SelectItem value="90 minutes">90 minutes</SelectItem>
                              <SelectItem value="2 hours">2 hours</SelectItem>
                              <SelectItem value="Multiple days">Multiple days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long this lesson will take.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map((class_) => (
                              <SelectItem key={class_.id} value={class_.id.toString()}>
                                {class_.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associate this lesson plan with a specific class (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Lesson Plan Content</CardTitle>
                  <CardDescription>
                    View and edit the content of your lesson plan.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={isEditing ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("generate")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Start typing your lesson plan content here..."
                              className="h-[500px] resize-none font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-4 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="relative rounded-md border p-4 min-h-[500px]">
                  {lessonPlan.content ? (
                    <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                      {lessonPlan.content}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center">
                      <BookText className="h-16 w-16 text-muted mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        This lesson plan doesn't have any content yet. You can add content manually by clicking 'Edit'
                        or generate content using our AI assistant.
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Add Content Manually
                        </Button>
                        <Button
                          onClick={() => setActiveTab("generate")}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {generatedComponent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Component</CardTitle>
                <CardDescription>
                  Review and apply the generated component to your lesson plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-4">
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                    {generatedComponent}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedComponent("")}
                >
                  Discard
                </Button>
                <Button
                  onClick={applyGeneratedComponent}
                >
                  Apply to Lesson Plan
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generate Components</CardTitle>
              <CardDescription>
                Generate specific components for your lesson plan using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("objectives")}
                  disabled={!!generatingComponent}
                >
                  <Target className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Learning Objectives</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate clear learning objectives for this lesson
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("activities")}
                  disabled={!!generatingComponent}
                >
                  <ListChecks className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Learning Activities</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate engaging activities for students
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("assessment")}
                  disabled={!!generatingComponent}
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Assessment</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate assessment strategies and questions
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("materials")}
                  disabled={!!generatingComponent}
                >
                  <BookText className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Materials List</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate a list of required materials
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("standards")}
                  disabled={!!generatingComponent}
                >
                  <BookText className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Standards Alignment</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate aligned educational standards
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center space-y-2"
                  onClick={() => handleGenerateComponent("differentiation")}
                  disabled={!!generatingComponent}
                >
                  <BookText className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Differentiation</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Generate differentiation strategies
                  </span>
                </Button>
              </div>

              {generatingComponent && (
                <div className="flex items-center justify-center mt-6 p-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Generating {generatingComponent}...</span>
                </div>
              )}

              <div className="mt-6">
                <FormLabel htmlFor="componentContext">Additional Context (Optional)</FormLabel>
                <Textarea
                  id="componentContext"
                  placeholder="Provide any additional context for the component generation..."
                  value={componentContext}
                  onChange={(e) => setComponentContext(e.target.value)}
                  className="mt-2"
                />
                <FormDescription className="mt-1">
                  Add specific details or requirements to guide the AI when generating components.
                </FormDescription>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Lesson Plan with AI</CardTitle>
              <CardDescription>
                Use our AI assistant to generate a complete lesson plan based on your inputs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI-Powered Generation</AlertTitle>
                <AlertDescription>
                  Our AI will generate a complete lesson plan based on the details you've provided and any materials you've uploaded.
                  You can further customize the generated content afterwards.
                </AlertDescription>
              </Alert>

              <Form {...generateForm}>
                <form onSubmit={generateForm.handleSubmit(onGenerate)} className="space-y-6">
                  <div className="grid gap-6">
                    <FormField
                      control={generateForm.control}
                      name="teacherNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teaching Notes or Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any specific teaching notes or instructions for the AI to consider..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include any specific teaching approaches, student needs, or other details you want the AI to consider.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Available Materials</FormLabel>
                    {materials && materials.length > 0 ? (
                      <div className="mt-2 mb-4">
                        <ScrollArea className="h-[200px] rounded-md border p-4">
                          <div className="space-y-4">
                            {materials.map((material) => (
                              <div
                                key={material.id}
                                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                              >
                                <input
                                  type="checkbox"
                                  id={`material-${material.id}`}
                                  className="h-4 w-4"
                                  onChange={(e) => {
                                    const currentMaterials = generateForm.getValues("materialIds") || [];
                                    if (e.target.checked) {
                                      generateForm.setValue("materialIds", [...currentMaterials, material.id]);
                                    } else {
                                      generateForm.setValue(
                                        "materialIds",
                                        currentMaterials.filter((id) => id !== material.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`material-${material.id}`}
                                  className="flex-1 flex items-center space-x-3 cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm truncate">{material.fileName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {(material.fileSize / 1024).toFixed(0)} KB
                                  </Badge>
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="mt-2 mb-6 rounded-md border border-dashed p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted mb-2" />
                        <p className="mb-1 font-medium">No materials uploaded yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload teaching materials for better AI generation results.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("materials")}
                        >
                          Upload Materials
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center bg-muted/20 p-4 rounded-md">
                    <div className="flex-grow">
                      <h3 className="font-semibold mb-1">Lesson Plan Summary</h3>
                      <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <div><span className="font-medium">Title:</span> {lessonPlan.title}</div>
                        <div><span className="font-medium">Subject:</span> {lessonPlan.subject}</div>
                        {lessonPlan.gradeLevel && (
                          <div><span className="font-medium">Grade Level:</span> {lessonPlan.gradeLevel}</div>
                        )}
                        {lessonPlan.duration && (
                          <div><span className="font-medium">Duration:</span> {lessonPlan.duration}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => generateForm.reset()}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Lesson Plan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Upload Materials</CardTitle>
              <CardDescription>
                Upload teaching materials to improve AI-generated content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-md border border-dashed p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-medium mb-1">Upload Materials</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Upload documents, worksheets, or other materials to help the AI generate more relevant content.
                  Supported formats: PDF, DOCX, TXT, JPG, PNG.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <Button
                    variant="outline"
                    className="relative z-10"
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select File
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Uploaded Materials</h3>
                {materials && materials.length > 0 ? (
                  <div className="space-y-2">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center space-x-3 p-3 bg-muted/20 rounded-md"
                      >
                        <FileText className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-grow">
                          <div className="font-medium text-sm">{material.fileName}</div>
                          <div className="text-xs text-muted-foreground">
                            Uploaded {new Date(material.createdAt).toLocaleDateString()} • 
                            {(material.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled // Add delete functionality if needed
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground text-sm">
                    No materials uploaded yet. Upload materials to improve AI-generated content.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}