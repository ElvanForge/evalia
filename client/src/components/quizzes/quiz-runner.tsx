import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, QuizQuestion, QuizOption, Class, InsertQuizAnswer } from '@shared/schema';
import { getImageProps } from '@/lib/image-utils';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { normalizeUrlPath, joinUrlPaths } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

/**
 * Helper function to get the properly formatted URL for quiz images
 * Uses the new direct API endpoint with proper URL path joining
 */
function getQuizImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Extract the filename from the URL path
  const filename = url.split(/[\/\\]/).pop();
  
  // Clean up any query parameters
  const cleanFilename = filename?.split('?')[0];
  
  if (!cleanFilename) return '';
  
  // Use path joining to ensure proper URL formatting
  const apiPath = joinUrlPaths('/api/images', cleanFilename) + `?t=${Date.now()}`;
  
  // Return the direct API endpoint with cache busting
  return `${window.location.origin}${apiPath}`;
}

// Interface for our internal answer tracking
interface QuizAnswer {
  questionId: number;
  selectedOptionId?: number; // For multiple choice questions
  isCorrect: boolean;
  speakingAnswer?: string; // For speaking questions
}

interface QuizRunnerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  options: Record<number, QuizOption[]>;
  onComplete: (correctAnswers: number, totalQuestions: number) => void;
  previewMode?: boolean;
  classInfo?: Class; // Optional class information that contains grade level
  onBackToDetails?: () => void; // New callback to handle navigation back to quiz details
  submissionId?: number; // Optional submission ID for saving answers
}

