import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Award, Target, TrendingUp, Home, Coins } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MockResultsPage = () => {
    const router = useRouter();
    const [results, setResults] = useState(null);
    const [percentile, setPercentile] = useState(0);
    const [air, setAir] = useState(0);

    const [coinsEarned, setCoinsEarned] = useState(0);

    // Realistic JEE Mains Score to Percentile approximation
    const calculatePercentile = (score) => {
        if (score >= 250) return 99.90 + ((score - 250) / 50) * 0.1;
        if (score >= 200) return 99.00 + ((score - 200) / 50) * 0.9;
        if (score >= 150) return 97.00 + ((score - 150) / 50) * 2.0;
        if (score >= 100) return 93.00 + ((score - 100) / 50) * 4.0;
        if (score >= 70) return 85.00 + ((score - 70) / 30) * 8.0;
        if (score > 0) return (score / 70) * 85.00;
        return 0;
    };

    useEffect(() => {
        const stored = sessionStorage.getItem('mockResults');
        if (stored) {
            const parsed = JSON.parse(stored);
            setResults(parsed);
            
            const expectedPercentile = calculatePercentile(parsed.score);
            
            // Expected AIR (assume 12 lakh students)
            const rank = Math.round((100 - expectedPercentile) / 100 * 1200000);
            
            setPercentile(Math.min(100, Math.max(0, expectedPercentile)).toFixed(2));
            setAir(rank <= 0 ? 1 : rank);

            // Reward JEE Coins based on score (e.g. 50 coins for attempting + 2 per correct answer)
            const earned = 50 + (parsed.correct * 2);
            setCoinsEarned(earned);

            // Update Real Firebase Data
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        const currentCoins = data.stats?.jeeCoins || 0;
                        await updateDoc(userRef, {
                            'stats.jeeCoins': currentCoins + earned
                        });
                    }
                }
            });
            
            return () => unsubscribe();
        } else {
            router.push('/dashboard');
        }
    }, [router]);

    if (!results) return <div style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Loading Results...</div>;

    return (
        <div className="results-container">
            <Head>
                <title>Mock Test Results | JEE Solver</title>
                <style>{`
                    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; }
                    .results-container { padding: 40px 20px; max-width: 1000px; margin: 0 auto; text-align: center; }
                    .header h1 { font-size: 2.5rem; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
                    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px; }
                    .score-text { font-size: 4rem; font-weight: 900; margin: 10px 0; color: #3b82f6; }
                    .stat-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
                    .predictor-box { background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.1)); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; padding: 30px; margin-top: 30px; }
                    .highlight { color: #f59e0b; font-size: 3rem; font-weight: 900; display: block; margin: 10px 0; }
                    .actions { margin-top: 40px; }
                    .btn-home { background: #3b82f6; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; transition: transform 0.2s; }
                    .btn-home:hover { transform: scale(1.05); background: #2563eb; }
                `}</style>
            </Head>

            <div className="header">
                <h1>Test Analysis & Predictor</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Detailed breakdown of your NTA Mock Test performance</p>
            </div>

            <div className="grid">
                <div className="card">
                    <Target size={40} color="#3b82f6" style={{ margin: '0 auto' }} />
                    <h2>Total Score</h2>
                    <div className="score-text">{results.score} <span style={{fontSize: '1.5rem', color: '#64748b'}}>/ {results.maxScore}</span></div>
                    {coinsEarned > 0 && (
                        <div style={{ marginTop: '10px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(180,83,9,0.3))', padding: '10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 'bold' }}>
                            <Coins size={20} />
                            +{coinsEarned} JEE Coins Earned!
                        </div>
                    )}
                </div>

                <div className="card" style={{ textAlign: 'left' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}><Award size={24} style={{verticalAlign: 'middle', marginRight: '10px'}}/> Performance Stats</h2>
                    <div className="stat-row">
                        <span style={{color: '#94a3b8'}}>Total Questions</span>
                        <strong>{results.total}</strong>
                    </div>
                    <div className="stat-row">
                        <span style={{color: '#22c55e'}}>Correct (+)</span>
                        <strong style={{color: '#22c55e'}}>{results.correct}</strong>
                    </div>
                    <div className="stat-row">
                        <span style={{color: '#ef4444'}}>Incorrect (-)</span>
                        <strong style={{color: '#ef4444'}}>{results.incorrect}</strong>
                    </div>
                    <div className="stat-row" style={{border: 'none'}}>
                        <span style={{color: '#94a3b8'}}>Unattempted</span>
                        <strong>{results.unattempted}</strong>
                    </div>
                </div>
            </div>

            <div className="predictor-box">
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}><TrendingUp size={30} style={{verticalAlign: 'middle'}}/> Percentile & AIR Predictor</h2>
                <p style={{ color: '#cbd5e1', marginBottom: '30px' }}>Based on previous year cutoffs and paper difficulty level</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <span style={{ fontSize: '1.2rem', color: '#fbbf24' }}>Expected Percentile</span>
                        <span className="highlight">{percentile} %ile</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '1.2rem', color: '#fbbf24' }}>Expected All India Rank</span>
                        <span className="highlight">~ {air.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="actions">
                <button className="btn-home" onClick={() => router.push('/dashboard')}>
                    <Home size={20} /> Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default MockResultsPage;
