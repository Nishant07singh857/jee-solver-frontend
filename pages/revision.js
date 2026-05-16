import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { 
  ArrowLeft, BrainCircuit, Lightbulb, RefreshCw, Bookmark, X, Filter, 
  Target, TrendingUp, AlertCircle, BarChart3, BookOpen, ChevronDown, 
  ChevronUp, Sparkles, Star, Clock, Award, Zap, Layers, GraduationCap,
  Trophy, Flame, ThumbsUp, ThumbsDown, ExternalLink, Eye, ChevronRight
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  doc, getDoc, setDoc, collection, query, where, getDocs, 
  updateDoc, arrayUnion, arrayRemove, onSnapshot, orderBy, limit
} from 'firebase/firestore';

const RevisionPage = () => {
    const [bookmarks, setBookmarks] = useState({});
    const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
    const [mistakes, setMistakes] = useState([]);
    const [weakSubjects, setWeakSubjects] = useState([]);
    const [userProgress, setUserProgress] = useState({});
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [subjects, setSubjects] = useState(['All']);
    const [activeTab, setActiveTab] = useState('bookmarks');
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [streak, setStreak] = useState(0);
    const [revisionProgress, setRevisionProgress] = useState(0);
    const [quizHistory, setQuizHistory] = useState([]);

    const cardRef = useRef(null);
    const router = useRouter();
    const headerRef = useRef(null);
    const statsRef = useRef(null);

    // Sync tab from URL if provided
    useEffect(() => {
        if (router.query.tab) {
            setActiveTab(router.query.tab);
        }
    }, [router.query.tab]);

    // Fetch real data from Firebase
    useEffect(() => {
        const loadRealData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    router.push('/login');
                    return;
                }

                setLoading(true);

                // 1. Fetch user bookmarks
                const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
                const bookmarksDoc = await getDoc(bookmarksRef);
                
                if (bookmarksDoc.exists()) {
                    const bookmarksData = bookmarksDoc.data();
                    setBookmarks(bookmarksData);
                    
                    // Convert bookmarks to array format for display
                    const bookmarksArray = Object.entries(bookmarksData)
                        .filter(([key, value]) => typeof value === 'object' && value.question)
                        .map(([id, bookmark]) => ({
                            id,
                            question: bookmark.question,
                            topic: bookmark.topic || bookmark.subject || 'General',
                            correctAnswer: bookmark.correctAnswer,
                            subject: bookmark.subject || 'General',
                            options: bookmark.options || [],
                            hint: bookmark.hint || '',
                            explanation: bookmark.explanation || '',
                            bookmarkedAt: bookmark.bookmarkedAt || new Date().toISOString()
                        }));
                    
                    setBookmarkedQuestions(bookmarksArray);
                    
                    // Extract unique subjects
                    const subjectSet = new Set(['All']);
                    bookmarksArray.forEach(bookmark => {
                        if (bookmark.subject) subjectSet.add(bookmark.subject);
                    });
                    setSubjects(Array.from(subjectSet));
                }

                // 1b. Fetch Mistake Bank
                const mistakesQuery = query(
                    collection(db, 'mistakeBank'),
                    where('userId', '==', currentUser.uid),
                    where('mastered', '==', false)
                );
                const mistakesSnapshot = await getDocs(mistakesQuery);
                const mistakesArray = [];
                mistakesSnapshot.forEach(doc => {
                    mistakesArray.push({ id: doc.id, ...doc.data() });
                });
                // Sort mistakes by nextReviewDate
                mistakesArray.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
                setMistakes(mistakesArray);

                // 2. Fetch user progress and calculate weak subjects
                const progressQuery = query(
                    collection(db, 'userProgress'),
                    where('userId', '==', currentUser.uid)
                );
                const progressSnapshot = await getDocs(progressQuery);
                
                const progressData = {};
                const subjectPerformance = {};
                
                progressSnapshot.forEach(doc => {
                    const data = doc.data();
                    progressData[doc.id] = data;
                    
                    const subject = data.subject;
                    const accuracy = data.totalAttempts > 0 
                        ? (data.correctAttempts / data.totalAttempts) * 100 
                        : 0;
                    
                    if (!subjectPerformance[subject]) {
                        subjectPerformance[subject] = {
                            totalAttempts: 0,
                            correctAttempts: 0,
                            topics: []
                        };
                    }
                    
                    subjectPerformance[subject].totalAttempts += data.totalAttempts;
                    subjectPerformance[subject].correctAttempts += data.correctAttempts;
                    subjectPerformance[subject].topics.push({
                        name: data.topic,
                        accuracy: accuracy,
                        attempts: data.totalAttempts
                    });
                });
                
                setUserProgress(progressData);
                
                // Calculate weak subjects based on performance data
                const weakSubjectsList = Object.entries(subjectPerformance).map(([name, data]) => {
                    const accuracy = data.totalAttempts > 0 
                        ? (data.correctAttempts / data.totalAttempts) * 100 
                        : 0;
                    
                    return {
                        name: name,
                        strength: Math.round(accuracy),
                        questions: data.totalAttempts,
                        correct: data.correctAttempts,
                        topics: data.topics,
                        color: accuracy < 40 ? '#ef4444' : accuracy < 60 ? '#f59e0b' : '#10b981',
                        improvement: accuracy > 50 ? `+${Math.round(accuracy - 50)}%` : `${Math.round(accuracy)}%`
                    };
                }).filter(s => s.questions > 0);
                
                setWeakSubjects(weakSubjectsList);

                // 3. Fetch quiz history for streak calculation
                const quizQuery = query(
                    collection(db, 'quizResults'),
                    where('userId', '==', currentUser.uid),
                    orderBy('completedAt', 'desc'),
                    limit(30)
                );
                const quizSnapshot = await getDocs(quizQuery);
                
                const quizzes = [];
                quizSnapshot.forEach(doc => {
                    quizzes.push({ id: doc.id, ...doc.data() });
                });
                setQuizHistory(quizzes);
                
                // Calculate streak from quiz history
                if (quizzes.length > 0) {
                    let currentStreak = 0;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    for (let i = 0; i < quizzes.length; i++) {
                        const quizDate = quizzes[i].completedAt?.toDate();
                        if (quizDate) {
                            quizDate.setHours(0, 0, 0, 0);
                            const diffDays = Math.floor((today - quizDate) / (1000 * 60 * 60 * 24));
                            if (diffDays === currentStreak) {
                                currentStreak++;
                            } else if (diffDays > currentStreak) {
                                break;
                            }
                        }
                    }
                    setStreak(currentStreak);
                }
                
                // Calculate revision progress
                const totalQuestions = bookmarkedQuestions.length;
                const revisedQuestions = bookmarkedQuestions.filter(q => 
                    userProgress[q.id]?.revisedCount > 0
                ).length;
                const progress = totalQuestions > 0 ? (revisedQuestions / totalQuestions) * 100 : 0;
                setRevisionProgress(Math.round(progress));
                
                setLoading(false);
                
            } catch (error) {
                console.error("Error loading real data:", error);
                setLoading(false);
            }
        };

        loadRealData();
        
        // Set up real-time listener for bookmarks
        const currentUser = auth.currentUser;
        if (currentUser) {
            const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
            const unsubscribe = onSnapshot(bookmarksRef, (doc) => {
                if (doc.exists()) {
                    const bookmarksData = doc.data();
                    setBookmarks(bookmarksData);
                    
                    const bookmarksArray = Object.entries(bookmarksData)
                        .filter(([key, value]) => typeof value === 'object' && value.question)
                        .map(([id, bookmark]) => ({
                            id,
                            question: bookmark.question,
                            topic: bookmark.topic || bookmark.subject || 'General',
                            correctAnswer: bookmark.correctAnswer,
                            subject: bookmark.subject || 'General',
                            options: bookmark.options || [],
                            hint: bookmark.hint || '',
                            explanation: bookmark.explanation || '',
                            bookmarkedAt: bookmark.bookmarkedAt || new Date().toISOString()
                        }));
                    
                    setBookmarkedQuestions(bookmarksArray);
                    
                    const subjectSet = new Set(['All']);
                    bookmarksArray.forEach(bookmark => {
                        if (bookmark.subject) subjectSet.add(bookmark.subject);
                    });
                    setSubjects(Array.from(subjectSet));
                }
            });
            
            return () => unsubscribe();
        }
    }, [router]);

    // Filter bookmarks by subject
    const filteredBookmarks = selectedSubject === 'All' 
        ? bookmarkedQuestions 
        : bookmarkedQuestions.filter(item => item.subject === selectedSubject);

    // Group bookmarks by subject
    const bookmarksBySubject = bookmarkedQuestions.reduce((groups, item) => {
        const subject = item.subject;
        if (!groups[subject]) groups[subject] = [];
        groups[subject].push(item);
        return groups;
    }, {});

    const toggleSubject = (subject) => {
        setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
    };

    const flipCard = () => {
        if (filteredBookmarks.length === 0) return;
        
        gsap.to(cardRef.current, {
            rotationY: '+=180',
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => setIsFlipped(!isFlipped)
        });
        
        // Track revision attempt in Firebase
        const currentQuestion = filteredBookmarks[currentCardIndex];
        if (currentQuestion && !isFlipped) {
            trackRevisionAttempt(currentQuestion.id);
        }
    };

    const trackRevisionAttempt = async (questionId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const progressRef = doc(db, 'userProgress', `${currentUser.uid}_revision_${questionId}`);
            const progressDoc = await getDoc(progressRef);
            
            if (progressDoc.exists()) {
                await updateDoc(progressRef, {
                    revisedCount: (progressDoc.data().revisedCount || 0) + 1,
                    lastRevised: new Date(),
                    revisedAt: arrayUnion(new Date())
                });
            } else {
                await setDoc(progressRef, {
                    userId: currentUser.uid,
                    questionId: questionId,
                    revisedCount: 1,
                    firstRevised: new Date(),
                    lastRevised: new Date(),
                    revisedAt: [new Date()]
                });
            }
        } catch (error) {
            console.error("Error tracking revision:", error);
        }
    };

    const handleNextCard = () => {
        if (filteredBookmarks.length === 0) return;
        
        setIsFlipped(false);
        gsap.to(cardRef.current, {
            opacity: 0,
            y: -50,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredBookmarks.length);
                gsap.fromTo(cardRef.current, 
                    { opacity: 0, y: 50, rotationY: isFlipped ? 180 : 0 },
                    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                );
            }
        });
    };

    const removeBookmark = async (questionId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
            const bookmarksDoc = await getDoc(bookmarksRef);
            
            if (bookmarksDoc.exists()) {
                const currentBookmarks = bookmarksDoc.data();
                delete currentBookmarks[questionId];
                await setDoc(bookmarksRef, currentBookmarks);
                
                // Also remove from userProgress
                const progressRef = doc(db, 'userProgress', `${currentUser.uid}_revision_${questionId}`);
                await setDoc(progressRef, { isBookmarked: false }, { merge: true });
                
                // Update local state
                setBookmarkedQuestions(prev => prev.filter(q => q.id !== questionId));
                
                gsap.to(`#bookmark-${questionId}`, {
                    opacity: 0,
                    x: -20,
                    duration: 0.3
                });
            }
        } catch (error) {
            console.error("Error removing bookmark:", error);
        }
    };

    const markAsMastered = async (questionId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const progressRef = doc(db, 'userProgress', `${currentUser.uid}_revision_${questionId}`);
            await setDoc(progressRef, { 
                isMastered: true,
                masteredAt: new Date()
            }, { merge: true });
            
            // Remove from bookmarks if mastered
            await removeBookmark(questionId);
            
        } catch (error) {
            console.error("Error marking as mastered:", error);
        }
    };

    const getSubjectPerformance = (subject) => {
        const subjectData = weakSubjects.find(s => s.name === subject);
        return subjectData ? subjectData.strength : 0;
    };

    const getRecommendedResources = (subject) => {
        const resources = {
            'Physics': ['HC Verma', 'DC Pandey', 'Physics Galaxy'],
            'Chemistry': ['NCERT', 'OP Tandon', 'MS Chouhan'],
            'Maths': ['RD Sharma', 'Cengage', 'Arihant'],
            'General': ['Previous Year Papers', 'Mock Tests', 'Video Lectures']
        };
        return resources[subject] || resources['General'];
    };

    const handleBackClick = () => {
        gsap.to("body", {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                // Force a hard reload to ensure dashboard animations initialize properly
                window.location.href = '/dashboard';
            }
        });
    };

    const goToQuiz = () => {
        router.push('/practice');
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Loading your revision hub...</p>
                </div>
                <style jsx>{`
                    .loading-screen {
                        min-height: 100vh;
                        background: linear-gradient(135deg, #0a0c15 0%, #0f172a 100%);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .loading-content {
                        text-align: center;
                    }
                    .loading-spinner {
                        width: 60px;
                        height: 60px;
                        border: 3px solid rgba(59, 130, 246, 0.2);
                        border-top-color: #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s ease-in-out infinite;
                        margin-bottom: 1rem;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Smart Revision Hub | JEE Solver</title>
                <meta name="description" content="Revise bookmarked questions and improve weak areas with AI-powered flashcards" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="revision-page">
                {/* Animated Background */}
                <div className="bg-effects">
                    <div className="orb blue"></div>
                    <div className="orb purple"></div>
                    <div className="orb cyan"></div>
                    <div className="noise"></div>
                    <div className="grid-pattern"></div>
                </div>

                <div className="content-container">
                    {/* Header */}
                    <div ref={headerRef} className="header-section">
                        <button onClick={handleBackClick} className="back-button">
                            <ArrowLeft size={18} />
                            <span>Back to Dashboard</span>
                        </button>
                        
                        <div className="hero-badge">
                            <BrainCircuit size={16} />
                            <span>AI-Powered Revision</span>
                        </div>
                        
                        <h1 className="hero-title">
                            Smart Revision 
                            <span className="gradient-text"> Hub</span>
                        </h1>
                        
                        <p className="hero-description">
                            Master your weak areas with AI-powered flashcards and personalized insights
                        </p>
                    </div>

                    {/* Stats Cards - Real Data */}
                    <div ref={statsRef} className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon bookmarks">
                                <Bookmark size={24} />
                            </div>
                            <div className="stat-info">
                                <p className="stat-value">{bookmarkedQuestions.length}</p>
                                <p className="stat-label">Bookmarked Questions</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon streak">
                                <Flame size={24} />
                            </div>
                            <div className="stat-info">
                                <p className="stat-value">{streak} Days</p>
                                <p className="stat-label">Revision Streak</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon progress">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-info">
                                <p className="stat-value">{revisionProgress}%</p>
                                <p className="stat-label">Revision Progress</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon mastered">
                                <Trophy size={24} />
                            </div>
                            <div className="stat-info">
                                <p className="stat-value">{weakSubjects.filter(s => s.strength >= 70).length}</p>
                                <p className="stat-label">Strong Subjects</p>
                            </div>
                        </div>
                    </div>

                    <div className="tab-navigation">
                        <button 
                            onClick={() => setActiveTab('mistakes')}
                            className={`tab-btn ${activeTab === 'mistakes' ? 'active' : ''}`}
                        >
                            <BrainCircuit size={18} />
                            <span>Mistake Bank</span>
                            {mistakes.filter(m => new Date(m.nextReviewDate) <= new Date()).length > 0 && 
                                <span className="badge warning">
                                    {mistakes.filter(m => new Date(m.nextReviewDate) <= new Date()).length} Due
                                </span>
                            }
                        </button>
                        <button 
                            onClick={() => setActiveTab('bookmarks')}
                            className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
                        >
                            <Bookmark size={18} />
                            <span>Bookmarked Questions</span>
                            {bookmarkedQuestions.length > 0 && <span className="badge">{bookmarkedQuestions.length}</span>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('weakAreas')}
                            className={`tab-btn ${activeTab === 'weakAreas' ? 'active' : ''}`}
                        >
                            <AlertCircle size={18} />
                            <span>Weak Areas Analysis</span>
                            {weakSubjects.filter(s => s.strength < 50).length > 0 && 
                                <span className="badge warning">{weakSubjects.filter(s => s.strength < 50).length}</span>
                            }
                        </button>
                    </div>

                    {activeTab === 'mistakes' ? (
                        mistakes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Trophy size={64} style={{ color: '#10b981' }} />
                                </div>
                                <h3>Mistake Bank Empty!</h3>
                                <p>You have no pending wrong answers to review. Keep up the good work!</p>
                                <button onClick={goToQuiz} className="primary-btn">
                                    <Zap size={18} />
                                    Start Practicing
                                </button>
                            </div>
                        ) : (
                            <div className="mistakes-layout">
                                <div className="section-header">
                                    <div className="header-left">
                                        <Flame size={20} className="icon" style={{ color: '#ef4444' }} />
                                        <h2>Spaced Repetition Review</h2>
                                    </div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginLeft: '2rem' }}>
                                        Reviewing mistakes at intervals (3, 7, 14 days) pushes them into your long-term memory.
                                    </p>
                                </div>
                                
                                <div className="mistakes-grid">
                                    {mistakes.map(mistake => {
                                        const isDue = new Date(mistake.nextReviewDate) <= new Date();
                                        const reviewDates = mistake.reviewSchedule || [];
                                        const reviewCount = mistake.reviewCount || 0;
                                        
                                        return (
                                            <div key={mistake.id} className={`mistake-card ${isDue ? 'due' : 'upcoming'}`}>
                                                <div className="mistake-header">
                                                    <span className={`status-badge ${isDue ? 'due-badge' : 'upcoming-badge'}`}>
                                                        {isDue ? 'Due for Review' : `Next review: ${new Date(mistake.nextReviewDate).toLocaleDateString()}`}
                                                    </span>
                                                    <span className="topic-badge">{mistake.topic}</span>
                                                </div>
                                                <p className="mistake-question">{mistake.question}</p>
                                                
                                                <div className="mistake-answers">
                                                    <div className="wrong-answer">
                                                        <span className="label">You answered:</span>
                                                        <span className="text">{mistake.userAnswer}</span>
                                                    </div>
                                                    <div className="correct-answer">
                                                        <span className="label">Correct answer:</span>
                                                        <span className="text">{mistake.correctAnswer}</span>
                                                    </div>
                                                </div>
                                                
                                                {mistake.explanation && (
                                                    <div className="mistake-explanation">
                                                        <Lightbulb size={14} style={{ color: '#eab308', flexShrink: 0 }} />
                                                        <p dangerouslySetInnerHTML={{ __html: mistake.explanation }}></p>
                                                    </div>
                                                )}

                                                <div className="mistake-actions">
                                                    <div className="spaced-rep-progress">
                                                        <span>Progress:</span>
                                                        <div className="dots">
                                                            <div className={`dot ${reviewCount >= 1 ? 'done' : ''}`}></div>
                                                            <div className={`dot ${reviewCount >= 2 ? 'done' : ''}`}></div>
                                                            <div className={`dot ${reviewCount >= 3 ? 'done' : ''}`}></div>
                                                        </div>
                                                    </div>
                                                    {isDue && (
                                                        <button 
                                                            className="mark-reviewed-btn"
                                                            onClick={async () => {
                                                                const newCount = reviewCount + 1;
                                                                const mastered = newCount >= 3;
                                                                const updateData = { 
                                                                    reviewCount: newCount, 
                                                                    mastered,
                                                                    lastReviewed: new Date()
                                                                };
                                                                if (!mastered && reviewDates[newCount]) {
                                                                    updateData.nextReviewDate = reviewDates[newCount];
                                                                }
                                                                await updateDoc(doc(db, 'mistakeBank', mistake.id), updateData);
                                                                setMistakes(prev => prev.filter(m => m.id !== mistake.id));
                                                            }}
                                                        >
                                                            Mark as Reviewed <ChevronRight size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ) : activeTab === 'bookmarks' ? (
                        bookmarkedQuestions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Bookmark size={64} />
                                </div>
                                <h3>No bookmarks yet</h3>
                                <p>Bookmark questions during quizzes to review them here</p>
                                <button onClick={goToQuiz} className="primary-btn">
                                    <Zap size={18} />
                                    Start Practicing
                                </button>
                            </div>
                        ) : (
                            <div className="flashcards-layout">
                                {/* Flashcard Section */}
                                <div className="flashcard-section">
                                    <div className="section-header">
                                        <div className="header-left">
                                            <Sparkles size={20} className="icon" />
                                            <h2>Flashcard Revision</h2>
                                        </div>
                                        <div className="subject-filter">
                                            <Filter size={14} />
                                            <select 
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                            >
                                                {subjects.map(subject => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="card-counter">
                                        <span className="count">{filteredBookmarks.length}</span>
                                        <span>questions in {selectedSubject}</span>
                                        <span className="progress-badge">{currentCardIndex + 1} / {filteredBookmarks.length}</span>
                                    </div>
                                    
                                    {filteredBookmarks.length > 0 ? (
                                        <>
                                            <div className="flashcard-wrapper">
                                                <div ref={cardRef} onClick={flipCard} className="flashcard">
                                                    <div className="flashcard-front">
                                                        <div className="card-badge question-badge">
                                                            <Eye size={12} />
                                                            Question
                                                        </div>
                                                        <p className="question-text">
                                                            {filteredBookmarks[currentCardIndex]?.question}
                                                        </p>
                                                        <div className="topic-tag">
                                                            <Layers size={12} />
                                                            {filteredBookmarks[currentCardIndex]?.topic}
                                                        </div>
                                                        <div className="flip-hint">
                                                            <Lightbulb size={12} />
                                                            Click to reveal answer
                                                        </div>
                                                    </div>
                                                    <div className="flashcard-back">
                                                        <div className="card-badge answer-badge">
                                                            <Sparkles size={12} />
                                                            Answer
                                                        </div>
                                                        <p className="answer-text">
                                                            {filteredBookmarks[currentCardIndex]?.correctAnswer}
                                                        </p>
                                                        <div className="action-buttons-flashcard">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsMastered(filteredBookmarks[currentCardIndex]?.id);
                                                                }}
                                                                className="mastered-btn"
                                                            >
                                                                <Trophy size={14} />
                                                                Mastered
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeBookmark(filteredBookmarks[currentCardIndex]?.id);
                                                                }}
                                                                className="remove-btn"
                                                            >
                                                                <X size={14} />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flashcard-controls">
                                                <button onClick={handleNextCard} className="next-btn">
                                                    <RefreshCw size={18} />
                                                    Next Card
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-questions">
                                            <BookOpen size={48} />
                                            <p>No bookmarks in this subject</p>
                                        </div>
                                    )}
                                </div>

                                {/* Bookmark Catalog */}
                                <div className="catalog-section">
                                    <div className="section-header">
                                        <div className="header-left">
                                            <Layers size={20} className="icon" />
                                            <h2>Subject-wise Catalog</h2>
                                        </div>
                                    </div>
                                    <div className="catalog-list">
                                        {Object.entries(bookmarksBySubject).map(([subject, items]) => (
                                            <div key={subject} className="catalog-item">
                                                <div 
                                                    className="catalog-header"
                                                    onClick={() => toggleSubject(subject)}
                                                >
                                                    <div className="subject-info">
                                                        <div className="subject-dot"></div>
                                                        <h3>{subject}</h3>
                                                        <span className="question-count">{items.length} questions</span>
                                                        {getSubjectPerformance(subject) > 0 && (
                                                            <span className={`performance-badge ${getSubjectPerformance(subject) >= 70 ? 'good' : getSubjectPerformance(subject) >= 40 ? 'average' : 'poor'}`}>
                                                                {getSubjectPerformance(subject)}% mastery
                                                            </span>
                                                        )}
                                                    </div>
                                                    {expandedSubjects[subject] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {expandedSubjects[subject] && (
                                                    <div className="catalog-content">
                                                        {items.map((bookmark) => (
                                                            <div key={bookmark.id} id={`bookmark-${bookmark.id}`} className="question-item">
                                                                <p className="question-preview">{bookmark.question}</p>
                                                                <div className="question-meta">
                                                                    <span className="topic">{bookmark.topic}</span>
                                                                    <span className="answer">Answer: {bookmark.correctAnswer}</span>
                                                                    <button 
                                                                        onClick={() => removeBookmark(bookmark.id)}
                                                                        className="remove-icon"
                                                                        title="Remove bookmark"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="weak-areas-layout">
                            {/* Subject Performance - Real Data */}
                            <div className="performance-card">
                                <div className="card-header">
                                    <BarChart3 size={20} />
                                    <h3>Subject Performance</h3>
                                </div>
                                <div className="subjects-list">
                                    {weakSubjects.length > 0 ? (
                                        weakSubjects.map((subject, idx) => {
                                            const strength = subject.strength;
                                            let statusClass = 'critical';
                                            if (strength >= 60) statusClass = 'good';
                                            else if (strength >= 40) statusClass = 'average';
                                            
                                            return (
                                                <div key={idx} className="subject-item">
                                                    <div className="subject-header">
                                                        <span className="subject-name">{subject.name}</span>
                                                        <div className="subject-stats">
                                                            <span className={`status ${statusClass}`}>{strength}%</span>
                                                            <span className="improvement positive">
                                                                {subject.improvement}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="progress-bar-container">
                                                        <div 
                                                            className={`progress-fill ${statusClass}`}
                                                            style={{ width: `${strength}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="subject-details">
                                                        <span>Questions attempted: {subject.questions}</span>
                                                        <span>Correct: {subject.correct}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => router.push(`/practice?subject=${subject.name}`)} 
                                                        className="practice-btn"
                                                    >
                                                        <Target size={14} />
                                                        Practice {subject.name}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-data">
                                            <p>Complete more quizzes to see performance data</p>
                                            <button onClick={goToQuiz} className="primary-btn small">
                                                Start Practicing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Improvement Areas - Real Data */}
                            <div className="improvement-card">
                                <div className="card-header">
                                    <TrendingUp size={20} />
                                    <h3>Areas for Improvement</h3>
                                </div>
                                
                                <div className="priority-areas">
                                    <h4>Priority Topics (Below 50% Mastery)</h4>
                                    <div className="priority-list">
                                        {weakSubjects.filter(s => s.strength < 50).map(subject => (
                                            <div key={subject.name} className="priority-item">
                                                <div className="priority-dot critical"></div>
                                                <span>{subject.name}</span>
                                                <span className="priority-score">{subject.strength}% mastery</span>
                                                <span className="questions-count">{subject.questions} questions</span>
                                            </div>
                                        ))}
                                        {weakSubjects.filter(s => s.strength < 50).length === 0 && (
                                            <p className="no-priority">Great job! No priority areas found.</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="improving-areas">
                                    <h4>Showing Improvement (50-70% Mastery)</h4>
                                    <div className="improving-list">
                                        {weakSubjects.filter(s => s.strength >= 50 && s.strength < 70).map(subject => (
                                            <div key={subject.name} className="improving-item">
                                                <div className="priority-dot average"></div>
                                                <span>{subject.name}</span>
                                                <span className="improvement-score">+{subject.improvement}</span>
                                                <span className="mastery-score">{subject.strength}%</span>
                                            </div>
                                        ))}
                                        {weakSubjects.filter(s => s.strength >= 50 && s.strength < 70).length === 0 && (
                                            <p className="no-priority">Keep practicing to see improvement!</p>
                                        )}
                                    </div>
                                </div>

                                <div className="revision-tip">
                                    <Lightbulb size={16} />
                                    <p>Based on your performance, focus 30 minutes daily on priority topics for best results</p>
                                </div>
                            </div>

                            {/* Recommended Resources - Based on Weak Areas */}
                            <div className="resources-card">
                                <div className="card-header">
                                    <GraduationCap size={20} />
                                    <h3>Recommended Resources</h3>
                                </div>
                                <div className="resources-list">
                                    {weakSubjects.filter(s => s.strength < 60).slice(0, 3).map(subject => (
                                        <div key={subject.name} className="resource-item">
                                            <div className="resource-icon">📚</div>
                                            <div>
                                                <h4>{subject.name} - Recommended</h4>
                                                <p>Focus on {subject.name} fundamentals</p>
                                            </div>
                                            <ExternalLink size={16} />
                                        </div>
                                    ))}
                                    {weakSubjects.filter(s => s.strength < 60).length === 0 && (
                                        <div className="resource-item">
                                            <div className="resource-icon">🎯</div>
                                            <div>
                                                <h4>Advanced Practice</h4>
                                                <p>Ready for advanced level questions!</p>
                                            </div>
                                            <ExternalLink size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .revision-page {
                    min-height: 100vh;
                    background: #0a0c15;
                    position: relative;
                    overflow-x: hidden;
                    font-family: 'Inter', sans-serif;
                }

                /* Background Effects */
                .bg-effects {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                }

                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float 15s ease-in-out infinite;
                }

                .orb.blue {
                    width: 500px;
                    height: 500px;
                    background: #3b82f6;
                    top: -200px;
                    right: -200px;
                }

                .orb.purple {
                    width: 400px;
                    height: 400px;
                    background: #a855f7;
                    bottom: -150px;
                    left: -150px;
                    animation-delay: -5s;
                }

                .orb.cyan {
                    width: 300px;
                    height: 300px;
                    background: #06b6d4;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -10s;
                }

                .noise {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    background-size: 256px;
                    opacity: 0.02;
                    pointer-events: none;
                }

                .grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .content-container {
                    position: relative;
                    z-index: 2;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Header */
                .header-section {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .back-button {
                    position: absolute;
                    left: 2rem;
                    top: 2rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.6rem 1.2rem;
                    border-radius: 50px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .back-button:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                    transform: translateX(-4px);
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    margin-bottom: 1.5rem;
                    font-size: 0.85rem;
                    color: #93c5fd;
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    color: white;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #60a5fa, #a855f7, #ec489a);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }

                .hero-description {
                    font-size: 1.1rem;
                    color: #94a3b8;
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon.bookmarks { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .stat-icon.streak { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .stat-icon.progress { background: linear-gradient(135deg, #10b981, #059669); }
                .stat-icon.mastered { background: linear-gradient(135deg, #a855f7, #7c3aed); }

                .stat-info .stat-value {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1;
                }

                .stat-info .stat-label {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin-top: 0.25rem;
                }

                /* Tab Navigation */
                .tab-navigation {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    position: relative;
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, #3b82f6, #a855f7);
                    border-color: transparent;
                    color: white;
                }

                .badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.15rem 0.4rem;
                    border-radius: 50px;
                }

                .badge.warning {
                    background: #f59e0b;
                }

                /* Flashcards Layout */
                .flashcards-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .flashcard-section, .catalog-section {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .header-left .icon {
                    color: #a855f7;
                }

                .section-header h2 {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: white;
                }

                .subject-filter {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                }

                .subject-filter select {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 0.85rem;
                    cursor: pointer;
                }

                .card-counter {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding: 0.75rem 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                }

                .card-counter .count {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #3b82f6;
                }

                .progress-badge {
                    background: rgba(59, 130, 246, 0.2);
                    padding: 0.25rem 0.75rem;
                    border-radius: 50px;
                    font-size: 0.8rem;
                }

                /* Flashcard */
                .flashcard-wrapper {
                    perspective: 1000px;
                    margin-bottom: 1.5rem;
                }

                .flashcard {
                    position: relative;
                    width: 100%;
                    height: 380px;
                    cursor: pointer;
                    transform-style: preserve-3d;
                    transition: transform 0.6s;
                }

                .flashcard-front, .flashcard-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    border-radius: 20px;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }

                .flashcard-front {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    border: 1px solid rgba(168, 85, 247, 0.3);
                }

                .flashcard-back {
                    background: linear-gradient(135deg, #0f172a, #1e293b);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    transform: rotateY(180deg);
                }

                .card-badge {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 50px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .question-badge {
                    background: rgba(168, 85, 247, 0.2);
                    color: #c084fc;
                }

                .answer-badge {
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                }

                .question-text, .answer-text {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: white;
                    margin: 1rem 0;
                }

                .topic-tag {
                    position: absolute;
                    bottom: 1rem;
                    left: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .flip-hint {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .action-buttons-flashcard {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    display: flex;
                    gap: 0.5rem;
                }

                .mastered-btn, .remove-btn {
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    transition: all 0.3s ease;
                }

                .mastered-btn {
                    background: rgba(16, 185, 129, 0.2);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #34d399;
                }

                .mastered-btn:hover {
                    background: rgba(16, 185, 129, 0.3);
                }

                .remove-btn {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                }

                .remove-btn:hover {
                    background: rgba(239, 68, 68, 0.3);
                }

                .flashcard-controls {
                    display: flex;
                    justify-content: center;
                }

                .next-btn {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                }

                .next-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
                }

                /* Catalog Section */
                .catalog-list {
                    max-height: 500px;
                    overflow-y: auto;
                }

                .catalog-item {
                    margin-bottom: 0.75rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .catalog-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.02);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .catalog-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .subject-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .subject-dot {
                    width: 8px;
                    height: 8px;
                    background: #3b82f6;
                    border-radius: 50%;
                }

                .subject-info h3 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: white;
                }

                .question-count {
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .performance-badge {
                    font-size: 0.65rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }

                .performance-badge.good {
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                }

                .performance-badge.average {
                    background: rgba(245, 158, 11, 0.2);
                    color: #fbbf24;
                }

                .performance-badge.poor {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .catalog-content {
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                }

                .question-item {
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .question-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .question-preview {
                    font-size: 0.85rem;
                    color: #e2e8f0;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                }

                .question-meta {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .question-meta .topic {
                    font-size: 0.7rem;
                    color: #64748b;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }

                .question-meta .answer {
                    font-size: 0.7rem;
                    color: #10b981;
                }

                .remove-icon {
                    background: none;
                    border: none;
                    color: #f87171;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .question-item:hover .remove-icon {
                    opacity: 1;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 4rem;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: #3b82f6;
                }

                .empty-state h3 {
                    font-size: 1.3rem;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                }

                .primary-btn {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                }

                .primary-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
                }

                .primary-btn.small {
                    padding: 0.5rem 1rem;
                    font-size: 0.85rem;
                }

                /* Weak Areas Layout */
                .weak-areas-layout {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .performance-card, .improvement-card, .resources-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 1.5rem;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .card-header svg {
                    color: #3b82f6;
                }

                .card-header h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                }

                .subjects-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .subject-item {
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                }

                .subject-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .subject-name {
                    font-weight: 600;
                    color: white;
                }

                .subject-stats {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .status {
                    font-size: 0.8rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }

                .status.critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
                .status.average { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
                .status.good { background: rgba(16, 185, 129, 0.2); color: #34d399; }

                .improvement {
                    font-size: 0.7rem;
                }

                .improvement.positive { color: #10b981; }

                .progress-bar-container {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 0.5rem 0;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.5s ease;
                }

                .progress-fill.critical { background: #ef4444; }
                .progress-fill.average { background: #f59e0b; }
                .progress-fill.good { background: #10b981; }

                .subject-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    color: #64748b;
                    margin: 0.5rem 0;
                }

                .practice-btn {
                    width: 100%;
                    margin-top: 0.75rem;
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 0.5rem;
                    border-radius: 8px;
                    color: #60a5fa;
                    font-size: 0.8rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                    transition: all 0.3s ease;
                }

                .practice-btn:hover {
                    background: rgba(59, 130, 246, 0.3);
                }

                .priority-areas, .improving-areas {
                    margin-bottom: 1.5rem;
                }

                .priority-areas h4, .improving-areas h4 {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-bottom: 0.75rem;
                }

                .priority-item, .improving-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                }

                .priority-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .priority-dot.critical { background: #ef4444; }
                .priority-dot.average { background: #f59e0b; }

                .priority-score {
                    margin-left: auto;
                    font-size: 0.75rem;
                    color: #f87171;
                }

                .questions-count {
                    font-size: 0.65rem;
                    color: #64748b;
                }

                .improvement-score {
                    margin-left: auto;
                    font-size: 0.75rem;
                    color: #10b981;
                }

                .mastery-score {
                    font-size: 0.7rem;
                    color: #94a3b8;
                }

                .no-priority {
                    color: #64748b;
                    font-size: 0.85rem;
                    text-align: center;
                    padding: 1rem;
                }

                .no-data {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                }

                .revision-tip {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(168, 85, 247, 0.1));
                    border-radius: 12px;
                    margin-top: 1rem;
                }

                .revision-tip svg {
                    color: #f59e0b;
                    flex-shrink: 0;
                }

                .revision-tip p {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    line-height: 1.4;
                }

                .resources-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .resource-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .resource-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateX(4px);
                }

                .resource-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .resource-item h4 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 0.2rem;
                }

                .resource-item p {
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .resource-item svg:last-child {
                    margin-left: auto;
                    color: #64748b;
                }

                .no-questions {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                }

                /* Responsive */
                @media (max-width: 968px) {
                    .content-container {
                        padding: 1rem;
                    }
                    
                    .hero-title {
                        font-size: 2rem;
                    }
                    
                    .back-button {
                        position: static;
                        margin-bottom: 1rem;
                        display: inline-flex;
                    }
                    
                    .flashcards-layout {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .tab-navigation {
                        flex-direction: column;
                    }
                    
                    .weak-areas-layout {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .flashcard {
                        height: 450px;
                    }
                    
                    .question-text, .answer-text {
                        font-size: 0.9rem;
                    }
                    
                    .subject-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }

                .mistakes-layout {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 2rem;
                    backdrop-filter: blur(10px);
                }

                .mistakes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 1.5rem;
                }

                .mistake-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }

                .mistake-card.due {
                    border-left: 4px solid var(--accent-red);
                    background: linear-gradient(to right, rgba(239, 68, 68, 0.05), rgba(255, 255, 255, 0.02));
                }

                .mistake-card.upcoming {
                    border-left: 4px solid var(--accent-blue);
                }

                .mistake-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .status-badge {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.3rem 0.6rem;
                    border-radius: 20px;
                }

                .due-badge { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
                .upcoming-badge { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
                .topic-badge { background: rgba(255,255,255,0.1); font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; }

                .mistake-question { font-size: 1.1rem; margin-bottom: 1.5rem; font-weight: 500; }
                
                .mistake-answers {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .wrong-answer, .correct-answer {
                    padding: 1rem;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .wrong-answer { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
                .wrong-answer .label { color: #fca5a5; font-size: 0.8rem; text-transform: uppercase; }
                
                .correct-answer { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
                .correct-answer .label { color: #6ee7b7; font-size: 0.8rem; text-transform: uppercase; }

                .mistake-explanation {
                    display: flex;
                    gap: 0.75rem;
                    background: rgba(0,0,0,0.3);
                    padding: 1rem;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    color: var(--secondary-text);
                    margin-bottom: 1.5rem;
                    flex: 1;
                }

                .mistake-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border-color);
                    padding-top: 1rem;
                    margin-top: auto;
                }

                .spaced-rep-progress {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    font-size: 0.85rem;
                    color: var(--secondary-text);
                }

                .spaced-rep-progress .dots { display: flex; gap: 0.5rem; }
                .spaced-rep-progress .dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.1); }
                .spaced-rep-progress .dot.done { background: var(--accent-green); box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }

                .mark-reviewed-btn {
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }

                .mark-reviewed-btn:hover { background: #2563eb; transform: translateY(-2px); }

                @media (max-width: 768px) {
                    .mistakes-grid { grid-template-columns: 1fr; }
                    .mistake-answers { grid-template-columns: 1fr; }
                }
            `}</style>
        </>
    );
};

export default RevisionPage;