// components/CosmicFocus.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';

const SOUND_URLS = {
  rain: 'https://cdn.freesound.org/previews/174/174366_3226920-lq.mp3',
  forest: 'https://cdn.freesound.org/previews/567/567083_12185244-lq.mp3',
  waves: 'https://cdn.freesound.org/previews/400/400632_5121236-lq.mp3',
  fire: 'https://cdn.freesound.org/previews/339/339304_5121236-lq.mp3',
  space: 'https://cdn.freesound.org/previews/608/608930_10928926-lq.mp3',
  completion: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3'
};

const CosmicFocus = () => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const completionAudioRef = useRef(null);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Timer State
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPulse, setTimerPulse] = useState(false);
  
  // Breathing State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathText, setBreathText] = useState('Ready');
  const [breathScale, setBreathScale] = useState(1);
  const [breathColor, setBreathColor] = useState('var(--primary)');
  
  // Sound State
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume] = useState(50);

  // Audio Initialization
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    
    completionAudioRef.current = new Audio(SOUND_URLS.completion);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const toggleSound = (soundKey) => {
    if (activeSound === soundKey) {
      audioRef.current.pause();
      setActiveSound(null);
    } else {
      audioRef.current.src = SOUND_URLS[soundKey];
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(e => console.log('Audio playback failed', e));
      setActiveSound(soundKey);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval;
    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && remainingSeconds === 0) {
      setIsTimerRunning(false);
      setTimerPulse(true);
      if (completionAudioRef.current) {
        completionAudioRef.current.volume = 0.7;
        completionAudioRef.current.play().catch(e => console.log(e));
      }
      setTimeout(() => setTimerPulse(false), 3000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingSeconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setRemainingSeconds(totalSeconds);
  };
  const setPreset = (mins) => {
    setIsTimerRunning(false);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
  };

  // Breathing Logic
  useEffect(() => {
    let interval;
    if (isBreathing) {
      // Start immediately with Inhale
      setBreathText('Inhale');
      setBreathScale(1.5);
      setBreathColor(isDarkMode ? 'var(--primary)' : 'var(--secondary)');
      
      let isExhaleNext = true;
      
      interval = setInterval(() => {
        if (isExhaleNext) {
          setBreathText('Exhale');
          setBreathScale(1);
          setBreathColor(isDarkMode ? 'var(--secondary)' : 'var(--primary)');
        } else {
          setBreathText('Inhale');
          setBreathScale(1.5);
          setBreathColor(isDarkMode ? 'var(--primary)' : 'var(--secondary)');
        }
        isExhaleNext = !isExhaleNext;
      }, 4000);
      
    } else {
      setBreathText('Ready');
      setBreathScale(1);
      setBreathColor(isDarkMode ? 'var(--primary)' : 'var(--secondary)');
    }
    return () => clearInterval(interval);
  }, [isBreathing, isDarkMode]);

  // 3D Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      angle: Math.random() * 360,
      distance: Math.random() * 5 + 1
    }));
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const bgGrad = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width * 0.8
      );
      if (isDarkMode) {
        bgGrad.addColorStop(0, 'rgba(15, 15, 35, 0.8)');
        bgGrad.addColorStop(1, 'rgba(10, 10, 30, 0.8)');
      } else {
        bgGrad.addColorStop(0, 'rgba(200, 220, 255, 0.8)');
        bgGrad.addColorStop(1, 'rgba(160, 180, 220, 0.8)');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.angle += 0.002 * p.speed;
        const x = p.x + Math.cos(p.angle) * p.distance;
        const y = p.y + Math.sin(p.angle) * p.distance;
        
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? `rgba(180, 180, 255, ${p.opacity})` : `rgba(80, 100, 200, ${p.opacity})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  const progressPercent = 100 - (remainingSeconds / totalSeconds * 100);

  return (
    <div className={`cosmic-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      
      <canvas ref={canvasRef} className="cosmic-canvas" />

      <div className="container">
        <header>
          <div className="header-left">
            <button className="back-btn" onClick={() => window.location.href = '/dashboard'}>
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            <div className="logo">
              <i className="fas fa-brain"></i>
              <span>Cosmic Focus</span>
            </div>
          </div>
          <button className="theme-switcher" onClick={() => setIsDarkMode(!isDarkMode)}>
            <i className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <div className="dashboard">
          {/* Focus Timer */}
          <div className="card focus-card">
            <div className="card-header">
              <i className="fas fa-clock"></i>
              <h2>Deep Focus Timer</h2>
            </div>
            <p>Immerse yourself in distraction-free study sessions with our cosmic timer.</p>
            
            <div className={`timer-display ${timerPulse ? 'celebrate' : ''}`}>
              {formatTime(remainingSeconds)}
            </div>
            
            <div className="focus-progress">
              <div className="focus-progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>
            
            <div className="timer-controls">
              {!isTimerRunning ? (
                <button className="btn btn-primary" onClick={startTimer}>
                  <i className="fas fa-play"></i> {remainingSeconds === totalSeconds ? 'Start Focus' : 'Resume'}
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={pauseTimer}>
                  <i className="fas fa-pause"></i> Pause
                </button>
              )}
              <button className="btn btn-danger" onClick={resetTimer}>
                <i className="fas fa-redo"></i> Reset
              </button>
            </div>
            
            <div className="presets">
              {[25, 45, 60, 90].map(mins => (
                <button key={mins} className="preset-btn" onClick={() => setPreset(mins)}>{mins} min</button>
              ))}
            </div>
          </div>

          {/* Breathing */}
          <div className="card breathing-card">
            <div className="card-header">
              <i className="fas fa-wind"></i>
              <h2>Cosmic Breathing</h2>
            </div>
            <p>Sync your breathing with the pulsating cosmic rhythm to center your mind.</p>
            
            <div className="breathing-circle-wrapper">
              <div 
                className="breathing-circle" 
                style={{ transform: `scale(${breathScale})`, backgroundColor: breathColor }}
              >
                <span>{breathText}</span>
              </div>
            </div>
            
            <div className="breathing-controls">
              {!isBreathing ? (
                <button className="btn btn-success" onClick={() => setIsBreathing(true)}>
                  <i className="fas fa-play"></i> Start Session
                </button>
              ) : (
                <button className="btn btn-danger" onClick={() => setIsBreathing(false)}>
                  <i className="fas fa-stop"></i> Stop
                </button>
              )}
            </div>
          </div>

          {/* Sounds */}
          <div className="card sounds-card">
            <div className="card-header">
              <i className="fas fa-music"></i>
              <h2>Ambient Soundscape</h2>
            </div>
            <p>Enhance your focus with immersive ambient sound environments.</p>
            
            <div className="sounds-grid">
              {[
                { id: 'rain', icon: 'fa-cloud-rain', name: 'Cosmic Rain', desc: 'Ethereal rainfall' },
                { id: 'forest', icon: 'fa-tree', name: 'Nebula Forest', desc: 'Mystical woodland' },
                { id: 'waves', icon: 'fa-water', name: 'Stellar Waves', desc: 'Celestial ocean' },
                { id: 'fire', icon: 'fa-fire', name: 'Solar Flare', desc: 'Cosmic energy' },
                { id: 'space', icon: 'fa-star', name: 'Deep Space', desc: 'Ethereal ambience' }
              ].map(s => (
                <div 
                  key={s.id} 
                  className={`sound-btn ${activeSound === s.id ? 'active' : ''}`} 
                  onClick={() => toggleSound(s.id)}
                >
                  <i className={`fas ${s.icon}`}></i>
                  <span className="sound-name">{s.name}</span>
                  <span className="sound-desc">{s.desc}</span>
                </div>
              ))}
            </div>
            
            <div className="volume-control">
              <p>Volume: <span>{volume}%</span></p>
              <input 
                type="range" min="0" max="100" value={volume} 
                onChange={(e) => setVolume(e.target.value)} 
                className="volume-slider" 
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --primary: #8a2be2;
          --primary-glow: #9370db;
          --secondary: #00bcd4;
          --accent: #ff4081;
          --card-bg: rgba(20, 20, 40, 0.6);
          --card-border: rgba(138, 43, 226, 0.4);
          --starlight: #f8fafc;
        }

        .light-mode {
          --primary: #6a4ca3;
          --primary-glow: #9370db;
          --secondary: #0097a7;
          --accent: #ff5252;
          --card-bg: rgba(255, 255, 255, 0.8);
          --card-border: rgba(106, 76, 163, 0.4);
          --starlight: #1a1a2e;
        }

        .cosmic-container {
          color: var(--starlight);
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          position: relative;
          z-index: 1;
        }

        .cosmic-canvas {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: -1;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--card-border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          color: var(--starlight);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(138, 43, 226, 0.2);
          transform: translateY(-2px);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .theme-switcher {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          color: var(--starlight);
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 2.5rem;
        }

        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid var(--card-border);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
          transition: transform 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-5px);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .focus-card .card-header { color: var(--primary); }
        .breathing-card .card-header { color: var(--secondary); }
        .sounds-card .card-header { color: var(--accent); }

        .card-header i {
          padding: 0.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
        }

        .timer-display {
          font-size: 4rem;
          font-weight: 800;
          text-align: center;
          margin: 2rem 0;
          font-variant-numeric: tabular-nums;
          background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .timer-display.celebrate {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .focus-progress {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .focus-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          transition: width 1s linear;
        }

        .timer-controls, .breathing-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          color: white;
        }

        .btn-primary { background: linear-gradient(135deg, #8a2be2, #4b0082); }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); color: var(--starlight); border: 1px solid var(--card-border); }
        .btn-danger { background: rgba(255, 64, 129, 0.2); color: #ff4081; }
        .btn-success { background: linear-gradient(135deg, #00bcd4, #009688); }

        .presets {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .preset-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--starlight);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .preset-btn:hover { background: rgba(255, 255, 255, 0.15); }

        .breathing-circle-wrapper {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2rem 0;
        }

        .breathing-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          transition: transform 4s ease-in-out, background-color 4s ease-in-out;
          box-shadow: 0 0 30px rgba(0, 188, 212, 0.3);
        }

        .sounds-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .sound-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s;
        }

        .sound-btn.active {
          background: rgba(255, 64, 129, 0.15);
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(255, 64, 129, 0.3);
        }

        .sound-btn i {
          font-size: 1.5rem;
          color: var(--starlight);
          margin-bottom: 0.5rem;
          display: block;
        }

        .sound-name {
          display: block;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .sound-desc {
          font-size: 0.8rem;
          opacity: 0.6;
        }

        .volume-control {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
        }

        .volume-slider {
          width: 100%;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default CosmicFocus;