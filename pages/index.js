import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'; // Step 1: Import the router
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import * as THREE from 'three';
import { Atom, ArrowRight, Camera, BarChart3, BrainCircuit } from 'lucide-react';

// --- Main Landing Page Component ---
const LandingPage = () => {
    const canvasRef = useRef(null);
    const router = useRouter(); // Step 2: Initialize the router

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // --- Three.js Background Animation ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16, 2, 3);
        const material = new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.03 });
        const torusKnot = new THREE.Points(geometry, material);
        torusKnot.position.x = 20;
        scene.add(torusKnot);

        const animate = () => {
            torusKnot.rotation.y += 0.001;
            torusKnot.rotation.x += 0.0005;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();
        
        // --- GSAP Scroll-Triggered Animations ---
        gsap.fromTo(".hero-element", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.3 });

        const sections = document.querySelectorAll('.feature-section, .testimonial-section, .cta-section');
        sections.forEach(section => {
            gsap.fromTo(section, 
                { opacity: 0, y: 100 }, 
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    }
                }
            );
        });
        
        gsap.to(torusKnot.position, {
            x: -20,
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
            }
        });

    }, []);
    
    // Step 3: This function is no longer needed, but we can leave it or remove it.
    // The buttons will call the router directly.
    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <>
            <Head>
                <title>JEE Solver | Your AI-Powered Study Partner</title>
                {/* Font link is now in _document.js, so we can remove it from here */}
            </Head>

            <div className="min-h-screen bg-slate-900 text-gray-200 font-sans overflow-x-hidden">
                <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.2 }} />

                {/* Header */}
                <header className="relative z-10 p-6 max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Atom className="text-blue-400" size={32} />
                        <span className="text-xl font-bold text-white">JEE Solver</span>
                    </div>
                    {/* Step 4: Update the onClick handler */}
                    <button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all">
                        Login
                    </button>
                </header>

                <main className="relative z-10">
                    {/* Hero Section */}
                    <section className="text-center py-24 sm:py-32 px-6">
                        <h1 className="hero-element text-5xl sm:text-7xl font-black text-white leading-tight">
                            Conquer JEE with your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AI Study Partner</span>
                        </h1>
                        <p className="hero-element max-w-2xl mx-auto mt-6 text-lg text-gray-400">
                            From instant doubt solving to personalized progress tracking, get everything you need to ace the exam.
                        </p>
                        {/* Step 4: Update the onClick handler */}
                        <button onClick={() => router.push('/login')} className="hero-element mt-10 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto">
                            Start Learning Now <ArrowRight size={20} />
                        </button>
                    </section>

                    {/* Features Section */}
                    <section className="feature-section py-20 px-6 max-w-7xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-white mb-12">Everything You Need, All in One Place</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                <Camera size={32} className="text-blue-400 mb-4" />
                                <h3 className="text-xl font-bold text-white">Photo Doubt Solver</h3>
                                <p className="text-gray-400 mt-2">Stuck? Snap a picture of any question and get a detailed, step-by-step solution instantly.</p>
                            </div>
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                <BarChart3 size={32} className="text-green-400 mb-4" />
                                <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
                                <p className="text-gray-400 mt-2">Identify your strengths and weaknesses with our visual heatmaps and subject-wise reports.</p>
                            </div>
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                <BrainCircuit size={32} className="text-purple-400 mb-4" />
                                <h3 className="text-xl font-bold text-white">AI-Powered Practice</h3>
                                <p className="text-gray-400 mt-2">Practice with an infinite bank of questions tailored to your skill level and the latest JEE syllabus.</p>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials Section */}
                    <section className="testimonial-section py-20 px-6 bg-white/5">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-4xl font-bold text-white mb-10">Trusted by Future Engineers</h2>
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 relative">
                                <p className="text-xl italic text-gray-300">"The Photo Doubt Solver is a lifesaver. I can get unstuck in minutes instead of hours. My confidence in problem-solving has skyrocketed!"</p>
                                <p className="mt-6 font-bold text-white">- Priya K., JEE Aspirant</p>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA Section */}
                    <section className="cta-section py-24 text-center px-6">
                        <h2 className="text-4xl font-bold text-white">Ready to Elevate Your Preparation?</h2>
                        <p className="text-lg text-gray-400 mt-4">Join thousands of students who are studying smarter, not just harder.</p>
                        {/* Step 4: Update the onClick handler */}
                        <button onClick={() => router.push('/login')} className="mt-8 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105">
                            Get Started for Free
                        </button>
                    </section>
                </main>

                {/* Footer */}
                <footer className="relative z-10 text-center py-8 border-t border-white/10">
                    <p className="text-gray-500">&copy; {new Date().getFullYear()} JEE Solver. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
};

export default LandingPage;
