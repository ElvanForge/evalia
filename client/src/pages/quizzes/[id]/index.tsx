import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ArrowLeft, Save, Trash2, Plus, Edit, Loader2, Play, PlusCircle, Image, Users, Download
} from "lucide-react";
import { getImageProps } from "@/lib/image-utils";
import Layout from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { QuestionFormDialog } from "@/components/quizzes/question-form-dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";
import { Quiz, QuizQuestion, QuizOption, quizFormSchema } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const QuizDetail = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  // Fetch quiz data
  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
    enabled: !!id,
  });

  // Fetch quiz questions
  const {
    data: questions,
    isLoading: isLoadingQuestions,
  } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quizzes/${id}/questions`],
    enabled: !!id,
  });

  // Fetch options for all questions
  const {
    data: optionsRaw,
    isLoading: isLoadingOptions,
  } = useQuery<Record<string, QuizOption[]>>({
    queryKey: [`/api/quizzes/${id}/options`],
    enabled: !!id && !!questions?.length,
  });
  
  // Process options to ensure we have a numeric index
  console.log("Options data from API:", optionsRaw);
  const options = optionsRaw ? Object.entries(optionsRaw).reduce((acc, [questionId, questionOptions]) => {
    console.log(`Processing options for question ${questionId}:`, questionOptions);
    acc[parseInt(questionId)] = questionOptions || [];
    return acc;
  }, {} as Record<number, QuizOption[]>) : {};
  console.log("Processed options:", options);

  // Fetch classes for dropdown
  const {
    data: classes,
  } = useQuery({
    queryKey: ["/api/classes"],
  });
  
  // Fetch assigned classes for this quiz
  const {
    data: assignedClasses,
    isLoading: isLoadingAssignedClasses,
    refetch: refetchAssignedClasses
  } = useQuery({
    queryKey: [`/api/quizzes/${id}/classes`],
    enabled: !!id,
  });
  
  // State for class assignment management
  const [isEditingClasses, setIsEditingClasses] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  
  // Update selectedClassIds when assigned classes are loaded
  useEffect(() => {
    if (assignedClasses?.length) {
      setSelectedClassIds(assignedClasses.map(c => c.id));
    } else {
      setSelectedClassIds([]);
    }
  }, [assignedClasses]);
  
  // Mutation for updating class assignments
  const updateClassAssignmentsMutation = useMutation({
    mutationFn: async (classIds: number[]) => {
      console.log("Updating quiz class assignments with class IDs:", classIds);
      
      try {
        // Use the apiRequest.post utility for consistent authentication handling
        const result = await apiRequest.post(`/api/quizzes/${id}/classes`, { classIds });
        console.log("Class assignments update successful:", result);
        return result;
      } catch (error) {
        console.error("Error in class assignments update:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Classes Updated",
        description: "Your quiz has been assigned to the selected classes.",
      });
      setIsEditingClasses(false);
      refetchAssignedClasses();
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was a problem updating class assignments.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: null,
      classId: null,
      isActive: false,
      timeLimit: null,
    },
  });

  // Update form when quiz data is loaded
  useEffect(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        description: quiz.description,
        classId: quiz.classId,
        isActive: quiz.isActive || false,
        timeLimit: quiz.timeLimit,
      });
    }
  }, [quiz, form]);

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quizFormSchema>) => {
      console.log("Updating quiz with data:", JSON.stringify(data, null, 2)); 
      
      try {
        // Use the apiRequest.put utility for consistent auth handling
        // apiRequest.put returns the response directly, no need to call .json()
        const result = await apiRequest.put(`/api/quizzes/${id}`, data);
        console.log("Quiz update successful:", result);
        return result;
      } catch (error) {
        console.error("Error in update mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Quiz successfully updated:", data);
      toast({
        title: "Quiz Updated",
        description: "Your quiz has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
    onError: (error) => {
      console.error("Quiz update error:", error);
      toast({
        title: "Update Failed",
        description: "There was a problem updating your quiz.",
        variant: "destructive",
      });
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async () => {
      try {
        // Use apiRequest for DELETE operation
        const response = await apiRequest("DELETE", `/api/quizzes/${id}`);
        console.log("Delete response status:", response.status);
        return response;
      } catch (error) {
        console.error("Error in delete operation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Quiz Deleted",
        description: "Your quiz has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setLocation("/quizzes");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "There was a problem deleting your quiz.",
        variant: "destructive",
      });
    },
  });

  // Format the quiz title to include grade level if available
  const getFormattedTitle = () => {
    if (quiz?.classId && classes) {
      const classInfo = classes.find(c => c.id === quiz.classId);
      if (classInfo?.gradeLevel) {
        return `Grade ${classInfo.gradeLevel} ${quiz.title}`;
      }
    }
    return quiz?.title || "Quiz Detail";
  };

  const onSubmit = (data: z.infer<typeof quizFormSchema>) => {
    console.log("Form submission triggered!");
    console.log("Form submitted with data:", JSON.stringify(data, null, 2));
    console.log("isActive value:", data.isActive, "type:", typeof data.isActive);
    
    // Ensure isActive is properly set as a boolean and teacherId is included
    const formattedData = {
      ...data,
      isActive: data.isActive === true,
      teacherId: user?.id // Add teacherId from component-level useAuth
    };
    
    console.log("Formatted data for submission:", JSON.stringify(formattedData, null, 2));
    console.log("Quiz ID:", id);
    
    try {
      // Convert ID to a number to ensure it's not treated as a string
      const quizId = parseInt(id as string);
      if (isNaN(quizId)) {
        throw new Error(`Invalid quiz ID: ${id}`);
      }
      
      // Add toast to confirm submission is starting
      toast({
        title: "Saving Changes",
        description: "Updating quiz information...",
      });
      
      updateQuizMutation.mutate(formattedData);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Form Submission Error",
        description: "There was a problem with the form submission.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Quiz Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !quiz) {
    return (
      <Layout title="Error">
        <div className="text-center py-12 text-destructive">
          <p>Failed to load quiz details</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation("/quizzes")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Edit Quiz" : getFormattedTitle()}>
      <div className="space-y-6">
        {/* Add Question Dialog */}
        {isAddingQuestion && (
          <QuestionFormDialog
            open={true}
            onOpenChange={(open) => {
              console.log("Question dialog onOpenChange called with:", open);
              setIsAddingQuestion(open);
            }}
            quizId={Number(id)}
            questionToEdit={null}
          />
        )}
        
        {/* Edit Question Dialog */}
        {editingQuestion && (
          <QuestionFormDialog
            open={true}
            onOpenChange={(open) => {
              console.log("Edit question dialog onOpenChange called with:", open);
              if (!open) setEditingQuestion(null);
            }}
            quizId={Number(id)}
            questionToEdit={editingQuestion}
          />
        )}
        
        <PageHeader
          title={isEditing ? "Edit Quiz" : getFormattedTitle()}
          description={isEditing ? "Update quiz details" : quiz.description || "No description provided"}
          actions={
            isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    console.log("Manual save button clicked");
                    const formValues = form.getValues();
                    console.log("Form values:", formValues);
                    
                    // Validate the form
                    const formState = await form.trigger();
                    console.log("Form validation state:", formState);
                    console.log("Form errors:", form.formState.errors);
                    
                    if (!formState) {
                      console.error("Form validation failed");
                      toast({
                        title: "Form Validation Error",
                        description: "Please check the form for errors",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Ensure all required fields are present and properly formatted
                    const formattedData = {
                      ...formValues,
                      isActive: formValues.isActive === true,
                      teacherId: user?.id // Add teacherId from authenticated user (from component-level useAuth)
                    };
                    
                    console.log("Formatted data for direct submission:", JSON.stringify(formattedData, null, 2));
                    
                    try {
                      // Directly call the API using apiRequest helper
                      const quizId = parseInt(id as string);
                      const response = await apiRequest.put(`/api/quizzes/${quizId}`, formattedData);
                      // For apiRequest, we don't need to call .json() as it handles the response internally
                      const result = response;
                      console.log("Direct API call success:", result);
                      
                      toast({
                        title: "Quiz Updated",
                        description: "Your quiz has been updated successfully.",
                      });
                      
                      setIsEditing(false);
                      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
                      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
                    } catch (error) {
                      console.error("Error in direct API call:", error);
                      toast({
                        title: "Update Error",
                        description: error instanceof Error ? error.message : "Failed to update quiz",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={updateQuizMutation.isPending}
                >
                  {updateQuizMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setLocation("/quizzes")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Quizzes
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/quizzes/${id}/preview`)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="default"
                  onClick={() => setLocation(`/quizzes/${id}/preview?admin=true`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Administer Quiz to Students
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Show loading toast
                            toast({
                              title: "Exporting Scores",
                              description: "Preparing CSV export...",
                            });
                            
                            // Use vanilla fetch directly for blob data - better browser compatibility
                            const response = await fetch('/api/export/quiz-scores', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                quizId: Number(id),
                                format: 'csv'
                              }),
                              credentials: 'include'
                            });
                            
                            console.log("CSV Export response status:", response.status);
                            console.log("CSV Export response headers:", 
                              [...response.headers.entries()].reduce((obj, [key, val]) => {
                                obj[key] = val; 
                                return obj;
                              }, {} as Record<string, string>)
                            );
                            
                            // Handle different response types
                            const contentType = response.headers.get('content-type');
                            console.log("Response content-type:", contentType);
                            
                            if (!response.ok) {
                              // For error responses, try to parse as JSON first
                              if (contentType?.includes('application/json')) {
                                const errorJson = await response.json();
                                throw new Error(errorJson.message || `Export failed: ${response.status}`);
                              } else {
                                const errorText = await response.text();
                                throw new Error(`Export failed: ${response.status} - ${errorText}`);
                              }
                            }
                            
                            // For success response with JSON (no submissions etc)
                            if (contentType?.includes('application/json')) {
                              const jsonResponse = await response.json();
                              console.log("Received JSON response:", jsonResponse);
                              
                              if (jsonResponse.message) {
                                toast({
                                  title: "Export Info",
                                  description: jsonResponse.message,
                                });
                                return; // Exit early
                              }
                            }
                            
                            // Proceed with CSV blob handling for text/csv content
                            const blob = await response.blob();
                            console.log("Received blob:", blob);
                            
                            // Create a download link and trigger download
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `quiz_${id}_scores.csv`);
                            
                            // Append, click, and remove
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up the object URL
                            window.URL.revokeObjectURL(url);
                            
                            toast({
                              title: "Export Successful",
                              description: "Quiz scores have been exported to CSV",
                            });
                          } catch (error) {
                            console.error("Error exporting scores:", error);
                            toast({
                              title: "Export Failed",
                              description: "There was a problem exporting the quiz scores",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Scores (CSV)
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Download student quiz scores as CSV
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        quiz and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteQuizMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteQuizMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          }
        />

        {isEditing ? (
          <Form {...form}>
            <form 
              id="quiz-edit-form" 
              onSubmit={(e) => {
                console.log("Form onSubmit event triggered");
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign to Class</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                // Handle "0" as null (None selection)
                                const parsed = parseInt(value);
                                field.onChange(parsed === 0 ? null : parsed);
                              }}
                              value={field.value?.toString() || "0"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                {classes?.map((c) => (
                                  <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="timeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : null);
                                }}
                                min={1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Make this quiz available to students
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === true}
                              onCheckedChange={(checked) => {
                                console.log("Switch toggled to:", checked);
                                field.onChange(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <p className="font-medium">{quiz.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Time Limit</span>
                    <p className="font-medium">{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Questions</span>
                    <p className="font-medium">{questions?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Class</span>
                    <p className="font-medium">
                      {quiz.classId ? (
                        classes?.find(c => c.id === quiz.classId)?.name || "Unknown class"
                      ) : (
                        "Not assigned"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Class Assignments</CardTitle>
                  <CardDescription>
                    Assign this quiz to multiple classes
                  </CardDescription>
                </div>
                {isEditingClasses ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingClasses(false);
                        // Reset to original values
                        if (assignedClasses?.length) {
                          setSelectedClassIds(assignedClasses.map(c => c.id));
                        } else {
                          setSelectedClassIds([]);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateClassAssignmentsMutation.mutate(selectedClassIds)}
                      disabled={updateClassAssignmentsMutation.isPending}
                    >
                      {updateClassAssignmentsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditingClasses(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Assignments
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingAssignedClasses ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isEditingClasses ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {classes?.map((c) => (
                        <div 
                          key={c.id}
                          className="flex items-center space-x-2 border rounded-lg p-3"
                        >
                          <Checkbox 
                            id={`class-${c.id}`}
                            checked={selectedClassIds.includes(c.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClassIds(prev => [...prev, c.id]);
                              } else {
                                setSelectedClassIds(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`class-${c.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {c.name} {c.gradeLevel ? `(Grade ${c.gradeLevel})` : ""}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : assignedClasses?.length ? (
                  <div className="flex flex-col space-y-2">
                    {assignedClasses.map((c) => (
                      <div 
                        key={c.id} 
                        className="flex items-center rounded-md border p-2"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.gradeLevel && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            Grade {c.gradeLevel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This quiz is not assigned to any classes.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Manage quiz questions and answers
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    console.log("Add Question button clicked, quiz ID:", id);
                    setIsAddingQuestion(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingQuestions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !questions?.length ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No questions added yet</p>
                    <Button variant="outline" onClick={() => setIsAddingQuestion(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <Card key={question.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">
                                Question {index + 1}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {question.question}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {question.imageUrl && (
                            <div className="mt-4">
                              <img 
                                {...getImageProps({
                                  src: question.imageUrl,
                                  alt: "Question image",
                                  className: "max-h-40 object-contain rounded-md border border-border"
                                })}
                              />
                            </div>
                          )}
                        </CardHeader>
                        {isLoadingOptions ? (
                          <CardContent className="pb-4">
                            <div className="flex justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          </CardContent>
                        ) : (
                          <CardContent className="pb-4">
                            {options && options[question.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {options[question.id].map(option => (
                                  <div 
                                    key={option.id}
                                    className={`p-2 rounded-md ${
                                      option.isCorrect 
                                        ? 'bg-primary/10 border border-primary/30' 
                                        : 'bg-muted/40'
                                    }`}
                                  >
                                    {option.isCorrect && (
                                      <span className="text-xs text-primary mr-1">
                                        ✓ Correct:
                                      </span>
                                    )}
                                    {option.text}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No answer options added</p>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizDetail;