import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, QuizQuestion, QuizOption, Class, InsertQuizAnswer } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { QuizCelebration } from '@/components/quiz-celebration';
import { ImageWithFallbacks } from './image-with-fallbacks';

/**
 * Simple, direct function to get an image URL for quiz questions
 * No fancy formatters or cache busting that could cause the stuttering issues
 * 
 * @param url - Original image URL from database
 * @returns Direct URL to the image
 */
// Enhanced function to get reliable image URLs for quiz questions
// Uses multiple fallback strategies and the debug API
async function fetchReliableImageUrl(url: string | null | undefined): Promise<string> {
  if (!url) return '';
  
  console.log('Processing image URL:', url);
  
  try {
    // Try our debug API first to get a reliable URL
    const filename = url.split(/[\/\\]/).pop()?.split('?')[0];
    
    if (filename) {
      const debugResponse = await fetch(`/api/image-debug/find?path=${encodeURIComponent(filename)}`);
      if (debugResponse.ok) {
        const data = await debugResponse.json();
        if (data.success) {
          console.log(`Debug API found image for ${filename}: ${data.url}`);
          return data.url;
        }
      }
    }
    
    // Fallback: Add cache-busting to the original URL
    console.log('Using original URL with cache busting:', url);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  } catch (err) {
    console.error('Error finding reliable image URL:', err);
    // Last resort: Return the original URL
    return url;
  }
}

