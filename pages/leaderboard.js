import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { ArrowLeft, Trophy, Medal, Flame, Crown } from 'lucide-react';
import axios from 'axios';
import { gsap } from 'gsap';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

const LeaderboardPage = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            if (u) { setUser(u); fetchLeaderboard(); }
            else router.push('/login');
        });
        return () => unsub();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get(`${API_URL}/users/leaderboard?limit=25`);
            setLeaderboard(res.data.leaderboard);
        } catch (err) {
            console.error("Leaderboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && leaderboard.length > 0) {
            gsap.fromTo(".lb-row", { opacity: 0, x: -30 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" });
        }
    }, [loading, leaderboard]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={24} color="#fbbf24" />;
        if (rank === 2) return <Medal size={24} color="#c0c0c0" />;
        if (rank === 3) return <Medal size={24} color="#cd7f32" />;
        return <span style={{ color: '#64748b', fontWeight: 700, fontSize: '1.1rem' }}>#{rank}</span>;
    };

    return (
        <>
            <Head>
                <title>Leaderboard | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
                <style>{`
                    body { margin: 0; background: #020617; color: white; font-family: 'Inter', sans-serif; }
                    .lb-container { max-width: 800px; margin: 0 auto; padding: 30px 20px; }
                    .lb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                    .btn-back { background: none; border: none; color: #cbd5e1; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 1rem; }
                    .btn-back:hover { color: white; }
                    .lb-title { text-align: center; }
                    .lb-title h1 { font-size: 2.5rem; font-weight: 900; margin: 0; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; color: transparent; }
                    .lb-title p { color: #64748b; margin-top: 5px; }
                    .lb-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
                    .lb-row { background: rgba(30,41,59,0.6); border-radius: 12px; }
                    .lb-row td { padding: 16px 20px; }
                    .lb-row td:first-child { border-radius: 12px 0 0 12px; width: 60px; text-align: center; }
                    .lb-row td:last-child { border-radius: 0 12px 12px 0; text-align: right; }
                    .lb-row.me { background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); }
                    .lb-row:hover { background: rgba(30,41,59,0.9); }
                    .player-info { display: flex; align-items: center; gap: 12px; }
                    .player-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }
                    .coins-badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 6px 14px; border-radius: 20px; color: #78350f; font-weight: 900; font-size: 0.95rem; }
                    .streak-badge { display: inline-flex; align-items: center; gap: 4px; color: #f97316; font-weight: 700; font-size: 0.9rem; margin-left: 10px; }
                    .loading-box { text-align: center; padding: 80px 20px; color: #64748b; font-size: 1.2rem; }
                `}</style>
            </Head>

            <div className="lb-container">
                <div className="lb-header">
                    <button className="btn-back" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft size={20} /> Dashboard
                    </button>
                    <div className="lb-title">
                        <h1><Trophy size={30} style={{ verticalAlign: 'middle', marginRight: '10px' }} />Leaderboard</h1>
                        <p>Top JEE Warriors by Coins</p>
                    </div>
                    <div style={{ width: '100px' }}></div>
                </div>

                {loading ? (
                    <div className="loading-box">Loading leaderboard...</div>
                ) : leaderboard.length === 0 ? (
                    <div className="loading-box">No players yet. Be the first to earn JEE Coins!</div>
                ) : (
                    <table className="lb-table">
                        <tbody>
                            {leaderboard.map((player) => (
                                <tr key={player.uid} className={`lb-row ${user?.uid === player.uid ? 'me' : ''}`}>
                                    <td>{getRankIcon(player.rank)}</td>
                                    <td>
                                        <div className="player-info">
                                            <div className="player-avatar" style={{ background: `hsl(${player.rank * 40}, 70%, 50%)` }}>
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>
                                                    {player.name} {user?.uid === player.uid && <span style={{ color: '#60a5fa', fontSize: '0.8rem' }}>(You)</span>}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {player.battleWins || 0} wins
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {player.streak > 0 && (
                                            <span className="streak-badge">
                                                <Flame size={16} /> {player.streak}d
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="coins-badge">
                                            🪙 {player.coins}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default LeaderboardPage;
