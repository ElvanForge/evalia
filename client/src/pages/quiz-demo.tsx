import { useState, useEffect } from 'react';
import Layout from '@/components/layout';
import { useLocation } from 'wouter';

interface Question {
  question: string;
  image?: string;
  correctAnswer: string;
}

export default function QuizDemo() {
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Demo quiz questions based on your provided example
  const questions: Question[] = [
    {
      question: "What is this an image of?",
      image: "https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // elephant image
      correctAnswer: "Correct"
    },
    {
      question: "What animal is shown in this image?",
      image: "https://images.pexels.com/photos/46251/sumatran-tiger-tiger-big-cat-stripes-46251.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // tiger image
      correctAnswer: "Correct"
    }
  ];

  function selectAnswer(selectedAnswer: string) {
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(prevScore => prevScore + 1);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      showScore();
    }
  }

  function showScore() {
    setIsComplete(true);
  }

  if (isComplete) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <Layout title="Quiz Demo">
        <div className="page-header">
          <h1>Grade 4 Speaking Test</h1>
        </div>
        
        <div className="quiz-container">
          <h2>UNIT 6 SPEAKING TEST</h2>
          <div id="score">
            Your score is {score} out of {questions.length} ({percentage.toFixed(2)}%)
          </div>
          
          <button 
            onClick={() => {
              setCurrentQuestionIndex(0);
              setScore(0);
              setIsComplete(false);
            }}
            className="mt-4"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Layout title="Quiz Demo">
      <div className="page-header">
        <h1>Grade 4 Speaking Test</h1>
      </div>
      
      <div className="quiz-container">
        <h2>UNIT 6 SPEAKING TEST</h2>
        
        <div id="question-container">
          {currentQuestion.image && (
            <img 
              id="question-image"
              src={currentQuestion.image} 
              alt={`Question ${currentQuestionIndex + 1}`}
              style={{ display: 'block', maxWidth: '300px', marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }}
            />
          )}
          <div id="question">{currentQuestion.question}</div>
        </div>
        
        <div id="options">
          <button 
            onClick={() => selectAnswer("Correct")}
            className="mr-2"
          >
            Correct
          </button>
          <button 
            onClick={() => selectAnswer("Incorrect")}
          >
            Incorrect
          </button>
        </div>
      </div>
    </Layout>
  );
}