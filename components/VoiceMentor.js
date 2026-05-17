import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { gsap } from 'gsap';
import { auth } from '../lib/firebase';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

const VoiceMentor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const orbRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Fix: Keep listening until user stops
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onend = () => {
                // We handle stopping in toggleListening
                setIsListening(false);
            };
        }

        // Initialize Speech Synthesis
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    useEffect(() => {
        if (isListening || isSpeaking || isProcessing) {
            gsap.to(orbRef.current, {
                scale: 1.1,
                boxShadow: isSpeaking ? '0 0 40px #a855f7, inset 0 0 20px #c084fc' : 
                          isListening ? '0 0 30px #3b82f6, inset 0 0 15px #60a5fa' : 
                                        '0 0 20px #f59e0b, inset 0 0 10px #fbbf24',
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        } else {
            gsap.killTweensOf(orbRef.current);
            gsap.to(orbRef.current, {
                scale: 1,
                boxShadow: '0 0 15px rgba(255,255,255,0.2), inset 0 0 5px rgba(255,255,255,0.1)',
                duration: 0.5
            });
        }
    }, [isListening, isSpeaking, isProcessing]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Your browser doesn't support Voice Recognition. Please use Chrome.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            processQuery(transcript);
        } else {
            if (synthRef.current) synthRef.current.cancel();
            setTranscript('');
            setAiResponse('');
            setIsSpeaking(false);
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const processQuery = async (query) => {
        if (!query.trim()) return;
        
        setIsProcessing(true);
        try {
            const user = auth.currentUser;
            const payload = { query };
            if (user) {
                payload.uid = user.uid;
            }
            const response = await axios.post(`${BACKEND_API_URL}/mentor/ask`, payload);
            const replyText = response.data.response;
            setAiResponse(replyText);
            
            // Speak
            if (synthRef.current) {
                const utterance = new SpeechSynthesisUtterance(replyText);
                
                const voices = synthRef.current.getVoices();
                // Prefer Indian voices for Hinglish
                const preferredVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('en-IN') || v.name.includes('Google हिन्दी'));
                if (preferredVoice) utterance.voice = preferredVoice;
                
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                
                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                
                synthRef.current.speak(utterance);
            }
        } catch (error) {
            console.error("Mentor Error:", error);
            setAiResponse("Sorry, I'm having trouble connecting to my neural network.");
        } finally {
            setIsProcessing(false);
            // Save to AI Memory in background (non-blocking)
            const currentUser = auth.currentUser;
            if (currentUser && query.trim()) {
                axios.post(`${BACKEND_API_URL}/users/save-memory`, {
                    uid: currentUser.uid,
                    topic: query.trim(),
                    context: "Student asked JARVIS voice mentor about this topic"
                }).catch(() => {}); // silent fail
            }
        }
    };

    const toggleMentor = () => {
        if (isOpen) {
            gsap.to(containerRef.current, { y: 20, opacity: 0, duration: 0.3, onComplete: () => setIsOpen(false) });
            if (synthRef.current) synthRef.current.cancel();
        } else {
            setIsOpen(true);
            setTimeout(() => {
                gsap.fromTo(containerRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" });
            }, 10);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
            {isOpen && (
                <div ref={containerRef} style={{ 
                    background: 'rgba(15, 23, 42, 0.85)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '20px',
                    width: '320px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Sparkles size={18} color="#a855f7" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>JARVIS Mentor</h3>
                        </div>
                        <button onClick={toggleMentor} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ 
                        height: '150px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        {/* JARVIS ORB */}
                        <div ref={orbRef} style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: isSpeaking ? 'radial-gradient(circle at 30% 30%, #d8b4fe, #a855f7, #7e22ce)' : 
                                       isListening ? 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1d4ed8)' : 
                                       isProcessing ? 'radial-gradient(circle at 30% 30%, #fcd34d, #f59e0b, #b45309)' : 
                                                      'radial-gradient(circle at 30% 30%, #cbd5e1, #64748b, #334155)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.5s ease',
                        }} onClick={toggleListening}>
                            {isProcessing ? <Loader className="spin" size={30} color="white" /> : 
                             isListening ? <Mic size={30} color="white" /> : 
                             <MicOff size={30} color="white" />}
                        </div>
                    </div>

                    <div style={{ 
                        minHeight: '80px', 
                        maxHeight: '120px', 
                        overflowY: 'auto', 
                        background: 'rgba(0,0,0,0.3)', 
                        borderRadius: '12px', 
                        padding: '12px',
                        fontSize: '0.9rem',
                        color: '#e2e8f0'
                    }}>
                        {isListening ? (
                            <p style={{ fontStyle: 'italic', color: '#93c5fd' }}>{transcript || "Listening..."}</p>
                        ) : isProcessing ? (
                            <p style={{ fontStyle: 'italic', color: '#fcd34d' }}>Analyzing your query...</p>
                        ) : aiResponse ? (
                            <p>{aiResponse}</p>
                        ) : (
                            <p style={{ color: '#94a3b8' }}>Tap the orb and ask me a question like "Explain Rotational Mechanics". Tap again to send.</p>
                        )}
                    </div>
                </div>
            )}

            {!isOpen && (
                <button 
                    onClick={toggleMentor}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 10px 25px rgba(168, 85, 247, 0.4)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Mic size={24} />
                </button>
            )}
        </div>
    );
};

export default VoiceMentor;
