import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, QuizQuestion, QuizOption, Class, InsertQuizAnswer } from '@shared/schema';
import { getImageProps } from '@/lib/image-utils';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { normalizeUrlPath, joinUrlPaths } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { QuizCelebration } from '@/components/quiz-celebration';

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
  // State for celebration animation
  const [showCelebration, setShowCelebration] = useState(false);
  
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
      
      // Show celebration animation for correct answers
      setShowCelebration(true);
      
      // After animation completes, move to next question or show score
      setTimeout(() => {
        setShowCelebration(false);
        
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
          showScore();
        }
      }, 2000);
    } else {
      // For incorrect answers, immediately move to next question or show score
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        showScore();
      }
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
  
  // Add a loading state when questions aren't loaded yet
  if (!currentQuestion) {
    return (
      <div className="bg-card rounded-xl border p-6 shadow-sm h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading quiz questions...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm h-full flex flex-col relative">
      {/* Add celebration animation component with absolute positioning over the content */}
      <QuizCelebration 
        visible={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      
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
            Question {currentQuestionIndex + 1} of {questions?.length || 0}
          </div>
        </div>
        
        {/* Question text - centered, larger and more prominent */}
        <div className="text-3xl font-bold text-center px-6 py-4 bg-primary/10 rounded-lg w-full shadow-sm mb-4">
          {currentQuestion.question}
        </div>
        
        {/* Image container - larger with fullscreen capabilities */}
        {currentQuestion.imageUrl && (
          <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg p-1 min-h-[65vh] relative">
            {/* Add loading state */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
            
            <ImageWithFallback 
              src={currentQuestion.imageUrl}
              alt={`Question ${currentQuestionIndex + 1}`}
              className="rounded-md object-contain max-h-[62vh] w-auto max-w-[98%] z-10 relative"
              isQuizImage={true}
              onLoadSuccess={() => {
                console.log(`Quiz question image loaded successfully: ${currentQuestion.imageUrl}`);
              }}
              onLoadError={() => {
                console.log(`Quiz image failed to load: ${currentQuestion.imageUrl || 'no image'}`);
                
                // Extract filename for better error reporting
                const filename = currentQuestion.imageUrl ? currentQuestion.imageUrl.split(/[\/\\]/).pop() : null;
                
                if (filename) {
                  // Clean up any query parameters
                  const cleanFilename = filename.split('?')[0];
                  const timestamp = Date.now();
                  
                  // Log detailed troubleshooting info
                  console.log(`Quiz image troubleshooting - Question ID: ${currentQuestion.id}`);
                  console.log(`Original imageUrl: ${currentQuestion.imageUrl}`);
                  console.log(`Extracted filename: ${cleanFilename}`);
                  
                  // Log possible URLs that could work
                  const apiUrl = `${window.location.origin}/api/images/${cleanFilename}?t=${timestamp}`;
                  const uploadsUrl = `${window.location.origin}/uploads/images/${cleanFilename}?t=${timestamp}`;
                  
                  console.log(`Possible direct API URL: ${apiUrl}`);
                  console.log(`Possible direct uploads URL: ${uploadsUrl}`);
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
              className="gap-2 px-8 py-6 text-lg"
              size="lg"
            >
              <CheckCircle2 className="h-6 w-6" />
              Correct
            </Button>
            <Button 
              onClick={() => selectAnswer(false)}
              variant="outline"
              className="gap-2 px-8 py-6 text-lg hover:bg-muted/50 hover:border-destructive/50 transition-colors"
              size="lg"
            >
              <XCircle className="h-6 w-6" />
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
                className="justify-start h-auto py-4 px-6 text-left text-lg hover:bg-muted/50 hover:border-primary/50 transition-colors"
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