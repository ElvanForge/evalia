import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, UserCircle, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import QuizLayout from "@/components/quiz-layout";
import { Quiz, QuizQuestion, QuizOption, Student, Class } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const QuizPreview = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [completed, setCompleted] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [results, setResults] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    studentId?: number;
  } | null>(null);
  
  // Create submission before starting quiz
  const createSubmissionMutation = useMutation({
    mutationFn: async (data: {
      quizId: number;
      studentId: number;
    }) => {
      try {
        const response = await apiRequest(
          "POST", 
          `/api/quizzes/${data.quizId}/submissions`, 
          data
        );
        
        // Check if the response is ok
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create quiz submission');
        }
        
        return await response.json();
      } catch (error: any) {
        console.error("Error creating quiz submission:", error);
        throw new Error(error.message || 'Failed to create quiz submission');
      }
    },
    onSuccess: (data) => {
      // Only show toast and set ID if we got valid data
      if (data && data.id) {
        // Store the submission ID
        setSubmissionId(data.id);
        
        toast({
          title: "Quiz started",
          description: "Ready to record answers",
        });
      } else {
        console.error("Received invalid submission data:", data);
        toast({
          title: "Warning",
          description: "Quiz started but tracking may be limited",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Submission creation error:", error);
      toast({
        title: "Quiz will continue in preview mode",
        description: "Your answers won't be saved: " + error.message,
        variant: "destructive",
      });
      
      // Force preview mode on error
      setPreviewMode(true);
    }
  });
  
  // Create mutation for updating quiz results when completed
  const updateQuizResultMutation = useMutation({
    mutationFn: async (data: {
      submissionId: number;
      score: number;
      maxScore: number;
      completed: boolean;
    }) => {
      try {
        // Map our data to what the server expects
        // The server expects score/maxScore as decimals, not booleans for completion status
        const submissionData = {
          score: data.score,
          maxScore: data.maxScore
          // Server automatically sets completedAt when updating
        };
        
        console.log("Submitting final quiz data:", submissionData);
        
        const response = await apiRequest(
          "PUT", 
          `/api/quiz-submissions/${data.submissionId}`, 
          submissionData
        );
        
        // Check if response is ok
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update quiz submission');
        }
        
        return await response.json();
      } catch (error: any) {
        console.error("Error updating quiz submission:", error);
        throw new Error(error.message || 'Failed to update quiz submission');
      }
    },
    onSuccess: () => {
      toast({
        title: "Quiz completed",
        description: "Student's score has been saved successfully",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudentId}/quiz-submissions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${validId}/submissions`] });
    },
    onError: (error: Error) => {
      console.error("Failed to save final quiz results:", error);
      toast({
        title: "Quiz completed",
        description: "But there was an issue saving the final score. The answers may have been recorded.",
        variant: "default", // Using a less alarming variant since answers might still be saved
      });
    }
  });

  // Add state for tracking submission ID
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  // Parse URL for admin mode parameter
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminMode = searchParams.get('admin') === 'true';
  
  // Add toggle for preview mode vs. grading mode - initialized based on URL parameter
  // If admin=true in URL, we force admin mode (previewMode=false)
  const [previewMode, setPreviewMode] = useState(!isAdminMode);
  
  // We'll only enter fullscreen when a student is selected or we're in preview mode
  // Don't auto-enter fullscreen just because isAdminMode is true
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Update fullscreen state when preview mode changes OR when a student is selected
  useEffect(() => {
    if (previewMode) {
      // In preview mode, user can manually toggle fullscreen
      // We don't auto-enter fullscreen here
    } else if (selectedStudentId) {
      // When in admin mode AND a student is selected, auto-enter fullscreen
      setIsFullscreen(true);
    }
  }, [previewMode, selectedStudentId]);

  // Make sure id is a number for database queries
  const numericId = id ? parseInt(id, 10) : undefined;
  const validId = !isNaN(Number(numericId)) ? numericId : undefined;
  
  // Fetch quiz data
  const {
    data: quiz,
    isLoading: isLoadingQuiz,
    error: quizError,
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${validId}`],
    enabled: !!validId,
  });

  // Fetch quiz questions
  const {
    data: questions,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quizzes/${validId}/questions`],
    enabled: !!validId,
  });

  // Fetch options for all questions
  const {
    data: optionsRaw,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useQuery<Record<string, QuizOption[]>>({
    queryKey: [`/api/quizzes/${validId}/options`],
    enabled: !!validId && !!questions?.length,
  });

  // Format options to match the expected structure
  const options = optionsRaw
    ? Object.entries(optionsRaw).reduce((acc, [questionId, opts]) => {
        acc[parseInt(questionId)] = opts;
        return acc;
      }, {} as Record<number, QuizOption[]>)
    : {};
    
  // Fetch class assignments for this quiz
  const {
    data: assignedClasses,
    isLoading: isLoadingAssignedClasses,
  } = useQuery({
    queryKey: [`/api/quizzes/${validId}/classes`],
    enabled: !!validId,
  });
  
  // Get valid class ID - either the primary classId or the first assigned class
  const validClassId = (quiz?.classId && !isNaN(Number(quiz.classId))) 
    ? quiz.classId 
    : (assignedClasses && assignedClasses.length > 0) 
      ? assignedClasses[0].id 
      : undefined;
  
  // State for selected class when multiple classes are available
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  // Set the selected class to the valid class ID when it becomes available
  useEffect(() => {
    if (validClassId && !selectedClassId) {
      setSelectedClassId(validClassId);
    }
  }, [validClassId, selectedClassId]);
  
  // Use the selected class ID for fetching if available, otherwise use validClassId
  const activeClassId = selectedClassId || validClassId;
  
  // Fetch class information if quiz is assigned to a class
  const {
    data: classInfo,
    isLoading: isLoadingClass,
  } = useQuery<Class>({
    queryKey: [`/api/classes/${activeClassId}`],
    enabled: !!activeClassId,
  });

  // Fetch students for the class if quiz is assigned to a class
  const {
    data: students,
    isLoading: isLoadingStudents,
  } = useQuery<Student[]>({
    queryKey: [`/api/classes/${activeClassId}/students`],
    enabled: !!activeClassId && !previewMode,
  });

  // Function to create a quiz submission when a student is selected
  useEffect(() => {
    // Only create submission when we have a valid quiz ID, student ID, and we're in grading mode
    if (!previewMode && selectedStudentId && validId && !submissionId) {
      createSubmissionMutation.mutate({
        quizId: validId,
        studentId: selectedStudentId
      });
    }
  }, [selectedStudentId, validId, previewMode, submissionId]);
  
  // Handle quiz completion
  const handleComplete = (correctAnswers: number, totalQuestions: number) => {
    setCompleted(true);
    setResults({ 
      correctAnswers, 
      totalQuestions,
      studentId: selectedStudentId || undefined
    });
    
    // If not in preview mode and we have a submission ID, update the quiz results
    if (!previewMode && submissionId) {
      try {
        updateQuizResultMutation.mutate({
          submissionId: submissionId,
          score: correctAnswers,
          maxScore: totalQuestions,
          completed: true
        });
      } catch (error) {
        console.error("Failed to update quiz results:", error);
        toast({
          title: "Quiz completed",
          description: "But there was an issue saving the final score. The individual answers were recorded.",
          variant: "default" 
        });
      }
    }
  };

  // We only add isLoadingStudents to the loading state if we're in admin mode
  const isLoading = 
    isLoadingQuiz || 
    isLoadingQuestions || 
    isLoadingOptions || 
    isLoadingAssignedClasses || 
    (activeClassId && isLoadingClass) || 
    (!previewMode && activeClassId && isLoadingStudents);
  const error = quizError || questionsError || optionsError;

  if (isLoading) {
    return (
      <Layout title="Quiz Preview">
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !quiz || !questions) {
    return (
      <Layout title="Error">
        <div className="space-y-4 text-center py-12">
          <h2 className="text-xl font-semibold text-destructive">Failed to load quiz</h2>
          <p className="text-muted-foreground">
            There was a problem loading the quiz content.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/quizzes/${validId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quiz Details
          </Button>
        </div>
      </Layout>
    );
  }

  // Format the quiz title to include grade level if available
  const getFormattedTitle = () => {
    if (quiz?.classId && classInfo?.gradeLevel) {
      return `Grade ${classInfo.gradeLevel} ${quiz.title}`;
    }
    return quiz?.title || "Quiz Preview";
  };

  // Choose the layout based on fullscreen state
  const LayoutComponent = isFullscreen ? QuizLayout : Layout;

  return (
    <LayoutComponent 
      title={`Preview: ${getFormattedTitle()}`} 
      isFullscreen={isFullscreen}
    >
      <div className={`${isFullscreen ? 'h-full' : 'space-y-6'}`}>
        {/* Only show header when not in fullscreen mode */}
        {!isFullscreen && (
          <>
            <PageHeader
              title={getFormattedTitle()}
              description={previewMode ? "Preview mode - results will not be saved" : "Administering quiz"}
              actions={
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation(`/quizzes/${validId}`)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Quiz Details
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              }
            />
            
            {/* Mode toggle */}
            <div className="flex items-center space-x-4 px-4 py-3 bg-muted rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium">Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {previewMode ? "Preview only" : "Administer quiz to students"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="mode-toggle" className={previewMode ? "text-muted-foreground" : "font-medium"}>Grade Students</Label>
                <Switch
                  id="mode-toggle"
                  checked={!previewMode} 
                  onCheckedChange={(checked) => {
                    setPreviewMode(!checked);
                    // Reset selected student when switching modes
                    if (!checked) setSelectedStudentId(null);
                  }}
                />
              </div>
            </div>
            
            {/* Class selector - only show if multiple classes are assigned and not in preview mode */}
            {!previewMode && assignedClasses && assignedClasses.length > 1 && (
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select class
                </label>
                <Select 
                  value={selectedClassId?.toString()} 
                  onValueChange={(value) => {
                    setSelectedClassId(Number(value));
                    // Reset student selection when changing class
                    setSelectedStudentId(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Student selector - only show if not in preview mode and we have students */}
            {!previewMode && students && students.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow">
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Select student to grade
                </label>
                <Select value={selectedStudentId?.toString()} onValueChange={(value) => setSelectedStudentId(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {!selectedStudentId && (
                  <p className="mt-2 text-sm text-amber-600">
                    Please select a student before starting the quiz
                  </p>
                )}
              </div>
            )}
            
            {/* Show message if there are no students in the selected class */}
            {!previewMode && activeClassId && (!students || students.length === 0) && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800">
                <p className="text-sm">
                  No students are enrolled in the selected class. Please add students to the class before administering the quiz.
                </p>
              </div>
            )}
          </>
        )}

        {/* Only show quiz if in preview mode or a student is selected */}
        {(previewMode || selectedStudentId) ? (
          <div className={isFullscreen ? "h-full" : ""}>
            <QuizRunner
              quiz={quiz}
              questions={questions}
              options={options}
              onComplete={handleComplete}
              previewMode={previewMode}
              classInfo={classInfo}
              onBackToDetails={() => setLocation(`/quizzes/${validId}`)}
              submissionId={submissionId || undefined}
            />
          </div>
        ) : (
          <div className="bg-muted p-6 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Student Selection Required</h3>
            <p className="text-muted-foreground">
              Please select a student above to administer this quiz.
            </p>
          </div>
        )}
      </div>
    </LayoutComponent>
  );
};

export default QuizPreview;