import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const PageLayout = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', fontFamily: "'Inter', sans-serif" }}>
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.8)' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <span style={{ fontSize: '1.5rem' }}>🧠</span>
        <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>JEE Solver AI</span>
      </Link>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/ncert-mock" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>📚 NCERT Mock</Link>
        <Link href="/photo-solver" style={{ color: '#fbbf24', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>📸 Photo Solver</Link>
        <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>← Dashboard</Link>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

export default function PhotoSolver() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) handleFile(dropped);
  };

  const solve = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${BACKEND}/rag/photo-solve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  // Format the solution text with basic markdown-like formatting
  const formatSolution = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{ color: '#a5b4fc', fontWeight: 700, marginTop: '16px', marginBottom: '4px', fontSize: '1rem' }}>{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.includes('**')) {
        const parts = line.split('**');
        return <div key={i} style={{ color: '#cbd5e1', lineHeight: 1.8, marginBottom: '4px' }}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9' }}>{p}</strong> : p)}
        </div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
      return <div key={i} style={{ color: '#cbd5e1', lineHeight: 1.8, marginBottom: '4px' }}>{line}</div>;
    });
  };

  return (
    <PageLayout>
      <Head>
        <title>Photo Doubt Solver | JEE Solver AI</title>
        <meta name="description" content="Upload a photo of your JEE doubt and get NCERT-grounded step-by-step solution" />
      </Head>

      <div style={{ minHeight: '100vh', padding: '30px 20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '50px', padding: '8px 20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>📸</span>
            <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em' }}>NCERT-GROUNDED SOLVER</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, background: 'linear-gradient(135deg, #e2e8f0, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px' }}>
            Photo to Official Solution
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Snap your doubt. AI searches through NCERT textbooks to give you an official, grounded solution.</p>
        </div>

        {/* Upload Area */}
        {!result && (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !preview && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#f59e0b' : preview ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '20px',
                padding: '40px 20px',
                textAlign: 'center',
                background: dragOver ? 'rgba(245,158,11,0.05)' : 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                cursor: preview ? 'default' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '24px',
              }}
            >
              {preview ? (
                <div>
                  <img src={preview} alt="Uploaded doubt" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }} />
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
                      🔄 Change Image
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem' }}>
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📸</div>
                  <div style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Drop your question image here</div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>or click to browse · JPG, PNG, WEBP supported</div>
                  <div style={{ marginTop: '20px', display: 'inline-flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['📝 Textbook Problems', '🔬 Physics Diagrams', '⚗️ Chemistry Equations', '📐 Maths Numericals'].map(tip => (
                      <span key={tip} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>{tip}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} style={{ display: 'none' }} />

            {error && (
              <div style={{ marginBottom: '16px', color: '#f87171', fontSize: '0.9rem', background: 'rgba(239,68,68,0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>❌ {error}</div>
            )}

            {preview && (
              <button onClick={solve} disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #d97706, #f59e0b)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.3s', letterSpacing: '0.02em' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    AI is searching NCERT books for your answer...
                  </span>
                ) : '🔍 Solve with NCERT Reference'}
              </button>
            )}
          </div>
        )}

        {/* Result Panel */}
        {result && (
          <div>
            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ background: result.ncert_grounded ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${result.ncert_grounded ? '#10b981' : '#f59e0b'}`, borderRadius: '50px', padding: '6px 18px', color: result.ncert_grounded ? '#34d399' : '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>
                {result.message}
              </span>
            </div>

            {/* Extracted Question */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '8px', fontSize: '0.85rem', letterSpacing: '0.08em' }}>📋 QUESTION DETECTED</div>
              <p style={{ color: '#f1f5f9', margin: 0, lineHeight: 1.7 }}>{result.extracted_question}</p>
            </div>

            {/* Solution */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(12px)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span> Official Solution
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.95rem' }}>
                {formatSolution(result.solution)}
              </div>
            </div>

            {/* Image Preview */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <img src={preview} alt="Your question" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Your uploaded question</div>
                <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>{file?.name}</div>
              </div>
            </div>

            <button onClick={reset} style={{ marginTop: '20px', width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#94a3b8', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
              📸 Solve Another Question
            </button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PageLayout>
  );
}
