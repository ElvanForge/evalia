import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Quiz, QuizQuestion, QuizOption } from "@shared/schema";

const QuizPreview = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

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

  const handleComplete = (correctAnswers: number, totalQuestions: number) => {
    setCompleted(true);
    setResults({ correctAnswers, totalQuestions });
  };

  const isLoading = isLoadingQuiz || isLoadingQuestions || isLoadingOptions;
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

  return (
    <Layout title={`Preview: ${quiz.title}`}>
      <div className="space-y-6">
        <PageHeader
          title={quiz.title}
          description="Preview mode - results will not be saved"
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

        <QuizRunner
          quiz={quiz}
          questions={questions}
          options={options}
          onComplete={handleComplete}
          previewMode={true}
        />
      </div>
    </Layout>
  );
};

export default QuizPreview;