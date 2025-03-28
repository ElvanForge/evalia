const questions = [
    {
        question: "What is this an image of?",
        image: "images/elephant.jpg", // Ensure this path is correct relative to your HTML file
        correctAnswer: "Correct", // The correct answer
    },
    {
        question: "What animal is shown in this image?",
        image: "images/tiger.jpg", // Replace with the actual path to the tiger image
        correctAnswer: "Correct", // Adjust based on the correct answer for this question
    },
];
let currentQuestionIndex = 0;
let score = 0;

function loadQuestion() {
    const questionElement = document.getElementById("question");
    const questionImage = document.getElementById("question-image");
    const optionsElement = document.getElementById("options");
    const nextButton = document.getElementById("next-button");

    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        questionElement.innerText = currentQuestion.question;
        questionImage.src = currentQuestion.image; // Set the image source
        questionImage.style.display = "block"; // Show the image
        optionsElement.innerHTML = `
            <button onclick="selectAnswer('Correct')">Correct</button>
            <button onclick="selectAnswer('Incorrect')">Incorrect</button>
        `; // Provide buttons for "Correct" and "Incorrect"
        nextButton.style.display = "none"; // Hide next button initially
    } else {
        showScore();
    }
}

function selectAnswer(selectedAnswer) {
    const currentQuestion = questions[currentQuestionIndex];

    // Check if the selected answer matches the correct answer
    if (selectedAnswer === currentQuestion.correctAnswer) {
        score++; // Increment score only if the answer is correct
    }

    currentQuestionIndex++; // Move to the next question
    loadQuestion(); // Load the next question
}

function showScore() {
    const questionElement = document.getElementById("question");
    const questionImage = document.getElementById("question-image");
    const optionsElement = document.getElementById("options");
    const nextButton = document.getElementById("next-button");
    const scoreElement = document.getElementById("score");

    questionElement.style.display = "none";
    questionImage.style.display = "none";
    optionsElement.style.display = "none";
    nextButton.style.display = "none";

    const percentage = (score / questions.length) * 100; // Calculate percentage
    scoreElement.innerText = `Your score is ${score} out of ${questions.length} (${percentage.toFixed(2)}%)`;
    scoreElement.style.display = "block";
}

// Start the quiz
loadQuestion();


