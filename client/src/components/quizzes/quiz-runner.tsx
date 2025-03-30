import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, QuizQuestion, QuizOption, Class } from '@shared/schema';
import { getImageProps } from '@/lib/image-utils';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

interface QuizRunnerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  options: Record<number, QuizOption[]>;
  onComplete: (correctAnswers: number, totalQuestions: number) => void;
  previewMode?: boolean;
  classInfo?: Class; // Optional class information that contains grade level
}

export function QuizRunner({
  quiz,
  questions,
  options,
  onComplete,
  previewMode = false,
  classInfo
}: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  
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

  // Handle when a user selects an answer - following the provided JS file
  const selectAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      showScore();
    }
  };

  // Show final score - following the provided JS file structure
  const showScore = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsComplete(true);
    const percentage = (score / questions.length) * 100;
    onComplete(score, questions.length);
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
          <div className="p-4 border border-dashed border-muted-foreground rounded-md">
            <p className="text-muted-foreground">
              This is a preview. In a real quiz, results would be recorded.
            </p>
          </div>
        )}
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
        
        {/* Question text always at the top */}
        <div className="text-lg font-medium mb-4 w-full">{currentQuestion.question}</div>
        
        {/* Image container as a fixed size - not flexible */}
        {currentQuestion.imageUrl && (
          <div className="w-full flex items-center justify-center bg-muted/50 rounded-lg p-4 min-h-[300px]">
            <ImageWithFallback 
              src={currentQuestion.imageUrl}
              alt={`Question ${currentQuestionIndex + 1}`}
              className="rounded-md object-contain max-h-[280px] max-w-full"
              isQuizImage={true}
              onLoadSuccess={() => console.log(`Quiz question image loaded: ${currentQuestion.imageUrl}`)}
              onLoadError={() => console.log(`Quiz question image failed to load: ${currentQuestion.imageUrl}`)}
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
                onClick={() => selectAnswer(option.isCorrect || false)}
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