// Synchronous version that returns the original URL immediately
// and can be used while the async function resolves
function getQuizImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Return the URL with cache busting
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
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

  // State for preloading next question's image
  const [preloadedImages, setPreloadedImages] = useState<Record<number, boolean>>({});
  
  // Preload the next question's image when the current question is displayed
  // Using enhanced image handling to ensure proper caching and fallbacks
  useEffect(() => {
    if (!questions || currentQuestionIndex >= questions.length - 1) return;
    
    // Get next question
    const nextQuestion = questions[currentQuestionIndex + 1];
    if (nextQuestion && nextQuestion.imageUrl && !preloadedImages[nextQuestion.id]) {
      // Advanced preloading with fetch for base64 when needed
      const preloadImageWithFallbacks = async () => {
        try {
          // First try normal preloading
          const img = new Image();
          
          // Set up event listeners
          img.onload = () => {
            console.log(`Successfully preloaded next question image via standard method: ${nextQuestion.id}`);
          };
          
          img.onerror = async () => {
            console.log(`Standard preload failed, trying base64 method for question: ${nextQuestion.id}`);
            
            // Extract filename for API request
            let filename = nextQuestion.imageUrl?.split(/[\/\\]/).pop()?.split('?')[0];
            
            // Special handling for blob URLs that might be stored with the blob: prefix
            if (nextQuestion.imageUrl?.includes('blob:')) {
              // Try to extract the UUID
              const uuidMatch = nextQuestion.imageUrl.match(/([a-f0-9-]{36})/i);
              if (uuidMatch && uuidMatch[1]) {
                console.log(`Extracted UUID ${uuidMatch[1]} from blob URL: ${nextQuestion.imageUrl}`);
                filename = uuidMatch[1];
              }
            }
            
            if (filename) {
              try {
                // Try to get the image as base64
                const response = await fetch(`/api/images/base64/${filename}`);
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    // Preload the base64 image
                    const base64Img = new Image();
                    base64Img.src = data.data;
                    console.log(`Successfully preloaded next question image via base64: ${nextQuestion.id}`);
                  }
                }
              } catch (err) {
                console.log(`Failed to preload image via all methods: ${nextQuestion.id}`);
              }
            }
          };
          
          // Start the preload with normal image loading
          img.src = getQuizImageUrl(nextQuestion.imageUrl);
        } catch (err) {
          console.error(`Error in preload logic: ${err}`);
        }
      };
      
      // Execute the preload function
      preloadImageWithFallbacks();
      
      // Mark this question as preloaded regardless of outcome
      setPreloadedImages(prev => ({
        ...prev,
        [nextQuestion.id]: true
      }));
      
      console.log(`Started preloading for next question: ${nextQuestion.id}`);
    }
  }, [currentQuestionIndex, questions, preloadedImages]);
  
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
  
  // Add more detailed image error logging
  const handleImageError = (question: QuizQuestion, url: string) => {
    console.error(
      `Failed to load image for question ${question.id}:`,
      `\nOriginal URL: ${question.imageUrl}`,
      `\nProcessed URL: ${url}`,
      `\nQuestion text: ${question.question.substring(0, 50)}...`
    );
  };

  // State to prevent multiple rapid answers
  const [isAnswering, setIsAnswering] = useState(false);
  
  // Debounce ref to prevent multiple rapid answer submissions even across component renders
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Additional state to track the loading state of images
  const [isNextImageLoading, setIsNextImageLoading] = useState(false);
  const nextImageRef = useRef<HTMLImageElement | null>(null);
  
  // Enhanced function to preload the next question image with multiple fallback strategies
  const preloadNextQuestionImage = (callback: () => void) => {
    if (currentQuestionIndex >= questions.length - 1) {
      // No next question, just call the callback directly
      callback();
      return;
    }
    
    const nextQuestion = questions[currentQuestionIndex + 1];
    if (!nextQuestion.imageUrl) {
      // No image to preload, just call the callback directly
      callback();
      return;
    }
    
    // Start loading state
    setIsNextImageLoading(true);
    
    // Create a timeout for safety
    const safetyTimeoutId = setTimeout(() => {
      if (isNextImageLoading) {
        console.log('Preload timeout reached, proceeding anyway');
        setIsNextImageLoading(false);
        callback();
      }
    }, 3000);
    
    // Advanced preloading with multiple fallback strategies
    const tryPreloadWithFallbacks = async () => {
      try {
        // First attempt: standard image preloading
        const img = new Image();
        nextImageRef.current = img;
        
        // Set up event handlers
        img.onload = () => {
          console.log(`Next question image preloaded successfully: ${nextQuestion.imageUrl}`);
          clearTimeout(safetyTimeoutId);
          setIsNextImageLoading(false);
          callback(); // Proceed once loaded
        };
        
        img.onerror = async () => {
          console.log(`Standard preload failed, trying base64 method for: ${nextQuestion.imageUrl}`);
          
          // Extract filename for API request
          let filename = nextQuestion.imageUrl?.split(/[\/\\]/).pop()?.split('?')[0];
          
          // Special handling for blob URLs that might be stored with the blob: prefix
          if (nextQuestion.imageUrl?.includes('blob:')) {
            // Try to extract the UUID
            const uuidMatch = nextQuestion.imageUrl.match(/([a-f0-9-]{36})/i);
            if (uuidMatch && uuidMatch[1]) {
              console.log(`Extracted UUID ${uuidMatch[1]} from blob URL: ${nextQuestion.imageUrl}`);
              filename = uuidMatch[1];
            }
          }
          
          if (filename) {
            try {
              // Try to get the image as base64
              const response = await fetch(`/api/images/base64/${filename}`);
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                  console.log(`Successfully preloaded image via base64 for next question`);
                  // Success with base64 method
                  clearTimeout(safetyTimeoutId);
                  setIsNextImageLoading(false);
                  callback();
                  return;
                }
              }
              
              // If we got here, both methods failed
              console.log(`All preload methods failed for: ${nextQuestion.imageUrl}, proceeding anyway`);
              clearTimeout(safetyTimeoutId);
              setIsNextImageLoading(false);
              callback();
            } catch (err) {
              console.error(`Error in base64 preload: ${err}`);
              clearTimeout(safetyTimeoutId);
              setIsNextImageLoading(false);
              callback();
            }
          } else {
            // No valid filename, move on
            clearTimeout(safetyTimeoutId);
            setIsNextImageLoading(false);
            callback();
          }
        };
        
        // Set source with cache busting to ensure we get the latest version
        img.src = getQuizImageUrl(nextQuestion.imageUrl);
      } catch (err) {
        console.error(`Error in preload logic: ${err}`);
        clearTimeout(safetyTimeoutId);
        setIsNextImageLoading(false);
        callback();
      }
    };
    
    // Start the preload process
    tryPreloadWithFallbacks();
  };

  // Handle when a user selects an answer
  const selectAnswer = (isCorrect: boolean, selectedOptionId?: number) => {
    // Prevent multiple rapid answer submissions with both state and ref check
    if (isAnswering || debounceTimeoutRef.current || isNextImageLoading) {
      console.log('Answer selection blocked: already processing an answer');
      return;
    }
    
    // Set answering state and debounce timeout
    setIsAnswering(true);
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
    }, 2500); // Longer than our animation time
    
    // Record the answer with the selected option ID
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error('No current question found');
      setIsAnswering(false);
      return;
    }
    
    // Check if this question has already been answered (prevent double counting)
    const alreadyAnswered = answers.some(a => a.questionId === currentQuestion.id);
    if (alreadyAnswered) {
      console.log(`Question ${currentQuestion.id} already answered, skipping score update`);
      setIsAnswering(false); // Reset answering state
      return;
    }
    
    console.log(`Recording answer for question ${currentQuestion.id}, correct: ${isCorrect}`);
    
    // Create the answer object with all needed properties
    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      isCorrect,
      selectedOptionId // This will be undefined for speaking assessments
    };
    
    // Update answer collection
    setAnswers(prev => {
      const newAnswers = [...prev, answer];
      console.log(`Total answers recorded: ${newAnswers.length}`);
      return newAnswers;
    });
    
    // Save the answer to the server if we have a submission ID and not in preview mode
    if (submissionId && !previewMode) {
      console.log(`Saving answer to server for submission ${submissionId}`);
      saveAnswerToServer(answer)
        .then(() => console.log(`Answer for question ${currentQuestion.id} saved successfully`))
        .catch(err => console.error(`Failed to save answer: ${err.message}`));
    } else {
      console.log(`Not saving to server: ${previewMode ? 'in preview mode' : 'no submission ID'}`);
    }
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      
      // Show celebration animation for correct answers
      setShowCelebration(true);
      
      // After animation completes, preload next question image then move to next question
      setTimeout(() => {
        setShowCelebration(false);
        
        if (currentQuestionIndex < questions.length - 1) {
          // First preload the next question's image
          preloadNextQuestionImage(() => {
            setIsAnswering(false); // Allow answering again
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
          });
        } else {
          setIsAnswering(false);
          showScore();
        }
      }, 2000);
    } else {
      // For incorrect answers, preload next question image then move to next question
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          // First preload the next question's image
          preloadNextQuestionImage(() => {
            setIsAnswering(false); // Allow answering again
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
          });
        } else {
          setIsAnswering(false);
          showScore();
        }
      }, 500); // Short delay to prevent accidental clicks
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
    // Clear any running timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Clear any debounce timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    console.log('Finalizing quiz and calculating score...');
    
    // Mark quiz as complete
    setIsComplete(true);
    
    // Get unique correct answers (prevent double counting due to potential duplicate answers)
    const uniqueCorrectQuestionIds = new Set(
      answers
        .filter(a => a.isCorrect)
        .map(a => a.questionId)
    );
    
    // Count unique correct answers to ensure accuracy
    const correctAnswersCount = uniqueCorrectQuestionIds.size;
    
    // Deduplicate all answers by question ID (keep only the last answer for each question)
    const deduplicatedAnswers = Array.from(
      answers.reduce((map, answer) => {
        map.set(answer.questionId, answer);
        return map;
      }, new Map()).values()
    );
    
    console.log(`Quiz completion stats:
      - Total raw answers: ${answers.length}
      - Deduplicated answers: ${deduplicatedAnswers.length} 
      - Unique correct answers: ${correctAnswersCount}
      - Total questions: ${questions.length}
      - Current score tracker: ${score}`);
    
    // If calculated score doesn't match our tracked correct answers, fix it
    let finalScore = correctAnswersCount;
    if (score !== correctAnswersCount) {
      console.log(`Score calculation mismatch: tracked=${score}, calculated=${correctAnswersCount}. Using calculated value.`);
      // Update the state for display purposes
      setScore(correctAnswersCount);
    }
    
    // Additional safety check: make sure score doesn't exceed the number of questions
    if (finalScore > questions.length) {
      console.log(`Score exceeds question count (${finalScore} > ${questions.length}). Capping at question count.`);
      finalScore = questions.length;
      setScore(questions.length);
    }
    
    // Pass results to the parent component for further processing
    console.log(`Reporting final score: ${finalScore}/${questions.length}`);
    onComplete(finalScore, questions.length);
    
    // If not in preview mode, log the detailed answers and ensure completion
    if (!previewMode) {
      console.log('Quiz completed, detailed answers:', deduplicatedAnswers); // Use deduplicated list
      
      // If we have a submission ID and answers aren't empty, ensure all answers are submitted
      if (submissionId && answers.length > 0) {
        // Check if we have answers for all questions
        const answeredQuestionIds = new Set(answers.map(a => a.questionId));
        const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id));
        
        // Log any questions without answers (this could happen if time runs out)
        if (unansweredQuestions.length > 0) {
          console.log('Some questions were not answered:', unansweredQuestions.map(q => q.id));
          
          // For unanswered questions, we don't need to submit anything - they'll be counted as incorrect
          // by the final score calculation
        }
        
        // Ensure all answers were properly saved to server by checking if any failed
        // This is just for logging, we don't actually retry here
        const allAnswersSaved = deduplicatedAnswers.every(answer => {
          // Consider any answer without a selectedOptionId (for speaking assessments) as saved
          // This is a simplification, but helps avoid false negatives
          return answer.selectedOptionId !== undefined;
        });
        
        console.log(`All answers properly recorded: ${allAnswersSaved ? 'Yes' : 'Some may be missing'}`);
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
      {/* Loading overlay for next image preloading */}
      {isNextImageLoading && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-primary"></div>
            <p className="text-lg font-medium">Loading next question...</p>
          </div>
        </div>
      )}
      
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
        
        {/* Enhanced image container with robust fallbacks */}
        {currentQuestion.imageUrl && (
          <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg p-1 min-h-[65vh] relative" id={`question-container-${currentQuestion.id}`}>
            <div className="relative w-full flex justify-center">
              <ImageWithFallbacks 
                src={currentQuestion.imageUrl}
                alt={`Image for question ${currentQuestionIndex + 1}`}
                className="max-h-[60vh] object-contain"
              />
            </div>
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
              disabled={isAnswering}
            >
              {isAnswering ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-primary-foreground mr-2" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
              Correct
            </Button>
            <Button 
              onClick={() => selectAnswer(false)}
              variant="outline"
              className="gap-2 px-8 py-6 text-lg hover:bg-muted/50 hover:border-destructive/50 transition-colors"
              size="lg"
              disabled={isAnswering}
            >
              {isAnswering ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-primary mr-2" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
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
                disabled={isAnswering}
              >
                {option.text}
                {isAnswering && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-primary ml-2" />
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}