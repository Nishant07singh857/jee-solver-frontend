import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { ArrowLeft, BrainCircuit, Lightbulb, RefreshCw, Bookmark, X, Filter, Target, TrendingUp, AlertCircle, BarChart3, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const RevisionPage = () => {
    const [bookmarks, setBookmarks] = useState({});
    const [mistakes, setMistakes] = useState([]);
    const [weakSubjects, setWeakSubjects] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [subjects, setSubjects] = useState(['All']);
    const [activeTab, setActiveTab] = useState('bookmarks');
    const [expandedSubjects, setExpandedSubjects] = useState({});

    const cardRef = useRef(null);
    const router = useRouter();

    // Load bookmarks and weak areas from Firebase
    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                
                // Load bookmarks
                const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
                const bookmarksDoc = await getDoc(bookmarksRef);
                
                if (bookmarksDoc.exists()) {
                    const bookmarksData = bookmarksDoc.data();
                    setBookmarks(bookmarksData);
                    
                    // Extract unique subjects
                    const subjectSet = new Set(['All']);
                    Object.values(bookmarksData).forEach(bookmark => {
                        if (bookmark.subject) {
                            subjectSet.add(bookmark.subject);
                        }
                    });
                    setSubjects(Array.from(subjectSet));
                    
                    // Convert bookmarks to mistakes format for display
                    const mistakesData = Object.entries(bookmarksData).map(([id, bookmark]) => ({
                        id,
                        question: bookmark.question,
                        topic: bookmark.topic || 'General',
                        yourAnswer: 'Not answered yet',
                        correctAnswer: bookmark.correctAnswer,
                        subject: bookmark.subject || 'General'
                    }));
                    
                    setMistakes(mistakesData);
                }
                
                // Load weak subjects (mock data for now)
                const mockWeakSubjects = [
                    { name: 'Calculus', strength: 35, questions: 12, color: '#ef4444' },
                    { name: 'Organic Chemistry', strength: 42, questions: 8, color: '#f59e0b' },
                    { name: 'Electrodynamics', strength: 28, questions: 15, color: '#ef4444' },
                    { name: 'Algebra', strength: 65, questions: 10, color: '#10b981' },
                    { name: 'Mechanics', strength: 58, questions: 7, color: '#f59e0b' }
                ];
                setWeakSubjects(mockWeakSubjects);
                
                setLoading(false);
            } catch (error) {
                console.error("Error loading data:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Filter bookmarks by subject
    const filteredBookmarks = selectedSubject === 'All' 
        ? mistakes 
        : mistakes.filter(item => item.subject === selectedSubject);

    // Group bookmarks by subject
    const bookmarksBySubject = mistakes.reduce((groups, item) => {
        const subject = item.subject;
        if (!groups[subject]) {
            groups[subject] = [];
        }
        groups[subject].push(item);
        return groups;
    }, {});

    // Toggle subject expansion
    const toggleSubject = (subject) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subject]: !prev[subject]
        }));
    };

    // GSAP animation for flipping the card
    const flipCard = () => {
        if (filteredBookmarks.length === 0) return;
        
        gsap.to(cardRef.current, {
            rotationY: '+=180',
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => setIsFlipped(!isFlipped)
        });
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

    // Remove bookmark
    const removeBookmark = async (questionId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            const bookmarksRef = doc(db, 'userBookmarks', currentUser.uid);
            const updatedBookmarks = { ...bookmarks };
            delete updatedBookmarks[questionId];
            
            await setDoc(bookmarksRef, updatedBookmarks, { merge: true });
            setBookmarks(updatedBookmarks);
            
            // Update mistakes list
            const updatedMistakes = mistakes.filter(item => item.id !== questionId);
            setMistakes(updatedMistakes);
            
        } catch (error) {
            console.error("Error removing bookmark:", error);
        }
    };

    // Page load animations
    useEffect(() => {
        gsap.fromTo(".revision-section", 
            { opacity: 0, y: 50 }, 
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out', delay: 0.3 }
        );
        
        gsap.fromTo(".floating-element", 
            { y: 20, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
        );
    }, []);

    const handleBackClick = () => {
        router.push('/dashboard');
    };

    const goToQuiz = () => {
        router.push('/practice');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-gray-200 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="spinner"></div>
                    <p className="mt-4 text-lg">Loading your revision data...</p>
                </div>
                <style jsx>{`
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 3px solid rgba(255, 255, 255, 0.1);
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

    return (
        <>
            <Head>
                <title>Smart Revision | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-gray-200 font-sans p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4 floating-element">
                        <button onClick={handleBackClick} className="flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors bg-blue-900/30 hover:bg-blue-800/40 px-4 py-2 rounded-lg w-full sm:w-auto justify-center">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-black text-white text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Smart Revision Hub
                        </h1>
                        <button onClick={goToQuiz} className="flex items-center gap-2 text-green-300 hover:text-green-100 transition-colors bg-green-900/30 hover:bg-green-800/40 px-4 py-2 rounded-lg w-full sm:w-auto justify-center">
                            <Target size={18} />
                            Practice More
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8 floating-element">
                        <div className="bg-slate-800/50 rounded-xl p-1 flex w-full max-w-md">
                            <button 
                                onClick={() => setActiveTab('bookmarks')}
                                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all flex-1 justify-center ${activeTab === 'bookmarks' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Bookmark size={18} />
                                <span className="hidden sm:inline">Bookmarked</span>
                                <span className="sm:hidden">Bookmarks</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('weakAreas')}
                                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all flex-1 justify-center ${activeTab === 'weakAreas' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <AlertCircle size={18} />
                                <span className="hidden sm:inline">Weak Areas</span>
                                <span className="sm:hidden">Weak</span>
                            </button>
                        </div>
                    </div>

                    {activeTab === 'bookmarks' ? (
                        mistakes.length === 0 ? (
                            <div className="text-center py-16 floating-element bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                <Bookmark size={64} className="mx-auto text-gray-500 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-300 mb-2">No bookmarks yet</h2>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">Bookmark questions during quizzes to review them here</p>
                                <button 
                                    onClick={goToQuiz}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                                >
                                    Start Practicing
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Bookmarked Questions as Flashcards */}
                                <section className="revision-section bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <BrainCircuit className="text-purple-400" /> Flashcard Revision
                                        </h2>
                                        <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2">
                                            <Filter size={16} className="text-gray-400" />
                                            <select 
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="bg-transparent text-white border-none rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {subjects.map(subject => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6 flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                                        <p className="text-gray-400">
                                            <span className="font-semibold text-blue-400">{filteredBookmarks.length}</span> question{filteredBookmarks.length !== 1 ? 's' : ''} in <span className="font-semibold text-purple-400">{selectedSubject}</span>
                                        </p>
                                        <span className="text-xs bg-slate-700/50 text-gray-400 px-2 py-1 rounded-full">
                                            {currentCardIndex + 1} of {filteredBookmarks.length}
                                        </span>
                                    </div>
                                    
                                    {filteredBookmarks.length > 0 ? (
                                        <>
                                            <div className="perspective-container h-80 mb-6">
                                                {/* Flashcard */}
                                                <div ref={cardRef} onClick={flipCard} className="flashcard-container w-full h-full cursor-pointer">
                                                    {/* Front of the card */}
                                                    <div className="flashcard-face front bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-xl">
                                                        <div className="absolute top-4 left-4 bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded-full">
                                                            Question
                                                        </div>
                                                        <p className="text-xl font-semibold text-white mt-4">
                                                            {filteredBookmarks[currentCardIndex]?.question}
                                                        </p>
                                                        <p className="text-sm text-gray-400 mt-4 bg-slate-900/50 px-3 py-1 rounded-full">
                                                            Topic: {filteredBookmarks[currentCardIndex]?.topic}
                                                        </p>
                                                        <div className="absolute bottom-4 text-xs text-gray-500 flex items-center gap-1">
                                                            <Lightbulb size={12} /> Click to reveal answer
                                                        </div>
                                                    </div>
                                                    {/* Back of the card */}
                                                    <div className="flashcard-face back bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-xl">
                                                        <div className="absolute top-4 left-4 bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full">
                                                            Answer
                                                        </div>
                                                        <p className="text-xl font-semibold text-white mt-4">
                                                            {filteredBookmarks[currentCardIndex]?.correctAnswer}
                                                        </p>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeBookmark(filteredBookmarks[currentCardIndex]?.id);
                                                            }}
                                                            className="mt-6 text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-900/30 px-3 py-1 rounded-lg transition-colors"
                                                        >
                                                            <X size={16} />
                                                            Remove Bookmark
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Flashcard Controls */}
                                            <div className="flex justify-center">
                                                <button onClick={handleNextCard} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2">
                                                    <RefreshCw size={18} />
                                                    Next Card
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                                            <BookOpen size={48} className="mx-auto text-gray-500 mb-4" />
                                            <p className="text-gray-400">No bookmarks in this subject yet</p>
                                        </div>
                                    )}
                                </section>

                                {/* Right Column: Bookmark Catalog by Subject */}
                                <section className="revision-section bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <Lightbulb className="text-yellow-400"/> Subjects Overview
                                    </h2>
                                    <p className="text-gray-400 mb-6">Your bookmarks organized by subject.</p>
                                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(bookmarksBySubject).map(([subject, items]) => (
                                            <div key={subject} className="bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:border-slate-600/70">
                                                <div 
                                                    className="p-4 flex justify-between items-center cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                                                    onClick={() => toggleSubject(subject)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                        <h3 className="font-semibold text-white">{subject}</h3>
                                                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                                                            {items.length} question{items.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {expandedSubjects[subject] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {expandedSubjects[subject] && (
                                                    <div className="p-4 space-y-3 bg-slate-900/20">
                                                        {items.map((bookmark) => (
                                                            <div key={bookmark.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 transition-all hover:border-yellow-500/30 relative group">
                                                                <button 
                                                                    onClick={() => removeBookmark(bookmark.id)}
                                                                    className="absolute top-3 right-3 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove bookmark"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                                <p className="font-medium text-white pr-6">{bookmark.question}</p>
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    <span className="text-xs bg-slate-700/50 text-gray-400 px-2 py-1 rounded-full">
                                                                        Topic: {bookmark.topic}
                                                                    </span>
                                                                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">
                                                                        Answer: {bookmark.correctAnswer}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Weak Subjects Visualization */}
                            <section className="revision-section bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <BarChart3 className="text-blue-400" /> Subject Performance
                                </h2>
                                <p className="text-gray-400 mb-6">Your performance across different subjects.</p>
                                <div className="space-y-6">
                                    {weakSubjects.map((subject) => {
                                        const strength = subject.strength;
                                        let strengthColor = 'bg-red-500';
                                        if (strength >= 40) strengthColor = 'bg-amber-500';
                                        if (strength >= 60) strengthColor = 'bg-green-500';
                                        
                                        return (
                                            <div key={subject.name} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 transition-all hover:border-amber-500/30">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-semibold text-white text-lg">{subject.name}</h3>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
                                                        {subject.questions} questions
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                                    <div 
                                                        className={`h-2.5 rounded-full ${strengthColor} transition-all duration-500`} 
                                                        style={{ width: `${subject.strength}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-400">
                                                    <span>Mastery Level</span>
                                                    <span className={strength < 40 ? 'text-red-400' : strength < 60 ? 'text-amber-400' : 'text-green-400'}>
                                                        {subject.strength}%
                                                    </span>
                                                </div>
                                                <button className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg transition-colors">
                                                    Practice {subject.name} Questions
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Weak Subjects Analysis */}
                            <section className="revision-section bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <TrendingUp className="text-amber-400" /> Areas Needing Improvement
                                </h2>
                                <p className="text-gray-400 mb-6">Focus on these subjects to improve your overall score.</p>
                                
                                <div className="bg-gradient-to-br from-amber-900/30 to-red-900/30 border border-amber-500/30 rounded-2xl p-6 mb-6">
                                    <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                        <AlertCircle size={20} /> Priority Areas
                                    </h3>
                                    <ul className="space-y-2">
                                        {weakSubjects.filter(s => s.strength < 50).map(subject => (
                                            <li key={subject.name} className="flex items-center gap-3 p-2 rounded-lg bg-amber-900/20 hover:bg-amber-900/30 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="text-white">{subject.name}</span>
                                                <span className="text-red-400 ml-auto">{subject.strength}% mastery</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 border border-green-500/30 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                                        <TrendingUp size={20} /> Improving Areas
                                    </h3>
                                    <ul className="space-y-2">
                                        {weakSubjects.filter(s => s.strength >= 50 && s.strength < 70).map(subject => (
                                            <li key={subject.name} className="flex items-center gap-3 p-2 rounded-lg bg-green-900/20 hover:bg-green-900/30 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-white">{subject.name}</span>
                                                <span className="text-amber-400 ml-auto">{subject.strength}% mastery</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
            
            {/* CSS for the 3D flip effect and custom scrollbar */}
            <style jsx global>{`
                body {
                    font-family: 'Inter', sans-serif;
                }
                .perspective-container {
                    perspective: 1000px;
                }
                .flashcard-container {
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 0.6s;
                }
                .flashcard-face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    border-radius: 1rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                .flashcard-face.back {
                    transform: rotateY(180deg);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </>
    );
};

export default RevisionPage;