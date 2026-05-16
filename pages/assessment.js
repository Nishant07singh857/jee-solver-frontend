import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, BrainCircuit, Upload, Loader, AlertTriangle, Sparkles, 
  Trophy, Target, TrendingUp, TrendingDown, Award, BarChart3, 
  CheckCircle2, XCircle, FileText, Zap, PieChart, ChevronRight,
  Clock, Star, Medal, BookOpen, Lightbulb, Rocket
} from 'lucide-react';
import { gsap } from 'gsap';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const AssessmentPage = () => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const router = useRouter();
    const uploadAreaRef = useRef(null);
    const headerRef = useRef(null);
    const resultsRef = useRef(null);
    
    // Mock performance data for charts
    const performanceData = [
        { subject: 'Physics', score: 75, avg: 65 },
        { subject: 'Chemistry', score: 68, avg: 62 },
        { subject: 'Mathematics', score: 82, avg: 70 },
    ];
    
    const topicWiseData = [
        { topic: 'Kinematics', mastery: 85 },
        { topic: 'Thermodynamics', mastery: 72 },
        { topic: 'Optics', mastery: 68 },
        { topic: 'Electrodynamics', mastery: 58 },
        { topic: 'Modern Physics', mastery: 76 },
    ];
    
    const pieData = [
        { name: 'Correct', value: 185, color: '#10b981' },
        { name: 'Incorrect', value: 115, color: '#ef4444' },
    ];
    
    const COLORS = ['#10b981', '#ef4444'];

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(headerRef.current, 
            { opacity: 0, y: -30 }, 
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
        tl.fromTo(".upload-card", 
            { opacity: 0, y: 50 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }, 
            "-=0.4"
        );
    }, []);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
            gsap.to(uploadAreaRef.current, {
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out"
            });
        } else if (e.type === "dragleave") {
            setDragActive(false);
            gsap.to(uploadAreaRef.current, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        gsap.to(uploadAreaRef.current, { scale: 1, duration: 0.2 });
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            handleFile(droppedFile);
        } else {
            setError('Please drop a valid PDF file.');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            handleFile(selectedFile);
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleFile = (selectedFile) => {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            gsap.fromTo(".error-message", 
                { opacity: 0, y: -10 }, 
                { opacity: 1, y: 0, duration: 0.3, ease: "back.out" }
            );
            return;
        }
        
        setLoading(true);
        setError('');
        setResult(null);
        setUploadProgress(0);
        
        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return 95;
                }
                return prev + 5;
            });
        }, 150);
        
        // Mock AI Analysis
        setTimeout(() => {
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            const mockResult = {
                score: 185,
                totalMarks: 300,
                percentage: 61.67,
                accuracy: 61.7,
                rank: 1247,
                totalStudents: 15000,
                strongTopics: ['Kinematics', 'Chemical Bonding', 'Thermodynamics'],
                weakTopics: ['Rotational Motion', 'P-Block Elements', 'Electrostatics'],
                timeManagement: {
                    avgTimePerQuestion: '1.8 min',
                    totalTimeSpent: '54 min',
                    timeEfficiency: 72
                },
                recommendations: [
                    'Focus on Rotational Motion - 8 questions attempted, 2 correct',
                    'Review P-Block Elements concepts',
                    'Practice time management for numerical problems',
                    'Strengthen Electrostatics fundamentals'
                ],
                subjectBreakdown: {
                    physics: 68,
                    chemistry: 58,
                    mathematics: 72
                }
            };
            
            setResult(mockResult);
            setLoading(false);
            
            gsap.fromTo(resultsRef.current, 
                { opacity: 0, y: 50 }, 
                { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.2)", delay: 0.3 }
            );
        }, 3000);
    };

    const handleBackClick = () => {
        gsap.to("body", {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                // Force a hard reload to ensure dashboard animations initialize properly
                window.location.href = '/dashboard';
            }
        });
    };

    return (
        <>
            <Head>
                <title>AI Assessment Engine | JEE Solver</title>
                <meta name="description" content="Get detailed AI-powered analysis of your JEE mock test performance" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="assessment-page">
                {/* Animated Background */}
                <div className="bg-effects">
                    <div className="orb blue"></div>
                    <div className="orb purple"></div>
                    <div className="orb cyan"></div>
                    <div className="noise-overlay"></div>
                    <div className="grid-overlay"></div>
                </div>

                <div className="content-container">
                    {/* Header */}
                    <div ref={headerRef} className="header-section">
                        <button onClick={handleBackClick} className="back-button">
                            <ArrowLeft size={18} />
                            <span>Back to Dashboard</span>
                        </button>
                        
                        <div className="hero-badge">
                            <BrainCircuit size={16} />
                            <span>AI-Powered Analysis</span>
                        </div>
                        
                        <h1 className="hero-title">
                            AI Assessment 
                            <span className="gradient-text"> Engine</span>
                        </h1>
                        
                        <p className="hero-description">
                            Upload your mock test answer sheet and get detailed performance analysis with personalized recommendations
                        </p>
                    </div>

                    {/* Upload Card */}
                    <div className="upload-card">
                        <div className="card-header">
                            <div className="icon-wrapper">
                                <FileText size={24} />
                            </div>
                            <h2>Upload Your Answer Sheet</h2>
                            <p>Submit your completed mock test (PDF) for a detailed, step-by-step analysis</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div 
                                ref={uploadAreaRef}
                                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    accept="application/pdf" 
                                    onChange={handleFileChange} 
                                    className="hidden-input"
                                />
                                
                                <div className="upload-content">
                                    <div className="upload-icon">
                                        <Upload size={48} />
                                    </div>
                                    <h3>{dragActive ? "Drop your PDF here" : fileName || "Click or drag to upload PDF"}</h3>
                                    <p>Max file size: 10MB • PDF format only</p>
                                    {fileName && (
                                        <div className="file-badge">
                                            <CheckCircle2 size={14} />
                                            <span>{fileName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {loading && (
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
                                    </div>
                                    <p className="progress-text">
                                        <Loader className="spin" size={16} />
                                        Analyzing your answer sheet... {uploadProgress}%
                                    </p>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading || !file} 
                                className="analyze-button"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="spin" size={20} />
                                        <span>Analyzing Performance...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={20} />
                                        <span>Start AI Analysis</span>
                                        <ChevronRight size={18} />
                                    </>
                                )}
                            </button>
                            
                            {error && (
                                <div className="error-message">
                                    <AlertTriangle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div ref={resultsRef} className="results-section">
                            <div className="results-header">
                                <Sparkles className="sparkle-icon" size={28} />
                                <h2>Your Performance Analysis</h2>
                                <p>Detailed insights to help you improve</p>
                            </div>

                            {/* Score Cards */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon score">
                                        <Trophy size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Your Score</p>
                                        <p className="stat-value">{result.score}<span>/{result.totalMarks}</span></p>
                                        <div className="stat-trend">
                                            <TrendingUp size={14} />
                                            <span>Top {Math.round((result.rank / result.totalStudents) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon accuracy">
                                        <Target size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Accuracy</p>
                                        <p className="stat-value">{result.accuracy}%</p>
                                        <div className="stat-trend">
                                            <TrendingUp size={14} className="positive" />
                                            <span>+12% vs last test</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon rank">
                                        <Medal size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Estimated Rank</p>
                                        <p className="stat-value">#{result.rank}</p>
                                        <div className="stat-trend">
                                            <span>out of {result.totalStudents.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="charts-grid">
                                {/* Pie Chart */}
                                <div className="chart-card">
                                    <h3>Question Analysis</h3>
                                    <div className="pie-chart-container">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <RePieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="pie-legend">
                                            <div className="legend-item">
                                                <div className="legend-color correct"></div>
                                                <span>Correct ({pieData[0].value})</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color incorrect"></div>
                                                <span>Incorrect ({pieData[1].value})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Performance */}
                                <div className="chart-card">
                                    <h3>Subject-wise Performance</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RadarChart data={performanceData}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                                            <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                            <Radar name="Average" dataKey="avg" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                                            <Tooltip 
                                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Topics Analysis */}
                            <div className="topics-grid">
                                <div className="topics-card strong">
                                    <div className="card-title">
                                        <TrendingUp size={20} />
                                        <h3>Strong Topics</h3>
                                    </div>
                                    <ul>
                                        {result.strongTopics.map((topic, i) => (
                                            <li key={i}>
                                                <CheckCircle2 size={16} />
                                                <span>{topic}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="topics-card weak">
                                    <div className="card-title">
                                        <TrendingDown size={20} />
                                        <h3>Areas for Improvement</h3>
                                    </div>
                                    <ul>
                                        {result.weakTopics.map((topic, i) => (
                                            <li key={i}>
                                                <XCircle size={16} />
                                                <span>{topic}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="recommendations-card">
                                <div className="card-title">
                                    <Lightbulb size={20} />
                                    <h3>AI Recommendations</h3>
                                </div>
                                <div className="recommendations-list">
                                    {result.recommendations.map((rec, i) => (
                                        <div key={i} className="recommendation-item">
                                            <div className="bullet-point"></div>
                                            <p>{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="btn-primary" onClick={() => router.push('/practice')}>
                                    <BookOpen size={18} />
                                    Practice Weak Topics
                                </button>
                                <button className="btn-secondary" onClick={() => window.print()}>
                                    <FileText size={18} />
                                    Download Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .assessment-page {
                    min-height: 100vh;
                    background: #0a0c15;
                    position: relative;
                    overflow-x: hidden;
                    font-family: 'Inter', sans-serif;
                }

                /* Background Effects */
                .bg-effects {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                }

                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float 15s ease-in-out infinite;
                }

                .orb.blue {
                    width: 500px;
                    height: 500px;
                    background: #3b82f6;
                    top: -200px;
                    right: -200px;
                }

                .orb.purple {
                    width: 400px;
                    height: 400px;
                    background: #a855f7;
                    bottom: -150px;
                    left: -150px;
                    animation-delay: -5s;
                }

                .orb.cyan {
                    width: 300px;
                    height: 300px;
                    background: #06b6d4;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -10s;
                }

                .noise-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    background-size: 256px;
                    opacity: 0.02;
                    pointer-events: none;
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .content-container {
                    position: relative;
                    z-index: 2;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Header */
                .header-section {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .back-button {
                    position: absolute;
                    left: 2rem;
                    top: 2rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.6rem 1.2rem;
                    border-radius: 50px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .back-button:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                    transform: translateX(-4px);
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    margin-bottom: 1.5rem;
                    font-size: 0.85rem;
                    color: #93c5fd;
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    color: white;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #60a5fa, #a855f7, #ec489a);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }

                .hero-description {
                    font-size: 1.1rem;
                    color: #94a3b8;
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* Upload Card */
                .upload-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                }

                .card-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .icon-wrapper {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #3b82f6, #a855f7);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    color: white;
                }

                .card-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .card-header p {
                    color: #94a3b8;
                }

                .upload-area {
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(0, 0, 0, 0.2);
                    margin-bottom: 1.5rem;
                }

                .upload-area:hover, .upload-area.drag-active {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }

                .hidden-input {
                    display: none;
                }

                .upload-content h3 {
                    color: white;
                    margin: 1rem 0 0.5rem;
                }

                .upload-content p {
                    color: #64748b;
                    font-size: 0.85rem;
                }

                .upload-icon {
                    color: #3b82f6;
                }

                .file-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(16, 185, 129, 0.2);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                    font-size: 0.85rem;
                    color: #34d399;
                }

                .progress-container {
                    margin-bottom: 1.5rem;
                }

                .progress-bar {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #a855f7);
                    transition: width 0.3s ease;
                }

                .progress-text {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #94a3b8;
                }

                .analyze-button {
                    width: 100%;
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    border: none;
                    padding: 1rem;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .analyze-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(168, 85, 247, 0.3);
                }

                .analyze-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #f87171;
                    font-size: 0.85rem;
                }

                /* Results Section */
                .results-section {
                    margin-top: 2rem;
                }

                .results-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .sparkle-icon {
                    color: #f59e0b;
                    margin-bottom: 0.5rem;
                }

                .results-header h2 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .results-header p {
                    color: #94a3b8;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    transition: transform 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                }

                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon.score { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .stat-icon.accuracy { background: linear-gradient(135deg, #10b981, #059669); }
                .stat-icon.rank { background: linear-gradient(135deg, #3b82f6, #2563eb); }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-bottom: 0.25rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1;
                }

                .stat-value span {
                    font-size: 1rem;
                    color: #64748b;
                }

                .stat-trend {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: #10b981;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .chart-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 1.5rem;
                }

                .chart-card h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 1rem;
                }

                .pie-chart-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .pie-legend {
                    display: flex;
                    gap: 1.5rem;
                    margin-top: 1rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #94a3b8;
                }

                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }

                .legend-color.correct { background: #10b981; }
                .legend-color.incorrect { background: #ef4444; }

                .topics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .topics-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 1.5rem;
                }

                .topics-card.strong .card-title svg { color: #10b981; }
                .topics-card.weak .card-title svg { color: #ef4444; }

                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .card-title h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                }

                .topics-card ul {
                    list-style: none;
                }

                .topics-card li {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 0;
                    color: #94a3b8;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .topics-card li:last-child {
                    border-bottom: none;
                }

                .recommendations-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .recommendations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .recommendation-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                }

                .bullet-point {
                    width: 8px;
                    height: 8px;
                    background: #f59e0b;
                    border-radius: 50%;
                    margin-top: 0.5rem;
                }

                .recommendation-item p {
                    flex: 1;
                    color: #cbd5e1;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn-primary, .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .content-container {
                        padding: 1rem;
                    }
                    
                    .hero-title {
                        font-size: 2rem;
                    }
                    
                    .back-button {
                        position: static;
                        margin-bottom: 1rem;
                        display: inline-flex;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .topics-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                    
                    .btn-primary, .btn-secondary {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </>
    );
};

export default AssessmentPage;