import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

const SUBJECTS = {
  Physics: ['Kinematics', 'Laws of Motion', 'Thermodynamics', 'Electrostatics', 'Optics', 'Modern Physics'],
  Chemistry: ['Atomic Structure', 'Equilibrium', 'Organic Chemistry Basics', 'Electrochemistry', 'Coordination Compounds'],
  Maths: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Trigonometry', 'Vectors & 3D'],
};

const PageLayout = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', fontFamily: "'Inter', sans-serif" }}>
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.8)' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <span style={{ fontSize: '1.5rem' }}>🧠</span>
        <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>JEE Solver AI</span>
      </Link>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>← Dashboard</Link>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

export default function RevisionShorts() {
  const [subject, setSubject] = useState('Physics');
  const [topic, setTopic] = useState('Thermodynamics');
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null); // 'left' or 'right'

  const generateCards = async () => {
    setLoading(true); setFlashcards([]); setCurrentIndex(0); setIsFlipped(false);
    try {
      const res = await axios.post(`${BACKEND}/rag/generate-flashcards`, { subject, topic, count: 5 });
      setFlashcards(res.data.flashcards);
    } catch (e) {
      alert('Error generating flashcards!');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction) => {
    setSwipeDir(direction);
    setTimeout(() => {
      setIsFlipped(false);
      setSwipeDir(null);
      setCurrentIndex(prev => prev + 1);
    }, 400); // Wait for animation
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (flashcards.length === 0 || currentIndex >= flashcards.length) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flashcards, currentIndex]);

  return (
    <PageLayout>
      <Head>
        <title>Revision Shorts | JEE Solver AI</title>
        <meta name="description" content="Tinder-style AI Flashcards for rapid JEE revision" />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 120px 20px', minHeight: 'calc(100vh - 70px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: '50px', padding: '6px 18px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px' }}>🃏</span>
            <span style={{ color: '#f472b6', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>TINDER FOR JEE</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #fbcfe8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px' }}>Revision Shorts</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '400px' }}>Swipe right if you remember, swipe left if you forgot.</p>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '15px', color: '#64748b', fontSize: '0.85rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>⌨️ <strong>Space</strong> : Flip</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>⌨️ <strong>← / →</strong> : Swipe</span>
          </div>
        </div>

        {flashcards.length === 0 && !loading && (
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', backdropFilter: 'blur(12px)' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>SUBJECT</label>
              <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(SUBJECTS[e.target.value][0]); }} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: '#f1f5f9', fontSize: '1rem', outline: 'none' }}>
                {Object.keys(SUBJECTS).map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>TOPIC</label>
              <select value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: '#f1f5f9', fontSize: '1rem', outline: 'none' }}>
                {SUBJECTS[subject].map(t => <option key={t} value={t} style={{ background: '#1e293b' }}>{t}</option>)}
              </select>
            </div>
            <button onClick={generateCards} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #db2777, #f43f5e)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 30px rgba(219,39,119,0.3)' }}>
              🔥 Create Flashcards
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid rgba(244,114,182,0.2)', borderTopColor: '#f472b6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#f472b6', marginTop: '20px', fontWeight: 600 }}>Extracting from NCERT...</div>
          </div>
        )}

        {flashcards.length > 0 && currentIndex < flashcards.length && (
          <div style={{ position: 'relative', width: '90%', maxWidth: '520px', height: '60vh', minHeight: '420px', maxHeight: '550px', perspective: '1200px', marginTop: '20px' }}>
            <AnimatePresence>
              <motion.div
                key={currentIndex}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ 
                  scale: 1, opacity: 1, y: 0, 
                  x: swipeDir === 'left' ? -300 : swipeDir === 'right' ? 300 : 0,
                  rotate: swipeDir === 'left' ? -20 : swipeDir === 'right' ? 20 : 0
                }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ width: '100%', height: '100%', position: 'absolute' }}
              >
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ 
                    width: '100%', height: '100%', borderRadius: '30px', cursor: 'pointer',
                    transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}
                >
                  {/* FRONT */}
                  <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '24px', background: 'rgba(244,114,182,0.15)', color: '#f472b6', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>{flashcards[currentIndex].category}</div>
                    <h2 style={{ color: '#f8fafc', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, lineHeight: 1.5 }}>{flashcards[currentIndex].front}</h2>
                    <div style={{ position: 'absolute', bottom: '24px', color: '#64748b', fontSize: '0.9rem' }}>Tap or press Space to flip 👆</div>
                  </div>

                  {/* BACK */}
                  <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, #db2777, #9d174d)', border: '2px solid rgba(244,114,182,0.4)', borderRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', transform: 'rotateY(180deg)' }}>
                    <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, lineHeight: 1.5 }}>{flashcards[currentIndex].back}</h2>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <div style={{ position: 'absolute', bottom: '-90px', width: '100%', display: 'flex', justifyContent: 'center', gap: '40px', padding: '0 20px' }}>
              <button className="swipe-btn left-btn" onClick={() => handleSwipe('left')} style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444', color: '#ef4444', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(239,68,68,0.2)', transition: 'all 0.2s' }}>
                ❌
              </button>
              <button className="swipe-btn right-btn" onClick={() => handleSwipe('right')} style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e', color: '#22c55e', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(34,197,94,0.2)', transition: 'all 0.2s' }}>
                ✅
              </button>
            </div>
          </div>
        )}

        {flashcards.length > 0 && currentIndex >= flashcards.length && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#f1f5f9', marginBottom: '10px' }}>You're all caught up!</h2>
            <button onClick={generateCards} style={{ marginTop: '20px', padding: '12px 30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', color: '#fff', cursor: 'pointer' }}>Revise More</button>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .swipe-btn:hover { transform: scale(1.1); }
        .left-btn:hover { background: rgba(239,68,68,0.25) !important; boxShadow: 0 15px 25px rgba(239,68,68,0.3) !important; }
        .right-btn:hover { background: rgba(34,197,94,0.25) !important; boxShadow: 0 15px 25px rgba(34,197,94,0.3) !important; }
      `}</style>
    </PageLayout>
  );
}
