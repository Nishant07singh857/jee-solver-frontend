import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { Mail, Lock, User, AlertTriangle, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';

const LoginPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const formRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  // Check if user is already logged in
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log('User already logged in, redirecting to dashboard');
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Switch between login and signup views
  const switchView = (view) => {
    setError('');
    setSuccess('');
    if ((view === 'login' && !isLoginView) || (view === 'signup' && isLoginView)) {
      gsap.to(formRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setIsLoginView(view === 'login');
          gsap.fromTo(
            formRef.current,
            { opacity: 0, y: 20 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.5, 
              ease: 'back.out(1.7)',
              onComplete: () => {
                const firstInput = formRef.current.querySelector('input');
                if (firstInput) firstInput.focus();
              }
            }
          );
        }
      });
    }
  };

  // Validate form
  const validateForm = () => {
    if (!isLoginView) {
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // DIRECT Firebase authentication - no wrapper functions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      gsap.from(formRef.current, {
        x: -5,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLoginView) {
        // Direct login call - no wrapper
        console.log('Attempting login...');
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccess('Welcome back! Redirecting to dashboard...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        // Direct signup call - no wrapper
        console.log('Attempting signup...');
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Update profile with full name
        if (formData.fullName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: formData.fullName.trim()
          });
        }
        
        setSuccess('Account created successfully! Redirecting to dashboard...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Raw authentication error:', error);
      
      // Enhanced error handling
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled');
          break;
        default:
          setError(`Authentication failed: ${error.message}`);
      }
      
      gsap.from(formRef.current, {
        x: -5,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Simple background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: Math.random() > 0.5 ? 'rgba(79, 70, 229, 0.3)' : 'rgba(139, 92, 246, 0.3)'
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width) particle.speedX *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Initial animations
  useEffect(() => {
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2
    });
  }, []);

  return (
    <>
      <Head>
        <title>{isLoginView ? 'Login' : 'Sign Up'} | JEE Solver</title>
        <meta name="description" content="Access your JEE Solver account to get personalized problem solutions and learning resources." />
      </Head>

      <canvas 
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.5
        }}
      />
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        zIndex: 1
      }} />
      
      <div 
        className="container"
        ref={containerRef}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div className="header">
          <div className="logo">
            <i className="fas fa-brain"></i>
            <span>JEE Solver</span>
          </div>
        </div>
        
        <div className="auth-container" ref={formRef}>
          <div className="auth-header">
            <h1>{isLoginView ? 'Welcome Back' : 'Create Account'}</h1>
            <p>{isLoginView ? 'Sign in to continue your JEE preparation' : 'Sign up to start your JEE preparation'}</p>
          </div>
          
          <div className="view-toggle">
            <div 
              className={`toggle-btn ${isLoginView ? 'active' : ''}`}
              onClick={() => switchView('login')}
            >
              Login
            </div>
            <div 
              className={`toggle-btn ${!isLoginView ? 'active' : ''}`}
              onClick={() => switchView('signup')}
            >
              Sign Up
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {!isLoginView && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input 
                    type="text" 
                    id="fullName"
                    name="fullName"
                    placeholder="Rohan Sharma" 
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  placeholder="you@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  placeholder={isLoginView ? "••••••••" : "Create a strong password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              {!isLoginView && (
                <p className="password-requirement">
                  Minimum 6 characters
                </p>
              )}
            </div>
            
            {!isLoginView && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input 
                    type="password" 
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password" 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
            )}
            
            {isLoginView && (
              <div className="forgot-password">
                <button type="button" onClick={handlePasswordReset} disabled={loading}>
                  Forgot password?
                </button>
              </div>
            )}
            
            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>{isLoginView ? 'Logging in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLoginView ? 'Login to Dashboard' : 'Create Account'}</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
          
          {error && (
            <div className="error-message">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <span>{success}</span>
            </div>
          )}
          
          <div className="switch-view">
            <p>
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => switchView(isLoginView ? 'signup' : 'login')}
                disabled={loading}
              >
                {isLoginView ? 'Sign up now' : 'Login now'}
              </button>
            </p>
          </div>
        </div>
        
        <footer>
          <p>© 2025 NISHANT SINGH RAGHUVANSHI</p>
        </footer>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #020617;
          color: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .header {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
          margin-bottom: 10px;
          width: 100%;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(to right, #4f46e5, #0891b2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .auth-container {
          width: 100%;
          max-width: 450px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .auth-header h1 {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 10px;
          background: linear-gradient(to right, #4f46e5, #0891b2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .auth-header p {
          color: #94a3b8;
          font-size: 1rem;
        }
        
        .view-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 25px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 12px;
          text-align: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }
        
        .toggle-btn.active {
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          color: white;
        }
        
        .toggle-btn:not(.active) {
          color: #94a3b8;
        }
        
        .toggle-btn:not(.active):hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        
        .input-wrapper input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .input-wrapper input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
        
        .password-requirement {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 5px;
        }
        
        .forgot-password {
          text-align: right;
          margin-bottom: 20px;
        }
        
        .forgot-password button {
          background: none;
          border: none;
          color: #4f46e5;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .forgot-password button:hover:not(:disabled) {
          color: #6366f1;
          text-decoration: underline;
        }
        
        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          transform: translateY(-2px);
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .error-message {
          margin-top: 20px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fecaca;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .success-message {
          margin-top: 20px;
          padding: 12px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          color: #a7f3d0;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .switch-view {
          text-align: center;
          margin-top: 25px;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        
        .switch-view button {
          background: none;
          border: none;
          color: #4f46e5;
          cursor: pointer;
          font-weight: 600;
          margin-left: 5px;
        }
        
        .switch-view button:hover:not(:disabled) {
          color: #6366f1;
          text-decoration: underline;
        }
        
        footer {
          text-align: center;
          padding: 30px 0;
          margin-top: 50px;
          color: #64748b;
          font-size: 0.9rem;
          width: 100%;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
          
          .auth-container {
            padding: 20px;
          }
          
          .auth-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </>
  );
};

export default LoginPage;