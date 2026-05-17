import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

// ── Shared Upload Component ─────────────────────────────────────────────────
const UploadZone = ({ file, preview, onFile, onReset, dragOver, setDragOver }) => {
  const fileInputRef = useRef(null);
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  };
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#a78bfa' : preview ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '20px', padding: preview ? '20px' : '48px 20px',
          textAlign: 'center', cursor: preview ? 'default' : 'pointer',
          background: dragOver ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s', marginBottom: '16px'
        }}
      >
        {preview ? (
          <div>
            <img src={preview} alt="upload" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '14px', objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ padding: '7px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}>🔄 Change</button>
              <button onClick={(e) => { e.stopPropagation(); onReset(); }} style={{ padding: '7px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}>🗑️ Remove</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📷</div>
            <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Drop your question image here</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>or click to browse · JPG, PNG, WEBP supported</div>
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files[0])} style={{ display: 'none' }} />
    </div>
  );
};

// ── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginRight: '10px' }} />
);

// ── Format Solution Text ─────────────────────────────────────────────────────
const FormatText = ({ text }) => {
  if (!text) return null;
  return (
    <div>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
        if (line.startsWith('**') && line.endsWith('**'))
          return <div key={i} style={{ color: '#a5b4fc', fontWeight: 700, marginTop: '14px', marginBottom: '4px' }}>{line.replace(/\*\*/g, '')}</div>;
        if (line.includes('**')) {
          const parts = line.split('**');
          return <div key={i} style={{ color: '#cbd5e1', lineHeight: 1.8 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9' }}>{p}</strong> : p)}</div>;
        }
        return <div key={i} style={{ color: '#cbd5e1', lineHeight: 1.8 }}>{line}</div>;
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Instant Doubt Solver (calls examiner endpoint)
// ═══════════════════════════════════════════════════════════════════════════════
const DoubtSolverTab = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => { setFile(f); setResult(''); setError(''); const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f); };
  const reset = () => { setFile(null); setPreview(null); setResult(''); setError(''); };

  const solve = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${BACKEND}/examiner/check-attempt`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      setResult(res.data.feedback);
    } catch (e) { setError(e.response?.data?.detail || 'Something went wrong. Try again!'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <UploadZone file={file} preview={preview} onFile={handleFile} onReset={reset} dragOver={dragOver} setDragOver={setDragOver} />
      {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.9rem' }}>❌ {error}</div>}
      {preview && !result && (
        <button onClick={solve} disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && <Spinner />}{loading ? 'AI is reading your image...' : '🔍 Check My Attempt'}
        </button>
      )}
      {result && (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '18px', padding: '24px', marginTop: '16px' }}>
          <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', letterSpacing: '0.06em' }}>🎯 AI EXAMINER FEEDBACK</div>
          <FormatText text={result} />
          <button onClick={reset} style={{ marginTop: '20px', padding: '10px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>📷 Try Another</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: NCERT Official Solution (RAG powered)
// ═══════════════════════════════════════════════════════════════════════════════
const NCERTSolverTab = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => { setFile(f); setResult(null); setError(''); const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f); };
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(''); };

  const solve = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${BACKEND}/rag/photo-solve`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || 'Something went wrong. Try again!'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <UploadZone file={file} preview={preview} onFile={handleFile} onReset={reset} dragOver={dragOver} setDragOver={setDragOver} />
      {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.9rem' }}>❌ {error}</div>}
      {preview && !result && (
        <button onClick={solve} disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #d97706, #f59e0b)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && <Spinner />}{loading ? 'Searching NCERT textbooks...' : '📚 Find NCERT Solution'}
        </button>
      )}
      {result && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ background: result.ncert_grounded ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${result.ncert_grounded ? '#10b981' : '#f59e0b'}`, borderRadius: '20px', padding: '4px 14px', color: result.ncert_grounded ? '#34d399' : '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
              {result.message}
            </span>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.07em' }}>📋 QUESTION DETECTED</div>
            <div style={{ color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1.7 }}>{result.extracted_question}</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', letterSpacing: '0.06em' }}>⚡ OFFICIAL SOLUTION</div>
            <FormatText text={result.solution} />
          </div>
          <button onClick={reset} style={{ marginTop: '16px', padding: '10px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>📷 Try Another</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Mistake Finder (AI finds exact wrong step)
// ═══════════════════════════════════════════════════════════════════════════════
const MistakeFinderTab = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => { setFile(f); setResult(''); setError(''); const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f); };
  const reset = () => { setFile(null); setPreview(null); setResult(''); setError(''); };

  const findMistake = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult('');
    try {
      const fd = new FormData(); fd.append('file', file);
      // Uses examiner endpoint with strict mistake-finding mode
      const res = await axios.post(`${BACKEND}/examiner/check-attempt`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      setResult(res.data.feedback);
    } catch (e) { setError(e.response?.data?.detail || 'Something went wrong. Try again!'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px' }}>
        <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.9rem' }}>📝 <strong>How to use:</strong> Upload a photo of your <strong>handwritten solution attempt</strong>. AI will find the exact step where you made a mistake!</p>
      </div>
      <UploadZone file={file} preview={preview} onFile={handleFile} onReset={reset} dragOver={dragOver} setDragOver={setDragOver} />
      {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.9rem' }}>❌ {error}</div>}
      {preview && !result && (
        <button onClick={findMistake} disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && <Spinner />}{loading ? 'AI is checking your work...' : '🔬 Find My Mistake'}
        </button>
      )}
      {result && (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '18px', padding: '24px', marginTop: '16px' }}>
          <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', letterSpacing: '0.06em' }}>🔬 MISTAKE ANALYSIS</div>
          <FormatText text={result} />
          <button onClick={reset} style={{ marginTop: '20px', padding: '10px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>📷 Try Another</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE - All-in-One Photo AI Hub
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'doubt',   icon: '🎯', label: 'Instant Solver',    sub: 'Get step-by-step AI solution',  color: '#6366f1' },
  { id: 'ncert',   icon: '📚', label: 'NCERT Solution',    sub: 'Official textbook-grounded answer', color: '#f59e0b' },
  { id: 'mistake', icon: '🔬', label: 'Mistake Finder',    sub: 'Find exact error in your attempt', color: '#ef4444' },
];

export default function PhotoAIHub() {
  const [activeTab, setActiveTab] = useState('doubt');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)', fontFamily: "'Inter', sans-serif" }}>
      <Head>
        <title>Photo AI Hub | JEE Solver AI</title>
        <meta name="description" content="All-in-one photo upload AI: Solve doubts, find mistakes, get NCERT grounded solutions" />
      </Head>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.85)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>JEE Solver AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/ncert-mock" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>📝 Mock Test</Link>
          <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>← Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '50px', padding: '8px 22px', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>📸</span>
            <span style={{ color: '#c4b5fd', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>PHOTO AI HUB</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, background: 'linear-gradient(135deg, #e2e8f0 30%, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 12px' }}>
            All-in-One Photo Solver
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
            Upload any question photo and choose what you want — instant answer, NCERT reference, or mistake analysis.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '16px 12px', borderRadius: '16px', border: `1.5px solid ${activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.08)'}`,
              background: activeTab === tab.id ? `${tab.color}18` : 'rgba(255,255,255,0.03)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s',
              boxShadow: activeTab === tab.id ? `0 0 20px ${tab.color}30` : 'none',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{tab.icon}</div>
              <div style={{ color: activeTab === tab.id ? '#f1f5f9' : '#94a3b8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{tab.label}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.4 }}>{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* Active Tab Panel */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', padding: '28px', backdropFilter: 'blur(16px)' }}>
          {/* Tab Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1.5rem' }}>{TABS.find(t => t.id === activeTab)?.icon}</span>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>{TABS.find(t => t.id === activeTab)?.label}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{TABS.find(t => t.id === activeTab)?.sub}</div>
            </div>
          </div>

          {activeTab === 'doubt'   && <DoubtSolverTab />}
          {activeTab === 'ncert'   && <NCERTSolverTab />}
          {activeTab === 'mistake' && <MistakeFinderTab />}
        </div>

        {/* Bottom Tip */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#475569', fontSize: '0.82rem' }}>
          💡 Tip: Switch between tabs anytime — each has its own independent session.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
