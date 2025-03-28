import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [results, setResults] = useState<{
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
  } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTimeRef = useRef<number | null>(timeLeft);

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
          handleComplete();
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

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    questions.forEach(question => {
      const selectedOptionId = answers[question.id];
      if (selectedOptionId) {
        const selectedOption = options[question.id]?.find(o => o.id === selectedOptionId);
        if (selectedOption?.isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        incorrectCount++;
      }
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    setResults({
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      score
    });
    
    setIsComplete(true);
    onComplete(correctCount, questions.length);
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

  if (isComplete && results) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
              
              <div className="flex justify-center items-center text-4xl font-bold my-8">
                <span className="text-primary">{results.score}%</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Correct</p>
                  <p className="text-xl font-bold">{results.correctAnswers}</p>
                </div>
                
                <div className="p-4 bg-destructive/10 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-sm font-medium">Incorrect</p>
                  <p className="text-xl font-bold">{results.incorrectAnswers}</p>
                </div>
              </div>
              
              {previewMode && (
                <p className="text-muted-foreground mt-4">
                  This is a preview. In a real quiz, results would be saved.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const currentOptions = options[currentQuestionData?.id] || [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const hasAnswered = !!answers[currentQuestionData?.id];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        
        {timeLeft !== null && (
          <div className="flex items-center gap-1 text-sm font-medium">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestionData.question}</h2>
          
          {currentQuestionData.imageUrl && (
            <div className="mb-4">
              <img 
                src={currentQuestionData.imageUrl} 
                alt={`Question ${currentQuestion + 1}`} 
                className="max-w-full rounded-md"
              />
            </div>
          )}
          
          <RadioGroup
            value={answers[currentQuestionData.id]?.toString()}
            onValueChange={(value) => 
              handleAnswer(currentQuestionData.id, parseInt(value))
            }
            className="space-y-3"
          >
            {currentOptions.map(option => (
              <div
                key={option.id}
                className="flex items-start space-x-2 p-3 rounded-md border"
              >
                <RadioGroupItem
                  value={option.id.toString()}
                  id={`option-${option.id}`}
                  className="mt-1"
                />
                <Label
                  htmlFor={`option-${option.id}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleNext}
              disabled={!hasAnswered}
              variant="default"
            >
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Complete Quiz'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}