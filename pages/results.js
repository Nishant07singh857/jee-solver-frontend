import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Award, CheckCircle, XCircle, Target, Repeat, LayoutDashboard, ArrowLeft, Home, ExternalLink, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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

    // Save results to userProgress collection for the progress page
    const saveResultsToProgress = async (results) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            // Check if user progress document exists
            const progressQuery = query(
                collection(db, 'userProgress'),
                where('userId', '==', currentUser.uid)
            );
            
            const progressSnapshot = await getDocs(progressQuery);
            
            if (progressSnapshot.empty) {
                // Create new user progress document
                await addDoc(collection(db, 'userProgress'), {
                    userId: currentUser.uid,
                    totalQuestions: results.totalQuestions,
                    correctAnswers: results.correctAnswers,
                    accuracy: Math.round((results.correctAnswers / results.totalQuestions) * 100),
                    lastUpdated: new Date(),
                    quizAttempts: 1,
                    subjectPerformance: calculateSubjectPerformance(results.questions),
                    topicPerformance: calculateTopicPerformance(results.questions)
                });
            } else {
                // Update existing user progress document
                const progressDoc = progressSnapshot.docs[0];
                const currentData = progressDoc.data();
                
                await updateDoc(doc(db, 'userProgress', progressDoc.id), {
                    totalQuestions: currentData.totalQuestions + results.totalQuestions,
                    correctAnswers: currentData.correctAnswers + results.correctAnswers,
                    accuracy: Math.round(((currentData.correctAnswers + results.correctAnswers) / 
                                        (currentData.totalQuestions + results.totalQuestions)) * 100),
                    lastUpdated: new Date(),
                    quizAttempts: currentData.quizAttempts + 1,
                    subjectPerformance: updateSubjectPerformance(currentData.subjectPerformance, results.questions),
                    topicPerformance: updateTopicPerformance(currentData.topicPerformance, results.questions)
                });
            }
        } catch (error) {
            console.error('Error saving results to progress:', error);
        }
    };

    // Helper functions for progress calculation
    const calculateSubjectPerformance = (questions) => {
        const subjectStats = {
            Physics: { total: 0, correct: 0 },
            Chemistry: { total: 0, correct: 0 },
            Maths: { total: 0, correct: 0 }
        };

        questions.forEach(q => {
            if (subjectStats[q.subject]) {
                subjectStats[q.subject].total++;
                if (q.isCorrect) subjectStats[q.subject].correct++;
            }
        });

        return [
            { 
                name: 'Physics', 
                accuracy: subjectStats.Physics.total > 0 ? 
                    Math.round((subjectStats.Physics.correct / subjectStats.Physics.total) * 100) : 0,
                color: '#3b82f6' 
            },
            { 
                name: 'Chemistry', 
                accuracy: subjectStats.Chemistry.total > 0 ? 
                    Math.round((subjectStats.Chemistry.correct / subjectStats.Chemistry.total) * 100) : 0,
                color: '#22c55e' 
            },
            { 
                name: 'Maths', 
                accuracy: subjectStats.Maths.total > 0 ? 
                    Math.round((subjectStats.Maths.correct / subjectStats.Maths.total) * 100) : 0,
                color: '#f97316' 
            }
        ];
    };

    const calculateTopicPerformance = (questions) => {
        const topicStats = {
            Physics: {},
            Chemistry: {},
            Maths: {}
        };

        questions.forEach(q => {
            if (q.subject && q.topic && topicStats[q.subject]) {
                if (!topicStats[q.subject][q.topic]) {
                    topicStats[q.subject][q.topic] = { total: 0, correct: 0 };
                }
                topicStats[q.subject][q.topic].total++;
                if (q.isCorrect) topicStats[q.subject][q.topic].correct++;
            }
        });

        // Convert to array format
        const result = {
            Physics: [],
            Chemistry: [],
            Maths: []
        };

        Object.keys(topicStats).forEach(subject => {
            Object.keys(topicStats[subject]).forEach(topic => {
                const stats = topicStats[subject][topic];
                if (stats.total >= 3) { // Only include topics with at least 3 attempts
                    result[subject].push({
                        topic: topic,
                        score: Math.round((stats.correct / stats.total) * 100)
                    });
                }
            });
        });

        return result;
    };

    const updateSubjectPerformance = (currentPerformance, newQuestions) => {
        const newPerformance = calculateSubjectPerformance(newQuestions);
        
        return currentPerformance.map((subject, index) => {
            const newSubject = newPerformance[index];
            if (subject.totalQuestions && newSubject.totalQuestions) {
                const totalQuestions = subject.totalQuestions + newSubject.totalQuestions;
                const correctAnswers = subject.correctAnswers + newSubject.correctAnswers;
                return {
                    ...subject,
                    accuracy: Math.round((correctAnswers / totalQuestions) * 100)
                };
            }
            return subject;
        });
    };

    const updateTopicPerformance = (currentPerformance, newQuestions) => {
        const newPerformance = calculateTopicPerformance(newQuestions);
        const result = { ...currentPerformance };

        Object.keys(newPerformance).forEach(subject => {
            newPerformance[subject].forEach(newTopic => {
                const existingTopic = result[subject].find(t => t.topic === newTopic.topic);
                if (existingTopic) {
                    // Update existing topic (simplified - in real implementation, you'd track totals)
                    existingTopic.score = Math.round((existingTopic.score + newTopic.score) / 2);
                } else {
                    // Add new topic
                    result[subject].push(newTopic);
                }
            });
        });

        return result;
    };

    // Fetch quiz results data
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
                                // Save to progress collection
                                await saveResultsToProgress(results);
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
                            // Save to progress collection
                            await saveResultsToProgress(results);
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
        window.open("https://console.firebase.google.com/v1/r/project/ai-powerd-jee-learn/firestore/indexes?create_composite=Cldwcm9qZWN0cy9haS1wb3dlcmQtamVlLWxlYXJuL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9xdWl6UmVzdWx0cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoPCgtjb21wbGV0ZWRBdBACGgwKCF9fbmFtZV9fEAI", "_blank");
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
    const COLORS = ['#22c55e', '#ef4444'];

    return (
        <>
            <Head>
                <title>Quiz Results | JEE Solver</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
            </Head>

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
                    opacity: 0.3
                }}
            ></canvas>

            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <button 
                            onClick={handleDashboard} 
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-black text-white text-center">Quiz Results</h1>
                        <div className="w-10"></div>
                    </header>

                    {/* Summary Section */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* Score Card */}
                        <div className="results-summary-card bg-white/5 border border-white/10 rounded-2xl p-6 text-center flex flex-col justify-center items-center">
                            <Award size={40} className="text-yellow-400 mb-3" />
                            <p className="text-5xl font-bold text-white">{scorePercentage}<span className="text-3xl text-gray-400">%</span></p>
                            <p className="text-lg text-gray-300">Your Score</p>
                            <p className="text-sm text-gray-400 mt-2">{resultsData.quizTitle || "Quick Quiz"}</p>
                        </div>

                        {/* Stats Card */}
                        <div className="results-summary-card bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-4">
                                <Target size={24} className="text-blue-400" />
                                <p className="text-lg">Total Questions: <span className="font-bold text-white">{resultsData.totalQuestions}</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                                <CheckCircle size={24} className="text-green-500" />
                                <p className="text-lg">Correct Answers: <span className="font-bold text-white">{resultsData.correctAnswers}</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                                <XCircle size={24} className="text-red-500" />
                                <p className="text-lg">Incorrect Answers: <span className="font-bold text-white">{resultsData.totalQuestions - resultsData.correctAnswers}</span></p>
                            </div>
                        </div>

                        {/* Pie Chart Card */}
                        <div className="results-summary-card bg-white/5 border border-white/10 rounded-2xl p-6">
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={40} paddingAngle={5}>
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Detailed Question Review */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">Question Review</h2>
                        <div className="space-y-4">
                            {resultsData.questions && resultsData.questions.map((q, index) => (
                                <div key={index} className={`question-review-card bg-white/5 border-l-4 rounded-lg p-5 ${q.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                    <p className="font-semibold text-lg text-white mb-3">Q{index + 1}: {q.question}</p>
                                    <div className="space-y-2 text-md">
                                        <p className={`flex items-center gap-2 ${q.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                            {q.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                            Your Answer: <span className="font-mono p-1 rounded bg-black/20">{q.userAnswer}</span>
                                        </p>
                                        {!q.isCorrect && (
                                            <p className="flex items-center gap-2 text-green-400">
                                                <CheckCircle size={18} />
                                                Correct Answer: <span className="font-mono p-1 rounded bg-black/20">{q.correctAnswer}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <footer className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button onClick={handleRetry} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all">
                            <Repeat size={18} /> Retry Quiz
                        </button>
                        <button onClick={handleDashboard} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all">
                            <LayoutDashboard size={18} /> Back to Dashboard
                        </button>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
                    color: #f8fafc;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                
                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #4f46e5, #7c3aed);
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #7c3aed, #0891b2);
                }

                /* Animations */
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                /* Hover effects */
                .results-summary-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    h1 {
                        font-size: 2.2rem !important;
                    }
                }

                .bg-white\\/5 {
                    background-color: rgba(255, 255, 255, 0.05);
                }

                .border-white\\/10 {
                    border-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </>
    );
};

export default ResultsPage;