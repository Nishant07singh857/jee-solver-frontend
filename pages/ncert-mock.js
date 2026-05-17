import { useState } from 'react';
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

const SUBJECTS = {
  Physics: ['Kinematics', 'Laws of Motion', 'Rotational Motion', 'Thermodynamics', 'Electrostatics', 'Magnetism', 'Optics', 'Waves', 'Gravitation', 'Fluid Mechanics'],
  Chemistry: ['Atomic Structure', 'Chemical Bonding', 'Equilibrium', 'Redox Reactions', 'Organic Chemistry Basics', 'Hydrocarbons', 'Coordination Compounds', 'Electrochemistry', 'Thermodynamics', 'p-Block Elements'],
  Maths: ['Complex Numbers', 'Matrices & Determinants', 'Calculus', 'Probability', '3D Geometry', 'Vectors', 'Integration', 'Differential Equations', 'Permutations & Combinations', 'Trigonometry'],
};

export default function NCERTMockTest() {
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('Thermodynamics');
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  const generateTest = async () => {
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setError('');
    try {
      const res = await axios.post(`${BACKEND}/rag/generate-mock-test`, {
        subject,
        chapter,
        num_questions: numQ,
      });
      setQuiz(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to generate test. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitTest = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.answer_index) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getOptionStyle = (qIdx, optIdx) => {
    const q = quiz.questions[qIdx];
    const selected = answers[qIdx] === optIdx;
    const correct = q.answer_index === optIdx;

    if (!submitted) {
      return selected
        ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: '2px solid #818cf8' }
        : { background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' };
    }
    if (correct) return { background: 'linear-gradient(135deg, #065f46, #10b981)', color: '#fff', border: '2px solid #34d399' };
    if (selected && !correct) return { background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', color: '#fff', border: '2px solid #f87171' };
    return { background: 'rgba(255,255,255,0.03)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' };
  };

  const percent = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;
  const grade = percent >= 90 ? { label: 'A+', color: '#10b981' } : percent >= 75 ? { label: 'A', color: '#6366f1' } : percent >= 60 ? { label: 'B', color: '#f59e0b' } : percent >= 40 ? { label: 'C', color: '#f97316' } : { label: 'F', color: '#ef4444' };

  return (
    <PageLayout>
      <Head>
        <title>NCERT Mock Test Generator | JEE Solver AI</title>
        <meta name="description" content="Generate hard, NCERT-grounded JEE mock tests using AI" />
      </Head>

      <div style={{ minHeight: '100vh', padding: '30px 20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '50px', padding: '8px 20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>📚</span>
            <span style={{ color: '#a5b4fc', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em' }}>NCERT-GROUNDED AI</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px' }}>
            Custom Mock Test Generator
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>AI reads your NCERT books and creates exam-pattern questions grounded in official textbook content.</p>
        </div>

        {/* Score Card */}
        {submitted && (
          <div style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,27,75,0.9))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '20px', padding: '30px', marginBottom: '30px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: grade.color, marginBottom: '10px' }}>{grade.label}</div>
            <div style={{ fontSize: '1.5rem', color: '#f1f5f9', fontWeight: 700 }}>{score} / {quiz.questions.length} Correct</div>
            <div style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '8px' }}>{percent}% Score</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginTop: '20px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: `linear-gradient(90deg, ${grade.color}, #6366f1)`, borderRadius: '10px', transition: 'width 1s ease' }} />
            </div>
            <button onClick={() => { setQuiz(null); setSubmitted(false); setAnswers({}); }} style={{ marginTop: '20px', padding: '10px 30px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              🔄 Generate New Test
            </button>
          </div>
        )}

        {/* Config Panel */}
        {!quiz && (
          <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', marginBottom: '30px', backdropFilter: 'blur(12px)' }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '24px', fontSize: '1.3rem' }}>⚙️ Configure Your Test</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>SUBJECT</label>
                <select value={subject} onChange={e => { setSubject(e.target.value); setChapter(Object.values(SUBJECTS)[Object.keys(SUBJECTS).indexOf(e.target.value)][0]); }} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  {Object.keys(SUBJECTS).map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>CHAPTER / TOPIC</label>
                <select value={chapter} onChange={e => setChapter(e.target.value)} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  {SUBJECTS[subject].map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>NO. OF QUESTIONS</label>
                <select value={numQ} onChange={e => setNumQ(parseInt(e.target.value))} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  {[3, 5, 8, 10].map(n => <option key={n} value={n} style={{ background: '#1e293b' }}>{n} Questions</option>)}
                </select>
              </div>
            </div>
            {error && <div style={{ marginTop: '16px', color: '#f87171', fontSize: '0.9rem', background: 'rgba(239,68,68,0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)' }}>❌ {error}</div>}
            <button onClick={generateTest} disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '16px', background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.3s', letterSpacing: '0.02em' }}>
              {loading ? '🤖 AI is reading your NCERT books...' : `🚀 Generate ${numQ} NCERT-Grounded Questions`}
            </button>
          </div>
        )}

        {/* Quiz Questions */}
        {quiz && !submitted && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ background: quiz.ncert_grounded ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${quiz.ncert_grounded ? '#10b981' : '#f59e0b'}`, borderRadius: '50px', padding: '4px 14px', color: quiz.ncert_grounded ? '#34d399' : '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
                {quiz.ncert_grounded ? '✅ NCERT Grounded' : '🤖 AI Generated'}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{quiz.subject} › {quiz.chapter} · {quiz.questions.length} Questions</span>
            </div>

            {quiz.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                  <span style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>Q{qIdx + 1}</span>
                  <p style={{ color: '#f1f5f9', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>{q.question}</p>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {q.options.map((opt, optIdx) => (
                    <button key={optIdx} onClick={() => handleSelect(qIdx, optIdx)} style={{ textAlign: 'left', padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1.5, transition: 'all 0.2s', ...getOptionStyle(qIdx, optIdx) }}>
                      <strong>{['A', 'B', 'C', 'D'][optIdx]}.</strong> {opt}
                    </button>
                  ))}
                </div>
                {q.hint && <div style={{ marginTop: '12px', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>💡 Hint: {q.hint}</div>}
              </div>
            ))}

            <button onClick={submitTest} disabled={Object.keys(answers).length < quiz.questions.length} style={{ width: '100%', padding: '16px', background: Object.keys(answers).length < quiz.questions.length ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: Object.keys(answers).length < quiz.questions.length ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
              {Object.keys(answers).length < quiz.questions.length ? `Answer all questions (${Object.keys(answers).length}/${quiz.questions.length})` : '✅ Submit & See Results'}
            </button>
          </div>
        )}

        {/* Show Explanations after submit */}
        {submitted && quiz && (
          <div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem', marginBottom: '20px' }}>📖 Explanations</h2>
            {quiz.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${answers[qIdx] === q.answer_index ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px', padding: '24px', marginBottom: '16px', backdropFilter: 'blur(12px)' }}>
                <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '12px' }}>Q{qIdx + 1}. {q.question}</p>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>✅ Correct Answer: </span>
                  <span style={{ color: '#f1f5f9' }}>{['A', 'B', 'C', 'D'][q.answer_index]}. {q.options[q.answer_index]}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}><strong style={{ color: '#a5b4fc' }}>Explanation:</strong> {q.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
