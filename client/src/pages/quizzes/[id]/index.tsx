import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ArrowLeft, Save, Trash2, Plus, Edit, Loader2, Play, PlusCircle, Image
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
import { queryClient } from "@/lib/queryClient";
import { Quiz, QuizQuestion, QuizOption, insertQuizSchema } from "@shared/schema";

const QuizDetail = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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

  const form = useForm<z.infer<typeof insertQuizSchema>>({
    resolver: zodResolver(insertQuizSchema),
    defaultValues: {
      title: "",
      description: null,
      classId: null,
      isActive: false,
      timeLimit: null,
    },
  });

  // Update form when quiz data is loaded
  useState(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        description: quiz.description,
        classId: quiz.classId,
        isActive: quiz.isActive || false,
        timeLimit: quiz.timeLimit,
      });
    }
  });

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertQuizSchema>) => {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quiz");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Updated",
        description: "Your quiz has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
    onError: () => {
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
      const response = await fetch(`/api/quizzes/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quiz");
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
    onError: () => {
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

  const onSubmit = (data: z.infer<typeof insertQuizSchema>) => {
    updateQuizMutation.mutate(data);
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
        <QuestionFormDialog
          open={isAddingQuestion}
          onOpenChange={setIsAddingQuestion}
          quizId={parseInt(id as string)}
          questionToEdit={null}
        />
        
        {/* Edit Question Dialog */}
        {editingQuestion && (
          <QuestionFormDialog
            open={!!editingQuestion}
            onOpenChange={(open) => !open && setEditingQuestion(null)}
            quizId={parseInt(id as string)}
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
                  type="submit"
                  form="quiz-edit-form"
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
            <form id="quiz-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
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

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Manage quiz questions and answers
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddingQuestion(true)}>
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