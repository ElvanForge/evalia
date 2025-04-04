import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2, Upload, FileText } from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Schema for creating a lesson plan
const lessonPlanSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  gradeLevel: z.string().optional(),
  duration: z.string().optional(),
  classId: z.string().optional(),
});

type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;

export default function CreateLessonPlanPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [createdLessonPlanId, setCreatedLessonPlanId] = useState<number | null>(null);

  // Fetch classes for the dropdown
  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    refetchOnWindowFocus: false,
  });

  // Form definition
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      title: "",
      subject: "",
      gradeLevel: "",
      duration: "60 minutes",
      classId: "",
    },
  });

  // Create lesson plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: LessonPlanFormValues) => {
      const cleanedData = {
        ...data,
        classId: data.classId ? parseInt(data.classId) : undefined,
      };
      
      const response = await apiRequest("POST", "/api/lesson-plans", cleanedData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lesson plan created",
        description: "Your lesson plan has been created successfully.",
      });
      
      setCreatedLessonPlanId(data.id);
      
      // If PDF file was uploaded, upload it automatically
      if (pdfFile && data.id) {
        uploadPdfToLessonPlan(data.id, pdfFile);
      } else {
        // Navigate to the edit page of the new lesson plan
        setLocation(`/lesson-plans/${data.id}/edit`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create lesson plan",
        description: error.message || "An error occurred while creating the lesson plan.",
        variant: "destructive",
      });
    },
  });

  // Upload PDF file mutation
  const uploadPdfMutation = useMutation({
    mutationFn: async ({ lessonPlanId, file }: { lessonPlanId: number, file: File }) => {
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
    onSuccess: (data, variables) => {
      toast({
        title: "PDF uploaded",
        description: "Your PDF has been uploaded and will be used to generate the lesson plan.",
      });
      setUploadingFile(false);
      
      // Generate lesson plan content directly with the material
      generateWithPdfMutation.mutate({
        lessonPlanId: variables.lessonPlanId,
        materialId: data.id
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload PDF",
        description: error.message || "An error occurred while uploading your PDF.",
        variant: "destructive",
      });
      setUploadingFile(false);
      
      // Still navigate to edit page if file upload fails
      if (createdLessonPlanId) {
        setLocation(`/lesson-plans/${createdLessonPlanId}/edit`);
      }
    },
  });
  
  // Generate lesson plan with PDF mutation
  const generateWithPdfMutation = useMutation({
    mutationFn: async ({ lessonPlanId, materialId }: { lessonPlanId: number, materialId: number }) => {
      const response = await apiRequest("POST", `/api/lesson-plans/${lessonPlanId}/generate`, {
        teacherNotes: "Generated from uploaded PDF file",
        materialIds: [materialId]
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lesson plan generated",
        description: "Your lesson plan has been generated based on the uploaded PDF.",
      });
      
      // Navigate to view the generated lesson plan
      if (createdLessonPlanId) {
        setLocation(`/lesson-plans/${createdLessonPlanId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate from PDF",
        description: error.message || "An error occurred while generating content from your PDF.",
        variant: "destructive",
      });
      
      // Still navigate to edit page if generation fails
      if (createdLessonPlanId) {
        setLocation(`/lesson-plans/${createdLessonPlanId}/edit`);
      }
    },
  });

  const onSubmit = (data: LessonPlanFormValues) => {
    createMutation.mutate(data);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if file is a PDF
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        toast({
          title: "PDF selected",
          description: `"${file.name}" will be uploaded after creating the lesson plan.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
      }
    }
  };
  
  const uploadPdfToLessonPlan = (lessonPlanId: number, file: File) => {
    uploadPdfMutation.mutate({ lessonPlanId, file });
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => setLocation("/lesson-plans")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Lesson Plans
          </Button>
          <PageTitle title="Create Lesson Plan" subtitle="Set up your new lesson plan" />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#ede8dd]">
          <TabsTrigger value="details" className="data-[state=active]:bg-[#0ba2b0] data-[state=active]:text-white">
            Lesson Details
          </TabsTrigger>
          <TabsTrigger value="pdf" className="data-[state=active]:bg-[#0ba2b0] data-[state=active]:text-white">
            Upload PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="border-t-4 border-t-[#0ba2b0]">
            <CardHeader className="bg-[#ede8dd]/50">
              <CardTitle>Lesson Plan Details</CardTitle>
              <CardDescription>
                Enter the basic information for your lesson plan. You'll be able to add content and generate with AI in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pdfFile && (
                <Alert className="mb-6">
                  <FileText className="h-4 w-4" />
                  <AlertTitle>PDF Selected</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPdfFile(null)}
                    >
                      Remove
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            
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
                            defaultValue={field.value}
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
                            defaultValue={field.value}
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
                          defaultValue={field.value}
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
                      onClick={() => {
                        if (!pdfFile) {
                          setActiveTab("pdf");
                        } else {
                          setPdfFile(null);
                        }
                      }}
                    >
                      {pdfFile ? "Change PDF" : "Add PDF (Optional)"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || uploadingFile}
                    >
                      {createMutation.isPending || uploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadingFile ? "Uploading..." : "Creating..."}
                        </>
                      ) : (
                        "Create & Continue"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card className="border-t-4 border-t-[#0ba2b0]">
            <CardHeader className="bg-[#ede8dd]/50">
              <CardTitle>Upload PDF Content</CardTitle>
              <CardDescription>
                Upload a PDF file to use as content for your lesson plan. Our AI will analyze the PDF and create a lesson plan based on it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-md border border-dashed p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-medium mb-1">Upload PDF File</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Upload a PDF file such as a textbook chapter, article, or existing materials. 
                  The AI will analyze this content and help create your lesson plan.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    id="pdf-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="application/pdf"
                  />
                  <Button
                    variant="outline"
                    className="relative z-10"
                  >
                    Choose PDF File
                  </Button>
                </div>
              </div>
              
              {pdfFile && (
                <Alert className="mb-6">
                  <FileText className="h-4 w-4" />
                  <AlertTitle>PDF Selected</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPdfFile(null)}
                    >
                      Remove
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <Separator className="my-6" />
              
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">How it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm pl-1">
                  <li>Upload a PDF file with your educational content</li>
                  <li>Fill in the basic lesson plan details</li>
                  <li>The AI will analyze your PDF and extract key information</li>
                  <li>A complete lesson plan will be generated based on your content</li>
                  <li>You can edit and refine the generated lesson plan as needed</li>
                </ol>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                >
                  Continue to Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}