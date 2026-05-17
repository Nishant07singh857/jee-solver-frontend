import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Clock, Info } from 'lucide-react';
import physicsData from '../data/physicsQuestions.json';
import chemistryData from '../data/chemistryQuestions.json';
import mathsData from '../data/mathsQuestions.json';

// Helper to extract random questions
const getRandomQuestions = (data, count, subject) => {
    let allQuestions = [];
    Object.values(data).forEach(yearQuestions => {
        allQuestions = [...allQuestions, ...yearQuestions.map(q => ({...q, subject}))];
    });
    // Shuffle and pick 'count'
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const MockTestPage = () => {
    const router = useRouter();
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(180 * 60); // 180 mins
    const [answers, setAnswers] = useState({});
    const [status, setStatus] = useState({}); // 'not_visited', 'not_answered', 'answered', 'review', 'answered_review'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load questions
        const pQ = getRandomQuestions(physicsData, 25, 'Physics');
        const cQ = getRandomQuestions(chemistryData, 25, 'Chemistry');
        const mQ = getRandomQuestions(mathsData, 25, 'Maths');
        const allQ = [...pQ, ...cQ, ...mQ];
        
        // Ensure we have exactly 75, or however many are available if less
        setQuestions(allQ);
        
        // Init status
        const initialStatus = {};
        allQ.forEach((q, i) => {
            initialStatus[i] = i === 0 ? 'not_answered' : 'not_visited';
        });
        setStatus(initialStatus);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (loading) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    submitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (option) => {
        setAnswers(prev => ({ ...prev, [currentIdx]: option }));
    };

    const updateStatus = (idx, newStatus) => {
        setStatus(prev => ({ ...prev, [idx]: newStatus }));
    };

    const navigateTo = (idx) => {
        // Current question status update if moving away without saving
        if (status[currentIdx] === 'not_visited' || status[currentIdx] === 'not_answered') {
            if (answers[currentIdx]) {
                 updateStatus(currentIdx, 'answered');
            } else {
                 updateStatus(currentIdx, 'not_answered');
            }
        }
        
        setCurrentIdx(idx);
        if (status[idx] === 'not_visited') {
            updateStatus(idx, 'not_answered');
        }
    };

    const handleSaveAndNext = () => {
        if (answers[currentIdx]) {
            updateStatus(currentIdx, 'answered');
        } else {
            updateStatus(currentIdx, 'not_answered');
        }
        if (currentIdx < questions.length - 1) navigateTo(currentIdx + 1);
    };

    const handleClearResponse = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentIdx];
        setAnswers(newAnswers);
        updateStatus(currentIdx, 'not_answered');
    };

    const handleMarkForReviewAndNext = () => {
        if (answers[currentIdx]) {
            updateStatus(currentIdx, 'answered_review');
        } else {
            updateStatus(currentIdx, 'review');
        }
        if (currentIdx < questions.length - 1) navigateTo(currentIdx + 1);
    };

    const submitTest = () => {
        // Calculate score
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;

        questions.forEach((q, i) => {
            const ans = answers[i];
            const stat = status[i];
            
            // Evaluated if answered or answered_review
            if (stat === 'answered' || stat === 'answered_review') {
                if (ans === q.correctAnswer) {
                    correct++;
                } else {
                    incorrect++;
                }
            } else {
                unattempted++;
            }
        });

        const score = (correct * 4) - (incorrect * 1);
        
        const results = {
            total: questions.length,
            correct,
            incorrect,
            unattempted,
            score,
            maxScore: questions.length * 4
        };

        sessionStorage.setItem('mockResults', JSON.stringify(results));
        router.push('/mock-results');
    };

    if (loading) return <div className="loading">Loading Full Test...</div>;

    const currentQ = questions[currentIdx];

    // Status counts
    const counts = {
        not_visited: Object.values(status).filter(s => s === 'not_visited').length,
        not_answered: Object.values(status).filter(s => s === 'not_answered').length,
        answered: Object.values(status).filter(s => s === 'answered').length,
        review: Object.values(status).filter(s => s === 'review').length,
        answered_review: Object.values(status).filter(s => s === 'answered_review').length,
    };

    return (
        <div className="nta-container">
            <Head>
                <title>JEE Mock Test Simulator</title>
                <style>{`
                    body { margin: 0; font-family: Arial, sans-serif; background: #f0f0f0; }
                    .nta-container { display: flex; flex-direction: column; height: 100vh; }
                    .top-bar { background: #1e3a8a; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
                    .timer-box { font-size: 1.2rem; font-weight: bold; display: flex; align-items: center; gap: 8px; }
                    .main-content { display: flex; flex: 1; overflow: hidden; }
                    .left-panel { flex: 3; display: flex; flex-direction: column; background: white; color: #000; margin: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .question-header { padding: 15px; border-bottom: 1px solid #ccc; display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; color: #1e3a8a; }
                    .question-body { padding: 20px; flex: 1; overflow-y: auto; font-size: 1.1rem; color: #222; }
                    .options-list { margin-top: 20px; }
                    .option-item { margin-bottom: 15px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; color: #333; }
                    .option-item input { margin-top: 5px; }
                    .bottom-bar { padding: 15px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; background: #f9f9f9; }
                    .btn { padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-weight: bold; }
                    .btn-save { background: #22c55e; color: white; border: none; }
                    .btn-clear { background: white; color: #333; }
                    .btn-review { background: #eab308; color: white; border: none; }
                    .right-panel { flex: 1; background: white; color: #000; margin: 10px 10px 10px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
                    .profile-section { padding: 10px; text-align: center; border-bottom: 1px solid #ccc; color: #333; }
                    .status-legend { padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem; border-bottom: 1px solid #ccc; color: #444; }
                    .legend-item { display: flex; align-items: center; gap: 5px; }
                    .badge { width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 4px; color: white; font-weight: bold; }
                    .b-not_visited { background: #e2e8f0; color: #333; }
                    .b-not_answered { background: #ef4444; border-radius: 50% 50% 0 0; }
                    .b-answered { background: #22c55e; border-radius: 50% 50% 0 0; clip-path: polygon(50% 0%, 100% 50%, 100% 100%, 0 100%, 0 50%); }
                    .b-review { background: #a855f7; border-radius: 50%; }
                    .b-answered_review { background: #a855f7; border-radius: 50%; position: relative; }
                    .b-answered_review::after { content: '✓'; position: absolute; bottom: -5px; right: -5px; background: #22c55e; border-radius: 50%; width: 15px; height: 15px; font-size: 10px; display: flex; align-items: center; justify-content: center; }
                    .palette-section { padding: 15px; overflow-y: auto; flex: 1; }
                    .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
                    .palette-btn { width: 40px; height: 40px; border: none; cursor: pointer; font-weight: bold; display: flex; justify-content: center; align-items: center; }
                    .submit-section { padding: 15px; border-top: 1px solid #ccc; text-align: center; }
                    .btn-submit { background: #3b82f6; color: white; width: 100%; padding: 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1.1rem; }
                    /* Responsive Layout */
                    @media (max-width: 1024px) {
                        .main-content { flex-direction: column; overflow-y: auto; }
                        .left-panel { flex: none; min-height: 60vh; margin-bottom: 0; }
                        .right-panel { flex: none; margin: 10px; }
                        .palette-grid { grid-template-columns: repeat(10, 1fr); }
                        .bottom-bar { flex-wrap: wrap; gap: 10px; }
                        .bottom-bar > div { width: 100%; display: flex; flex-wrap: wrap; gap: 5px; }
                        .bottom-bar .btn { flex: 1 1 calc(33% - 5px); text-align: center; font-size: 0.85rem; padding: 10px 5px; white-space: nowrap; }
                        .bottom-bar > button { width: 100%; margin-top: 10px; }
                    }
                    @media (max-width: 600px) {
                        .palette-grid { grid-template-columns: repeat(6, 1fr); }
                        .top-bar h2 { font-size: 1.1rem; }
                        .timer-box { font-size: 1rem; }
                        .status-legend { grid-template-columns: 1fr; }
                    }
                `}</style>
            </Head>

            <div className="top-bar">
                <h2>JEE Main - Full Mock Test</h2>
                <div className="timer-box">
                    <Clock size={24} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="main-content">
                <div className="left-panel">
                    <div className="question-header">
                        <span>Question {currentIdx + 1}</span>
                        <span>{currentQ?.subject || 'Subject'}</span>
                    </div>
                    <div className="question-body">
                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
                            {currentQ?.question}
                        </div>
                        <div className="options-list">
                            {currentQ?.options?.map((opt, i) => (
                                <label key={i} className="option-item">
                                    <input 
                                        type="radio" 
                                        name="option" 
                                        checked={answers[currentIdx] === opt}
                                        onChange={() => handleOptionSelect(opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="bottom-bar">
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button className="btn btn-save" onClick={handleSaveAndNext}>Save & Next</button>
                            <button className="btn btn-clear" onClick={handleClearResponse}>Clear</button>
                            <button className="btn btn-review" onClick={handleMarkForReviewAndNext}>Mark for Review & Next</button>
                        </div>
                        <button className="btn btn-clear" onClick={() => navigateTo(Math.min(questions.length - 1, currentIdx + 1))}>Next &gt;&gt;</button>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="profile-section">
                        <h3>Test Profile</h3>
                        <p>Total Questions: {questions.length}</p>
                    </div>
                    <div className="status-legend">
                        <div className="legend-item"><div className="badge b-not_visited">{counts.not_visited}</div> Not Visited</div>
                        <div className="legend-item"><div className="badge b-not_answered">{counts.not_answered}</div> Not Answered</div>
                        <div className="legend-item"><div className="badge b-answered">{counts.answered}</div> Answered</div>
                        <div className="legend-item"><div className="badge b-review">{counts.review}</div> Marked for Review</div>
                        <div className="legend-item" style={{gridColumn: '1 / -1'}}><div className="badge b-answered_review">{counts.answered_review}</div> Answered & Marked for Review</div>
                    </div>
                    <div className="palette-section">
                        <h4>Question Palette</h4>
                        <div className="palette-grid">
                            {questions.map((_, i) => (
                                <button 
                                    key={i} 
                                    className={`palette-btn b-${status[i]}`}
                                    onClick={() => navigateTo(i)}
                                    style={{ border: currentIdx === i ? '2px solid black' : 'none' }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="submit-section">
                        <button className="btn-submit" onClick={submitTest}>Submit Test</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockTestPage;