export function QuizRunner({
  quiz,
  questions,
  options,
  onComplete,
  previewMode = false,
  classInfo,
  onBackToDetails,
  submissionId
}: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  // Enhanced answer tracking to include selected option IDs
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a dynamic title that includes grade level if available
  const getFormattedTitle = () => {
    if (classInfo?.gradeLevel) {
      return `Grade ${classInfo.gradeLevel} ${quiz.title}`;
    }
    return quiz.title;
  };

  // Setup timer
  useEffect(() => {
    if (!timeLeft || isComplete) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          // Time's up!
          clearInterval(timerRef.current!);
          showScore();
          return 0;
        }
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, isComplete]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle when a user selects an answer
  const selectAnswer = (isCorrect: boolean, selectedOptionId?: number) => {
    // Record the answer with the selected option ID
    const currentQuestion = questions[currentQuestionIndex];
    
    // Create the answer object with all needed properties
    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      isCorrect,
      selectedOptionId // This will be undefined for speaking assessments
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Save the answer to the server if we have a submission ID and not in preview mode
    if (submissionId && !previewMode) {
      saveAnswerToServer(answer);
    }
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      showScore();
    }
  };
  
  // Function to save an answer to the server
  const saveAnswerToServer = async (answer: QuizAnswer) => {
    if (!submissionId) return;
    
    try {
      // Format the answer according to the API requirements
      const answerData: InsertQuizAnswer = {
        submissionId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.isCorrect,
        speakingAnswer: answer.speakingAnswer
      };
      
      // Make the API request
      await apiRequest(
        "POST", 
        `/api/quiz-submissions/${submissionId}/answers`, 
        answerData
      );
      
      console.log(`Answer for question ${answer.questionId} saved successfully`);
    } catch (error) {
      console.error("Error saving quiz answer:", error);
    }
  };

  // Show final score and finalize the quiz session
  const showScore = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsComplete(true);
    
    // Pass results to the parent component for further processing
    onComplete(score, questions.length);
    
    // If not in preview mode, log the detailed answers
    if (!previewMode) {
      console.log('Quiz completed, detailed answers:', answers);
      
      // If we have a submission ID and answers aren't empty, ensure all answers are submitted
      if (submissionId && answers.length > 0) {
        // Check if we have answers for all questions
        const answeredQuestionIds = answers.map(a => a.questionId);
        const unansweredQuestions = questions.filter(q => !answeredQuestionIds.includes(q.id));
        
        // Log any questions without answers (this could happen if time runs out)
        if (unansweredQuestions.length > 0) {
          console.log('Some questions were not answered:', unansweredQuestions.map(q => q.id));
        }
      }
    }
  };

  if (!questions.length) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No questions available</h3>
        <p className="text-muted-foreground mt-1">This quiz doesn't have any questions yet.</p>
      </div>
    );
  }

  if (isComplete) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="bg-card rounded-xl border p-8 shadow-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">{getFormattedTitle()}</h2>
          <div className="text-xl font-bold text-primary">Quiz Complete!</div>
        </div>
        
        <div className="bg-muted p-6 rounded-lg mb-6">
          <div className="text-lg mb-2">Your Score</div>
          <div className="text-3xl font-bold mb-1">{score} / {questions.length}</div>
          <div className="text-muted-foreground">{percentage.toFixed(1)}%</div>
        </div>
        
        {/* Visually represent score */}
        <div className="w-full bg-muted rounded-full h-4 mb-6 overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {previewMode && (
          <div className="p-4 border border-dashed border-muted-foreground rounded-md mb-6">
            <p className="text-muted-foreground">
              This is a preview. In a real quiz, results would be recorded.
            </p>
          </div>
        )}
        
        {/* Back to quiz details button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={onBackToDetails}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Details
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // Ensure currentOptions is always an array
  const currentOptions = Array.isArray(options[currentQuestion?.id]) 
    ? options[currentQuestion?.id] 
    : [];
  
  // Find the correct option
  const correctOption = currentOptions.find(option => option.isCorrect);

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm h-full flex flex-col">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-semibold text-center mb-2">{getFormattedTitle()}</h2>
        
        {timeLeft !== null && (
          <div className="flex items-center bg-muted px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            Time remaining: {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <div className="mb-8 flex-grow flex flex-col">
        <div className="flex items-center mb-2">
          <div className="bg-primary/10 text-primary text-sm font-medium rounded-full px-3 py-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        
        {/* Question text - centered, larger and more prominent */}
        <div className="text-2xl font-semibold text-center px-4 py-3 bg-muted/30 rounded-lg w-full">
          {currentQuestion.question}
        </div>
        
        {/* Image container - larger with fullscreen capabilities */}
        {currentQuestion.imageUrl && (
          <div className="w-full flex items-center justify-center bg-muted/50 rounded-lg p-4 min-h-[400px]">
            <ImageWithFallback 
              src={currentQuestion.imageUrl}
              alt={`Question ${currentQuestionIndex + 1}`}
              className="rounded-md object-contain max-h-[380px] max-w-[90%]"
              isQuizImage={true}
              onLoadSuccess={() => console.log(`Quiz question image loaded successfully: ${currentQuestion.imageUrl}`)}
              onLoadError={() => {
                console.log(`Quiz image failed to load. Trying direct API URL for: ${currentQuestion.imageUrl || 'no image'}`);
                
                // Directly log the exact image path we're working with using our path utilities
                const filename = currentQuestion.imageUrl ? currentQuestion.imageUrl.split(/[\/\\]/).pop() : null;
                
                if (filename) {
                  // Clean up any query parameters
                  const cleanFilename = filename.split('?')[0];
                  
                  // Use our URL joining utility for consistent paths
                  const apiPath = joinUrlPaths('/api/images', cleanFilename);
                  const fullApiUrl = `${window.location.origin}${apiPath}`;
                  
                  // Generate upload direct access path with proper joining
                  const uploadsPath = joinUrlPaths('/uploads/images', cleanFilename);
                  const directUrl = `${window.location.origin}${uploadsPath}`;
                  
                  console.log("Image troubleshooting info:", {
                    originalUrl: currentQuestion.imageUrl || null,
                    extractedFilename: cleanFilename,
                    apiPath: apiPath,
                    fullApiUrl: fullApiUrl,
                    questionId: currentQuestion.id
                  });
                  
                  console.log(`Also trying direct file URL: ${directUrl}`);
                  
                  // Add a message in the console with debugging URLs to help developers
                  console.log(`Try accessing these URLs directly to debug:
                  1. ${fullApiUrl}
                  2. ${directUrl}
                  3. ${currentQuestion.imageUrl || 'N/A'}`);
                } else {
                  console.log('No image URLs to debug - filename could not be extracted from:', currentQuestion.imageUrl);
                }
              }}
            />
          </div>
        )}
        
        {/* If no image, add empty space */}
        {!currentQuestion.imageUrl && <div className="flex-grow"></div>}
      </div>
      
      <div>
        {/* For speaking tests or assessments with correct/incorrect */}
        {currentOptions.length <= 2 && (
          <div className="flex justify-center gap-4 mt-6">
            <Button 
              onClick={() => selectAnswer(true)}
              className="gap-2"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5" />
              Correct
            </Button>
            <Button 
              onClick={() => selectAnswer(false)}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <XCircle className="h-5 w-5" />
              Incorrect
            </Button>
          </div>
        )}
        
        {/* For multiple choice questions */}
        {currentOptions.length > 2 && (
          <div className="grid grid-cols-1 gap-3 mt-6">
            {currentOptions.map(option => (
              <Button
                key={option.id}
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left"
                onClick={() => selectAnswer(option.isCorrect || false, option.id)}
              >
                {option.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}