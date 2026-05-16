// pages/index.js
import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    const cursorRef = useRef(null);
    const cursorFollowerRef = useRef(null);
    const navbarRef = useRef(null);
    const hamburgerRef = useRef(null);
    const mobileNavRef = useRef(null);

    // Custom cursor effect
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const cursor = cursorRef.current;
        const cursorFollower = cursorFollowerRef.current;
        
        if (cursor && cursorFollower) {
            let mouseX = 0, mouseY = 0;
            let followerX = 0, followerY = 0;

            const onMouseMove = (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                cursor.style.left = mouseX + 'px';
                cursor.style.top = mouseY + 'px';
            };

            const animateCursor = () => {
                followerX += (mouseX - followerX) * 0.12;
                followerY += (mouseY - followerY) * 0.12;
                cursorFollower.style.left = followerX + 'px';
                cursorFollower.style.top = followerY + 'px';
                requestAnimationFrame(animateCursor);
            };

            document.addEventListener('mousemove', onMouseMove);
            animateCursor();

            const hoverTargets = document.querySelectorAll('a, button, .feature-card, .tcard');
            const addHoverClass = () => {
                cursor.classList.add('cursor--hover');
                cursorFollower.classList.add('cursor--hover');
            };
            const removeHoverClass = () => {
                cursor.classList.remove('cursor--hover');
                cursorFollower.classList.remove('cursor--hover');
            };

            hoverTargets.forEach(el => {
                el.addEventListener('mouseenter', addHoverClass);
                el.addEventListener('mouseleave', removeHoverClass);
            });

            return () => {
                document.removeEventListener('mousemove', onMouseMove);
                hoverTargets.forEach(el => {
                    el.removeEventListener('mouseenter', addHoverClass);
                    el.removeEventListener('mouseleave', removeHoverClass);
                });
            };
        }
    }, []);

    // Navbar scroll effect
    useEffect(() => {
        const navbar = navbarRef.current;
        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mobile menu toggle
    useEffect(() => {
        const hamburger = hamburgerRef.current;
        const mobileNav = mobileNavRef.current;

        if (hamburger && mobileNav) {
            const toggleMenu = () => {
                mobileNav.classList.toggle('open');
                const spans = hamburger.querySelectorAll('span');
                if (mobileNav.classList.contains('open')) {
                    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
                } else {
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '';
                    spans[2].style.transform = '';
                }
            };

            hamburger.addEventListener('click', toggleMenu);

            const mobileLinks = document.querySelectorAll('.mobile-nav-link');
            const closeMenu = () => {
                mobileNav.classList.remove('open');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            };

            mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

            return () => {
                hamburger.removeEventListener('click', toggleMenu);
                mobileLinks.forEach(link => link.removeEventListener('click', closeMenu));
            };
        }
    }, []);

    // Scroll animations
    useEffect(() => {
        const animatedElements = document.querySelectorAll('[data-animate]');
        const observerOptions = { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.1 };
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.getAttribute('data-delay') || '0');
                    setTimeout(() => el.classList.add('animated'), delay);
                    animationObserver.unobserve(el);
                }
            });
        }, observerOptions);

        animatedElements.forEach(el => animationObserver.observe(el));

        const heroElements = document.querySelectorAll('.hero [data-animate]');
        heroElements.forEach(el => {
            const delay = parseInt(el.getAttribute('data-delay') || '0');
            setTimeout(() => el.classList.add('animated'), delay + 200);
        });

        return () => animationObserver.disconnect();
    }, []);

    // Smooth scroll for anchor links
    useEffect(() => {
        const handleAnchorClick = (e) => {
            const href = e.currentTarget.getAttribute('href');
            if (href === '#' || !href.startsWith('#')) return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = navbarRef.current ? navbarRef.current.offsetHeight : 72;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        };

        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => link.addEventListener('click', handleAnchorClick));

        return () => {
            anchorLinks.forEach(link => link.removeEventListener('click', handleAnchorClick));
        };
    }, []);

    // Animated stat counter
    useEffect(() => {
        const statNums = document.querySelectorAll('.stat-num');
        const parseStatValue = (text) => {
            const match = text.match(/^([\d.]+)(.*)$/);
            if (match) return { value: parseFloat(match[1]), suffix: match[2] };
            return { value: 0, suffix: text };
        };

        const animateCounter = (el, target, suffix, duration = 1500) => {
            const start = performance.now();
            const isFloat = target % 1 !== 0;
            const update = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statNums.forEach(el => {
                        const { value, suffix } = parseStatValue(el.textContent);
                        animateCounter(el, value, suffix);
                    });
                    statsObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });

        const statsSection = document.querySelector('.hero-stats');
        if (statsSection) statsObserver.observe(statsSection);

        return () => statsObserver.disconnect();
    }, []);

    // Chart bar animation
    useEffect(() => {
        const chartBars = document.querySelectorAll('.chart-bar');
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartBars.forEach((bar, i) => {
                        const targetHeight = bar.style.height;
                        bar.style.height = '0%';
                        setTimeout(() => {
                            bar.style.transition = 'height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                            bar.style.height = targetHeight;
                        }, i * 100 + 200);
                    });
                    chartObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });

        const miniChart = document.querySelector('.mini-chart');
        if (miniChart) chartObserver.observe(miniChart);

        return () => chartObserver.disconnect();
    }, []);

    // Parallax effect
    useEffect(() => {
        let ticking = false;
        const handleParallaxScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const orb1 = document.querySelector('.orb-1');
                    const orb2 = document.querySelector('.orb-2');
                    if (orb1) orb1.style.transform = `translateY(${scrollY * 0.15}px)`;
                    if (orb2) orb2.style.transform = `translateY(${-scrollY * 0.1}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleParallaxScroll);
        return () => window.removeEventListener('scroll', handleParallaxScroll);
    }, []);

    // Feature card tilt effect
    useEffect(() => {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            const handleMouseMove = (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                card.style.transform = `translateY(-4px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            };
            const handleMouseLeave = () => { card.style.transform = ''; };
            card.addEventListener('mousemove', handleMouseMove);
            card.addEventListener('mouseleave', handleMouseLeave);
        });
    }, []);

    return (
        <>
            <Head>
                <title>JEE Solver | Your AI-Powered Study Partner</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
            </Head>

            <div>
                {/* Cursor */}
                <div className="cursor" id="cursor" ref={cursorRef}></div>
                <div className="cursor-follower" id="cursorFollower" ref={cursorFollowerRef}></div>

                {/* Noise Overlay */}
                <div className="noise-overlay"></div>

                {/* Animated BG Grid */}
                <div className="bg-grid"></div>

                {/* ===== NAVBAR ===== */}
                <header className="navbar" id="navbar" ref={navbarRef}>
                    <div className="nav-container">
                        <div className="nav-logo" onClick={() => router.push('/')}>
                            <div className="logo-icon">
                                <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="14" cy="14" r="3" fill="white"/>
                                    <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none"/>
                                    <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 14 14)"/>
                                    <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(120 14 14)"/>
                                </svg>
                            </div>
                            <span className="logo-text">JEE Solver</span>
                        </div>

                        <nav className="nav-links">
                            <a href="#features" className="nav-link">Features</a>
                            <a href="#pricing" className="nav-link">Pricing</a>
                            <a href="#about" className="nav-link">About</a>
                            <a href="/login" className="nav-link">Login</a>
                        </nav>

                        <div className="nav-actions">
                            <a href="/signup" className="btn-signup">
                                <span>Get Started</span>
                                <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </a>
                        </div>

                        <button className="hamburger" id="hamburger" ref={hamburgerRef} aria-label="Menu">
                            <span></span><span></span><span></span>
                        </button>
                    </div>

                    <div className="mobile-nav" id="mobileNav" ref={mobileNavRef}>
                        <a href="#features" className="mobile-nav-link">Features</a>
                        <a href="#pricing" className="mobile-nav-link">Pricing</a>
                        <a href="#about" className="mobile-nav-link">About</a>
                        <a href="/login" className="mobile-nav-link">Login</a>
                        <a href="/signup" className="mobile-nav-link mobile-cta">Get Started →</a>
                    </div>
                </header>

                {/* ===== HERO SECTION ===== */}
                <section className="hero">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>

                    <div className="hero-container">
                        <div className="hero-left">
                            <div className="hero-badge" data-animate="fade-up" data-delay="0">
                                <span className="badge-dot"></span>
                                <span>AI-Powered for JEE 2025</span>
                            </div>

                            <h1 className="hero-title" data-animate="fade-up" data-delay="100">
                                Conquer JEE <br />
                                <span className="title-accent">with Intelligence</span>
                            </h1>

                            <p className="hero-desc" data-animate="fade-up" data-delay="200">
                                From instant doubt solving to personalized progress tracking — get everything you need to ace the exam with your AI study partner.
                            </p>

                            <div className="hero-cta-group" data-animate="fade-up" data-delay="300">
                                <a href="/login" className="btn-primary">
                                    <span>Start Learning Free</span>
                                    <div className="btn-glow"></div>
                                </a>
                                <a href="#features" className="btn-ghost">
                                    <div className="play-icon">
                                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l10 5-10 5V3z"/></svg>
                                    </div>
                                    <span>See How It Works</span>
                                </a>
                            </div>

                            <div className="hero-stats" data-animate="fade-up" data-delay="400">
                                <div className="stat">
                                    <span className="stat-num">50K+</span>
                                    <span className="stat-label">Students</span>
                                </div>
                                <div className="stat-divider"></div>
                                <div className="stat">
                                    <span className="stat-num">2M+</span>
                                    <span className="stat-label">Doubts Solved</span>
                                </div>
                                <div className="stat-divider"></div>
                                <div className="stat">
                                    <span className="stat-num">98%</span>
                                    <span className="stat-label">Accuracy Rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-right" data-animate="fade-left" data-delay="200">
                            <div className="hero-visual-wrap">
                                <div className="visual-bg-ring ring-1"></div>
                                <div className="visual-bg-ring ring-2"></div>
                                <div className="visual-bg-ring ring-3"></div>

                                <div className="float-card card-top-left">
                                    <div className="fcard-icon blue">📷</div>
                                    <div>
                                        <div className="fcard-title">Doubt Solved!</div>
                                        <div className="fcard-sub">Calculus · 2s ago</div>
                                    </div>
                                </div>

                                <div className="float-card card-bottom-right">
                                    <div className="fcard-icon green">📈</div>
                                    <div>
                                        <div className="fcard-title">Score +18%</div>
                                        <div className="fcard-sub">This week</div>
                                    </div>
                                </div>

                                <div className="hero-img-container">
                                    <img src="/hero-illustration.jpeg" alt="Student Learning" className="hero-img" onError={(e) => {
                                        e.target.style.display = 'none';
                                        const fallback = document.getElementById('heroFallback');
                                        if (fallback) fallback.style.display = 'flex';
                                    }} />
                                    <div className="hero-fallback" id="heroFallback" style={{display: 'none'}}>
                                        <div className="fallback-icon">🎓</div>
                                        <div className="fallback-text">Your Study<br />Partner</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="scroll-hint">
                        <div className="scroll-line"></div>
                        <span>Scroll</span>
                    </div>
                </section>

                {/* ===== MARQUEE STRIP ===== */}
                <div className="marquee-wrap">
                    <div className="marquee-track">
                        <span>Physics</span><span className="dot">·</span>
                        <span>Chemistry</span><span className="dot">·</span>
                        <span>Mathematics</span><span className="dot">·</span>
                        <span>Photo Solver</span><span className="dot">·</span>
                        <span>Mock Tests</span><span className="dot">·</span>
                        <span>AI Mentor</span><span className="dot">·</span>
                        <span>Analytics</span><span className="dot">·</span>
                        <span>Study Plans</span><span className="dot">·</span>
                        <span>Physics</span><span className="dot">·</span>
                        <span>Chemistry</span><span className="dot">·</span>
                        <span>Mathematics</span><span className="dot">·</span>
                        <span>Photo Solver</span><span className="dot">·</span>
                        <span>Mock Tests</span><span className="dot">·</span>
                        <span>AI Mentor</span><span className="dot">·</span>
                        <span>Analytics</span><span className="dot">·</span>
                        <span>Study Plans</span><span className="dot">·</span>
                    </div>
                </div>

                {/* ===== FEATURES SECTION ===== */}
                <section id="features" className="features-section">
                    <div className="section-container">
                        <div className="section-header">
                            <span className="section-tag" data-animate="fade-up">Core Features</span>
                            <h2 className="section-title" data-animate="fade-up" data-delay="100">Everything You Need,<br /><em>All in One Place</em></h2>
                            <p className="section-desc" data-animate="fade-up" data-delay="200">Three powerful tools designed specifically to maximize your JEE performance and confidence.</p>
                        </div>

                        <div className="features-grid">
                            {/* Feature 1 */}
                            <div className="feature-card" data-animate="fade-up" data-delay="0">
                                <div className="fcard-top">
                                    <div className="feature-icon-wrap blue">
                                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="4" y="7" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                                            <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.8"/>
                                            <circle cx="16" cy="16" r="2" fill="currentColor"/>
                                            <path d="M11 7V5M21 7V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <div className="feature-tag blue">Instant</div>
                                </div>
                                <h3 className="feature-title">Photo Doubt Solver</h3>
                                <p className="feature-desc">Snap any question — from textbooks or handwritten notes — and receive instant step-by-step solutions with concept explanations.</p>
                                <div className="feature-footer">
                                    <span>Works with any subject</span>
                                    <div className="feature-arrow">→</div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="feature-card feature-card--featured" data-animate="fade-up" data-delay="150">
                                <div className="feature-featured-bg"></div>
                                <div className="fcard-top">
                                    <div className="feature-icon-wrap orange">
                                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 24l7-8 5 5 5-9 7 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="28" cy="7" r="3" fill="currentColor" opacity="0.4"/>
                                            <path d="M4 8h4M4 14h4M4 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                                        </svg>
                                    </div>
                                    <div className="feature-tag orange">AI-Driven</div>
                                </div>
                                <h3 className="feature-title">Performance Analytics</h3>
                                <p className="feature-desc">Deep-dive into your performance with chapter-wise accuracy, time-per-question analysis, and predictive rank forecasting powered by AI.</p>
                                <div className="mini-chart">
                                    <div className="chart-bar" style={{height: '40%'}} data-subject="P"></div>
                                    <div className="chart-bar" style={{height: '65%'}} data-subject="C"></div>
                                    <div className="chart-bar" style={{height: '80%'}} data-subject="M"></div>
                                    <div className="chart-bar chart-bar--active" style={{height: '90%'}} data-subject="O"></div>
                                </div>
                                <div className="feature-footer">
                                    <span>Track 30+ metrics</span>
                                    <div className="feature-arrow">→</div>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="feature-card" data-animate="fade-up" data-delay="300">
                                <div className="fcard-top">
                                    <div className="feature-icon-wrap purple">
                                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M18 23h10M23 18v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <div className="feature-tag purple">Personalized</div>
                                </div>
                                <h3 className="feature-title">Personalized Programs</h3>
                                <p className="feature-desc">Get custom study plans that adapt to your learning pace, target date, and weak areas — so every minute of study counts.</p>
                                <div className="feature-footer">
                                    <span>Adapts daily</span>
                                    <div className="feature-arrow">→</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== HOW IT WORKS ===== */}
                <section className="how-section">
                    <div className="section-container">
                        <div className="section-header">
                            <span className="section-tag" data-animate="fade-up">Simple Process</span>
                            <h2 className="section-title" data-animate="fade-up" data-delay="100">Start in <em>3 Steps</em></h2>
                        </div>

                        <div className="steps-wrap">
                            <div className="step-connector"></div>
                            <div className="steps-row">
                                <div className="step" data-animate="fade-up" data-delay="0">
                                    <div className="step-num">01</div>
                                    <div className="step-body">
                                        <h4>Create Account</h4>
                                        <p>Sign up free in under 60 seconds. No credit card needed.</p>
                                    </div>
                                </div>
                                <div className="step" data-animate="fade-up" data-delay="150">
                                    <div className="step-num">02</div>
                                    <div className="step-body">
                                        <h4>Set Your Goals</h4>
                                        <p>Tell us your target rank, weak subjects, and exam date.</p>
                                    </div>
                                </div>
                                <div className="step" data-animate="fade-up" data-delay="300">
                                    <div className="step-num">03</div>
                                    <div className="step-body">
                                        <h4>Study Smarter</h4>
                                        <p>Solve doubts, track progress, and follow your AI plan daily.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== TESTIMONIALS ===== */}
                <section className="testimonials-section">
                    <div className="section-container">
                        <div className="section-header">
                            <span className="section-tag" data-animate="fade-up">Student Stories</span>
                            <h2 className="section-title" data-animate="fade-up" data-delay="100">Trusted by Future<br /><em>Engineers</em></h2>
                        </div>

                        <div className="testimonials-grid">
                            <div className="tcard" data-animate="fade-up" data-delay="0">
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"The Photo Doubt Solver changed my prep completely. I used to spend hours on a single problem — now I get a solution in seconds and actually understand the concept."</p>
                                <div className="tcard-author">
                                    <div className="tcard-avatar">AK</div>
                                    <div>
                                        <div className="tcard-name">Arjun K.</div>
                                        <div className="tcard-meta">JEE Advanced 2024 · AIR 847</div>
                                    </div>
                                </div>
                            </div>

                            <div className="tcard tcard--featured" data-animate="fade-up" data-delay="150">
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"The analytics showed me I was spending too much time on chapters I already knew. After switching focus, my mock test scores jumped by 40 marks in a month."</p>
                                <div className="tcard-author">
                                    <div className="tcard-avatar purple-av">PS</div>
                                    <div>
                                        <div className="tcard-name">Priya S.</div>
                                        <div className="tcard-meta">JEE Main 2024 · 99.2 percentile</div>
                                    </div>
                                </div>
                            </div>

                            <div className="tcard" data-animate="fade-up" data-delay="300">
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"Personalized study plans are no joke. The AI actually remembers what I struggle with and keeps revisiting it. It's like having a private tutor available 24/7."</p>
                                <div className="tcard-author">
                                    <div className="tcard-avatar green-av">RV</div>
                                    <div>
                                        <div className="tcard-name">Rahul V.</div>
                                        <div className="tcard-meta">JEE Advanced 2024 · AIR 1243</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== CTA SECTION ===== */}
                <section className="cta-section">
                    <div className="cta-orb cta-orb-1"></div>
                    <div className="cta-orb cta-orb-2"></div>
                    <div className="section-container">
                        <div className="cta-box" data-animate="fade-up">
                            <span className="section-tag">Ready to Begin?</span>
                            <h2 className="cta-title">Your IIT dream starts<br /><em>right here.</em></h2>
                            <p className="cta-desc">Join 50,000+ students who are already studying smarter. No credit card required.</p>
                            <div className="cta-buttons">
                                <a href="/signup" className="btn-primary btn-large">
                                    <span>Create Free Account</span>
                                    <div className="btn-glow"></div>
                                </a>
                                <a href="/login" className="btn-text-link">Already have an account? Login →</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="footer">
                    <div className="footer-container">
                        <div className="footer-top">
                            <div className="footer-brand">
                                <div className="nav-logo" style={{marginBottom: '1rem'}}>
                                    <div className="logo-icon">
                                        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="14" cy="14" r="3" fill="white"/>
                                            <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none"/>
                                            <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 14 14)"/>
                                            <ellipse cx="14" cy="14" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(120 14 14)"/>
                                        </svg>
                                    </div>
                                    <span className="logo-text">JEE Solver</span>
                                </div>
                                <p className="footer-tagline">AI-powered preparation for India's most competitive engineering entrance exam.</p>
                            </div>
                            <div className="footer-links-group">
                                <div className="footer-col">
                                    <h5>Product</h5>
                                    <a href="#">Features</a>
                                    <a href="#">Pricing</a>
                                    <a href="#">Mock Tests</a>
                                    <a href="#">Analytics</a>
                                </div>
                                <div className="footer-col">
                                    <h5>Company</h5>
                                    <a href="#">About</a>
                                    <a href="#">Blog</a>
                                    <a href="#">Careers</a>
                                    <a href="#">Contact</a>
                                </div>
                                <div className="footer-col">
                                    <h5>Legal</h5>
                                    <a href="#">Privacy</a>
                                    <a href="#">Terms</a>
                                    <a href="#">Cookies</a>
                                </div>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            <span>© 2025 NISHANT SINGH RAGHUVANSHI.</span>
                            <span>Made with ❤️ for IIT aspirants</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}