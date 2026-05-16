import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { Swords, User, Clock, CheckCircle, XCircle, ArrowLeft, Loader, Zap, Trophy } from 'lucide-react';
import { gsap } from 'gsap';
import axios from 'axios';
import physicsQuestions from '../data/physicsQuestions.json'; // using this for random questions

const getRandomQuestions = (count) => {
    let all = [];
    Object.values(physicsQuestions).forEach(year => all.push(...year));
    return all.sort(() => 0.5 - Math.random()).slice(0, count);
};

const BattlePage = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [battleId, setBattleId] = useState(null);
    const [battleData, setBattleData] = useState(null);
    const [status, setStatus] = useState('finding'); // finding, starting, playing, finished
    const [timer, setTimer] = useState(30);
    const [selectedOption, setSelectedOption] = useState(null);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const coinsAwardedRef = useRef(false);
    
    const containerRef = useRef(null);
    const isMovingRef = useRef(false);
    const battleIdRef = useRef(null);
    const statusRef = useRef('finding');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserName(currentUser.displayName || 'Anonymous Engineer');
                findOrCreateMatch(currentUser);
            } else {
                router.push('/login');
            }
        });
        
        const handleUnload = async () => {
            if (battleIdRef.current && statusRef.current === 'waiting') {
                await deleteDoc(doc(db, 'battles', battleIdRef.current));
            }
        };
        window.addEventListener('beforeunload', handleUnload);
        
        return () => {
            unsubscribe();
            window.removeEventListener('beforeunload', handleUnload);
            handleUnload();
        };
    }, []);

    const findOrCreateMatch = async (currentUser) => {
        const battlesRef = collection(db, 'battles');
        const q = query(battlesRef, where('status', '==', 'waiting'));
        const snapshot = await getDocs(q);
        
        let foundMatch = false;
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!foundMatch && data.player1.uid !== currentUser.uid) {
                // Check if match is recent (created within last 60 seconds) to avoid dead matches
                if (Date.now() - (data.createdAtMillis || 0) < 60000) {
                    foundMatch = true;
                    joinMatch(docSnap.id, currentUser);
                }
            }
        });
        
        if (!foundMatch) {
            createMatch(currentUser);
        }
    };

    const createMatch = async (currentUser) => {
        try {
            const questions = getRandomQuestions(5); // 5 question battle
            const docRef = await addDoc(collection(db, 'battles'), {
                status: 'waiting',
                player1: { uid: currentUser.uid, name: currentUser.displayName || 'Player 1', score: 0, answered: false },
                player2: null,
                questions: questions,
                currentQuestionIndex: 0,
                createdAt: serverTimestamp(),
                createdAtMillis: Date.now()
            });
            setBattleId(docRef.id);
            battleIdRef.current = docRef.id;
            listenToMatch(docRef.id);
        } catch (error) {
            console.error("Error creating match", error);
        }
    };

    const joinMatch = async (id, currentUser) => {
        try {
            const matchRef = doc(db, 'battles', id);
            await updateDoc(matchRef, {
                status: 'playing',
                player2: { uid: currentUser.uid, name: currentUser.displayName || 'Player 2', score: 0, answered: false }
            });
            setBattleId(id);
            battleIdRef.current = id;
            listenToMatch(id);
        } catch (error) {
            console.error("Error joining match", error);
        }
    };

    const listenToMatch = (id) => {
        const matchRef = doc(db, 'battles', id);
        onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBattleData(data);
                setStatus(data.status);
                statusRef.current = data.status;
                
                // If both answered, move to next question after a brief pause
                if (data.status === 'playing' && data.player1.answered && data.player2?.answered) {
                    if (!isMovingRef.current) {
                        isMovingRef.current = true;
                        setTimeout(() => {
                            moveToNextQuestion(id, data);
                        }, 2000);
                    }
                }
            }
        });
    };

    // Timer logic
    useEffect(() => {
        let interval;
        if (status === 'playing' && battleData && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, battleData, timer]);

    const handleTimeUp = async () => {
        if (!user || !battleData) return;
        const isPlayer1 = battleData.player1.uid === user.uid;
        const playerKey = isPlayer1 ? 'player1' : 'player2';
        
        if (!battleData[playerKey].answered) {
            const matchRef = doc(db, 'battles', battleId);
            await updateDoc(matchRef, {
                [`${playerKey}.answered`]: true
            });
        }
    };

    const handleAnswer = async (option) => {
        if (!user || !battleData || selectedOption) return;
        setSelectedOption(option);
        
        const isPlayer1 = battleData.player1.uid === user.uid;
        const playerKey = isPlayer1 ? 'player1' : 'player2';
        const currentQ = battleData.questions[battleData.currentQuestionIndex];
        
        const isCorrect = option === currentQ.correctAnswer;
        
        // Faster answer = more points. Max 100, Min 10. Wrong = -20
        const points = isCorrect ? Math.max(10, Math.floor(timer * 3.33)) : -20;
        
        const matchRef = doc(db, 'battles', battleId);
        await updateDoc(matchRef, {
            [`${playerKey}.score`]: battleData[playerKey].score + points,
            [`${playerKey}.answered`]: true
        });
    };

    const moveToNextQuestion = async (id, data) => {
        // Prevent multiple clients from updating at the same time
        if (user.uid !== data.player1.uid) {
            isMovingRef.current = false;
            return; 
        }

        const matchRef = doc(db, 'battles', id);
        
        if (data.currentQuestionIndex >= data.questions.length - 1) {
            await updateDoc(matchRef, { status: 'finished' });
        } else {
            await updateDoc(matchRef, {
                currentQuestionIndex: data.currentQuestionIndex + 1,
                'player1.answered': false,
                'player2.answered': false
            });
        }
        isMovingRef.current = false;
    };

    // Reset timer and selected option when question changes
    useEffect(() => {
        if (battleData?.currentQuestionIndex !== undefined) {
            setTimer(30);
            setSelectedOption(null);
            
            gsap.fromTo(".question-card", 
                { opacity: 0, x: 50 }, 
                { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
            );
        }
    }, [battleData?.currentQuestionIndex]);

    // Award JEE Coins when battle finishes
    useEffect(() => {
        if (status === 'finished' && battleData && user && !coinsAwardedRef.current) {
            coinsAwardedRef.current = true;
            const isP1 = user.uid === battleData.player1.uid;
            const myScore = isP1 ? battleData.player1.score : battleData.player2.score;
            const opScore = isP1 ? battleData.player2.score : battleData.player1.score;
            
            let coins = 10; // participation
            if (myScore > opScore) coins = 50; // winner
            else if (myScore === opScore) coins = 25; // tie
            
            setCoinsEarned(coins);
            axios.post('http://localhost:8000/api/v1/users/update-coins', {
                uid: user.uid, amount: coins, reason: 'battle_' + (coins === 50 ? 'win' : coins === 25 ? 'tie' : 'loss')
            }).catch(err => console.error('Coins update failed:', err));
        }
    }, [status, battleData, user]);

    const exitBattle = async () => {
        if (battleIdRef.current) {
            if (statusRef.current === 'waiting') {
                await deleteDoc(doc(db, 'battles', battleIdRef.current));
            } else if (statusRef.current === 'playing') {
                // Optionally mark as finished so the other player wins
                await updateDoc(doc(db, 'battles', battleIdRef.current), { status: 'finished' });
            }
        }
        router.push('/dashboard');
    };

    return (
        <div className="battle-container" ref={containerRef}>
            <Head>
                <title>1v1 Quiz Battle | JEE Solver</title>
                <style>{`
                    body { margin: 0; background: #020617; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; }
                    .battle-container { min-height: 100vh; padding: 20px; position: relative; }
                    .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80vw; height: 80vw; background: radial-gradient(circle, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0) 70%); z-index: -1; }
                    .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: rgba(15,23,42,0.8); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                    .btn-back { background: none; border: none; color: #cbd5e1; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; }
                    .btn-back:hover { color: white; }
                    
                    .finding-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 70vh; }
                    .radar { width: 150px; height: 150px; border-radius: 50%; border: 2px solid #3b82f6; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(59,130,246,0.3); }
                    .radar::after { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(from 0deg, transparent 70%, rgba(59,130,246,0.5) 100%); animation: scan 2s linear infinite; }
                    @keyframes scan { 100% { transform: rotate(360deg); } }
                    
                    .vs-board { display: flex; justify-content: space-between; align-items: center; margin: 40px auto; max-width: 800px; background: rgba(30,41,59,0.5); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
                    .player-card { text-align: center; width: 30%; }
                    .p-avatar { width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 10px; }
                    .p1-av { background: linear-gradient(135deg, #3b82f6, #2563eb); border: 3px solid #60a5fa; box-shadow: 0 0 20px rgba(59,130,246,0.5); }
                    .p2-av { background: linear-gradient(135deg, #ef4444, #dc2626); border: 3px solid #f87171; box-shadow: 0 0 20px rgba(239,68,68,0.5); }
                    .score { font-size: 2.5rem; font-weight: 900; margin-top: 10px; }
                    .score.p1 { color: #60a5fa; }
                    .score.p2 { color: #f87171; }
                    .vs-text { font-size: 3rem; font-weight: 900; background: linear-gradient(to bottom, #fbbf24, #f59e0b); -webkit-background-clip: text; color: transparent; font-style: italic; }
                    
                    .game-area { max-width: 800px; margin: 0 auto; }
                    .timer-bar { height: 10px; background: #334155; border-radius: 5px; overflow: hidden; margin-bottom: 20px; }
                    .timer-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #eab308, #ef4444); transition: width 1s linear; }
                    
                    .question-card { background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px; }
                    .q-header { display: flex; justify-content: space-between; margin-bottom: 20px; color: #94a3b8; font-weight: 600; }
                    .q-text { font-size: 1.2rem; line-height: 1.6; margin-bottom: 30px; }
                    .options-grid { display: grid; gap: 15px; }
                    .option-btn { background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); padding: 15px 20px; border-radius: 12px; color: white; font-size: 1.1rem; cursor: pointer; text-align: left; transition: all 0.2s; }
                    .option-btn:hover:not(:disabled) { background: rgba(59,130,246,0.2); border-color: #3b82f6; }
                    .option-btn.selected { background: rgba(59,130,246,0.4); border-color: #3b82f6; }
                    .option-btn.correct { background: rgba(34,197,94,0.3); border-color: #22c55e; }
                    .option-btn.wrong { background: rgba(239,68,68,0.3); border-color: #ef4444; }
                    
                    .finished-screen { text-align: center; margin-top: 50px; }
                    .winner-text { font-size: 3rem; font-weight: 900; margin: 20px 0; background: linear-gradient(to right, #fcd34d, #f59e0b); -webkit-background-clip: text; color: transparent; }
                    .btn-primary { background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; border: none; padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 12px; cursor: pointer; margin-top: 30px; }
                    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(124,58,237,0.3); }
                `}</style>
            </Head>

            <div className="bg-glow"></div>

            <nav className="top-nav">
                <button className="btn-back" onClick={exitBattle}>
                    <ArrowLeft size={20} /> Leave Battle
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Swords size={24} color="#f87171" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '1px' }}>RANKED BATTLE</span>
                </div>
                <div style={{ width: '100px' }}></div>
            </nav>

            {status === 'finding' && (
                <div className="finding-screen">
                    <div className="radar">
                        <Swords size={40} color="#60a5fa" />
                    </div>
                    <h2 style={{ marginTop: '30px', color: '#93c5fd' }}>Searching for an opponent...</h2>
                    <p style={{ color: '#64748b' }}>Matchmaking based on your JEE rank...</p>
                </div>
            )}

            {(status === 'playing' || status === 'finished') && battleData && (
                <>
                    <div className="vs-board">
                        <div className="player-card">
                            <div className="p-avatar p1-av">{battleData.player1.name.charAt(0).toUpperCase()}</div>
                            <h3>{battleData.player1.name} {user?.uid === battleData.player1.uid && '(You)'}</h3>
                            <div className="score p1">{battleData.player1.score}</div>
                            {battleData.player1.answered && status === 'playing' && <CheckCircle size={20} color="#22c55e" style={{marginTop:'10px'}}/>}
                        </div>
                        <div className="vs-text">VS</div>
                        <div className="player-card">
                            <div className="p-avatar p2-av">{battleData.player2.name.charAt(0).toUpperCase()}</div>
                            <h3>{battleData.player2.name} {user?.uid === battleData.player2.uid && '(You)'}</h3>
                            <div className="score p2">{battleData.player2.score}</div>
                            {battleData.player2.answered && status === 'playing' && <CheckCircle size={20} color="#22c55e" style={{marginTop:'10px'}}/>}
                        </div>
                    </div>

                    {status === 'playing' && (
                        <div className="game-area">
                            <div className="timer-bar">
                                <div className="timer-fill" style={{ width: `${(timer/30)*100}%` }}></div>
                            </div>
                            
                            <div className="question-card">
                                <div className="q-header">
                                    <span>Question {battleData.currentQuestionIndex + 1} of {battleData.questions.length}</span>
                                    <span><Clock size={16} style={{verticalAlign:'middle', marginRight:'5px'}}/> {timer}s</span>
                                </div>
                                <div className="q-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {battleData.questions[battleData.currentQuestionIndex].question}
                                </div>
                                
                                <div className="options-grid">
                                    {battleData.questions[battleData.currentQuestionIndex].options.map((opt, i) => {
                                        const isMyTurnComplete = (battleData.player1.uid === user?.uid && battleData.player1.answered) || 
                                                                 (battleData.player2.uid === user?.uid && battleData.player2.answered);
                                        const bothAnswered = battleData.player1.answered && battleData.player2.answered;
                                        
                                        let btnClass = "option-btn";
                                        if (selectedOption === opt) btnClass += " selected";
                                        
                                        // Show correct/wrong only after both have answered or time is up
                                        if (bothAnswered || timer === 0) {
                                            if (opt === battleData.questions[battleData.currentQuestionIndex].correctAnswer) btnClass += " correct";
                                            else if (selectedOption === opt) btnClass += " wrong";
                                        }

                                        return (
                                            <button 
                                                key={i} 
                                                className={btnClass}
                                                onClick={() => handleAnswer(opt)}
                                                disabled={isMyTurnComplete || timer === 0}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'finished' && (
                        <div className="finished-screen">
                            <Zap size={60} color="#f59e0b" />
                            <h1 className="winner-text">
                                {battleData.player1.score > battleData.player2.score 
                                    ? `${battleData.player1.name} Wins!` 
                                    : battleData.player2.score > battleData.player1.score 
                                        ? `${battleData.player2.name} Wins!` 
                                        : "It's a Tie!"}
                            </h1>
                            {coinsEarned > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', padding: '12px 24px', borderRadius: '30px', color: '#78350f', fontWeight: 900, fontSize: '1.3rem', boxShadow: '0 8px 25px rgba(245,158,11,0.4)', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🪙</span>
                                    <span>+{coinsEarned} JEE Coins Earned!</span>
                                </div>
                            )}
                            <p style={{fontSize: '1.2rem', color: '#cbd5e1'}}>Rank points updated successfully.</p>
                            <button className="btn-primary" onClick={exitBattle}>Back to Dashboard</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BattlePage;
