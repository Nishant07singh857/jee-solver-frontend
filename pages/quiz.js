import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Clock, Lightbulb, Sparkles, Bookmark, Home, ArrowLeft, MessageCircle, X, Send, PenTool, Trash2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

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
    const [explanationCache, setExplanationCache] = useState({});

    // ⏱️ Per-question time tracking
    const [questionTimings, setQuestionTimings] = useState({});
    const questionStartTimeRef = useRef(null);

    // 🤖 AI Doubt Solver chatbot
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // ✍️ Digital Rough Pad
    const [showRoughPad, setShowRoughPad] = useState(false);
    const roughPadRef = useRef(null);

    const quizStartedAtRef = useRef(null);
    const router = useRouter();

    const getQuestionKey = (question = {}) => question.id ?? question.question;

    // 1. Initial Load
    useEffect(() => {
        const savedQuizData = sessionStorage.getItem('currentQuiz');
        if (savedQuizData) {
            try {
                const data = JSON.parse(savedQuizData);
                quizStartedAtRef.current = new Date();
                
                // Safety: Add IDs if missing
                if (data.questions) {
                    data.questions = data.questions.map((q, idx) => ({
                        ...q,
                        id: q.id || `temp_${Date.now()}_${idx}`
                    }));
                }

                setQuizData(data);
                loadBookmarks();
                setLoading(false);
            } catch (err) {
                setError('Invalid quiz data');
            }
        } else {
            router.push('/practice');
        }
    }, [router]);

    // 2. Timer Logic
    useEffect(() => {
        if (!quizData) return;
        const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [quizData]);

    // 🔥 3. BACKGROUND PRE-FETCHER + Question timer reset
    useEffect(() => {
        if (!quizData || !quizData.questions) return;

        const currentQ = quizData.questions[currentQuestionIndex];
        if (!currentQ) return;
        const key = getQuestionKey(currentQ);

        // ⏱️ Start per-question timer
        questionStartTimeRef.current = Date.now();

        // UI Reset
        setShowHint(false);
        setChatMessages([]); // reset chat for new question
        
        if (userAnswers[key]) {
             const cached = explanationCache[key] || currentQ.explanation;
             setExplanation(cached);
        } else {
            setExplanation(null);
        }

        // Note: Backend sends explanation: null initially
        if (!explanationCache[key] && !currentQ.explanation) {
            console.log(`⚡ Prefetching explanation for Q${currentQuestionIndex + 1}...`);
            
            axios.post(`${BACKEND_API_URL}/questions/generate-explanation`, {
                question: currentQ.question,
                options: currentQ.options,
                correctAnswer: currentQ.correctAnswer,
                userAnswer: "" 
            })
            .then(res => {
                setExplanationCache(prev => ({
                    ...prev,
                    [key]: res.data.explanation 
                }));
                console.log("✅ Explanation cached in background");
            })
            .catch(err => console.error("Background fetch failed", err));
        }

    }, [currentQuestionIndex, quizData]); // Removed 'userAnswers' to avoid loop

    // 🤖 Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // 💬 Send message to AI Doubt Solver
    const sendChatMessage = async () => {
        if (!chatInput.trim() || chatLoading) return;
        const currentQ = quizData?.questions[currentQuestionIndex];
        if (!currentQ) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatLoading(true);

        try {
            // Use dedicated /chat endpoint — no more "Missing required fields" error
            const response = await axios.post(`${BACKEND_API_URL}/questions/chat`, {
                doubt: userMsg,
                question: currentQ.question,
                options: currentQ.options || [],
                correctAnswer: currentQ.correctAnswer || '',
            });
            const reply = response.data.reply || 'I could not generate a response. Please try again!';
            setChatMessages(prev => [...prev, { role: 'ai', text: reply }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'ai', text: '⏳ AI tutor is busy right now. Try again in a moment!' }]);
        } finally {
            setChatLoading(false);
        }
    };

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

    // 💥 MISTAKE BANK: Save wrong answers for spaced repetition
    const saveMistakeToBank = async (question, userAnswer, explanation) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const reviewDates = [
                new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
            ];
            await addDoc(collection(db, 'mistakeBank'), {
                userId: currentUser.uid,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                userAnswer,
                explanation: explanation || '',
                subject: question.subject || quizData?.subject || 'General',
                topic: question.topic || 'Unknown',
                addedAt: serverTimestamp(),
                nextReviewDate: reviewDates[0],
                reviewSchedule: reviewDates,
                reviewCount: 0,
                mastered: false,
            });
        } catch (err) {
            console.error('Error saving to mistake bank:', err);
        }
    };

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
            const questionsData = quizData.questions.map(q => {
                const key = getQuestionKey(q);
                const userAnswer = userAnswers[key];
                const expl = explanationCache[key] || q.explanation || '';

                // ✅ Auto-save wrong answers to Mistake Bank
                if (userAnswer && !userAnswer.isCorrect) {
                    saveMistakeToBank(q, userAnswer.answer, expl);
                }
                
                return {
                    question: q.question,
                    userAnswer: userAnswer?.answer || '',
                    correctAnswer: q.correctAnswer,
                    isCorrect: userAnswer?.isCorrect || false,
                    options: q.options,
                    explanation: expl,
                    hint: q.hint || '',
                    subject: q.subject || quizData.subject || 'General',
                    topic: q.topic || 'Unknown',
                    timeSpentSeconds: questionTimings[key] || 0,
                };
            });

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
                startedAt: quizStartedAtRef.current || new Date(),
                questions: questionsData,
                subject: quizData.subject || 'General',
                difficulty: quizData.difficulty || 'Medium'
            });

            console.log("Quiz results saved to Firebase successfully");
            try {
                for (const q of questionsData) {
                    const subject = q.subject || quizData.subject || 'General';
                    const topic = q.topic || 'Unknown';
            
                    // Per-user + per-subject + per-topic document
                    const progressRef = doc(
                        db,
                        'userProgress',
                        `${currentUser.uid}_${subject}_${topic}`
                    );
            
                    const snap = await getDoc(progressRef);
                    const existing = snap.exists()
                        ? snap.data()
                        : { totalAttempts: 0, correctAttempts: 0 };
            
                    const updated = {
                        userId: currentUser.uid,
                        subject,
                        topic,
                        totalAttempts: (existing.totalAttempts || 0) + 1,
                        correctAttempts: (existing.correctAttempts || 0) + (q.isCorrect ? 1 : 0),
                        lastUpdated: serverTimestamp()
                    };
            
                    await setDoc(progressRef, updated);
                }
            
                console.log("userProgress updated for subject/topic performance");
            } catch (err) {
                console.error("Error updating userProgress:", err);
            }
        } catch (error) {
            console.error("Error saving quiz results:", error);
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
        const safeId = questionId ?? 'unknown';
        axios.post(`${BACKEND_API_URL}/questions/record-progress`, {
            questionId: String(safeId),
            isCorrect: Boolean(isCorrect),
            isBookmarked: Boolean(isBookmarked)
        }).catch(err => console.log("Failed to record progress:", err));
    };

    const handleAnswerSelect = (questionId, option) => {
        const currentQuestion = quizData.questions[currentQuestionIndex];
        const key = getQuestionKey(currentQuestion);
        const activeId = (typeof questionId === 'string') ? questionId : key;

        if (!currentQuestion || userAnswers[key]) return;

        // ⏱️ Record time spent on this question
        const timeSpent = questionStartTimeRef.current
            ? Math.round((Date.now() - questionStartTimeRef.current) / 1000)
            : 0;
        setQuestionTimings(prev => ({ ...prev, [key]: timeSpent }));
        
        const isCorrect = option === currentQuestion.correctAnswer;
        
        setUserAnswers(prev => ({ 
            ...prev, 
            [key]: { 
                answer: option, 
                isCorrect 
            } 
        }));
        
        recordProgress(activeId, isCorrect, Boolean(bookmarks[key]));
        
        const cachedExpl = explanationCache[key] || currentQuestion.explanation;
        if (cachedExpl) {
            setExplanation(cachedExpl);
            return;
        }

        setLoadingExplanation(true);
        axios.post(`${BACKEND_API_URL}/questions/generate-explanation`, {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            userAnswer: option
        }).then(response => {
            setExplanation(response.data.explanation);
            setExplanationCache(prev => ({...prev, [key]: response.data.explanation}));
        }).catch(err => {
            console.error("Explanation error:", err);
            setExplanation("Could not load explanation. The AI service might be unavailable.");
        }).finally(() => {
            setLoadingExplanation(false);
        });
    };

    const toggleBookmark = async (questionId) => {
        const currentQuestion = quizData.questions.find(q => getQuestionKey(q) === questionId) 
            || quizData.questions[currentQuestionIndex];
        if (!currentQuestion) return;
        const key = getQuestionKey(currentQuestion);
        
        const newBookmarkState = !bookmarks[key];
        const updatedBookmarks = { ...bookmarks, [key]: newBookmarkState };
        
        setBookmarks(updatedBookmarks);
        
        // Save to Firebase
        await saveBookmarksToFirebase(updatedBookmarks);
        
        // If user has answered, record progress with updated bookmark status
        if (userAnswers[key]) {
            recordProgress(key, userAnswers[key].isCorrect, newBookmarkState);
        }
        
        // Add question details to bookmark if it's being bookmarked
        if (newBookmarkState) {
            const bookmarkDetails = {
                question: currentQuestion.question,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer,
                hint: currentQuestion.hint || '',
                explanation: explanationCache[key] || currentQuestion.explanation || '',
                subject: quizData.subject || 'General',
                topic: currentQuestion.topic || 'Unknown',
                bookmarkedAt: new Date().toISOString()
            };
            
            const detailedBookmarks = { 
                ...updatedBookmarks, 
                [key]: bookmarkDetails 
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
    const currentQuestionKey = getQuestionKey(currentQuestion);
    const answered = userAnswers[currentQuestionKey];
    const isBookmarked = bookmarks[currentQuestionKey];
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
                    <button className="revision-button" onClick={() => setShowRoughPad(!showRoughPad)} title="Rough Pad">
                        <PenTool size={20} />
                    </button>
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

            {/* ✍️ Digital Rough Pad Modal */}
            {showRoughPad && (
                <div style={{
                    position: 'fixed', top: '80px', right: '20px', width: '400px', height: '500px',
                    backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
                    zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><PenTool size={16}/> Digital Rough Pad</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => roughPadRef.current?.clear()} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            <button onClick={() => setShowRoughPad(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#000000', cursor: 'crosshair' }}>
                        <SignatureCanvas ref={roughPadRef} penColor="#38bdf8" canvasProps={{ width: 400, height: 450, className: 'sigCanvas' }} />
                    </div>
                </div>
            )}

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
                        onClick={() => toggleBookmark(currentQuestionKey)}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                    >
                        <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                </div>

                <div className="question-text" style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.question}</div>

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
                                onClick={() => handleAnswerSelect(currentQuestionKey, option)}
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
                            <strong>Hint:</strong> {currentQuestion.hint || "Hint not available yet (check back later!)"}
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
                                        __html: explanation?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') || 'Explanation available shortly.' 
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

            {/* 🤖 AI Doubt Solver - Floating Chat */}
            <button
                className="chat-fab"
                onClick={() => setChatOpen(o => !o)}
                title="Ask AI Tutor"
            >
                {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
                {!chatOpen && <span className="chat-fab-label">Ask AI</span>}
            </button>

            {chatOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <Sparkles size={16} />
                        <span>AI Doubt Solver</span>
                        <button onClick={() => setChatOpen(false)} className="chat-close"><X size={16} /></button>
                    </div>
                    <div className="chat-messages">
                        {chatMessages.length === 0 && (
                            <div className="chat-empty">
                                <p>Ask me anything about this question! 🧠</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.6 }}>e.g. "Why is option B wrong?" or "Explain the concept used here"</p>
                            </div>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`chat-msg ${msg.role}`}>
                                {msg.role === 'ai' && <span className="chat-avatar">🤖</span>}
                                <div className="chat-bubble">{msg.text}</div>
                                {msg.role === 'user' && <span className="chat-avatar">👤</span>}
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="chat-msg ai">
                                <span className="chat-avatar">🤖</span>
                                <div className="chat-bubble chat-typing"><span></span><span></span><span></span></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="chat-input-row">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Type your doubt..."
                            className="chat-input"
                        />
                        <button onClick={sendChatMessage} disabled={chatLoading} className="chat-send">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

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

                /* 🤖 AI Doubt Solver Chat */
                .chat-fab {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    border: none;
                    border-radius: 50px;
                    color: white;
                    padding: 0.85rem 1.25rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                    z-index: 100;
                    transition: all 0.3s;
                }
                .chat-fab:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(139,92,246,0.5); }
                .chat-fab-label { font-size: 0.85rem; }

                .chat-panel {
                    position: fixed;
                    bottom: 5.5rem;
                    right: 2rem;
                    width: 340px;
                    max-height: 480px;
                    background: #1e293b;
                    border: 1px solid rgba(139,92,246,0.35);
                    border-radius: 18px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
                    z-index: 99;
                    overflow: hidden;
                }
                .chat-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 1rem;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    color: white;
                    font-weight: 700;
                    font-size: 0.95rem;
                }
                .chat-close {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    opacity: 0.8;
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .chat-empty {
                    text-align: center;
                    color: #64748b;
                    padding: 1rem;
                    font-size: 0.9rem;
                }
                .chat-msg {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                .chat-msg.user { flex-direction: row-reverse; }
                .chat-avatar { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
                .chat-bubble {
                    background: rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 0.6rem 0.85rem;
                    font-size: 0.88rem;
                    line-height: 1.5;
                    max-width: 80%;
                    word-break: break-word;
                }
                .chat-msg.user .chat-bubble {
                    background: rgba(59,130,246,0.25);
                    border: 1px solid rgba(59,130,246,0.3);
                    color: #bfdbfe;
                }
                .chat-msg.ai .chat-bubble {
                    background: rgba(139,92,246,0.15);
                    border: 1px solid rgba(139,92,246,0.25);
                }
                .chat-typing { display: flex; gap: 4px; align-items: center; padding: 0.6rem 1rem; }
                .chat-typing span {
                    width: 7px; height: 7px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    animation: chatBounce 1s infinite;
                }
                .chat-typing span:nth-child(2) { animation-delay: 0.15s; }
                .chat-typing span:nth-child(3) { animation-delay: 0.3s; }
                @keyframes chatBounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                }
                .chat-input-row {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .chat-input {
                    flex: 1;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 10px;
                    padding: 0.55rem 0.85rem;
                    color: #e2e8f0;
                    font-size: 0.88rem;
                    outline: none;
                }
                .chat-send {
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    padding: 0.55rem 0.75rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }
                .chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 480px) {
                    .chat-panel { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
                    .chat-fab { right: 1rem; bottom: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default QuizPage;