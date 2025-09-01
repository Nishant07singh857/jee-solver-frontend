import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

const DashboardPage = () => {
    const canvasRef = useRef(null);
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        problemsSolved: 0,
        timeFocused: '0 Hours',
        accuracy: '0%'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const animationInitialized = useRef(false);

    useEffect(() => {
        // Check if user is authenticated
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData(currentUser);
                setupRealtimeUpdates(currentUser);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchUserData = async (currentUser) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch user profile data
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
            
            // Fetch initial user stats
            await updateUserStats(currentUser);
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError(error.message);
            
            // Set default stats when there's an error
            setStats({
                problemsSolved: 0,
                timeFocused: '0 Hours',
                accuracy: '0%'
            });
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeUpdates = (currentUser) => {
        // Real-time listener for study sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sessionsQuery = query(
            collection(db, 'studySessions'),
            where('userId', '==', currentUser.uid),
            where('date', '>=', today)
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(sessionsQuery, 
            (snapshot) => {
                updateUserStats(currentUser);
            },
            (error) => {
                console.error('Real-time update error:', error);
                setError('Failed to get real-time updates');
            }
        );

        return unsubscribe;
    };

    const updateUserStats = async (currentUser) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const sessionsQuery = query(
                collection(db, 'studySessions'),
                where('userId', '==', currentUser.uid),
                where('date', '>=', today)
            );
            
            const sessionsSnapshot = await getDocs(sessionsQuery);
            let totalProblems = 0;
            let totalTime = 0;
            let correctAnswers = 0;
            let totalAnswers = 0;
            
            sessionsSnapshot.forEach(doc => {
                const sessionData = doc.data();
                totalProblems += sessionData.problemsSolved || 0;
                totalTime += sessionData.duration || 0;
                correctAnswers += sessionData.correctAnswers || 0;
                totalAnswers += sessionData.totalQuestions || 0;
            });
            
            // Calculate accuracy
            const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
            
            setStats({
                problemsSolved: totalProblems,
                timeFocused: `${(totalTime / 60).toFixed(1)} Hours`,
                accuracy: `${accuracy}%`
            });
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    };

    useEffect(() => {
        // Three.js Animation - only run on client side
        if (typeof window === 'undefined' || animationInitialized.current) return;
        
        // Wait for canvas to be available
        if (!canvasRef.current) {
            // Try again after a short delay if canvas isn't available yet
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
            console.log("Initializing Three.js animation");
            
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

            // GSAP animations for UI elements (run after a short delay)
            setTimeout(() => {
                const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
                tl.fromTo(".logo", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2 })
                  .fromTo(".nav-btn", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.4 })
                  .fromTo("h1", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, delay: 0.6 })
                  .fromTo(".subtitle", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, delay: 0.8 })
                  .fromTo(".stat-card", { opacity: 0, y: 40, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, delay: 1 })
                  .fromTo(".dashboard-card", { opacity: 0, y: 50, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, delay: 1.2 });
            }, 500);

            // Add interactivity to dashboard cards
            const cards = document.querySelectorAll('.dashboard-card');
            cards.forEach(card => {
                card.addEventListener('click', function() {
                    gsap.to(card, { scale: 0.95, duration: 0.2, yoyo: true, repeat: 1 });
                });
            });

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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '50%',
                        height: '48px',
                        width: '48px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        margin: '0 auto'
                    }}></div>
                    <p style={{ color: 'white', marginTop: '16px' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Modern Dashboard | AI Analytics</title>
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
            
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '20px',
                position: 'relative',
                zIndex: 1
            }}>
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <p>Error: {error}</p>
                        <button onClick={() => setError(null)} style={{
                            background: 'rgba(239, 68, 68, 0.3)',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer'
                        }}>Dismiss</button>
                    </div>
                )}
                
                <nav style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 0',
                    marginBottom: '30px'
                }}>
                    <div className="logo" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '24px',
                        fontWeight: '700',
                        background: 'linear-gradient(to right, #4f46e5, #0891b2)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        <i className="fas fa-brain" style={{
                            fontSize: '28px',
                            animation: 'float 6s ease-in-out infinite'
                        }}></i>
                        <span>AI Analytics</span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="nav-btn" style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}>
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="nav-btn logout" onClick={handleLogout} style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(239, 68, 68, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}>
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                    </div>
                </nav>
                
                <header style={{ textAlign: 'center', margin: '40px 0' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '15px',
                        letterSpacing: '-0.5px'
                    }}>Your Dashboard</h1>
                    <p className="subtitle" style={{
                        fontSize: '1.2rem',
                        color: '#94a3b8',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>Welcome back. Let's conquer your goals for today.</p>
                </header>
                
                <section style={{ margin: '50px 0' }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        marginBottom: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'white'
                    }}>
                        <i className="fas fa-chart-line"></i>
                        Today's Stats
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        <div className="stat-card" style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '24px',
                                background: 'rgba(16, 185, 129, 0.2)' 
                            }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    color: '#94a3b8',
                                    marginBottom: '8px'
                                }}>Problems Solved</h3>
                                <p style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: 'white'
                                }}>{stats.problemsSolved}</p>
                            </div>
                        </div>
                        
                        <div className="stat-card" style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '24px',
                                background: 'rgba(245, 158, 11, 0.2)' 
                            }}>
                                <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    color: '#94a3b8',
                                    marginBottom: '8px'
                                }}>Time Focused</h3>
                                <p style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: 'white'
                                }}>{stats.timeFocused}</p>
                            </div>
                        </div>
                        
                        <div className="stat-card" style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '24px',
                                background: 'rgba(6, 182, 212, 0.2)' 
                            }}>
                                <i className="fas fa-bullseye" style={{ color: '#06b6d4' }}></i>
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    color: '#94a3b8',
                                    marginBottom: '8px'
                                }}>Accuracy</h3>
                                <p style={{
                                    fontSize: '1.8rem',
                                    fontWeight: '700',
                                    color: 'white'
                                }}>{stats.accuracy}</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '25px',
                    margin: '50px 0'
                }}>
                    <div className="dashboard-card card-blue" onClick={() => handleCardClick('solve')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #4f46e5',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#4f46e5' }}>
                            <i className="fas fa-camera"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>Photo Doubt Solver</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Snap a picture of any problem and get an instant, step-by-step AI solution.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>Try it now →</div>
                    </div>
                    
                    <div className="dashboard-card card-green" onClick={() => handleCardClick('practice')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #059669',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#059669' }}>
                            <i className="fas fa-book-open"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>Start Practice</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Access PYQs, Model Papers, and an infinite bank of AI-generated questions.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>Practice now →</div>
                    </div>
                    
                    <div className="dashboard-card card-yellow" onClick={() => handleCardClick('progress')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #d97706',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#d97706' }}>
                            <i className="fas fa-chart-bar"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>View Progress</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Track your performance with heatmaps, analytics, and topper benchmarks.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>View stats →</div>
                    </div>
                    
                    <div className="dashboard-card card-purple" onClick={() => handleCardClick('assessment')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #7c3aed',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#7c3aed' }}>
                            <i className="fas fa-brain"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>AI Assessment</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Get intelligent step-wise scoring and feedback on your mock tests.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>Assess now →</div>
                    </div>
                    
                    <div className="dashboard-card card-red" onClick={() => handleCardClick('revision')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #dc2626',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#dc2626' }}>
                            <i className="fas fa-magic"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>Smart Revision</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Review your mistakes and practice with flashcards using spaced repetition.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>Revise now →</div>
                    </div>
                    
                    <div className="dashboard-card card-cyan" onClick={() => handleCardClick('wellness')} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: '4px solid #0891b2',
                        borderRadius: '16px',
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div className="card-icon" style={{ fontSize: '32px', marginBottom: '20px', color: '#0891b2' }}>
                            <i className="fas fa-wind"></i>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            fontWeight: '700',
                            color: 'white'
                        }}>Wellness Mode</h2>
                        <p style={{
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>Use focus timers and breathing guides to manage stress and study effectively.</p>
                        <div className="card-cta" style={{
                            color: '#0891b2',
                            fontWeight: '600',
                            opacity: '0',
                            transition: 'opacity 0.3s ease'
                        }}>Relax now →</div>
                    </div>
                </div>
                
                <footer style={{
                    textAlign: 'center',
                    padding: '30px 0',
                    marginTop: '50px',
                    color: '#64748b',
                    fontSize: '0.9rem'
                }}>
                    <p>© 2025 NISHANT SINGH RAGHUVANSHI</p>
                </footer>
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
                .stat-card:hover {
                    transform: translateY(-5px) !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                }

                .dashboard-card:hover {
                    transform: translateY(-8px) !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                }

                .dashboard-card:hover::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
                    opacity: 1 !important;
                }

                .dashboard-card:hover .card-cta {
                    opacity: 1 !important;
                }

                .nav-btn:hover {
                    transform: scale(1.1) !important;
                    background: rgba(255, 255, 255, 0.2) !important;
                }

                .nav-btn.logout:hover {
                    background: rgba(239, 68, 68, 0.3) !important;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    h1 {
                        font-size: 2.2rem !important;
                    }
                    
                    .stats-grid,
                    .dashboard-grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .dashboard-card {
                        padding: 20px !important;
                    }
                }
            `}</style>
        </>
    );
};

export default DashboardPage;