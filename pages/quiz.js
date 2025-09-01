// pages/quiz.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Clock, Lightbulb, Sparkles, Bookmark, Home, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

// Use environment variable for backend URL with fallback
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

const QuizPage = () => {
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [bookmarks, setBookmarks] = useState({});
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [showHint, setShowHint] = useState(false);
    const [explanation, setExplanation] = useState(null);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizStartedAt, setQuizStartedAt] = useState(null);

    const router = useRouter();

    useEffect(() => {
        // Load quiz data from session storage
        const savedQuizData = sessionStorage.getItem('currentQuiz');
        if (savedQuizData) {
            try {
                const data = JSON.parse(savedQuizData);
                setQuizData(data);
                setQuizStartedAt(new Date());
                
                // Load bookmarks from Firebase
                loadBookmarks();
                setLoading(false);
            } catch (err) {
                setError('Invalid quiz data format');
                console.error(err);
            }
        } else {
            // Redirect to practice page if no quiz data
            router.push('/practice');
        }
    }, [router]);

    // Load bookmarks from Firebase
    const loadBookmarks = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
            const bookmarksDoc = await getDoc(bookmarksRef);
            
            if (bookmarksDoc.exists()) {
                setBookmarks(bookmarksDoc.data());
            }
        } catch (error) {
            console.error("Error loading bookmarks:", error);
        }
    };

    useEffect(() => {
        if (!quizData) return;
        const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [quizData]);

    const saveQuizResultsToFirebase = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log("User not authenticated, skipping Firebase save");
                return;
            }

            // Calculate score and prepare data
            const totalQuestions = quizData.questions.length;
            const correctAnswers = Object.values(userAnswers).filter(
                answer => answer.isCorrect
            ).length;
            const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

            // Prepare questions data for Firebase
            const questionsData = quizData.questions.map(q => ({
                question: q.question,
                userAnswer: userAnswers[q.id]?.answer || '',
                correctAnswer: q.correctAnswer,
                isCorrect: userAnswers[q.id]?.isCorrect || false,
                options: q.options,
                hint: q.hint || '',
                subject: quizData.subject || 'General',
                topic: q.topic || 'Unknown'
            }));

            // Save to Firestore
            const quizResultsRef = collection(db, 'quizResults');
            await addDoc(quizResultsRef, {
                userId: currentUser.uid,
                quizTitle: quizData.quizTitle || 'Quick Quiz',
                totalQuestions,
                correctAnswers,
                accuracy,
                timeSpent: 30 * 60 - timeLeft, // in seconds
                completedAt: serverTimestamp(),
                startedAt: quizStartedAt,
                questions: questionsData,
                subject: quizData.subject || 'General',
                difficulty: quizData.difficulty || 'Medium'
            });

            console.log("Quiz results saved to Firebase successfully");

        } catch (error) {
            console.error("Error saving quiz results to Firebase:", error);
        }
    };

    // Save bookmarks to Firebase
    const saveBookmarksToFirebase = async (bookmarksData) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
            await setDoc(bookmarksRef, bookmarksData, { merge: true });
        } catch (error) {
            console.error("Error saving bookmarks:", error);
        }
    };

    const recordProgress = (questionId, isCorrect, isBookmarked) => {
        // Backend ko progress save karne ke liye data bhejta hai
        axios.post(`${BACKEND_API_URL}/questions/record-progress`, {
            questionId: questionId.toString(),
            isCorrect: Boolean(isCorrect),
            isBookmarked: Boolean(isBookmarked)
        }).catch(err => console.log("Failed to record progress:", err));
    };

    const handleAnswerSelect = (questionId, option) => {
        if (userAnswers[questionId]) return;
        
        const currentQuestion = quizData.questions[currentQuestionIndex];
        const isCorrect = option === currentQuestion.correctAnswer;
        
        console.log("Answer selected:", { 
            questionId, 
            option, 
            correctAnswer: currentQuestion.correctAnswer, 
            isCorrect 
        });
        
        // Update user answers
        setUserAnswers(prev => ({ 
            ...prev, 
            [questionId]: { 
                answer: option, 
                isCorrect: isCorrect 
            } 
        }));
        
        // Record progress (non-blocking)
        recordProgress(questionId, isCorrect, !!bookmarks[questionId]);
        
        // Load explanation
        setLoadingExplanation(true);
        axios.post(`${BACKEND_API_URL}/questions/generate-explanation`, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            userAnswer: option
        }).then(response => {
            setExplanation(response.data.explanation);
        }).catch(err => {
            console.error("Explanation error:", err);
            setExplanation("Could not load explanation. The AI service might be unavailable.");
        }).finally(() => {
            setLoadingExplanation(false);
        });
    };

    const toggleBookmark = async (questionId) => {
        const currentQuestion = quizData.questions.find(q => q.id === questionId);
        if (!currentQuestion) return;
        
        const newBookmarkState = !bookmarks[questionId];
        const updatedBookmarks = { ...bookmarks, [questionId]: newBookmarkState };
        
        setBookmarks(updatedBookmarks);
        
        // Save to Firebase
        await saveBookmarksToFirebase(updatedBookmarks);
        
        // If user has answered, record progress with updated bookmark status
        if (userAnswers[questionId]) {
            recordProgress(questionId, userAnswers[questionId].isCorrect, newBookmarkState);
        }
        
        // Add question details to bookmark if it's being bookmarked
        if (newBookmarkState) {
            const bookmarkDetails = {
                question: currentQuestion.question,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer,
                hint: currentQuestion.hint || '',
                subject: quizData.subject || 'General',
                topic: currentQuestion.topic || 'Unknown',
                bookmarkedAt: new Date().toISOString()
            };
            
            const detailedBookmarks = { 
                ...updatedBookmarks, 
                [questionId]: bookmarkDetails 
            };
            await saveBookmarksToFirebase(detailedBookmarks);
        }
    };

    const goToNextQuestion = async () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setShowHint(false);
            setExplanation(null);
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz complete - save results to Firebase
            await saveQuizResultsToFirebase();
            
            sessionStorage.removeItem('currentQuiz');
            router.push('/results');
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setShowHint(false);
            setExplanation(null);
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    const goToPractice = () => {
        router.push('/practice');
    };

    const goToRevision = () => {
        router.push('/revision');
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="quiz-container">
                <Head>
                    <title>Loading Quiz | JEE Solver</title>
                </Head>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading quiz questions...</p>
                </div>
                <style jsx>{`
                    .quiz-container {
                        min-height: 100vh;
                        background-color: #0f172a;
                        color: #e2e8f0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .loading-spinner {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 1rem;
                    }
                    
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 5px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                        border-top-color: #3b82f6;
                        animation: spin 1s ease-in-out infinite;
                    }
                    
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-container">
                <Head>
                    <title>Error | JEE Solver</title>
                </Head>
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
                <style jsx>{`
                    .quiz-container {
                        min-height: 100vh;
                        background-color: #0f172a;
                        color: #e2e8f0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .error-message {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 1rem;
                    }
                    
                    .error-message button {
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="quiz-container">
                <Head>
                    <title>Error | JEE Solver</title>
                </Head>
                <div className="error-message">
                    <p>No quiz data available.</p>
                </div>
                <style jsx>{`
                    .quiz-container {
                        min-height: 100vh;
                        background-color: #0f172a;
                        color: #e2e8f0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                `}</style>
            </div>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const answered = userAnswers[currentQuestion.id];
    const isBookmarked = bookmarks[currentQuestion.id];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

    return (
        <div className="quiz-container">
            <Head>
                <title>{quizData.quizTitle || 'AI Quiz'} | JEE Solver</title>
            </Head>
            
            <div className="quiz-header">
                <div className="header-left">
                    <button className="back-button" onClick={goToPractice} title="Back to Practice">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="quiz-title">{quizData.quizTitle}</h1>
                </div>
                <div className="header-right">
                    <div className="timer">
                        <Clock size={20} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <button className="revision-button" onClick={goToRevision} title="View Bookmarks">
                        <Bookmark size={20} />
                        <span className="bookmark-count">{Object.keys(bookmarks).length}</span>
                    </button>
                    <button className="dashboard-button" onClick={goToDashboard} title="Back to Dashboard">
                        <Home size={20} />
                    </button>
                </div>
            </div>

            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${progress}%`}}></div>
                </div>
                <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
            </div>

            <div className="question-card">
                <div className="question-header">
                    <div className="question-number">Question #{currentQuestionIndex + 1}</div>
                    <button 
                        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        onClick={() => toggleBookmark(currentQuestion.id)}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                    >
                        <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                </div>

                <div className="question-text">{currentQuestion.question}</div>

                <div className="options-grid">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = answered?.answer === option;
                        const isCorrectOption = option === currentQuestion.correctAnswer;
                        
                        let buttonClass = 'option-btn';
                        if (answered) {
                            if (isCorrectOption) {
                                buttonClass += ' correct';
                            } else if (isSelected && !isCorrectOption) {
                                buttonClass += ' incorrect';
                            } else if (!isSelected && answered) {
                                buttonClass += ' disabled';
                            }
                        }
                        
                        return (
                            <button
                                key={index}
                                className={buttonClass}
                                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                                disabled={!!answered}
                            >
                                {option}
                                {answered && isCorrectOption && (
                                    <span className="correct-indicator"> ✓</span>
                                )}
                                {answered && isSelected && !isCorrectOption && (
                                    <span className="incorrect-indicator"> ✗</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="hint-section">
                    <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                        <Lightbulb size={18} />
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    {showHint && (
                        <div className="hint-content">
                            <strong>Hint:</strong> {currentQuestion.hint}
                        </div>
                    )}
                </div>
                
                <div className="explanation-section">
                    {answered && (
                        <>
                            <div className="explanation-header">
                                <Sparkles size={24} className="explanation-icon" />
                                <h3>AI Explanation</h3>
                            </div>
                            {loadingExplanation ? (
                                <div className="loading-explanation">
                                    <p>Generating explanation...</p>
                                </div>
                            ) : (
                                <div 
                                    className="explanation-content" 
                                    dangerouslySetInnerHTML={{ 
                                        __html: explanation?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') || '' 
                                    }}
                                />
                            )}
                        </>
                    )}
                    <div className="navigation-buttons">
                        <button 
                            className="nav-btn prev-btn" 
                            onClick={goToPreviousQuestion}
                            disabled={isFirstQuestion}
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>
                        <button 
                            className="nav-btn next-btn" 
                            onClick={goToNextQuestion}
                        >
                            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                :root {
                    --primary-bg: #0f172a;
                    --card-bg: rgba(255, 255, 255, 0.05);
                    --border-color: rgba(255, 255, 255, 0.1);
                    --primary-text: #e2e8f0;
                    --secondary-text: #94a3b8;
                    --accent-blue: #3b82f6;
                    --accent-green: #22c55e;
                    --accent-red: #ef4444;
                    --accent-yellow: #eab308;
                    --accent-purple: #a855f7;
                }

                .quiz-container {
                    min-height: 100vh;
                    background-color: var(--primary-bg);
                    color: var(--primary-text);
                    padding: 1rem;
                    background-image: 
                        radial-gradient(circle at 10% 20%, rgba(86, 58, 220, 0.05) 0%, transparent 20%),
                        radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 20%);
                }

                .quiz-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    border: 1px solid var(--border-color);
                    backdrop-filter: blur(10px);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .back-button, .dashboard-button, .revision-button {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 8px;
                    color: var(--primary-text);
                    padding: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .revision-button {
                    background: rgba(234, 179, 8, 0.1);
                }

                .bookmark-count {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: var(--accent-yellow);
                    color: #000;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .back-button:hover, .dashboard-button:hover, .revision-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                .quiz-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(to right, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0;
                }

                .timer {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #93c5fd;
                }

                .progress-container {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(to right, #3b82f6, #8b5cf6);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }

                .question-card {
                    background: var(--card-bg);
                    border-radius: 20px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    border: 1px solid var(--border-color);
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }

                .question-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(to right, #3b82f6, #8b5cf6);
                    opacity: 0.7;
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .question-number {
                    font-size: 1.1rem;
                    color: var(--secondary-text);
                }

                .bookmark-btn {
                    background: none;
                    border: none;
                    color: var(--secondary-text);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .bookmark-btn.active {
                    color: var(--accent-yellow);
                }

                .bookmark-btn:hover {
                    transform: scale(1.1);
                }

                .question-text {
                    font-size: 1.4rem;
                    line-height: 1.5;
                    margin-bottom: 2rem;
                    font-weight: 500;
                }

                .options-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                @media (max-width: 768px) {
                    .options-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .quiz-container {
                        padding: 0.5rem;
                    }
                    
                    .question-card {
                        padding: 1.5rem;
                    }
                    
                    .question-text {
                        font-size: 1.2rem;
                    }

                    .quiz-header {
                        flex-direction: column;
                        gap: 1rem;
                        padding: 1rem;
                    }

                    .header-left, .header-right {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .quiz-title {
                        font-size: 1.3rem;
                    }
                }

                @media (max-width: 480px) {
                    .question-card {
                        padding: 1rem;
                    }

                    .question-text {
                        font-size: 1.1rem;
                    }

                    .options-grid {
                        gap: 0.5rem;
                    }

                    .quiz-header {
                        padding: 0.75rem;
                    }
                }

                .option-btn {
                    padding: 1.25rem;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    background: rgba(30, 41, 59, 0.5);
                    color: var(--primary-text);
                    text-align: left;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .option-btn:hover {
                    border-color: var(--accent-blue);
                    background: rgba(59, 130, 246, 0.1);
                    transform: translateY(-2px);
                }

                .option-btn.correct {
                    border-color: var(--accent-green);
                    background: rgba(34, 197, 94, 0.1);
                }

                .option-btn.incorrect {
                    border-color: var(--accent-red);
                    background: rgba(239, 68, 68, 0.1);
                }

                .option-btn.disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .hint-section {
                    text-align: center;
                    margin: 1.5rem 0;
                }

                .hint-btn {
                    background: none;
                    border: none;
                    color: var(--accent-purple);
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .hint-btn:hover {
                    background: rgba(168, 85, 247, 0.1);
                }

                .hint-content {
                    margin-top: 1rem;
                    padding: 1.25rem;
                    background: rgba(168, 85, 247, 0.1);
                    border-radius: 12px;
                    border-left: 4px solid var(--accent-purple);
                    font-size: 0.95rem;
                }

                .explanation-section {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border-color);
                }

                .explanation-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    font-size: 1.3rem;
                    color: var(--accent-yellow);
                }

                .explanation-icon {
                    color: var(--accent-yellow);
                }

                .explanation-content {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 1.25rem;
                    border-radius: 12px;
                    line-height: 1.6;
                    font-size: 1rem;
                }

                .explanation-content p {
                    margin-bottom: 1rem;
                }

                .explanation-content strong {
                    color: var(--accent-yellow);
                }

                .navigation-buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 2rem;
                    gap: 1rem;
                }

                .nav-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .prev-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--primary-text);
                }

                .prev-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.2);
                }

                .prev-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .next-btn {
                    background: var(--accent-blue);
                    color: white;
                }

                .next-btn:hover {
                    background: #2563eb;
                    transform: translateX(4px);
                }

                .loading-explanation {
                    padding: 2rem;
                    text-align: center;
                    color: var(--secondary-text);
                }

                .correct-indicator {
                    color: var(--accent-green);
                    font-weight: bold;
                    margin-left: 0.5rem;
                }

                .incorrect-indicator {
                    color: var(--accent-red);
                    font-weight: bold;
                    margin-left: 0.5rem;
                }

                @media (max-width: 480px) {
                    .navigation-buttons {
                        flex-direction: column;
                    }

                    .nav-btn {
                        justify-content: center;
                        width: 100%;
                        padding: 1rem;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default QuizPage;