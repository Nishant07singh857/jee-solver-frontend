import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Camera, Upload, Loader, AlertTriangle, Sparkles, ArrowLeft, 
  CheckCircle, XCircle, Image, Zap, BookOpen, ChevronRight, 
  Cpu, Brain, Lightbulb, FileImage, Trash2, RefreshCw 
} from 'lucide-react';
import { gsap } from 'gsap';

const API_ENDPOINT = "http://localhost:8000/api/v1/examiner/check-attempt";

const ExaminerPage = () => {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [solution, setSolution] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const fileInputRef = useRef(null);
    const solutionRef = useRef(null);
    const errorRef = useRef(null);
    const previewRef = useRef(null);
    const uploadAreaRef = useRef(null);
    const headerRef = useRef(null);
    const tipsRef = useRef(null);

    // Animation on mount
    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(headerRef.current, 
            { opacity: 0, y: -30 }, 
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
        tl.fromTo(".upload-card", 
            { opacity: 0, x: -50 }, 
            { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 
            "-=0.4"
        );
        tl.fromTo(".tips-card", 
            { opacity: 0, x: 50 }, 
            { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 
            "-=0.4"
        );
        tl.fromTo(".solution-placeholder", 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 
            "-=0.2"
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
        gsap.to(uploadAreaRef.current, {
            scale: 1,
            duration: 0.2
        });
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFile(file);
        } else {
            setError("Please drop a valid image file (PNG, JPG).");
            gsap.fromTo(errorRef.current, 
                { opacity: 0, y: 20, scale: 0.9 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
            );
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFile(file);
        } else {
            setError("Please select a valid image file (PNG, JPG).");
            gsap.fromTo(errorRef.current, 
                { opacity: 0, y: 20, scale: 0.9 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
            );
        }
    };

    const handleFile = (file) => {
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setSolution(null);
        setError('');
        setUploadProgress(0);
        
        gsap.fromTo(previewRef.current, 
            { opacity: 0, scale: 0.8, y: 30 }, 
            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }
        );
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setError("Please upload an image first.");
            gsap.fromTo(errorRef.current, 
                { opacity: 0, y: 20, scale: 0.9 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
            );
            return;
        }

        setIsLoading(true);
        setError('');
        setSolution(null);
        
        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 500);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            if (!response.ok) {
                throw new Error('Failed to get solution');
            }
            
            const data = await response.json();
            setSolution(data.feedback);
            
            gsap.fromTo(solutionRef.current, 
                { opacity: 0, y: 50, scale: 0.95 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.2)", delay: 0.2 }
            );

        } catch (err) {
            clearInterval(progressInterval);
            const errorMessage = err.message || "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            gsap.fromTo(errorRef.current, 
                { opacity: 0, y: 20, scale: 0.9 }, 
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
            );
            console.error("API Error:", err);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
                setUploadProgress(0);
            }, 500);
        }
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

    const clearAll = () => {
        gsap.to(previewRef.current, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => {
                setSelectedFile(null);
                setPreview(null);
                setSolution(null);
                setError('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                gsap.set(previewRef.current, { opacity: 1, scale: 1 });
            }
        });
    };

    return (
        <>
            <Head>
                <title>AI Examiner | JEE Solver</title>
                <meta name="description" content="Upload your handwritten solution to find mistakes step by step." />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            <div className="photo-solver">
                {/* Animated Background */}
                <div className="bg-gradient">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                    <div className="noise"></div>
                    <div className="grid-pattern"></div>
                </div>

                <div className="content-wrapper">
                    {/* Header */}
                    <div ref={headerRef} className="header-section">
                        <button onClick={handleBackClick} className="back-button">
                            <ArrowLeft size={18} />
                            <span>Back to Dashboard</span>
                        </button>
                        
                        <div className="hero-badge">
                            <Brain size={16} />
                            <span>AI-Powered Solver</span>
                        </div>
                        
                        <h1 className="hero-title">
                            Photo Doubt 
                            <span className="gradient-text"> Solver</span>
                        </h1>
                        
                        <p className="hero-description">
                            Snap a picture of any JEE problem and get instant step-by-step solutions with AI-powered explanations
                        </p>
                    </div>

                    <div className="main-grid">
                        {/* Left Column - Upload Section */}
                        <div className="upload-section">
                            <div className="upload-card">
                                <div className="card-header">
                                    <div className="card-icon">
                                        <Camera size={20} />
                                    </div>
                                    <h2>Upload Your Question</h2>
                                    <p>Supported formats: PNG, JPG, JPEG (Max 10MB)</p>
                                </div>
                                
                                <div 
                                    ref={uploadAreaRef}
                                    className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={handleUploadClick}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden-input"
                                    />
                                    
                                    <div className="upload-content">
                                        <div className="upload-icon-wrapper">
                                            <Upload size={48} />
                                        </div>
                                        <h3>{dragActive ? "Drop your image here" : "Drag & drop or click to upload"}</h3>
                                        <p>PNG, JPG up to 10MB</p>
                                        <button className="upload-button">
                                            <FileImage size={16} />
                                            Choose File
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Section */}
                                {preview && (
                                    <div ref={previewRef} className="preview-section">
                                        <div className="preview-header">
                                            <h3>Preview</h3>
                                            <button onClick={clearAll} className="clear-button">
                                                <Trash2 size={16} />
                                                Clear
                                            </button>
                                        </div>
                                        <div className="preview-image">
                                            <img src={preview} alt="Problem preview" />
                                        </div>
                                        <div className="file-info">
                                            <span>{selectedFile?.name}</span>
                                            <span>{(selectedFile?.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="submit-section">
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={isLoading || !selectedFile} 
                                        className="solve-button"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader className="spin" size={20} />
                                                <span>Analyzing your steps...</span>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={20} />
                                                <span>Check My Attempt</span>
                                                <ChevronRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Tips Card */}
                            <div ref={tipsRef} className="tips-card">
                                <div className="card-header">
                                    <div className="card-icon purple">
                                        <Lightbulb size={20} />
                                    </div>
                                    <h2>Tips for Best Results</h2>
                                </div>
                                <ul className="tips-list">
                                    <li>
                                        <CheckCircle size={16} />
                                        <span>Upload only your handwritten steps clearly</span>
                                    </li>
                                    <li>
                                        <CheckCircle size={16} />
                                        <span>Crop to focus on your steps, not the whole page</span>
                                    </li>
                                    <li>
                                        <CheckCircle size={16} />
                                        <span>Use high contrast (dark ink on white paper)</span>
                                    </li>
                                    <li>
                                        <CheckCircle size={16} />
                                        <span>Make sure all text is clearly visible</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column - Solution Section */}
                        <div className="solution-section">
                            {error && (
                                <div ref={errorRef} className="error-card">
                                    <AlertTriangle size={20} />
                                    <div>
                                        <h4>Upload Error</h4>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            )}

                            {solution ? (
                                <div ref={solutionRef} className="solution-card">
                                    <div className="solution-header">
                                        <div className="solution-icon">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h2>AI Examiner Feedback</h2>
                                            <p>Step-by-step analysis of your attempt</p>
                                        </div>
                                    </div>
                                    <div className="solution-content">
                                        <div className="solution-text">
                                            {solution}
                                        </div>
                                    </div>
                                    <div className="solution-footer">
                                        <button className="feedback-button helpful">
                                            ✓ Helpful
                                        </button>
                                        <button className="feedback-button not-helpful">
                                            ✗ Not Helpful
                                        </button>
                                        <button onClick={clearAll} className="feedback-button new">
                                            <RefreshCw size={14} />
                                            New Question
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="solution-placeholder">
                                    <div className="placeholder-icon">
                                        <Cpu size={48} />
                                    </div>
                                    <h3>Ready for Your Question</h3>
                                    <p>Upload an image of your doubt and click "Get Solution" to see the AI-powered explanation here</p>
                                    <div className="placeholder-features">
                                        <span>✨ Instant Solutions</span>
                                        <span>📝 Step-by-Step</span>
                                        <span>🎯 JEE Focused</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .photo-solver {
                    min-height: 100vh;
                    background: #0a0c15;
                    position: relative;
                    overflow-x: hidden;
                    font-family: 'Inter', sans-serif;
                }

                /* Background Effects */
                .bg-gradient {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float 15s ease-in-out infinite;
                }

                .orb-1 {
                    width: 500px;
                    height: 500px;
                    background: #3b82f6;
                    top: -200px;
                    right: -200px;
                    animation-delay: 0s;
                }

                .orb-2 {
                    width: 400px;
                    height: 400px;
                    background: #a855f7;
                    bottom: -150px;
                    left: -150px;
                    animation-delay: -5s;
                }

                .orb-3 {
                    width: 300px;
                    height: 300px;
                    background: #06b6d4;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -10s;
                }

                .noise {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    background-size: 256px;
                    opacity: 0.02;
                    pointer-events: none;
                }

                .grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .content-wrapper {
                    position: relative;
                    z-index: 2;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Header Section */
                .header-section {
                    text-align: center;
                    margin-bottom: 4rem;
                }

                .back-button {
                    position: absolute;
                    left: 2rem;
                    top: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.6rem 1.2rem;
                    border-radius: 50px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
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
                    font-size: 3.5rem;
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

                /* Main Grid */
                .main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                @media (max-width: 968px) {
                    .main-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .hero-title {
                        font-size: 2.5rem;
                    }
                    
                    .content-wrapper {
                        padding: 1rem;
                    }
                    
                    .back-button {
                        position: static;
                        margin-bottom: 1rem;
                        display: inline-flex;
                    }
                }

                /* Upload Section */
                .upload-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .upload-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                }

                .card-header {
                    margin-bottom: 1.5rem;
                }

                .card-icon {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                    color: white;
                }

                .card-icon.purple {
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                }

                .card-header h2 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .card-header p {
                    font-size: 0.85rem;
                    color: #64748b;
                }

                .upload-area {
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(0, 0, 0, 0.2);
                }

                .upload-area:hover {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }

                .upload-area.drag-active {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    transform: scale(1.02);
                }

                .hidden-input {
                    display: none;
                }

                .upload-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .upload-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #3b82f6;
                }

                .upload-content h3 {
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .upload-content p {
                    color: #64748b;
                    font-size: 0.85rem;
                }

                .upload-button {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 50px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .upload-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
                }

                /* Preview Section */
                .preview-section {
                    margin-top: 1.5rem;
                    animation: slideUp 0.5s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .preview-header h3 {
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .clear-button {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .clear-button:hover {
                    background: rgba(239, 68, 68, 0.3);
                    border-color: rgba(239, 68, 68, 0.5);
                }

                .preview-image {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                }

                .preview-image img {
                    max-width: 100%;
                    max-height: 250px;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .file-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: #64748b;
                }

                /* Submit Button */
                .submit-section {
                    margin-top: 1.5rem;
                }

                .solve-button {
                    width: 100%;
                    background: linear-gradient(135deg, #10b981, #059669);
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
                    position: relative;
                    overflow: hidden;
                }

                .solve-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.3);
                }

                .solve-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.2);
                }

                .progress-fill {
                    height: 100%;
                    background: white;
                    transition: width 0.3s ease;
                }

                /* Tips Card */
                .tips-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 1.5rem;
                }

                .tips-list {
                    list-style: none;
                    margin-top: 1rem;
                }

                .tips-list li {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 0;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .tips-list li:last-child {
                    border-bottom: none;
                }

                .tips-list li svg {
                    color: #10b981;
                    flex-shrink: 0;
                }

                /* Solution Section */
                .solution-section {
                    min-height: 500px;
                }

                .error-card {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 16px;
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .error-card svg {
                    color: #f87171;
                    flex-shrink: 0;
                }

                .error-card h4 {
                    color: #fecaca;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }

                .error-card p {
                    color: #fca5a5;
                    font-size: 0.85rem;
                }

                .solution-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    overflow: hidden;
                    animation: slideUp 0.5s ease;
                }

                .solution-header {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(168, 85, 247, 0.2));
                    padding: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .solution-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #f59e0b, #a855f7);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .solution-header h2 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .solution-header p {
                    font-size: 0.85rem;
                    color: #94a3b8;
                }

                .solution-content {
                    padding: 1.5rem;
                }

                .solution-text {
                    color: #e2e8f0;
                    line-height: 1.8;
                    font-size: 0.95rem;
                    white-space: pre-wrap;
                }

                .solution-footer {
                    padding: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .feedback-button {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .feedback-button.helpful {
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .feedback-button.not-helpful {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .feedback-button.new {
                    background: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .feedback-button:hover {
                    transform: translateY(-2px);
                }

                /* Solution Placeholder */
                .solution-placeholder {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 3rem;
                    text-align: center;
                }

                .placeholder-icon {
                    width: 80px;
                    height: 80px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: #3b82f6;
                }

                .solution-placeholder h3 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .solution-placeholder p {
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                }

                .placeholder-features {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .placeholder-features span {
                    padding: 0.4rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 50px;
                    font-size: 0.8rem;
                    color: #94a3b8;
                }
            `}</style>
        </>
    );
};

export default ExaminerPage;