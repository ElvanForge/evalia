import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Quiz, QuizQuestion, QuizOption, Student } from "@shared/schema";
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
  const [completed, setCompleted] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [results, setResults] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    studentId?: number;
  } | null>(null);
  
  // Add toggle for preview mode vs. grading mode - moved up here to avoid the initialization error
  const [previewMode, setPreviewMode] = useState(true);

  // Fetch quiz data
  const {
    data: quiz,
    isLoading: isLoadingQuiz,
    error: quizError,
  } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
    enabled: !!id,
  });

  // Fetch quiz questions
  const {
    data: questions,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quizzes/${id}/questions`],
    enabled: !!id,
  });

  // Fetch options for all questions
  const {
    data: optionsRaw,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useQuery<Record<string, QuizOption[]>>({
    queryKey: [`/api/quizzes/${id}/options`],
    enabled: !!id && !!questions?.length,
  });

  // Format options to match the expected structure
  const options = optionsRaw
    ? Object.entries(optionsRaw).reduce((acc, [questionId, opts]) => {
        acc[parseInt(questionId)] = opts;
        return acc;
      }, {} as Record<number, QuizOption[]>)
    : {};
    
  // Fetch class information if quiz is assigned to a class
  const {
    data: classInfo,
    isLoading: isLoadingClass,
  } = useQuery<Class>({
    queryKey: [`/api/classes/${quiz?.classId}`],
    enabled: !!quiz?.classId,
  });

  // Fetch students for the class if quiz is assigned to a class
  const {
    data: students,
    isLoading: isLoadingStudents,
  } = useQuery<Student[]>({
    queryKey: [`/api/classes/${quiz?.classId}/students`],
    enabled: !!quiz?.classId && !previewMode,
  });

  const handleComplete = (correctAnswers: number, totalQuestions: number) => {
    setCompleted(true);
    setResults({ 
      correctAnswers, 
      totalQuestions,
      studentId: selectedStudentId || undefined
    });
  };

  const isLoading = isLoadingQuiz || isLoadingQuestions || isLoadingOptions || (quiz?.classId && isLoadingClass);
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
            onClick={() => setLocation(`/quizzes/${id}`)}
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

  return (
    <Layout title={`Preview: ${getFormattedTitle()}`}>
      <div className="space-y-6">
        <PageHeader
          title={getFormattedTitle()}
          description={previewMode ? "Preview mode - results will not be saved" : "Administering quiz"}
          actions={
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/quizzes/${id}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz Details
            </Button>
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
                    {student.firstName} {student.lastName}
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

        {/* Only show quiz if in preview mode or a student is selected */}
        {(previewMode || selectedStudentId) ? (
          <QuizRunner
            quiz={quiz}
            questions={questions}
            options={options}
            onComplete={handleComplete}
            previewMode={previewMode}
            classInfo={classInfo}
          />
        ) : (
          <div className="bg-muted p-6 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Student Selection Required</h3>
            <p className="text-muted-foreground">
              Please select a student above to administer this quiz.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizPreview;