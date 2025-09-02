import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { ArrowLeft, Atom, FlaskConical, Sigma, PlayCircle, FileText, Target, Loader, BookOpen, Award, Calendar, Database } from 'lucide-react';
import axios from 'axios';

// Import your JSON question data
import physicsQuestions from '../data/physicsQuestions.json';

const SUBJECTS = [
    { name: 'Physics', icon: <Atom size={48} />, color: 'text-blue-400', bgColor: 'hover:bg-blue-500/10', borderColor: 'hover:border-blue-500/50', gradient: 'from-blue-500/20 to-violet-500/10' },
    { name: 'Chemistry', icon: <FlaskConical size={48} />, color: 'text-green-400', bgColor: 'hover:bg-green-500/10', borderColor: 'hover:border-green-500/50', gradient: 'from-green-500/20 to-emerald-500/10' },
    { name: 'Maths', icon: <Sigma size={48} />, color: 'text-orange-400', bgColor: 'hover:bg-orange-500/10', borderColor: 'hover:border-orange-500/50', gradient: 'from-orange-500/20 to-amber-500/10' },
];

const PRACTICE_MODES = [
    { name: 'Quick Quiz', mode: 'quick', description: 'A short, 5-question quiz on random topics.', icon: <PlayCircle size={24} /> },
    { name: 'Topic-wise Practice', mode: 'topic', description: 'A 10-question quiz on your chosen topic.', icon: <Target size={24} /> },
    { name: 'Full Mock Test', mode: 'full', description: 'A 30-question test simulating a full exam section.', icon: <FileText size={24} /> },
    { name: 'Previous Year Papers', mode: 'pyq', description: 'Practice with questions from actual JEE exams.', icon: <BookOpen size={24} /> },
    { name: 'Coaching Modal Papers', mode: 'coaching', description: 'Mock papers released by top coaching institutes.', icon: <Award size={24} /> },
    { name: 'JSON Question Bank', mode: 'json', description: 'Practice with questions from our curated database.', icon: <Database size={24} /> },
];

const PYQ_YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
const COACHING_INSTITUTES = ['FIITJEE', 'Allen', 'Resonance', 'Vibrant Academy', 'Motion', 'Aakash'];
const JSON_YEARS = Object.keys(physicsQuestions).map(year => parseInt(year)).sort((a, b) => b - a);

// Use environment variable for backend URL with fallback
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://jee-solver-backend.onrender.com/api/v1";

// Predefined particle positions to avoid hydration mismatch
const PREDEFINED_PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  top: `${(i * 13 + 7) % 100}%`,
  left: `${(i * 17 + 23) % 100}%`,
  opacity: (i % 10) * 0.03 + 0.1,
  width: `${(i % 8) + 2}px`,
  height: `${(i % 7) + 2}px`,
}));

const PracticePage = () => {
    const [step, setStep] = useState(1);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedMode, setSelectedMode] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedInstitute, setSelectedInstitute] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [navigationStack, setNavigationStack] = useState([]);
    const router = useRouter();
    const containerRef = useRef(null);
    const particlesRef = useRef([]);
    const lightsRef = useRef([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const initAnimations = () => {
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
        };

        const timer = setTimeout(initAnimations, 100);
        return () => clearTimeout(timer);
    }, [isClient]);

    useEffect(() => {
        if (!isClient) return;
        
        gsap.to(".step-container", {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out'
        });
    }, [step, isClient]);

    const handleSubjectSelect = async (subject) => {
        setSelectedSubject(subject);
        setLoading(true);
        setError('');
        try {
            console.log('Fetching topics from:', `${BACKEND_API_URL}/questions/topics?subject=${subject.name}`);
            const response = await axios.get(`${BACKEND_API_URL}/questions/topics?subject=${subject.name}`);
            console.log('Topics API response:', response.data);
            setTopics(response.data.topics || []);
            setNavigationStack([...navigationStack, step]);
            setStep(2);
        } catch (err) {
            console.error('Error fetching topics:', err);
            setError('Could not load topics. Please ensure the backend is running and the URL is correct.');
        } finally {
            setLoading(false);
        }
    };

    const handleModeSelect = (mode) => {
        setSelectedMode(mode);
        setNavigationStack([...navigationStack, step]);
        
        if (mode.mode === 'topic') {
            setStep(3);
        } else if (mode.mode === 'pyq') {
            setStep(4);
        } else if (mode.mode === 'coaching') {
            setStep(5);
        } else if (mode.mode === 'json') {
            setStep(6);
        } else {
            startQuiz(mode, "random");
        }
    };

    const handleTopicSelect = (topic) => {
        setNavigationStack([...navigationStack, step]);
        startQuiz(selectedMode, topic);
    };

    const handleYearSelect = (year) => {
        setSelectedYear(year);
        setNavigationStack([...navigationStack, step]);
        startQuiz(selectedMode, `pyq_${year}`);
    };

    const handleInstituteSelect = (institute) => {
        setSelectedInstitute(institute);
        setNavigationStack([...navigationStack, step]);
        startQuiz(selectedMode, `coaching_${institute}`);
    };

    const handleJsonYearSelect = async (year) => {
        setSelectedYear(year);
        setNavigationStack([...navigationStack, step]);
        setLoading(true);
        
        try {
            // Get questions from JSON file
            const questions = physicsQuestions[year] || [];
            
            // Enhance questions with AI explanations
            const enhancedQuestions = await Promise.all(
                questions.map(async (question) => {
                    try {
                        // Generate explanation using AI
                        const response = await axios.post(`${BACKEND_API_URL}/questions/generate-explanation`, {
                            question: question.question,
                            options: question.options,
                            correctAnswer: question.options[question.correctAnswer],
                            userAnswer: "" // Empty for initial generation
                        });
                        
                        return {
                            ...question,
                            explanation: response.data.explanation,
                            hint: "Review the related concepts to understand this question better."
                        };
                    } catch (error) {
                        console.error("Failed to generate explanation:", error);
                        // Fallback to basic explanation if AI fails
                        return {
                            ...question,
                            explanation: `The correct answer is ${question.options[question.correctAnswer]}.`,
                            hint: "Review the related concepts to understand this question better."
                        };
                    }
                })
            );
            
            const quizData = {
                subject: selectedSubject.name,
                mode: 'json',
                topic: `json_${year}`,
                questions: enhancedQuestions,
                quizTitle: `${selectedSubject.name} ${year} Questions`
            };
            
            sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));
            router.push('/quiz');
        } catch (error) {
            setError('Failed to load questions. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    const startQuiz = async (mode, topic) => {
        setLoading(true);
        setError('');
        try {
            console.log('Generating quiz with:', {
                subject: selectedSubject.name,
                mode: mode.mode,
                topic: topic,
            });
            
            const response = await axios.post(`${BACKEND_API_URL}/questions/generate-quiz`, {
                subject: selectedSubject.name,
                mode: mode.mode,
                topic: topic,
            });
            
            console.log('Quiz generated successfully:', response.data);
            sessionStorage.setItem('currentQuiz', JSON.stringify(response.data));
            router.push('/quiz');
        } catch (err) {
            console.error('Error generating quiz:', err);
            setError(err.response?.data?.detail || 'Failed to generate quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (navigationStack.length > 0) {
            const previousStep = navigationStack[navigationStack.length - 1];
            setNavigationStack(navigationStack.slice(0, -1));
            setStep(previousStep);
            setError('');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <>
            <Head>
                <title>Start Practice | JEE Solver</title>
                <style>{`
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #0f172a;
                        color: #e2e8f0;
                        overflow-x: hidden;
                    }
                    
                    .app-container {
                        min-height: 100vh;
                        padding: 1rem;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    @media (min-width: 640px) {
                        .app-container {
                            padding: 2rem;
                        }
                    }
                    
                    .max-width-container {
                        max-width: 72rem;
                        margin-left: auto;
                        margin-right: auto;
                        position: relative;
                        z-index: 10;
                    }
                    
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 2.5rem;
                    }
                    
                    .back-button {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: #60a5fa;
                        background-color: rgba(255, 255, 255, 0.05);
                        padding: 0.5rem 1rem;
                        border-radius: 0.5rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        transition: all 0.3s ease;
                        cursor: pointer;
                    }
                    
                    .back-button:hover {
                        color: #93c5fd;
                        border-color: rgba(96, 165, 250, 极.3);
                    }
                    
                    .title {
                        font-size: 2.25rem;
                        font-weight: 900;
                        text-align: center;
                        background-image: linear-gradient(to right, #60a5fa, #a78bfa);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    @media (min-width: 640px) {
                        .title {
                            font-size: 2.5rem;
                        }
                    }
                    
                    .placeholder {
                        width: 4rem;
                    }
                    
                    .step-description {
                        text-align: center;
                        color: #94a3b8;
                        margin-bottom: 2rem;
                        font-size: 1.125rem;
                    }
                    
                    .sub-step-description {
                        text-align: center;
                        color: #64748b;
                        margin-bottom: 2rem;
                    }
                    
                    .subjects-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                    
                    @media (min-width: 768px) {
                        .subjects-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                    
                    .subject-card {
                        background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1));
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        padding: 2rem;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.5s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .subject-card:hover {
                        transform: scale(1.02);
                        box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
                    }
                    
                    .subject-icon {
                        display: inline-block;
                        padding: 1rem;
                        border-radius: 1rem;
                        background-color: rgba(0, 0, 0, 0.2);
                        margin-bottom: 1rem;
                    }
                    
                    .subject-name {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-bottom: 0.5rem;
                    }
                    
                    .divider {
                        height: 0.25rem;
                        width: 3rem;
                        border-radius: 0.125rem;
                        opacity: 0.5;
                        margin: 1rem auto 0;
                    }
                    
                    .modes-container {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .mode-card {
                        width: 100%;
                        background: linear-gradient(to right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        padding: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 1.5rem;
                        cursor: pointer;
                        transition: all 0.5s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .mode-card:hover {
                        transform: scale(1.01);
                        border-color: rgba(96, 165, 250, 0.3);
                        box-shadow: 0 0 20px rgba(96, 165, 250, 0.05);
                    }
                    
                    .mode-icon {
                        color: #60a5fa;
                        background-color: rgba(96, 165, 250, 0.1);
                        padding: 1rem;
                        border-radius: 0.75rem;
                        border: 1px solid rgba(96, 165, 250, 0.2);
                    }
                    
                    .mode-content {
                        text-align: left;
                    }
                    
                    .mode-title {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: white;
                        margin-bottom: 0.25rem;
                    }
                    
                    .mode-description {
                        color: #94a3b8;
                        font-size: 0.875rem;
                    }
                    
                    .topics-grid, .years-grid, .institutes-grid, .json-years-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }
                    
                    @media (min-width: 768极) {
                        .topics-grid, .years-grid, .institutes-grid, .json-years-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                    
                    .topic-button, .year-button, .institute-button, .json-year-button {
                        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 0.5rem;
                        padding: 1.25rem;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .topic-button:hover, .year-button:hover, .institute-button:hover, .json-year-button:hover {
                        background-color: rgba(255, 255, 255, 0.1);
                        border-color: rgba(96, 165, 250, 0.3);
                        transform: scale(1.02);
                    }
                    
                    .topic-name, .year-name, .institute-name, .json-year-name {
                        font-size: 1rem;
                        font-weight: 600;
                        color: white;
                    }
                    
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 50;
                    }
                    
                    .loading-content {
                        text-align: center;
                        padding: 2rem;
                        background-color: rgba(15, 23, 42, 0.9);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        box-shadow: 0 0 30px rgba(96, 165, 250, 0.1);
                    }
                    
                    .spinner {
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                        color: #60a5fa;
                    }
                    
                    .loading-title {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: white;
                        margin-bottom: 0.5rem;
                    }
                    
                    .loading-text {
                        color: #94a3b8;
                    }
                    
                    .error-message {
                        position: fixed;
                        bottom: 1.5rem;
                        left: 50%;
                        transform: translateX(-50%);
                        background-color: rgba(127, 29, 29, 0.8);
                        border: 1px solid rgba(248, 113, 113, 0.3);
                        color: #fecaca;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.75rem;
                        backdrop-filter: blur(10px);
                        animation: fadeIn 0.5s ease-out forwards;
                        z-index: 100;
                    }
                    
                    .ambient-light {
                        position: absolute;
                        border-radius: 50%;
                        filter: blur(60px);
                        opacity: 0.15;
                        z-index: 0;
                    }
                    
                    .particle {
                        position: absolute;
                        width: 6px;
                        height: 6px;
                        background-color: rgba(255, 255, 255, 0.1);
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
                        background-image: 
                            linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px);
                        background-size: 24px 24px;
                    }
                    
                    .year-icon, .institute-icon, .json-year-icon {
                        margin-bottom: 0.5rem;
                        color: #60a5fa;
                    }
                    
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translate(-50%, 10px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
                    }
                    
                    .step-container {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                `}</style>
            </Head>
            
            <div className="app-container" ref={containerRef}>
                <div ref={el => lightsRef.current[0] = el} className="ambient-light -top-20 -left-20 w-80 h-80 bg-blue-500"></div>
                <div ref={el => lightsRef.current[1] = el} className="ambient-light -bottom-20 -right-20 w-80 h-80 bg-purple-500"></div>
                <div ref={el => lightsRef.current[2] = el} className="ambient-light top-1/2 right-1/4 w-60 h-60 bg-cyan-500"></div>
                
                {PREDEFINED_PARTICLES.map((particle, i) => (
                    <div 
                        key={i}
                        ref={el => particlesRef.current[i] = el}
                        className="particle"
                        style={{
                            top: particle.top,
                            left: particle.left,
                            opacity: particle.opacity,
                            width: particle.width,
                            height: particle.height,
                        }}
                    ></div>
                ))}
                
                <div className="max-width-container">
                    <div className="header">
                         <button onClick={goBack} className="back-button">
                            <ArrowLeft size={18} /> Back
                        </button>
                        <h1 className="title">Start Practice</h1>
                        <div className="placeholder"></div>
                    </div>

                    {step === 1 && (
                        <div className="step-container">
                            <p className="step-description">Choose your subject to begin</p>
                            <div className="subjects-grid">
                                {SUBJECTS.map(subject => (
                                    <div 
                                        key={subject.name} 
                                        onClick={() => handleSubjectSelect(subject)}
                                        className="subject-card"
                                        style={{
                                            backgroundColor: subject.name === 'Physics' ? 'rgba(59, 130, 246, 0.2)' : 
                                                              subject.name === 'Chemistry' ? 'rgba(34, 197, 94, 0.2)' : 
                                                              'rgba(249, 115, 22, 0.2)',
                                            backgroundImage: subject.name === 'Physics' ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))' : 
                                                              subject.name === 'Chemistry' ? 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))' : 
                                                              'linear-gradient(to bottom right, rgba(249, 115, 22, 0.2), rgba(245, 158, 11, 0.1))'
                                        }}
                                    >
                                        <div className={`subject-icon ${subject.color}`}>
                                            {subject.icon}
                                        </div>
                                        <h2 className={`subject-name ${subject.color}`}>{subject.name}</h2>
                                        <div className={`divider ${subject.color.replace('text', 'bg')}`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="step-container">
                            <p className="step-description">Practicing {selectedSubject?.name}</p>
                            <p className="sub-step-description">Select your preferred practice mode</p>
                            <div className="modes-container">
                                {PRACTICE_MODES.map(mode => (
                                    <button 
                                        key={mode.name} 
                                        onClick={() => handleModeSelect(mode)}
                                        className="mode-card"
                                    >
                                        <div className="mode-icon">
                                            {mode.icon}
                                        </div>
                                        <div className="mode-content">
                                            <h3 className="mode-title">{mode.name}</h3>
                                            <p className="mode-description">{mode.description}</p>                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-container">
                            <p className="step-description">{selectedSubject?.name} Practice</p>
                            <p className="sub-step-description">Select a topic to focus on</p>
                            <div className="topics-grid">
                                {topics.map(topic => (
                                    <button 
                                        key={topic} 
                                        onClick={() => handleTopicSelect(topic)}
                                        className="topic-button"
                                    >
                                        <h3 className="topic-name">{topic}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-container">
                            <p className="step-description">{selectedSubject?.name} Previous Year Questions</p>
                            <p className="sub-step-description">Select a year to practice</p>
                            <div className="years-grid">
                                {PYQ_YEARS.map(year => (
                                    <button 
                                        key={year} 
                                        onClick={() => handleYearSelect(year)}
                                        className="year-button"
                                    >
                                        <Calendar size={24} className="year-icon" />
                                        <h3 className="year-name">JEE {year}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="step-container">
                            <p className="step-description">{selectedSubject?.name} Coaching Modal Papers</p>
                            <p className="sub-step-description">Select a coaching institute</p>
                            <div className="institutes-grid">
                                {COACHING_INSTITUTES.map(institute => (
                                    <button 
                                        key={institute} 
                                        onClick={() => handleInstituteSelect(institute)}
                                        className="institute-button"
                                    >
                                        <Award size={24} className="institute-icon" />
                                        <h3 className="institute-name">{institute}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="step-container">
                            <p className="step-description">{selectedSubject?.name} JSON Question Bank</p>
                            <p className="sub-step-description">Select a year to practice</p>
                            <div className="json-years-grid">
                                {JSON_YEARS.map(year => (
                                    <button 
                                        key={year} 
                                        onClick={() => handleJsonYearSelect(year)}
                                        className="json-year-button"
                                    >
                                        <Database size={24} className="json-year-icon" />
                                        <h3 className="json-year-name">{year} Questions</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-content">
                                <Loader size={48} className="spinner" />
                                <h3 className="loading-title">
                                    {selectedMode?.mode === 'json' ? 'Loading Questions' : 'Generating AI Questions'}
                                </h3>
                                <p className="loading-text">
                                    {selectedMode?.mode === 'json' ? 'Preparing questions with AI explanations...' : 'Preparing your personalized quiz...'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>

                <div className="background-grid"></div>
            </div>
        </>
    );
};

export default PracticePage;
