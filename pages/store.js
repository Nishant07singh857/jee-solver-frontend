import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const PageLayout = ({ children, coins }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', fontFamily: "'Inter', sans-serif" }}>
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.8)' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <span style={{ fontSize: '1.5rem' }}>🧠</span>
        <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>JEE Solver AI</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', padding: '6px 14px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(245,158,11,0.3)', fontWeight: '900', color: '#78350f' }}>
          <span style={{ fontSize: '1.1rem' }}>🪙</span>
          <span>{coins} Coins</span>
        </div>
        <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>← Dashboard</Link>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

const REWARDS = [
  { id: 'avatar_ninja', name: 'Ninja Avatar', desc: 'Unlock the exclusive Ninja profile avatar.', cost: 500, icon: '🥷', color: '#a855f7' },
  { id: 'avatar_einstein', name: 'Einstein Avatar', desc: 'Unlock the genius scientist profile avatar.', cost: 1000, icon: '👨‍🔬', color: '#3b82f6' },
  { id: 'premium_rag', name: 'Premium RAG Search', desc: 'Boost your JARVIS Mentor context size for 24 hours.', cost: 2000, icon: '🔍', color: '#10b981' },
  { id: 'hard_mock', name: 'Advanced Mock Test', desc: 'Unlock the brutally hard NTA Mock Test (Level: Advanced).', cost: 5000, icon: '☠️', color: '#ef4444' },
];

export default function Store() {
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCoins(data.stats?.jeeCoins || 0);
          setUnlocked(data.unlocked_items || []);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePurchase = async (reward) => {
    if (coins < reward.cost) {
      alert("Not enough JEE Coins! Keep practicing to earn more.");
      return;
    }
    if (confirm(`Purchase ${reward.name} for ${reward.cost} coins?`)) {
      const newCoins = coins - reward.cost;
      const newUnlocked = [...unlocked, reward.id];
      
      setCoins(newCoins);
      setUnlocked(newUnlocked);
      
      await updateDoc(doc(db, 'users', user.uid), {
        'stats.jeeCoins': newCoins,
        'unlocked_items': newUnlocked
      });
      alert('Purchase successful! 🎉');
    }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading Store...</div>;

  return (
    <PageLayout coins={coins}>
      <Head>
        <title>Rewards Store | JEE Solver AI</title>
      </Head>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🏪</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 10px' }}>JEE Rewards Store</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Spend your hard-earned JEE Coins to unlock exclusive features and cosmetics.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {REWARDS.map(reward => {
            const isUnlocked = unlocked.includes(reward.id);
            const canAfford = coins >= reward.cost;

            return (
              <div key={reward.id} style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${reward.color}40`, borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backdropFilter: 'blur(12px)', transition: 'transform 0.2s', ...(canAfford && !isUnlocked ? { cursor: 'pointer', ':hover': { transform: 'translateY(-5px)' } } : {}) }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px', filter: isUnlocked ? 'none' : 'grayscale(0.5)' }}>{reward.icon}</div>
                <h3 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>{reward.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>{reward.desc}</p>
                
                {isUnlocked ? (
                  <button disabled style={{ width: '100%', padding: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', color: '#4ade80', fontWeight: 700 }}>
                    ✅ Unlocked
                  </button>
                ) : (
                  <button 
                    onClick={() => handlePurchase(reward)}
                    disabled={!canAfford}
                    style={{ 
                      width: '100%', padding: '12px', 
                      background: canAfford ? `linear-gradient(135deg, ${reward.color}, ${reward.color}99)` : 'rgba(255,255,255,0.05)', 
                      border: 'none', borderRadius: '12px', 
                      color: canAfford ? '#fff' : '#64748b', 
                      fontWeight: 800, cursor: canAfford ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span>🪙 {reward.cost}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
