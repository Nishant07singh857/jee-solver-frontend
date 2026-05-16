import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, Home, ChevronLeft, ChevronRight, BookOpen, CheckCircle, XCircle, Lightbulb, Loader, WifiOff, Database, Shuffle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import localQuestions from '../data/physicsQuestions.json';

// Flatten local JSON questions as fallback
const getLocalFallback = () => {
    const all = [];
    if (localQuestions) {
        Object.entries(localQuestions).forEach(([year, qs]) => {
            qs.forEach(q => all.push({ ...q, _source: 'local', _year: year }));
        });
    }
    return all;
};

// Helper to chunk array
const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

// Helper to shuffle array
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const OfflineQuizPage = () => {
    const router = useRouter();
    const [step, setStep] = useState('loading'); // loading | select | select_sets | quiz | result
    const [firebaseQuestions, setFirebaseQuestions] = useState([]);
    const [activeQuestions, setActiveQuestions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showHint, setShowHint] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [dataSource, setDataSource] = useState('firebase'); // 'firebase' | 'local'

    // ── Fetch from Firebase on mount ──────────────────────────────────────
    useEffect(() => {
        const fetchFromFirebase = async () => {
            try {
                const snap = await getDocs(collection(db, 'questions'));
                const docs = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.explanation && d.options && (d.question || d.questionText)) {
                        docs.push({
                            id: doc.id,
                            question: d.question || d.questionText || '',
                            options: d.options,
                            correctAnswer: d.correctAnswer || (d.options && d.options[d.answer_index]) || '',
                            explanation: d.explanation,
                            hint: d.hint || '',
                            subject: d.subject || 'General',
                            topic: d.topic || 'Mixed',
                            _source: 'firebase'
                        });
                    }
                });

                if (docs.length > 0) {
                    // Shuffle the entire question bank once loaded so it feels fresh
                    setFirebaseQuestions(shuffleArray(docs));
                    setDataSource('firebase');
                } else {
                    setFirebaseQuestions(shuffleArray(getLocalFallback()));
                    setDataSource('local');
                }
                setStep('select');
            } catch (err) {
                console.error('Firebase fetch failed:', err);
                setFetchError('Could not reach Firebase. Using local questions.');
                setFirebaseQuestions(shuffleArray(getLocalFallback()));
                setDataSource('local');
                setStep('select');
            }
        };
        fetchFromFirebase();
    }, []);

    // ── Start Quiz ────────────────────────────────────────────────────────
    const startQuiz = (selectedQs) => {
        setActiveQuestions(selectedQs);
        setCurrentIndex(0);
        setUserAnswers({});
        setShowHint(false);
        setShowExplanation(false);
        setStep('quiz');
    };

    const handleAnswer = (option) => {
        const q = activeQuestions[currentIndex];
        if (userAnswers[q.id]) return;
        const isCorrect = option === q.correctAnswer;
        setUserAnswers(prev => ({ ...prev, [q.id]: { selected: option, isCorrect } }));
        setShowExplanation(true);
        setShowHint(false);
    };

    const goNext = () => {
        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(p => p + 1);
            setShowHint(false);
            setShowExplanation(!!userAnswers[activeQuestions[currentIndex + 1]?.id]);
        } else {
            setStep('result');
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            const prevQ = activeQuestions[currentIndex - 1];
            setCurrentIndex(p => p - 1);
            setShowHint(false);
            setShowExplanation(!!userAnswers[prevQ?.id]);
        }
    };

    const getScore = () => Object.values(userAnswers).filter(a => a.isCorrect).length;

    // ── GROUP questions by subject ─────────────────────────────────────────
    const grouped = firebaseQuestions.reduce((acc, q) => {
        const key = q.subject || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
    }, {});

    // ─────────────────────────────────────────────────────────────────────
    // LOADING
    // ─────────────────────────────────────────────────────────────────────
    if (step === 'loading') {
        return (
            <div style={S.page}>
                <Head><title>Offline Quiz | JEE Solver</title></Head>
                <div style={S.centered}>
                    <Loader size={48} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Fetching stored questions...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // SELECT SUBJECT SCREEN
    // ─────────────────────────────────────────────────────────────────────
    if (step === 'select') {
        return (
            <div style={S.page}>
                <Head><title>Offline Quiz | JEE Solver</title></Head>
                <div style={S.header}>
                    <button style={S.backBtn} onClick={() => router.push('/practice')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 style={S.pageTitle}>📚 Offline Question Bank</h1>
                    <button style={S.homeBtn} onClick={() => router.push('/dashboard')}>
                        <Home size={18} />
                    </button>
                </div>

                {fetchError && (
                    <div style={S.warnBanner}>⚠️ {fetchError}</div>
                )}

                <div style={S.selectWrap}>
                    <div style={S.sourceBadge}>
                        {dataSource === 'firebase'
                            ? <><Database size={14} /> Fetched from Firebase • {firebaseQuestions.length} questions</>
                            : <><WifiOff size={14} /> Using Local JSON • {firebaseQuestions.length} questions</>
                        }
                    </div>
                    <p style={S.subtitle}>Select a subject to choose a quiz set. Questions are shuffled to keep it fresh!</p>

                    <div style={S.cardsGrid}>
                        <button style={{ ...S.subjectCard, borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)' }}
                            onClick={() => startQuiz(shuffleArray(firebaseQuestions).slice(0, 15))}>
                            <div style={S.cardIcon}>🔀</div>
                            <div style={S.cardTitle}>Quick Mixed Test</div>
                            <div style={S.cardCount}>15 Random Questions</div>
                        </button>

                        {Object.entries(grouped).map(([subject, qs]) => (
                            <button key={subject} style={S.subjectCard} onClick={() => {
                                setSelectedSubject(subject);
                                setStep('select_sets');
                            }}>
                                <div style={S.cardIcon}>
                                    {subject === 'Physics' ? '⚛️' : subject === 'Chemistry' ? '🧪' : subject === 'Maths' ? '📐' : '📝'}
                                </div>
                                <div style={S.cardTitle}>{subject}</div>
                                <div style={S.cardCount}>{qs.length} Questions</div>
                                <div style={S.cardMeta}>Divided into sets →</div>
                            </button>
                        ))}
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // SELECT SETS SCREEN
    // ─────────────────────────────────────────────────────────────────────
    if (step === 'select_sets') {
        const subjectQs = grouped[selectedSubject] || [];
        const SET_SIZE = 10;
        const sets = chunkArray(subjectQs, SET_SIZE);

        return (
            <div style={S.page}>
                <Head><title>{selectedSubject} Sets | JEE Solver</title></Head>
                <div style={S.header}>
                    <button style={S.backBtn} onClick={() => setStep('select')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 style={S.pageTitle}>{selectedSubject} Question Sets</h1>
                    <button style={S.homeBtn} onClick={() => router.push('/dashboard')}>
                        <Home size={18} />
                    </button>
                </div>

                <div style={S.selectWrap}>
                    <p style={S.subtitle}>We've divided the {subjectQs.length} questions into sets of {SET_SIZE} to make practicing easier.</p>
                    
                    <div style={S.cardsGrid}>
                        <button style={{ ...S.subjectCard, background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}
                            onClick={() => startQuiz(shuffleArray(subjectQs).slice(0, SET_SIZE))}>
                            <div style={S.cardIcon}><Shuffle size={28} color="#fbbf24" /></div>
                            <div style={S.cardTitle}>Randomized Set</div>
                            <div style={S.cardCount}>{SET_SIZE} Questions</div>
                        </button>

                        {sets.map((setQs, i) => (
                            <button key={i} style={S.subjectCard} onClick={() => startQuiz(setQs)}>
                                <div style={S.cardIcon}>📚</div>
                                <div style={S.cardTitle}>Set {i + 1}</div>
                                <div style={S.cardCount}>{setQs.length} Questions</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // RESULT SCREEN
    // ─────────────────────────────────────────────────────────────────────
    if (step === 'result') {
        const score = getScore();
        const total = activeQuestions.length;
        const pct = Math.round((score / total) * 100);
        const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📖';
        const grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing!';
        return (
            <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Head><title>Result | JEE Solver</title></Head>
                <div style={S.resultCard}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{emoji}</div>
                    <h2 style={S.resultTitle}>Quiz Complete!</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{grade}</p>
                    <div style={S.scoreBox}>
                        <div style={S.scoreNum}>{score}/{total}</div>
                        <div style={{ color: '#94a3b8' }}>{pct}% Accuracy</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button style={S.btnPrimary} onClick={() => startQuiz(shuffleArray(activeQuestions))}>Retry Set (Shuffled)</button>
                        <button style={S.btnSecondary} onClick={() => { setStep('quiz'); setCurrentIndex(0); setShowExplanation(true); }}>Review Answers</button>
                        <button style={S.btnGhost} onClick={() => setStep('select')}>Back to Subjects</button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // QUIZ SCREEN
    // ─────────────────────────────────────────────────────────────────────
    const q = activeQuestions[currentIndex];
    if (!q) return null;
    const answered = userAnswers[q.id];
    const progress = ((currentIndex + 1) / activeQuestions.length) * 100;

    return (
        <div style={S.page}>
            <Head><title>Offline Quiz | JEE Solver</title></Head>

            {/* Header */}
            <div style={S.quizHeader}>
                <button style={S.backBtn} onClick={() => setStep('select_sets')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={S.offlineBadge}>⚡ OFFLINE · NO AI</span>
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{q.subject || 'Questions'}</span>
                </div>
                <button style={S.homeBtn} onClick={() => router.push('/dashboard')}>
                    <Home size={18} />
                </button>
            </div>

            {/* Progress */}
            <div style={S.progressWrap}>
                <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${progress}%` }} />
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {currentIndex + 1} / {activeQuestions.length}
                </span>
            </div>

            {/* Card */}
            <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={S.qNum}>Q{currentIndex + 1}</span>
                    {q.topic && <span style={S.topicTag}>{q.topic}</span>}
                </div>

                <p style={S.qText}>{q.question}</p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {q.options.map((opt, i) => {
                        let bg = 'rgba(30,41,59,0.6)';
                        let border = 'rgba(255,255,255,0.1)';
                        let color = '#e2e8f0';
                        let icon = null;

                        if (answered) {
                            if (opt === q.correctAnswer) {
                                bg = 'rgba(22,163,74,0.25)'; border = '#22c55e'; color = '#4ade80';
                                icon = <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />;
                            } else if (opt === answered.selected && !answered.isCorrect) {
                                bg = 'rgba(220,38,38,0.25)'; border = '#ef4444'; color = '#f87171';
                                icon = <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />;
                            } else {
                                bg = 'rgba(15,23,42,0.4)'; border = 'rgba(255,255,255,0.04)'; color = '#475569';
                            }
                        }

                        return (
                            <button key={i}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', border: `2px solid ${border}`, borderRadius: '12px', background: bg, color, fontSize: '1rem', textAlign: 'left', cursor: answered ? 'default' : 'pointer', transition: 'all 0.25s', width: '100%' }}
                                onClick={() => handleAnswer(opt)}
                                disabled={!!answered}
                            >
                                <span style={{ fontWeight: 700, minWidth: '22px', color: answered ? color : '#94a3b8' }}>{String.fromCharCode(65 + i)}.</span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>

                {/* Result banner */}
                {answered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.25rem', borderRadius: '10px', border: `1px solid ${answered.isCorrect ? '#22c55e' : '#ef4444'}`, background: answered.isCorrect ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)', marginBottom: '1rem', fontSize: '0.95rem', color: '#e2e8f0' }}>
                        {answered.isCorrect
                            ? <><CheckCircle size={20} style={{ color: '#22c55e' }} /><strong style={{ color: '#4ade80' }}>Correct!</strong> Great job!</>
                            : <><XCircle size={20} style={{ color: '#ef4444' }} /><strong style={{ color: '#f87171' }}>Wrong!</strong>&nbsp;Correct:&nbsp;<strong style={{ color: '#4ade80' }}>{q.correctAnswer}</strong></>
                        }
                    </div>
                )}

                {/* Hint */}
                {!answered && q.hint && (
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <button style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px' }}
                            onClick={() => setShowHint(h => !h)}>
                            <Lightbulb size={16} /> {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        {showHint && (
                            <div style={{ marginTop: '0.75rem', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '10px', padding: '1rem', fontSize: '0.9rem', color: '#c4b5fd', textAlign: 'left' }}>
                                💡 {q.hint}
                            </div>
                        )}
                    </div>
                )}

                {/* Explanation */}
                {answered && showExplanation && q.explanation && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <BookOpen size={18} style={{ color: '#f59e0b' }} />
                            <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>Explanation</strong>
                        </div>
                        <div style={{ color: '#cbd5e1', lineHeight: 1.75, fontSize: '0.95rem' }}>
                            {q.explanation.split('\n').map((line, i) => (
                                <p key={i} style={{ margin: '0.25rem 0' }}>{line}</p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem' }}>
                    <button style={{ ...S.navBtn, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', opacity: currentIndex === 0 ? 0.4 : 1 }}
                        onClick={goPrev} disabled={currentIndex === 0}>
                        <ChevronLeft size={20} /> Prev
                    </button>
                    <button style={{ ...S.navBtn, background: 'linear-gradient(to right,#6366f1,#8b5cf6)', color: 'white', opacity: !answered ? 0.45 : 1, marginLeft: 'auto' }}
                        onClick={goNext} disabled={!answered}>
                        {currentIndex === activeQuestions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                body { margin: 0; background: #0f172a; font-family: 'Inter', sans-serif; }
                * { box-sizing: border-box; }
                button:focus { outline: none; }
            `}</style>
        </div>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', color: '#e2e8f0', padding: '1rem' },
    centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(30,41,59,0.6)', borderRadius: '14px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' },
    quizHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(30,41,59,0.6)', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' },
    pageTitle: { margin: 0, fontSize: '1.4rem', fontWeight: 700, background: 'linear-gradient(to right,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#93c5fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.9rem' },
    homeBtn: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '8px', cursor: 'pointer' },
    offlineBadge: { fontSize: '0.7rem', background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '2px 10px', fontWeight: 700 },
    warnBanner: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '0.75rem 1.25rem', color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '700px', margin: '0 auto 1rem' },
    selectWrap: { maxWidth: '700px', margin: '0 auto', textAlign: 'center' },
    sourceBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
    subtitle: { color: '#94a3b8', fontSize: '1rem', marginBottom: '1.5rem' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', textAlign: 'center' },
    subjectCard: { background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.75rem 1rem', cursor: 'pointer', transition: 'all 0.3s', color: '#e2e8f0' },
    cardIcon: { fontSize: '2rem', marginBottom: '0.5rem' },
    cardTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.3rem' },
    cardCount: { fontSize: '0.9rem', color: '#4ade80', fontWeight: 600 },
    cardMeta: { fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' },
    progressWrap: { display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '750px', margin: '0 auto 1.5rem' },
    progressBar: { flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(to right,#6366f1,#a855f7)', borderRadius: '4px', transition: 'width 0.5s ease' },
    card: { maxWidth: '750px', margin: '0 auto', background: 'rgba(30,41,59,0.7)', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' },
    qNum: { background: 'linear-gradient(to right,#6366f1,#a855f7)', borderRadius: '8px', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 700, color: 'white' },
    topicTag: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 },
    qText: { fontSize: '1.2rem', lineHeight: 1.65, marginBottom: '1.75rem', fontWeight: 500, whiteSpace: 'pre-wrap' },
    navBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    resultCard: { background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '420px', width: '100%' },
    resultTitle: { fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#e2e8f0' },
    scoreBox: { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '1.5rem', margin: '1rem 0' },
    scoreNum: { fontSize: '3rem', fontWeight: 900, color: '#a5b4fc' },
    btnPrimary: { background: 'linear-gradient(to right,#6366f1,#8b5cf6)', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    btnSecondary: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', padding: '0.9rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
    btnGhost: { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', padding: '0.9rem', borderRadius: '12px', fontSize: '1rem', cursor: 'pointer' },
};

export default OfflineQuizPage;
