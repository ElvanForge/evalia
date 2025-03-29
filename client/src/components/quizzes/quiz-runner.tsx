import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, QuizQuestion, QuizOption } from '@shared/schema';

interface QuizRunnerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  options: Record<number, QuizOption[]>;
  onComplete: (correctAnswers: number, totalQuestions: number) => void;
  previewMode?: boolean;
}

export function QuizRunner({
  quiz,
  questions,
  options,
  onComplete,
  previewMode = false
}: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      <div className="page-header">
        <h1>{quiz.title}</h1>
        <div className="quiz-container">
          <h2>Quiz Complete!</h2>
          <div id="score">
            Your score is {score} out of {questions.length} ({percentage.toFixed(2)}%)
          </div>
          
          {previewMode && (
            <p className="mt-4 text-gray-600">
              This is a preview. In a real quiz, results would be saved.
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = options[currentQuestion?.id] || [];
  
  // Find the correct option
  const correctOption = currentOptions.find(option => option.isCorrect);

  return (
    <div>
      <div className="page-header">
        <h1>{quiz.title}</h1>
      </div>
      
      <div className="quiz-container">
        <h2>{quiz.title}</h2>
        
        {timeLeft !== null && (
          <div className="flex items-center justify-center mb-4 text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Time remaining: {formatTime(timeLeft)}
          </div>
        )}
        
        <div id="question-container">
          {currentQuestion.imageUrl && (
            <img 
              id="question-image"
              src={currentQuestion.imageUrl} 
              alt={`Question ${currentQuestionIndex + 1}`}
              style={{ display: 'block', maxWidth: '300px', marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }}
            />
          )}
          <div id="question">{currentQuestion.question}</div>
        </div>
        
        <div id="options">
          {/* For speaking tests or assessments with correct/incorrect */}
          {currentOptions.length <= 2 && (
            <>
              <button 
                onClick={() => selectAnswer(true)}
                className="mr-2"
              >
                Correct
              </button>
              <button 
                onClick={() => selectAnswer(false)}
              >
                Incorrect
              </button>
            </>
          )}
          
          {/* For multiple choice questions */}
          {currentOptions.length > 2 && (
            <div className="grid grid-cols-1 gap-3">
              {currentOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => selectAnswer(option.isCorrect || false)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}