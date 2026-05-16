import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import DashboardLayout from '../components/DashboardLayout';
import styles from '../styles/Dashboard.module.css';

const DashboardPage = () => {
    const canvasRef = useRef(null);
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        problemsSolved: 0,
        timeFocused: '0 Mins',
        accuracy: '0%'
    });
    const [quizDates, setQuizDates] = useState([]);
    const [dailyStreak, setDailyStreak] = useState(0);
    const [weaknesses, setWeaknesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const animationInitialized = useRef(false);

    useEffect(() => {
        // Force loading to false after 3 seconds in case Firebase hangs
        const loadingTimer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData(currentUser);
                // Update daily streak
                fetch(`http://localhost:8000/api/v1/users/update-streak?uid=${currentUser.uid}`, { method: 'POST' })
                    .then(r => r.json())
                    .then(d => { if (d.streak) setDailyStreak(d.streak); })
                    .catch(() => {});
                // Realtime listener yahan start karein
                const realtimeUnsub = setupRealtimeUpdates(currentUser);
                return () => realtimeUnsub();
            } else {
                setLoading(false);
                router.push('/login');
            }
        });

        return () => {
            clearTimeout(loadingTimer);
            unsubscribe();
        };
    }, [router]);

    const fetchUserData = async (currentUser) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }

            // 🧠 Fetch AI Weaknesses from userProgress
            const progressQuery = query(collection(db, 'userProgress'), where('userId', '==', currentUser.uid));
            const progressSnap = await getDocs(progressQuery);
            const weakTopics = [];
            progressSnap.forEach(doc => {
                const data = doc.data();
                if (data.totalAttempts >= 2) {
                    const accuracy = data.correctAttempts / data.totalAttempts;
                    if (accuracy <= 0.5) { // If accuracy is 50% or below, flag as weakness
                        weakTopics.push({
                            topic: data.topic,
                            subject: data.subject,
                            accuracy: Math.round(accuracy * 100),
                            attempts: data.totalAttempts
                        });
                    }
                }
            });
            // Sort by most attempts with lowest accuracy
            weakTopics.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
            setWeaknesses(weakTopics.slice(0, 3)); // Top 3 critical weaknesses

        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Helper Function: Stats calculate karne ke liye
    const calculateStats = (snapshot) => {
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalTimeSeconds = 0;
        const dates = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalQuestions += data.totalQuestions || 0;
            totalCorrect += data.correctAnswers || 0;
            totalTimeSeconds += data.timeSpent || 0;
            // Collect completion dates for heatmap
            if (data.completedAt) {
                const d = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
                dates.push(d.toISOString());
            }
        });

        const accuracy = totalQuestions > 0 
            ? Math.round((totalCorrect / totalQuestions) * 100) 
            : 0;

        let timeDisplay = '0 Mins';
        if (totalTimeSeconds > 3600) {
            timeDisplay = `${(totalTimeSeconds / 3600).toFixed(1)} Hrs`;
        } else {
            timeDisplay = `${Math.floor(totalTimeSeconds / 60)} Mins`;
        }

        setStats({
            problemsSolved: totalQuestions,
            timeFocused: timeDisplay,
            accuracy: `${accuracy}%`
        });
        setQuizDates(dates);

        // 🔥 Calculate Daily Streak
        if (dates.length > 0) {
            const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))];
            uniqueDateStrings.sort((a, b) => new Date(b) - new Date(a)); // Newest first
            
            let streak = 0;
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let checkDate = new Date(today);
            
            // Allow streak to continue if they haven't played *yet* today, but played yesterday
            if (uniqueDateStrings[0] === today.toDateString() || uniqueDateStrings[0] === yesterday.toDateString()) {
                if (uniqueDateStrings[0] === yesterday.toDateString()) {
                    checkDate = yesterday;
                }
                
                for (let i = 0; i < uniqueDateStrings.length; i++) {
                    if (uniqueDateStrings[i] === checkDate.toDateString()) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
            setDailyStreak(streak);
        } else {
            setDailyStreak(0);
        }
    };

    // 🔥 Real-time Updates Setup
    const setupRealtimeUpdates = (currentUser) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const q = query(
            collection(db, 'quizResults'),
            where('userId', '==', currentUser.uid),
            // Agar aapko sirf aaj ka data chahiye to niche wali line uncomment karein:
            // where('completedAt', '>=', today),
            orderBy('completedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                calculateStats(snapshot);
            },
            (error) => {
                console.error('Real-time update error:', error);
                // Agar index error aaye, to console me link par click karein
                if (error.code === 'failed-precondition') {
                    setError('Database index required. Check console for link.');
                }
            }
        );

        return unsubscribe;
    };

    // Animation Code 
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
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;
            
            const renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                alpha: true,
                antialias: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCount = 5000;
            const posArray = new Float32Array(particlesCount * 3);
            const colorArray = new Float32Array(particlesCount * 3);
            
            for (let i = 0; i < particlesCount * 3; i += 3) {
                posArray[i] = (Math.random() - 0.5) * 15;
                posArray[i+1] = (Math.random() - 0.5) * 15;
                posArray[i+2] = (Math.random() - 0.5) * 15;
                
                const colorChoice = Math.floor(Math.random() * 3);
                if (colorChoice === 0) {
                    colorArray[i] = 0.2; colorArray[i+1] = 0.4; colorArray[i+2] = 0.8;
                } else if (colorChoice === 1) {
                    colorArray[i] = 0.6; colorArray[i+1] = 0.2; colorArray[i+2] = 0.8;
                } else {
                    colorArray[i] = 0.2; colorArray[i+1] = 0.8; colorArray[i+2] = 0.8;
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
            
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);
            
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
                particlesMesh.rotation.y = elapsedTime * 0.05 + mouseX * 0.3;
                particlesMesh.rotation.x = elapsedTime * 0.03 + mouseY * 0.2;
                particlesMesh.rotation.z = elapsedTime * 0.02;
                particlesMaterial.size = 0.02 + Math.sin(elapsedTime) * 0.005;
                renderer.render(scene, camera);
            };
            animate();

            // GSAP Animations
            setTimeout(() => {
                const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
                if (document.querySelector(`.${styles.logo}`)) {
                    tl.fromTo(`.${styles.logo}`, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.8 })
                      .fromTo(`.${styles.navBtn}`, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2 }, "-=0.6")
                      .fromTo(`.${styles.headerTitle}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, "-=0.4")
                      .fromTo(`.${styles.subtitle}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, "-=0.8")
                      .fromTo(`.${styles.statCard}`, { opacity: 0, y: 40, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 }, "-=0.6")
                      .fromTo(`.${styles.dashboardCard}`, { opacity: 0, y: 50, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1 }, "-=0.4");
                }
            }, 500);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('mousemove', handleMouseMove);
                if (renderer) renderer.dispose();
                if (particlesGeometry) particlesGeometry.dispose();
                if (particlesMaterial) particlesMaterial.dispose();
            };
        }
    }, []);

    const handleCardClick = (path) => {
        router.push(`/${path}`);
    };
    
    const handleLogout = () => {
        signOut(auth).then(() => {
            router.push('/login');
        }).catch((error) => {
            console.error("Logout Error:", error);
        });
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout 
            canvasRef={canvasRef}
            error={error}
            setError={setError}
            stats={stats}
            quizDates={quizDates}
            dailyStreak={dailyStreak}
            weaknesses={weaknesses}
            handleCardClick={handleCardClick}
            handleLogout={handleLogout}
            styles={styles}
        />
    );
};

export default DashboardPage;