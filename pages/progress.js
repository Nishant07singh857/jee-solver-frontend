import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowLeft, BarChart2, CheckCircle, Target, 
  Award, Calendar, Zap, Star, 
  Atom, FlaskConical, Sigma, Menu, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/router';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ProgressPage = () => {
    const [overallStats, setOverallStats] = useState({
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        streak: 0,
        rank: "N/A"
    });
    const [subjectPerformance, setSubjectPerformance] = useState([
        { name: 'Physics', accuracy: 0, color: '#3b82f6' },
        { name: 'Chemistry', accuracy: 0, color: '#22c55e' },
        { name: 'Maths', accuracy: 0, color: '#f97316' },
    ]);
    const [topicHeatmapData, setTopicHeatmapData] = useState({
        Physics: [],
        Chemistry: [],
        Maths: [],
    });
    const [weeklyProgress, setWeeklyProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const particlesRef = useRef([]);
    const lightsRef = useRef([]);
    const lenisRef = useRef(null);

    useEffect(() => {
        // Initialize Lenis for smooth scrolling
        const initSmoothScroll = async () => {
            if (typeof window !== 'undefined') {
                const Lenis = (await import('lenis')).default;
                
                lenisRef.current = new Lenis({
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    orientation: 'vertical',
                    gestureOrientation: 'vertical',
                    smoothWheel: true,
                    wheelMultiplier: 1,
                    touchMultiplier: 2,
                });

                function raf(time) {
                    lenisRef.current.raf(time);
                    requestAnimationFrame(raf);
                }

                requestAnimationFrame(raf);

                // Cleanup on unmount
                return () => {
                    if (lenisRef.current) {
                        lenisRef.current.destroy();
                    }
                };
            }
        };

        initSmoothScroll();
    }, []);

    useEffect(() => {
        // Check if user is authenticated
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                await fetchUserProgress(currentUser.uid);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchUserProgress = async (userId) => {
        try {
            setLoading(true);
            
            // Fetch quiz results instead of quiz attempts
            const resultsQuery = query(
                collection(db, 'quizResults'),
                where('userId', '==', userId),
                orderBy('completedAt', 'desc'),
                limit(50)
            );
            
            const resultsSnapshot = await getDocs(resultsQuery);
            
            if (resultsSnapshot.empty) {
                setLoading(false);
                return;
            }
            
            const results = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Calculate overall stats
            let totalQuestions = 0;
            let correctAnswers = 0;
            const subjectStats = {
                Physics: { total: 0, correct: 0 },
                Chemistry: { total: 0, correct: 0 },
                Maths: { total: 0, correct: 0 }
            };
            const topicStats = {
                Physics: {},
                Chemistry: {},
                Maths: {}
            };
            
            // Process each quiz result
            results.forEach(result => {
                if (result.questions) {
                    totalQuestions += result.questions.length;
                    correctAnswers += result.correctAnswers;
                    
                    result.questions.forEach(question => {
                        const isCorrect = question.isCorrect;
                        
                        // Update subject stats
                        if (subjectStats[question.subject]) {
                            subjectStats[question.subject].total++;
                            if (isCorrect) subjectStats[question.subject].correct++;
                        }
                        
                        // Update topic stats
                        if (question.topic && topicStats[question.subject]) {
                            if (!topicStats[question.subject][question.topic]) {
                                topicStats[question.subject][question.topic] = { total: 0, correct: 0 };
                            }
                            topicStats[question.subject][question.topic].total++;
                            if (isCorrect) topicStats[question.subject][question.topic].correct++;
                        }
                    });
                }
            });
            
            // Calculate accuracy
            const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            
            // Calculate subject performance
            const subjectPerformanceData = subjectPerformance.map(subject => {
                const stats = subjectStats[subject.name];
                const subjectAccuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return { ...subject, accuracy: subjectAccuracy };
            });
            
            // Calculate topic performance for heatmap
            const heatmapData = {
                Physics: [],
                Chemistry: [],
                Maths: []
            };
            
            Object.keys(topicStats).forEach(subject => {
                Object.keys(topicStats[subject]).forEach(topic => {
                    const stats = topicStats[subject][topic];
                    const topicAccuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    if (stats.total >= 5) { // Only show topics with at least 5 attempts
                        heatmapData[subject].push({
                            topic: topic,
                            score: topicAccuracy
                        });
                    }
                });
                
                // Sort by score descending and limit to top 5
                heatmapData[subject].sort((a, b) => b.score - a.score);
                heatmapData[subject] = heatmapData[subject].slice(0, 5);
            });
            
            // Calculate weekly progress (last 7 days)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const weeklyData = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayResults = results.filter(result => {
                    const resultDate = result.completedAt?.toDate();
                    if (!resultDate) return false;
                    return resultDate.toISOString().split('T')[0] === dateStr;
                });
                
                let dayQuestions = 0;
                let dayCorrect = 0;
                
                dayResults.forEach(result => {
                    if (result.questions) {
                        dayQuestions += result.questions.length;
                        dayCorrect += result.correctAnswers;
                    }
                });
                
                const dayAccuracy = dayQuestions > 0 ? Math.round((dayCorrect / dayQuestions) * 100) : 0;
                
                weeklyData.unshift({
                    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                    accuracy: dayAccuracy,
                    questions: dayQuestions
                });
            }
            
            // Calculate streak (consecutive days with at least 1 question)
            let streak = 0;
            const today = new Date().toISOString().split('T')[0];
            const uniqueDays = [...new Set(results
                .filter(result => result.completedAt)
                .map(result => result.completedAt.toDate().toISOString().split('T')[0])
            )].sort().reverse();
            
            if (uniqueDays.length > 0 && uniqueDays[0] === today) {
                streak = 1;
                for (let i = 1; i < uniqueDays.length; i++) {
                    const prevDate = new Date(uniqueDays[i-1]);
                    const currDate = new Date(uniqueDays[i]);
                    const diffTime = Math.abs(prevDate - currDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
            
            // Set all state with calculated data
            setOverallStats({
                totalQuestions,
                correctAnswers,
                accuracy,
                streak,
                rank: calculateRank(accuracy)
            });
            
            setSubjectPerformance(subjectPerformanceData);
            setTopicHeatmapData(heatmapData);
            setWeeklyProgress(weeklyData);
            
        } catch (error) {
            console.error('Error fetching user progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRank = (accuracy) => {
        if (accuracy >= 90) return "Top 5%";
        if (accuracy >= 80) return "Top 15%";
        if (accuracy >= 70) return "Top 30%";
        if (accuracy >= 60) return "Top 50%";
        if (accuracy >= 50) return "Top 70%";
        return "Needs Improvement";
    };

    useEffect(() => {
        // Initialize animations after component mounts
        const initAnimations = () => {
            // Animate ambient lights
            lightsRef.current.forEach((light, index) => {
                if (light) {
                    gsap.to(light, {
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                        duration: 20 + Math.random() * 10,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: index * 2
                    });
                }
            });

            // Animate particles with flowing motion
            particlesRef.current.forEach((particle, index) => {
                if (particle) {
                    const timeline = gsap.timeline({ repeat: -1 });
                    
                    timeline.to(particle, {
                        x: `+=${Math.random() * 100 - 50}`,
                        y: `+=${Math.random() * 60 - 30}`,
                        rotation: Math.random() * 20 - 10,
                        duration: 30 + Math.random() * 20,
                        ease: "sine.inOut",
                    }).to(particle, {
                        x: `+=${Math.random() * 80 - 40}`,
                        y: `+=${Math.random() * 40 - 20}`,
                        rotation: Math.random() * 15 - 7.5,
                        duration: 25 + Math.random() * 15,
                        ease: "sine.inOut",
                    });
                    
                    gsap.to(particle, {
                        opacity: Math.random() * 0.3 + 0.2,
                        duration: 5 + Math.random() * 10,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: index * 0.5
                    });
                }
            });

            // Scroll animations for sections
            gsap.utils.toArray('.progress-section').forEach((section, i) => {
                gsap.fromTo(section, 
                    { y: 50, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        scrollTrigger: {
                            trigger: section,
                            start: "top 85%",
                            end: "bottom 20%",
                            toggleActions: "play none none reverse"
                        },
                        delay: i * 0.1
                    }
                );
            });

            // Animate stat cards
            gsap.utils.toArray('.stat-card').forEach((card, i) => {
                gsap.fromTo(card, 
                    { y: 30, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.7,
                        scrollTrigger: {
                            trigger: card,
                            start: "top 90%",
                            toggleActions: "play none none reverse"
                        },
                        delay: i * 0.1,
                        ease: "back.out(1.2)"
                    }
                );
            });
        };

        const timer = setTimeout(initAnimations, 100);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        // Animate content sections when data is loaded
        if (!loading) {
            gsap.to(".progress-section", {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.3
            });
            
            gsap.to(".stat-card", {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)',
                delay: 0.5
            });
        }
    }, [loading]);

    const handleBackClick = () => router.push("/dashboard");
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const getHeatmapColor = (score) => {
        if (score >= 90) return 'from-emerald-400 to-green-600';
        if (score >= 80) return 'from-green-400 to-emerald-500';
        if (score >= 70) return 'from-amber-400 to-yellow-500';
        if (score >= 60) return 'from-orange-400 to-amber-500';
        return 'from-rose-400 to-red-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4">Loading your progress data...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Performance Analytics | JEE Solver</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                <style>{`
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html.lenis { height: auto; }
                    .lenis.lenis-smooth { scroll-behavior: auto; }
                    .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
                    .lenis.lenis-stopped { overflow: hidden; }
                    .lenis.lenis-smooth iframe { pointer-events: none; }
                    
                    body { 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
                        color: #e2e8f0; 
                        overflow-x: hidden; 
                        min-height: 100vh;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    
                    .app-container { 
                        min-height: 100vh; 
                        padding: 1rem; 
                        position: relative; 
                        overflow: hidden; 
                    }
                    
                    @media (min-width: 640px) { 
                        .app-container { 
                            padding: 1.5rem; 
                        } 
                    }
                    
                    @media (min-width: 1024px) { 
                        .app-container { 
                            padding: 2rem; 
                        } 
                    }
                    
                    .max-width-container { 
                        max-width: 90rem; 
                        margin-left: auto; 
                        margin-right: auto; 
                        position: relative; 
                        z-index: 10; 
                    }
                    
                    .header { 
                        display: flex; 
                        align-items: center; 
                        justify-content: space-between; 
                        margin-bottom: 2rem;
                        position: relative;
                    }
                    
                    @media (min-width: 768px) {
                        .header {
                            margin-bottom: 3rem;
                        }
                    }
                    
                    .mobile-menu-button {
                        display: block;
                        background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
                        border: 1px solid rgba(96, 165, 250, 0.2);
                        border-radius: 0.75rem;
                        padding: 0.75rem;
                        color: #60a5fa;
                        z-index: 50;
                    }
                    
                    @media (min-width: 768px) {
                        .mobile-menu-button {
                            display: none;
                        }
                    }
                    
                    .mobile-menu {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(15, 23, 42, 0.95);
                        backdrop-filter: blur(10px);
                        z-index: 40;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 2rem;
                    }
                    
                    .mobile-menu.hidden {
                        display: none;
                    }
                    
                    .back-button { 
                        display: flex; 
                        align-items: center; 
                        gap: 0.5rem; 
                        color: #60a5fa; 
                        background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%); 
                        padding: 0.75rem 1.25rem; 
                        border-radius: 1rem; 
                        border: 1px solid rgba(96, 165, 250, 0.2); 
                        transition: all 0.3s ease; 
                        cursor: pointer; 
                        backdrop-filter: blur(10px); 
                        font-weight: 500; 
                        font-size: 0.875rem;
                    }
                    
                    @media (min-width: 640px) {
                        .back-button {
                            font-size: 1rem;
                            padding: 0.75rem 1.5rem;
                        }
                    }
                    
                    .back-button:hover { 
                        color: #93c5fd; 
                        border-color: rgba(96, 165, 250, 0.4); 
                        transform: translateX(-5px); 
                        box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3); 
                    }
                    
                    .title { 
                        font-size: 1.75rem; 
                        font-weight: 900; 
                        text-align: center; 
                        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); 
                        -webkit-background-clip: text; 
                        -webkit-text-fill-color: transparent; 
                        background-clip: text; 
                        padding: 0 1rem; 
                        line-height: 1.2;
                    }
                    
                    @media (min-width: 640px) { 
                        .title { 
                            font-size: 2.5rem; 
                        } 
                    }
                    
                    @media (min-width: 1024px) {
                        .title {
                            font-size: 3rem;
                        }
                    }
                    
                    .stats-grid { 
                        display: grid; 
                        grid-template-columns: 1fr; 
                        gap: 1.25rem; 
                        margin-bottom: 2.5rem; 
                    }
                    
                    @media (min-width: 640px) { 
                        .stats-grid { 
                            grid-template-columns: repeat(2, 1fr); 
                            gap: 1.5rem;
                        } 
                    }
                    
                    @media (min-width: 1024px) {
                        .stats-grid {
                            grid-template-columns: repeat(4, 1fr);
                        }
                    }
                    
                    .stat-card { 
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 1.25rem; 
                        padding: 1.25rem; 
                        display: flex; 
                        flex-direction: column; 
                        gap: 1rem; 
                        transition: all 0.3s ease; 
                        backdrop-filter: blur(10px); 
                        opacity: 0; 
                        transform: translateY(20px); 
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-card {
                            padding: 1.5rem;
                            border-radius: 1.5rem;
                        }
                    }
                    
                    .stat-card:hover { 
                        transform: translateY(-8px); 
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); 
                        border-color: rgba(255, 255, 255, 0.15); 
                    }
                    
                    .stat-header { 
                        display: flex; 
                        align-items: center; 
                        justify-content: space-between; 
                    }
                    
                    .stat-icon { 
                        padding: 0.6rem; 
                        border-radius: 0.875rem; 
                        background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%); 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-icon {
                            padding: 0.75rem;
                            border-radius: 1rem;
                        }
                    }
                    
                    .stat-badge { 
                        padding: 0.25rem 0.6rem; 
                        border-radius: 1.5rem; 
                        font-size: 0.7rem; 
                        font-weight: 600; 
                        background: rgba(255, 255, 255, 0.1); 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-badge {
                            padding: 0.25rem 0.75rem;
                            font-size: 0.75rem;
                        }
                    }
                    
                    .stat-content { 
                        flex: 1; 
                    }
                    
                    .stat-label { 
                        color: #94a3b8; 
                        font-size: 0.8rem; 
                        margin-bottom: 0.5rem; 
                        font-weight: 500; 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-label {
                            font-size: 0.875rem;
                        }
                    }
                    
                    .stat-value { 
                        font-size: 1.75rem; 
                        font-weight: 800; 
                        color: white; 
                        line-height: 1; 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-value {
                            font-size: 2rem;
                        }
                    }
                    
                    .stat-subvalue { 
                        font-size: 0.8rem; 
                        color: #64748b; 
                        margin-top: 0.25rem; 
                    }
                    
                    @media (min-width: 640px) {
                        .stat-subvalue {
                            font-size: 0.875rem;
                        margin-top: 0.5rem;
                        line-height: 1.4;
                        min-height: 2.5rem;
                        display: flex;
                        align-items: flex-end;
                        flex-wrap: wrap;
                        gap: 0.25rem;
                        justify-content: flex-start;
                    }
                    }
                    
                    .content-grid { 
                        display: grid; 
                        grid-template-columns: 1fr; 
                        gap: 1.5rem; 
                        margin-bottom: 2rem; 
                    }
                    
                    @media (min-width: 1024px) { 
                        .content-grid { 
                            grid-template-columns: 1fr 1fr; 
                            gap: 2rem;
                        } 
                    }
                    
                    .chart-container { 
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 1.25rem; 
                        padding: 1.25rem; 
                        backdrop-filter: blur(10px); 
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
                    }
                    
                    @media (min-width: 640px) {
                        .chart-container {
                            padding: 1.5rem;
                            border-radius: 1.5rem;
                        }
                    }
                    
                    .chart-title { 
                        font-size: 1.25rem; 
                        font-weight: 700; 
                        color: white; 
                        margin-bottom: 1.25rem; 
                        display: flex; 
                        align-items: center; 
                        gap: 0.6rem; 
                    }
                    
                    @media (min-width: 640px) {
                        .chart-title {
                            font-size: 1.5rem;
                            margin-bottom: 1.5rem;
                            gap: 0.75rem;
                        }
                    }
                    
                    .heatmap-container { 
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 1.25rem; 
                        padding: 1.25rem; 
                        backdrop-filter: blur(10px); 
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); 
                    }
                    
                    @media (min-width: 640px) {
                        .heatmap-container {
                            padding: 1.5rem;
                            border-radius: 1.5rem;
                        }
                    }
                    
                    .heatmap-title { 
                        font-size: 1.25rem; 
                        font-weight: 700; 
                        color: white; 
                        margin-bottom: 1.25rem; 
                        display: flex; 
                        align-items: center; 
                        gap: 0.6rem; 
                    }
                    
                    @media (min-width: 640px) {
                        .heatmap-title {
                            font-size: 1.5rem;
                            margin-bottom: 1.5rem;
                            gap: 0.75rem;
                        }
                    }
                    
                    .subject-section { 
                        margin-bottom: 1.5rem; 
                    }
                    
                    .subject-title { 
                        font-size: 1.1rem; 
                        font-weight: 600; 
                        color: #93c5fd; 
                        margin-bottom: 1rem; 
                        display: flex; 
                        align-items: center; 
                        gap: 0.5rem; 
                    }
                    
                    @media (min-width: 640px) {
                        .subject-title {
                            font-size: 1.25rem;
                        margin-bottom: 1.25rem;
                        gap: 0.6rem;
                        flex-wrap: wrap;
                        row-gap: 0.5rem;
                        column-gap: 0.75rem;
                        justify-content: flex-start;
                        align-items: center;
                        line-height: 1.4;
                        min-height: auto;
                        height: auto;
                        padding: 0;
                        margin: 0 0 1rem 0;
                        display: flex;
                    }
                    }
                    
                    .topics-grid { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 0.6rem; 
                        margin-bottom: 1.25rem; 
                    }
                    
                    @media (min-width: 640px) { 
                        .topics-grid { 
                            grid-template-columns: repeat(3, 1fr); 
                            gap: 0.75rem;
                        } 
                    }
                    
                    @media (min-width: 1024px) { 
                        .topics-grid { 
                            grid-template-columns: repeat(5, 1fr); 
                        } 
                    }
                    
                    .topic-cell { 
                        padding: 0.875rem 0.4rem; 
                        border-radius: 0.875rem; 
                        text-align: center; 
                        color: white; 
                        font-weight: 600; 
                        transition: all 0.3s ease; 
                        background: linear-gradient(135deg, var(--tw-gradient-stops)); 
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); 
                        cursor: pointer; 
                        min-height: 80px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    @media (min-width: 640px) {
                        .topic-cell {
                            padding: 1rem 0.5rem;
                            border-radius: 1rem;
                            min-height: 90px;
                        }
                    }
                    
                    .topic-cell:hover { 
                        transform: translateY(-5px) scale(1.05); 
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); 
                    }
                    
                    .topic-name { 
                        font-size: 0.7rem; 
                        margin-bottom: 0.4rem; 
                        opacity: 0.9; 
                        line-height: 1.2;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                    }
                    
                    @media (min-width: 640px) {
                        .topic-name {
                            font-size: 0.75rem;
                            margin-bottom: 0.5rem;
                        }
                    }
                    
                    .topic-score { 
                        font-size: 1.1rem; 
                        font-weight: 700; 
                    }
                    
                    @media (min-width: 640px) {
                        .topic-score {
                            font-size: 1.25rem;
                        line-height: 1.2;
                        min-height: 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                    }
                    
                    .progress-section { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    
                    .ambient-light { 
                        position: absolute; 
                        border-radius: 50%; 
                        filter: blur(80px); 
                        opacity: 0.2; 
                        z-index: 0; 
                    }
                    
                    .particle { 
                        position: absolute; 
                        border-radius: 50%; 
                        z-index: 0; 
                    }
                    
                    .background-grid { 
                        position: fixed; 
                        top: 0; 
                        left: 0; 
                        right: 0; 
                        bottom: 0; 
                        z-index: 0; 
                        opacity: 0.03; 
                        background-image: linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px); 
                        background-size: 24px 24px; 
                    }
                    
                    .trend-chart { 
                        height: 250px; 
                        margin-top: 1rem; 
                    }
                    
                    @media (min-width: 640px) {
                        .trend-chart {
                            height: 300px;
                        }
                    }
                    
                    .custom-tooltip { 
                        background: rgba(30, 41, 59, 0.95); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 0.5rem; 
                        padding: 0.75rem; 
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); 
                    }
                    
                    .tooltip-label { 
                        color: #94a3b8; 
                        font-size: 0.875rem; 
                        margin-bottom: 0.25rem; 
                    }
                    
                    .tooltip-value { 
                        color: white; 
                        font-weight: 600; 
                    }
                    
                    .animate-spin { 
                        animation: spin 1s linear infinite; 
                    }
                    
                    @keyframes spin { 
                        from { transform: rotate(0deg); } 
                        to { transform: rotate(360deg); } 
                    }
                    
                    .no-data-message { 
                        text-align: center; 
                        color: #94a3b8; 
                        font-style: italic; 
                        padding: 2rem; 
                        grid-column: 1 / -1; 
                    }
                    
                    /* Improved mobile responsiveness */
                    @media (max-width: 639px) {
                        .stats-grid {
                            gap: 1rem;
                        }
                        
                        .stat-card {
                            padding: 1rem;
                            border-radius: 1rem;
                        }
                        
                        .stat-value {
                            font-size: 1.5rem;
                        }
                        
                        .content-grid {
                            gap: 1.25rem;
                        }
                        
                        .chart-container,
                        .heatmap-container {
                            padding: 1rem;
                            border-radius: 1rem;
                        }
                        
                        .chart-title,
                        .heatmap-title {
                            font-size: 1.1rem;
                            margin-bottom: 1rem;
                        }
                        
                        .topics-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.5rem;
                        }
                        
                        .topic-cell {
                            padding: 0.75rem 0.25rem;
                            border-radius: 0.75rem;
                            min-height: 70px;
                        }
                        
                        .topic-name {
                            font-size: 0.65rem;
                        margin-bottom: 0.25rem;
                        -webkit-line-clamp: 2;
                        line-clamp: 2;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        max-height: 2.4em;
                        line-height: 1.2;
                        min-height: 2.4em;
                    }
                    
                        .topic-score {
                            font-size: 1rem;
                        }
                    }
                    
                    /* Tablet optimizations */
                    @media (min-width: 640px) and (max-width: 1023px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .topics-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                        
                        .topic-name {
                            -webkit-line-clamp: 2;
                            line-clamp: 2;
                            display: -webkit-box;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            max-height: 2.4em;
                            line-height: 1.2;
                            min-height: 2.4em;
                        }
                    }
                `}</style>
            </Head>
            
            <div className="app-container">
                {/* Ambient Light Elements */}
                <div ref={el => lightsRef.current[0] = el} className="ambient-light -top-20 -left-20 w-80 h-80 bg-blue-500"></div>
                <div ref={el => lightsRef.current[1] = el} className="ambient-light -bottom-20 -right-20 w-80 h-80 bg-purple-500"></div>
                <div ref={el => lightsRef.current[2] = el} className="ambient-light top-1/2 right-1/4 w-60 h-60 bg-cyan-500"></div>
                
                {/* Floating Particles */}
                {[...Array(40)].map((_, i) => (
                    <div 
                        key={i}
                        ref={el => particlesRef.current[i] = el}
                        className="particle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.3 + 0.1,
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            background: `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.05})`,
                            boxShadow: `0 0 ${Math.random() * 15 + 5}px rgba(255, 255, 255, 0.5)`
                        }}
                    ></div>
                ))}
                
                <div className="max-width-container">
                    {/* Header */}
                    <div className="header">
                        <button onClick={handleBackClick} className="back-button">
                            <ArrowLeft size={18} />
                            <span className="hidden sm:inline">Back to Dashboard</span>
                            <span className="sm:hidden">Dashboard</span>
                        </button>
                        
                        <h1 className="title">Performance Analytics</h1>
                        
                        <button 
                            onClick={toggleMobileMenu}
                            className="mobile-menu-button"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                    
                    {/* Mobile Menu */}
                    <div className={`mobile-menu ${mobileMenuOpen ? '' : 'hidden'}`}>
                        <button onClick={handleBackClick} className="back-button text-lg">
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </button>
                    </div>
                    
                    {/* Overall Stats Section */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon text-blue-400">
                                    <Target size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div className="stat-badge">{overallStats.totalQuestions > 0 ? '+0%' : 'New'}</div>
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">Total Questions</p>
                                <p className="stat-value">{overallStats.totalQuestions}</p>
                                <p className="stat-subvalue">Start practicing to see progress</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon text-green-400">
                                    <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div className="stat-badge">{overallStats.correctAnswers > 0 ? '+0%' : '0%'}</div>
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">Correct Answers</p>
                                <p className="stat-value">{overallStats.correctAnswers}</p>
                                <p className="stat-subvalue">Accuracy: {overallStats.accuracy}%</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon text-yellow-400">
                                    <Award size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div className="stat-badge">{overallStats.streak > 0 ? '🔥' : '💤'}</div>
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">Current Streak</p>
                                <p className="stat-value">{overallStats.streak} days</p>
                                <p className="stat-subvalue">{overallStats.streak > 0 ? 'Keep it up!' : 'Start a streak today!'}</p>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon text-purple-400">
                                    <Star size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div className="stat-badge">🎯</div>
                            </div>
                            <div className="stat-content">
                                <p className="stat-label">Your Rank</p>
                                <p className="stat-value">{overallStats.rank}</p>
                                <p className="stat-subvalue">Among all students</p>
                            </div>
                        </div>
                    </div>

                    <div className="content-grid">
                        {/* Left Column: Subject Performance Chart */}
                        <section className="chart-container progress-section">
                            <h2 className="chart-title">
                                <BarChart2 className="text-orange-400 w-5 h-5 sm:w-7 sm:h-7" />
                                Subject Performance
                            </h2>
                            {overallStats.totalQuestions > 0 ? (
                                <div className="trend-chart">
                                    <ResponsiveContainer>
                                        <BarChart data={subjectPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                                            <Bar dataKey="accuracy" radius={[10, 10, 0, 0]}>
                                                {subjectPerformance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="no-data-message">
                                    <p>No subject data available yet</p>
                                    <p className="text-sm mt-2">Complete some quizzes to see your performance</p>
                                </div>
                            )}
                        </section>

                        {/* Right Column: Weekly Progress */}
                        <section className="chart-container progress-section">
                            <h2 className="chart-title">
                                <Calendar className="text-cyan-400 w-5 h-5 sm:w-7 sm:h-7" />
                                Weekly Progress
                            </h2>
                            {weeklyProgress.some(day => day.questions > 0) ? (
                                <div className="trend-chart">
                                    <ResponsiveContainer>
                                        <AreaChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                            <XAxis dataKey="day" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }} />
                                            <Area type="monotone" dataKey="accuracy" stroke="#8884d8" fill="url(#colorAccuracy)" fillOpacity={0.3} strokeWidth={3} />
                                            <defs>
                                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="no-data-message">
                                    <p>No weekly data available yet</p>
                                    <p className="text-sm mt-2">Practice daily to track your progress</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Topic Performance Heatmap */}
                    <section className="heatmap-container progress-section">
                        <h2 className="heatmap-title">
                            <Zap className="text-yellow-400 w-5 h-5 sm:w-7 sm:h-7" />
                            Topic Performance Heatmap
                        </h2>
                        {Object.values(topicHeatmapData).some(subject => subject.length > 0) ? (
                            <div className="space-y-6">
                                {Object.entries(topicHeatmapData).map(([subject, topics]) => (
                                    <div key={subject} className="subject-section">
                                        <h3 className="subject-title">
                                            {subject === 'Physics' && <Atom size={18} className="sm:w-5 sm:h-5" />}
                                            {subject === 'Chemistry' && <FlaskConical size={18} className="sm:w-5 sm:h-5" />}
                                            {subject === 'Maths' && <Sigma size={18} className="sm:w-5 sm:h-5" />}
                                            {subject}
                                        </h3>
                                        <div className="topics-grid">
                                            {topics.length > 0 ? (
                                                topics.map(item => (
                                                    <div key={item.topic} className={`topic-cell bg-gradient-to-br ${getHeatmapColor(item.score)}`}>
                                                        <p className="topic-name">{item.topic}</p>
                                                        <p className="topic-score">{item.score}%</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-data-message">
                                                    <p>No topic data for {subject}</p>
                                                    <p className="text-sm mt-2">Practice {subject} topics to see your performance</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-message">
                                <p>No topic data available yet</p>
                                <p className="text-sm mt-2">Complete topic-wise practice to see your strengths and weaknesses</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Animated background grid */}
                <div className="background-grid"></div>
            </div>
        </>
    );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                <p className="tooltip-value">
                    {payload[0].value}% Accuracy
                </p>
            </div>
        );
    }
    return null;
};

export default ProgressPage;