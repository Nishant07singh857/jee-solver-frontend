import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Award, CheckCircle, XCircle, Target, Repeat, LayoutDashboard, ArrowLeft, Home, ExternalLink, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';

const ResultsPage = () => {
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [indexError, setIndexError] = useState(false);
    const canvasRef = React.useRef(null);
    const animationInitialized = React.useRef(false);
    const router = useRouter();
    const { quizId } = router.query;

    // Three.js Animation Setup
    useEffect(() => {
        if (typeof window === 'undefined' || animationInitialized.current) return;
        
        if (!canvasRef.current) {
            const timer = setTimeout(() => {
                if (canvasRef.current && !animationInitialized.current) {
                    initThreeJS();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
        
        initThreeJS();
        
        function initThreeJS() {
            animationInitialized.current = true;
            
            // Set up Three.js scene
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;
            
            const renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                alpha: true,
                antialias: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Create colorful particles
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCount = 5000;
            const posArray = new Float32Array(particlesCount * 3);
            const colorArray = new Float32Array(particlesCount * 3);
            
            for (let i = 0; i < particlesCount * 3; i += 3) {
                posArray[i] = (Math.random() - 0.5) * 15;
                posArray[i+1] = (Math.random() - 0.5) * 15;
                posArray[i+2] = (Math.random() - 0.5) * 15;
                
                // Assign colors (blue, purple, cyan)
                const colorChoice = Math.floor(Math.random() * 3);
                if (colorChoice === 0) {
                    colorArray[i] = 0.2;   // R - blue
                    colorArray[i+1] = 0.4; // G - blue
                    colorArray[i+2] = 0.8; // B - blue
                } else if (colorChoice === 1) {
                    colorArray[i] = 0.6;   // R - purple
                    colorArray[i+1] = 0.2; // G - purple
                    colorArray[i+2] = 0.8; // B - purple
                } else {
                    colorArray[i] = 0.2;   // R - cyan
                    colorArray[i+1] = 0.8; // G - cyan
                    colorArray[i+2] = 0.8; // B - cyan
                }
            }
            
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
            
            const particlesMaterial = new THREE.PointsMaterial({ 
                size: 0.02,
                vertexColors: true,
                transparent: true,
                opacity: 0.8
            });
            
            const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particlesMesh);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            // Handle window resize
            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);
            
            // Mouse movement tracking
            let mouseX = 0;
            let mouseY = 0;
            
            const handleMouseMove = (event) => {
                mouseX = (event.clientX / window.innerWidth) * 2 - 1;
                mouseY = (event.clientY / window.innerHeight) * 2 - 1;
            };
            
            window.addEventListener('mousemove', handleMouseMove);
            
            const clock = new THREE.Clock();
            
            const animate = () => {
                requestAnimationFrame(animate);
                
                const elapsedTime = clock.getElapsedTime();
                
                // Add dynamic movement to particles
                particlesMesh.rotation.y = elapsedTime * 0.05 + mouseX * 0.3;
                particlesMesh.rotation.x = elapsedTime * 0.03 + mouseY * 0.2;
                particlesMesh.rotation.z = elapsedTime * 0.02;
                
                // Pulse particles size
                particlesMaterial.size = 0.02 + Math.sin(elapsedTime) * 0.005;
                
                renderer.render(scene, camera);
            };
            animate();

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('mousemove', handleMouseMove);
                if (renderer) {
                    renderer.dispose();
                }
                if (particlesGeometry) {
                    particlesGeometry.dispose();
                }
                if (particlesMaterial) {
                    particlesMaterial.dispose();
                }
            };
        }
    }, []);

    // ✅ Fetch quiz results data (display-only now, no extra progress saving here)
    useEffect(() => {
        const fetchResultsData = async () => {
            try {
                setLoading(true);
                setIndexError(false);
                
                // Check if user is authenticated
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                
                let results = null;

                // If we have a quizId from the URL, fetch that specific quiz result
                if (quizId) {
                    try {
                        const quizDoc = await getDoc(doc(db, 'quizResults', quizId));
                        if (quizDoc.exists()) {
                            const data = quizDoc.data();
                            // Verify this quiz belongs to the current user
                            if (data.userId === currentUser.uid) {
                                results = data;
                            } else {
                                setError("You don't have permission to view these results");
                                return;
                            }
                        } else {
                            setError("Quiz results not found");
                            return;
                        }
                    } catch (err) {
                        console.error("Error fetching specific quiz:", err);
                        setError("Failed to load quiz results");
                        return;
                    }
                } else {
                    // Try to fetch the most recent quiz result
                    try {
                        const quizQuery = query(
                            collection(db, 'quizResults'),
                            where('userId', '==', currentUser.uid),
                            orderBy('completedAt', 'desc'),
                            limit(1)
                        );
                        
                        const quizSnapshot = await getDocs(quizQuery);
                        
                        if (!quizSnapshot.empty) {
                            results = { id: quizSnapshot.docs[0].id, ...quizSnapshot.docs[0].data() };
                        } else {
                            setError("noQuizResults");
                            return;
                        }
                    } catch (err) {
                        console.error("Error fetching quizzes:", err);
                        if (err.code === 'failed-precondition' && err.message.includes('index')) {
                            setIndexError(true);
                            setError("Database index needs to be created");
                        } else {
                            setError("Failed to load quiz results");
                        }
                        return;
                    }
                }

                setResultsData(results);
                
            } catch (error) {
                console.error('Error in fetchResultsData:', error);
                setError("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchResultsData();
    }, [quizId, router]);

    useEffect(() => {
        if (!loading && resultsData) {
            // GSAP Animations
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo(".results-summary-card", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, delay: 0.3 })
              .fromTo(".question-review-card", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, "-=0.5");
        }
    }, [loading, resultsData]);

    const handleRetry = () => {
        if (resultsData && resultsData.quizId) {
            router.push(`/quiz/${resultsData.quizId}`);
        } else {
            router.push('/practice');
        }
    };

    const handleDashboard = () => router.push("/dashboard");
    const handlePractice = () => router.push("/practice");
    
    const createIndex = () => {
        window.open(
          "https://console.firebase.google.com/v1/r/project/ai-powerd-jee-learn/firestore/indexes?create_composite=Cldwcm9qZWN0cy9haS1wb3dlcmQtamVlLWxlYXJuL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9xdWl6UmVzdWx0cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoPCgtjb21wbGV0ZWRBdBACGgwKCF9fbmFtZV9fEAI",
          "_blank"
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4">Loading your results...</p>
                </div>
            </div>
        );
    }

    if (indexError) {
        return (
            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Index Required</h2>
                            <p className="text-gray-300 mb-4">Firebase needs to create an index for your query.</p>
                            <button 
                                onClick={createIndex}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mx-auto"
                            >
                                <ExternalLink size={16} /> Create Index
                            </button>
                        </div>
                        <p className="text-gray-400 mb-4">After creating the index, it may take a few minutes to become active.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error === "noQuizResults") {
        return (
            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <Target size={48} className="text-blue-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">No Quiz Results Yet</h2>
                        <p className="text-gray-400 mb-6">You haven't completed any quizzes yet. Complete a quiz to see your results here.</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handlePractice}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={18} /> Start Practice
                            </button>
                            <button 
                                onClick={handleDashboard}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Home size={18} /> Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !resultsData) {
        return (
            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
                        <p className="text-gray-400 mb-6">{error || "Unable to load quiz results"}</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={handleDashboard}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const scorePercentage = Math.round((resultsData.correctAnswers / resultsData.totalQuestions) * 100);
    const pieChartData = [
        { name: 'Correct', value: resultsData.correctAnswers },
        { name: 'Incorrect', value: resultsData.totalQuestions - resultsData.correctAnswers },
    ];
    const COLORS = ['#10b981', '#ef4444']; // Emerald and Red

    // Determine Grade/Message
    let grade = "";
    let gradeColor = "";
    if (scorePercentage >= 90) { grade = "Outstanding! 🏆"; gradeColor = "text-yellow-400"; }
    else if (scorePercentage >= 75) { grade = "Great Job! 🌟"; gradeColor = "text-blue-400"; }
    else if (scorePercentage >= 50) { grade = "Good Effort 👍"; gradeColor = "text-green-400"; }
    else { grade = "Needs Practice 📚"; gradeColor = "text-orange-400"; }

    return (
        <>
            <Head>
                <title>Quiz Results | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            {/* Interactive Background */}
            <canvas 
                id="animation-canvas" 
                ref={canvasRef} 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    opacity: 0.6
                }}
            ></canvas>

            <div className="min-h-screen relative z-10 font-sans p-4 sm:p-8 overflow-hidden">
                {/* Floating ambient orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-12">
                        <button 
                            onClick={handleDashboard} 
                            className="flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 transition-all"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-center uppercase tracking-wider">
                            Mission Accomplished
                        </h1>
                        <div className="w-24"></div> {/* Spacer for centering */}
                    </header>

                    {/* Summary Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                        {/* Score Card */}
                        <div className="results-summary-card relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center flex flex-col justify-center items-center group">
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <Award size={48} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            
                            <div className="relative">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={440} 
                                        strokeDashoffset={440 - (440 * scorePercentage) / 100}
                                        className="text-blue-500 transition-all duration-1000 ease-out" 
                                    />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                    <p className="text-4xl font-black text-white">{scorePercentage}<span className="text-2xl text-slate-400">%</span></p>
                                </div>
                            </div>
                            
                            <h3 className={`mt-6 text-xl font-bold ${gradeColor}`}>{grade}</h3>
                            <p className="text-sm text-slate-400 mt-2 font-medium">
                                {resultsData.quizTitle || "JEE Practice Session"}
                            </p>
                        </div>

                        {/* Stats Card */}
                        <div className="results-summary-card bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center gap-6">
                            <h3 className="text-xl font-bold text-white mb-2 border-b border-white/10 pb-4">Performance Metrics</h3>
                            
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg"><Target size={20} className="text-blue-400" /></div>
                                    <p className="text-slate-300 font-medium">Questions Attempted</p>
                                </div>
                                <span className="text-xl font-black text-white">{resultsData.totalQuestions}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-emerald-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg"><CheckCircle size={20} className="text-emerald-400" /></div>
                                    <p className="text-slate-300 font-medium">Correct Answers</p>
                                </div>
                                <span className="text-xl font-black text-emerald-400">{resultsData.correctAnswers}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg"><XCircle size={20} className="text-red-400" /></div>
                                    <p className="text-slate-300 font-medium">Incorrect Answers</p>
                                </div>
                                <span className="text-xl font-black text-red-400">{resultsData.totalQuestions - resultsData.correctAnswers}</span>
                            </div>
                        </div>

                        {/* Visual Breakdown Card */}
                        <div className="results-summary-card bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-4">Visual Breakdown</h3>
                            <div className="flex-1 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={60}
                                            paddingAngle={8}
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="rgba(255,255,255,0.1)"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend 
                                            iconType="circle" 
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* Detailed Question Review */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-8">
                            <BookOpen size={24} className="text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">Comprehensive Analysis</h2>
                        </div>
                        
                        <div className="grid gap-6">
                            {resultsData.questions &&
                                resultsData.questions.map((q, index) => (
                                    <div
                                        key={index}
                                        className={`question-review-card relative overflow-hidden bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 transition-all border-l-4 ${
                                            q.isCorrect
                                                ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:bg-slate-800/80"
                                                : "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {q.isCorrect ? (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                        <CheckCircle size={18} className="text-emerald-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                                        <XCircle size={18} className="text-red-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-xs font-bold px-2 py-1 bg-slate-700 text-slate-300 rounded-md uppercase tracking-wider">Question {index + 1}</span>
                                                    {!q.isCorrect && <span className="text-xs font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded-md uppercase tracking-wider">Mistake to Review</span>}
                                                </div>
                                                <p className="font-semibold text-lg text-slate-100 mb-6 leading-relaxed">
                                                    {q.question}
                                                </p>
                                                
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-xl border ${q.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                        <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Your Answer</p>
                                                        <p className={`font-mono font-medium ${q.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                                                            {q.userAnswer}
                                                        </p>
                                                    </div>

                                                    {!q.isCorrect && (
                                                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                            <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Correct Answer</p>
                                                            <p className="font-mono font-medium text-emerald-300">
                                                                {q.correctAnswer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <footer className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 pb-12">
                        <button
                            onClick={handleRetry}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]"
                        >
                            <Repeat size={20} /> Revise & Retry
                        </button>
                        <button
                            onClick={handleDashboard}
                            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 border border-white/10"
                        >
                            <LayoutDashboard size={20} /> Return to Base
                        </button>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                body {
                    background: #020617;
                }
                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                }
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
                    border-radius: 4px;
                }
                .border-white\\/10 {
                    border-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </>
    );
};

export default ResultsPage;
