// components/CosmicFocus.js
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

const CosmicFocus = () => {
  const appRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Client-side only code
    if (typeof window !== 'undefined') {
      // Import Lenis for smooth scrolling
      import('lenis').then((LenisModule) => {
        const Lenis = LenisModule.default;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
        });

        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
      });

      // Cosmic Focus Application Class
      class CosmicFocusApp {
        constructor() {
          this.timerInterval = null;
          this.breathingInterval = null;
          this.soundInterval = null;
          
          this.minutes = 25;
          this.seconds = 0;
          this.totalSeconds = this.minutes * 60;
          this.remainingSeconds = this.totalSeconds;
          this.isRunning = false;
          
          this.isBreathing = false;
          this.isInhale = true;
          this.breathCycle = 0;
          
          this.currentSound = null;
          this.currentAudio = null;
          
          this.initializeElements();
          this.attachEventListeners();
          this.updateTimerDisplay();
          this.init3DBackground();
        }
        
        initializeElements() {
          // Timer elements
          this.timerDisplay = document.getElementById('timer');
          this.progressBar = document.getElementById('progress');
          this.startTimerBtn = document.getElementById('start-timer');
          this.pauseTimerBtn = document.getElementById('pause-timer');
          this.resetTimerBtn = document.getElementById('reset-timer');
          this.presetButtons = document.querySelectorAll('.preset-btn');
          
          // Breathing elements
          this.breathingCircle = document.getElementById('breathing-circle');
          this.startBreathingBtn = document.getElementById('start-breathing');
          this.stopBreathingBtn = document.getElementById('stop-breathing');
          this.breathText = document.getElementById('breath-text');
          
          // Sound elements
          this.soundButtons = document.querySelectorAll('.sound-btn');
          this.volumeSlider = document.getElementById('volume-slider');
          this.volumeValue = document.getElementById('volume-value');
          
          // Create audio elements with higher quality sounds
          this.rainSound = new Audio('https://cdn.pixabay.com/download/audio/2022/01/20/audio_172d7de9f5.mp3?filename=rain-ambience-113154.mp3');
          this.forestSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_5bb5fad7f3.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3');
          this.wavesSound = new Audio('https://cdn.pixabay.com/download/audio/2021/10/25/audio_7b60754f9d.mp3?filename=ocean-waves-ambient-120285.mp3');
          this.fireSound = new Audio('https://cdn.pixabay.com/download/audio/2022/11/30/audio_ffa385ebb3.mp3?filename=campfire-crackle-140625.mp3');
          this.spaceSound = new Audio('https://cdn.pixabay.com/download/audio/2022/11/28/audio_3b2efb7f9c.mp3?filename=ethereal-ambient-140468.mp3');
          this.completionSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c4a27bdf98.mp3?filename=magical-harp-6737.mp3');
          
          // Set all sounds to loop
          [this.rainSound, this.forestSound, this.wavesSound, this.fireSound, this.spaceSound].forEach(sound => {
            sound.loop = true;
          });
        }
        
        attachEventListeners() {
          // Timer event listeners
          this.startTimerBtn.addEventListener('click', () => this.startTimer());
          this.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
          this.resetTimerBtn.addEventListener('click', () => this.resetTimer());
          
          // Breathing event listeners
          this.startBreathingBtn.addEventListener('click', () => this.startBreathing());
          this.stopBreathingBtn.addEventListener('click', () => this.stopBreathing());
          
          // Sound event listeners
          this.soundButtons.forEach(btn => {
            btn.addEventListener('click', () => {
              if (btn.classList.contains('active')) {
                this.stopSound();
              } else {
                this.playSound(btn.dataset.sound);
              }
            });
          });
          
          // Volume control
          this.volumeSlider.addEventListener('input', () => {
            this.setVolume(this.volumeSlider.value);
          });
          
          // Preset buttons
          this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
              this.setTimerMode(parseInt(btn.dataset.minutes));
            });
          });
        }
        
        init3DBackground() {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          // Create particles for 3D effect
          this.particles = [];
          const particleCount = 200;
          
          for (let i = 0; i < particleCount; i++) {
            this.particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              radius: Math.random() * 2 + 1,
              speed: Math.random() * 2 + 0.5,
              opacity: Math.random() * 0.5 + 0.2,
              angle: Math.random() * 360,
              distance: Math.random() * 5 + 1
            });
          }
          
          // Animation loop for 3D background
          const animate = () => {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create gradient background
            const gradient = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              0,
              canvas.width / 2,
              canvas.height / 2,
              canvas.width * 0.8
            );
            
            if (isDarkMode) {
              gradient.addColorStop(0, 'rgba(15, 15, 35, 0.8)');
              gradient.addColorStop(0.5, 'rgba(25, 25, 55, 0.6)');
              gradient.addColorStop(1, 'rgba(10, 10, 30, 0.8)');
            } else {
              gradient.addColorStop(0, 'rgba(200, 220, 255, 0.8)');
              gradient.addColorStop(0.5, 'rgba(180, 200, 240, 0.6)');
              gradient.addColorStop(1, 'rgba(160, 180, 220, 0.8)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw and animate particles
            this.particles.forEach(particle => {
              // Move particles in circular motion for 3D effect
              particle.angle += 0.002 * particle.speed;
              const x = particle.x + Math.cos(particle.angle) * particle.distance;
              const y = particle.y + Math.sin(particle.angle) * particle.distance;
              
              ctx.beginPath();
              ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
              
              // Different colors for dark/light mode
              if (isDarkMode) {
                ctx.fillStyle = `rgba(180, 180, 255, ${particle.opacity})`;
              } else {
                ctx.fillStyle = `rgba(80, 100, 200, ${particle.opacity})`;
              }
              
              ctx.fill();
              
              // Draw connecting lines between nearby particles
              this.particles.forEach(otherParticle => {
                const dx = x - (otherParticle.x + Math.cos(otherParticle.angle) * otherParticle.distance);
                const dy = y - (otherParticle.y + Math.sin(otherParticle.angle) * otherParticle.distance);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                  ctx.beginPath();
                  ctx.strokeStyle = isDarkMode 
                    ? `rgba(180, 180, 255, ${0.2 * (1 - distance/100)})` 
                    : `rgba(80, 100, 200, ${0.2 * (1 - distance/100)})`;
                  ctx.lineWidth = 0.5;
                  ctx.moveTo(x, y);
                  ctx.lineTo(
                    otherParticle.x + Math.cos(otherParticle.angle) * otherParticle.distance,
                    otherParticle.y + Math.sin(otherParticle.angle) * otherParticle.distance
                  );
                  ctx.stroke();
                }
              });
            });
            
            // Draw central nebula
            const nebulaGradient = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              0,
              canvas.width / 2,
              canvas.height / 2,
              canvas.width * 0.4
            );
            
            if (isDarkMode) {
              nebulaGradient.addColorStop(0, 'rgba(100, 60, 200, 0.3)');
              nebulaGradient.addColorStop(0.5, 'rgba(40, 20, 100, 0.2)');
              nebulaGradient.addColorStop(1, 'transparent');
            } else {
              nebulaGradient.addColorStop(0, 'rgba(150, 180, 255, 0.3)');
              nebulaGradient.addColorStop(0.5, 'rgba(100, 140, 230, 0.2)');
              nebulaGradient.addColorStop(1, 'transparent');
            }
            
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = nebulaGradient;
            ctx.fill();
          };
          
          animate();
          
          // Handle window resize
          window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          });
        }
        
        updateTimerDisplay() {
          const mins = Math.floor(this.remainingSeconds / 60);
          const secs = this.remainingSeconds % 60;
          this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          
          // Update progress bar
          const progressPercent = 100 - (this.remainingSeconds / this.totalSeconds * 100);
          this.progressBar.style.width = `${progressPercent}%`;
        }
        
        startTimer() {
          if (this.isRunning) return;
          
          this.isRunning = true;
          this.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>Running';
          this.startTimerBtn.classList.add('pulse');
          
          this.timerInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
              this.remainingSeconds--;
              this.updateTimerDisplay();
            } else {
              clearInterval(this.timerInterval);
              this.isRunning = false;
              this.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>Start Focus';
              this.startTimerBtn.classList.remove('pulse');
              this.playCompletionSound();
              
              // Show celebration effect
              this.timerDisplay.classList.add('celebrate');
              setTimeout(() => {
                this.timerDisplay.classList.remove('celebrate');
              }, 3000);
            }
          }, 1000);
        }
        
        pauseTimer() {
          clearInterval(this.timerInterval);
          this.isRunning = false;
          this.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>Resume';
          this.startTimerBtn.classList.remove('pulse');
        }
        
        resetTimer() {
          clearInterval(this.timerInterval);
          this.isRunning = false;
          this.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>Start Focus';
          this.startTimerBtn.classList.remove('pulse');
          this.remainingSeconds = this.totalSeconds;
          this.updateTimerDisplay();
        }
        
        setTimerMode(mins) {
          this.minutes = mins;
          this.totalSeconds = this.minutes * 60;
          this.remainingSeconds = this.totalSeconds;
          this.updateTimerDisplay();
        }
        
        startBreathing() {
          if (this.isBreathing) return;
          
          this.isBreathing = true;
          this.breathCycle = 0;
          this.startBreathingBtn.innerHTML = '<i class="fas fa-play"></i>Breathing';
          this.startBreathingBtn.classList.add('pulse');
          
          this.breathingInterval = setInterval(() => {
            this.breathCycle++;
            
            if (this.breathCycle % 2 === 1) {
              // Inhale phase (4 seconds)
              this.breathText.textContent = "Inhale";
              this.breathingCircle.style.transform = "scale(1.5)";
              this.breathingCircle.style.backgroundColor = isDarkMode ? "var(--primary)" : "var(--secondary)";
            } else {
              // Exhale phase (4 seconds)
              this.breathText.textContent = "Exhale";
              this.breathingCircle.style.transform = "scale(1)";
              this.breathingCircle.style.backgroundColor = isDarkMode ? "var(--secondary)" : "var(--primary)";
            }
            
            // Every 8 cycles, suggest a breath hold
            if (this.breathCycle % 8 === 0) {
              setTimeout(() => {
                if (this.isBreathing) {
                  this.breathText.textContent = "Hold";
                  this.breathingCircle.style.transform = "scale(1.2)";
                  this.breathingCircle.style.backgroundColor = "var(--accent)";
                }
              }, 4000);
            }
          }, 8000);
        }
        
        stopBreathing() {
          clearInterval(this.breathingInterval);
          this.isBreathing = false;
          this.startBreathingBtn.innerHTML = '<i class="fas fa-play"></i>Start Session';
          this.startBreathingBtn.classList.remove('pulse');
          this.breathText.textContent = "Ready";
          this.breathingCircle.style.transform = "scale(1)";
          this.breathingCircle.style.backgroundColor = isDarkMode ? "var(--primary)" : "var(--secondary)";
        }
        
        playSound(soundType) {
          // Stop any currently playing sound
          this.stopSound();
          
          // Play the selected sound
          switch(soundType) {
            case 'rain':
              this.currentAudio = this.rainSound;
              break;
            case 'forest':
              this.currentAudio = this.forestSound;
              break;
            case 'waves':
              this.currentAudio = this.wavesSound;
              break;
            case 'fire':
              this.currentAudio = this.fireSound;
              break;
            case 'space':
              this.currentAudio = this.spaceSound;
              break;
          }
          
          if (this.currentAudio) {
            this.currentAudio.volume = this.volumeSlider.value / 100;
            this.currentAudio.play().catch(e => console.log('Audio play failed:', e));
          }
          
          // Update UI to show active sound
          this.soundButtons.forEach(btn => {
            if (btn.dataset.sound === soundType) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
          
          this.currentSound = soundType;
        }
        
        stopSound() {
          // Stop any currently playing audio
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
          }
          
          this.soundButtons.forEach(btn => btn.classList.remove('active'));
          this.currentSound = null;
          this.currentAudio = null;
        }
        
        setVolume(level) {
          this.volumeValue.textContent = `${level}%`;
          // Update volume of currently playing audio
          if (this.currentAudio) {
            this.currentAudio.volume = level / 100;
          }
        }
        
        playCompletionSound() {
          this.completionSound.volume = 0.7;
          this.completionSound.play().catch(e => console.log('Completion sound play failed:', e));
        }
      }
      
      appRef.current = new CosmicFocusApp();
    }

    // Cleanup on component unmount
    return () => {
      if (appRef.current) {
        // Clean up any intervals
        if (appRef.current.timerInterval) clearInterval(appRef.current.timerInterval);
        if (appRef.current.breathingInterval) clearInterval(appRef.current.breathingInterval);
        if (appRef.current.soundInterval) clearInterval(appRef.current.soundInterval);
        
        // Stop any playing audio
        if (appRef.current.currentAudio) {
          appRef.current.currentAudio.pause();
          appRef.current.currentAudio = null;
        }
      }
    };
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`cosmic-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      
      <canvas 
        ref={canvasRef} 
        className="cosmic-canvas"
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
      />

      <div className="container">
        <header>
          <div className="logo">
            <i className="fas fa-brain"></i>
            <span>Cosmic Focus</span>
          </div>
          <button className="theme-switcher" onClick={toggleTheme}>
            <i className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <div className="dashboard">
          {/* Focus Timer Card */}
          <div className="card focus-card">
            <div className="card-header">
              <i className="fas fa-clock"></i>
              <h2>Deep Focus Timer</h2>
            </div>
            <p>Immerse yourself in distraction-free study sessions with our cosmic timer.</p>
            
            <div className="timer-display" id="timer">25:00</div>
            
            <div className="focus-progress">
              <div className="focus-progress-bar" id="progress"></div>
            </div>
            
            <div className="timer-controls">
              <button className="btn btn-primary" id="start-timer">
                <i className="fas fa-play"></i>Start Focus
              </button>
              <button className="btn btn-secondary" id="pause-timer">
                <i className="fas fa-pause"></i>Pause
              </button>
              <button className="btn btn-danger" id="reset-timer">
                <i className="fas fa-redo"></i>Reset
              </button>
            </div>
            
            <div className="presets">
              <button className="preset-btn" data-minutes="25">25 min</button>
              <button className="preset-btn" data-minutes="45">45 min</button>
              <button className="preset-btn" data-minutes="60">60 min</button>
              <button className="preset-btn" data-minutes="90">90 min</button>
            </div>
          </div>

          {/* Breathing Exercises Card */}
          <div className="card breathing-card">
            <div className="card-header">
              <i className="fas fa-wind"></i>
              <h2>Cosmic Breathing</h2>
            </div>
            <p>Sync your breathing with the pulsating cosmic rhythm to center your mind.</p>
            
            <div className="breathing-circle" id="breathing-circle">
              <span id="breath-text">Ready</span>
            </div>
            
            <div className="breathing-controls">
              <button className="btn btn-success" id="start-breathing">
                <i className="fas fa-play"></i>Start Session
              </button>
              <button className="btn btn-danger" id="stop-breathing">
                <i className="fas fa-stop"></i>Stop
              </button>
            </div>
          </div>

          {/* Ambient Sounds Card */}
          <div className="card sounds-card">
            <div className="card-header">
              <i className="fas fa-music"></i>
              <h2>Ambient Soundscape</h2>
            </div>
            <p>Enhance your focus with immersive ambient sound environments.</p>
            
            <div className="sounds-grid">
              <div className="sound-btn" data-sound="rain">
                <i className="fas fa-cloud-rain"></i>
                <span className="sound-name">Cosmic Rain</span>
                <span className="sound-desc">Ethereal rainfall</span>
              </div>
              <div className="sound-btn" data-sound="forest">
                <i className="fas fa-tree"></i>
                <span className="sound-name">Nebula Forest</span>
                <span className="sound-desc">Mystical woodland</span>
              </div>
              <div className="sound-btn" data-sound="waves">
                <i className="fas fa-water"></i>
                <span className="sound-name">Stellar Waves</span>
                <span className="sound-desc">Celestial ocean</span>
              </div>
              <div className="sound-btn" data-sound="fire">
                <i className="fas fa-fire"></i>
                <span className="sound-name">Solar Flare</span>
                <span className="sound-desc">Cosmic energy</span>
              </div>
              <div className="sound-btn" data-sound="space">
                <i className="fas fa-star"></i>
                <span className="sound-name">Deep Space</span>
                <span className="sound-desc">Ethereal ambience</span>
              </div>
            </div>
            
            <div className="volume-control">
              <p>Volume: <span id="volume-value">50%</span></p>
              <input type="range" min="0" max="100" value="50" className="volume-slider" id="volume-slider" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* CSS styles with enhanced 3D effects and animations */
        :root {
          --primary: #8a2be2;
          --primary-glow: #9370db;
          --secondary: #00bcd4;
          --accent: #ff4081;
          --deep-space: #0a0a1a;
          --nebula: #1a1a2e;
          --starlight: #f8fafc;
          --card-bg: rgba(20, 20, 40, 0.6);
          --card-border: rgba(138, 43, 226, 0.4);
        }

        .light-mode {
          --primary: #6a4ca3;
          --primary-glow: #9370db;
          --secondary: #0097a7;
          --accent: #ff5252;
          --deep-space: #f0f2f5;
          --nebula: #e6e9ff;
          --starlight: #1a1a2e;
          --card-bg: rgba(255, 255, 255, 0.8);
          --card-border: rgba(106, 76, 163, 0.4);
        }

        .cosmic-container {
          color: var(--starlight);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          transition: all 0.5s ease;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--card-border);
          animation: fadeInDown 1s ease;
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
          filter: drop-shadow(0 0 15px rgba(138, 43, 226, 0.5));
        }

        .logo i {
          color: var(--primary);
          font-size: 2rem;
          text-shadow: 0 0 10px var(--primary-glow);
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
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .theme-switcher:hover {
          background: rgba(138, 43, 226, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(138, 43, 226, 0.3);
        }

        .dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 2.5rem;
          margin-bottom: 3rem;
        }

        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
          transition: all 0.4s ease;
          border: 1px solid var(--card-border);
          animation: fadeInUp 0.8s ease;
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
        }

        .card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .card:hover {
          transform: translateY(-8px) rotateX(5deg) rotateY(5deg);
          box-shadow: 0 15px 50px rgba(138, 43, 226, 0.35);
        }

        .card:hover::after {
          opacity: 1;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 1.35rem;
          font-weight: 700;
        }

        .focus-card .card-header {
          color: var(--primary);
          text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
        }

        .breathing-card .card-header {
          color: var(--secondary);
          text-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
        }

        .sounds-card .card-header {
          color: var(--accent);
          text-shadow: 0 0 10px rgba(255, 64, 129, 0.5);
        }

        .card-header i {
          font-size: 1.5rem;
          padding: 0.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          text-shadow: none;
        }

        .focus-card .card-header i {
          background: rgba(138, 43, 226, 0.2);
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.4);
        }

        .breathing-card .card-header i {
          background: rgba(0, 188, 212, 0.2);
          box-shadow: 0 0 15px rgba(0, 188, 212, 0.4);
        }

        .sounds-card .card-header i {
          background: rgba(255, 64, 129, 0.2);
          box-shadow: 0 0 15px rgba(255, 64, 129, 0.4);
        }

        .card p {
          color: var(--starlight);
          margin-bottom: 1.5rem;
          line-height: 1.6;
          opacity: 0.8;
        }

        .timer-display {
          font-size: 4rem;
          font-weight: 800;
          text-align: center;
          margin: 2rem 0;
          font-variant-numeric: tabular-nums;
          color: var(--starlight);
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          animation: pulse 2s infinite;
          background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: all 0.5s ease;
        }

        .timer-display.celebrate {
          animation: celebrate 1s ease infinite;
          text-shadow: 0 0 30px var(--accent);
        }

        @keyframes celebrate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        .timer-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .btn {
          padding: 0.9rem 1.75rem;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: 0.5s;
          z-index: 1;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(138, 43, 226, 0.5);
        }

        .btn-primary.pulse {
          animation: buttonPulse 2s infinite;
        }

        @keyframes buttonPulse {
          0% { box-shadow: 0 0 0 0 rgba(138, 43, 226, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(138, 43, 226, 0); }
          100% { box-shadow: 0 0 0 0 rgba(138, 43, 226, 0); }
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--starlight);
          backdrop-filter: blur(10px);
          border: 1px solid var(--card-border);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }

        .btn-success {
          background: linear-gradient(135deg, var(--secondary), #0097a7);
          color: white;
          box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4);
        }

        .btn-success:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 188, 212, 0.5);
        }

        .btn-success.pulse {
          animation: buttonPulseSuccess 2s infinite;
        }

        @keyframes buttonPulseSuccess {
          0% { box-shadow: 0 0 0 0 rgba(0, 188, 212, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 188, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 188, 212, 0); }
        }

        .btn-danger {
          background: linear-gradient(135deg, var(--accent), #c2185b);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 64, 129, 0.4);
        }

        .btn-danger:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(255, 64, 129, 0.5);
        }

        .focus-progress {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin: 2rem 0;
          overflow: hidden;
          position: relative;
        }

        .focus-progress-bar {
          height: 100%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 4px;
          width: 0%;
          transition: width 1s linear;
          box-shadow: 0 0 10px rgba(138, 43, 226, 0.6);
          position: relative;
          overflow: hidden;
        }

        .focus-progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          z-index: 1;
          background-size: 20px 20px;
          animation: move 2s linear infinite;
        }

        @keyframes move {
          0% { background-position: 0 0; }
          100% { background-position: 20px 20px; }
        }

        .breathing-circle {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          margin: 2rem auto;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
          transition: all 4s ease-in-out;
          box-shadow: 0 0 50px rgba(0, 188, 212, 0.5);
          position: relative;
          overflow: hidden;
        }

        .breathing-circle::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          transform: rotate(0deg);
          animation: rotate 10s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .breathing-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .sounds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .sound-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
        }

        .sound-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .sound-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-5px) rotateX(5deg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .sound-btn:hover::before {
          opacity: 1;
        }

        .sound-btn.active {
          background: rgba(138, 43, 226, 0.2);
          border-color: var(--primary);
          transform: translateY(-3px);
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
        }

        .sound-btn i {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .sound-btn:hover i {
          transform: scale(1.2) rotate(10deg);
        }

        .sound-name {
          font-weight: 700;
          font-size: 1rem;
        }

        .sound-desc {
          font-size: 0.85rem;
          color: #94a3b8;
          text-align: center;
        }

        .volume-control {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--card-border);
        }

        .volume-control p {
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .volume-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(138, 43, 226, 0.8);
        }

        .presets {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .preset-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          border-radius: 50px;
          color: var(--starlight);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .preset-btn:hover {
          background: rgba(138, 43, 226, 0.2);
          transform: translateY(-2px);
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }

        /* Responsive design */
        @media (max-width: 768px) {
          .dashboard {
            grid-template-columns: 1fr;
          }
          
          .timer-display {
            font-size: 3rem;
          }
          
          .breathing-circle {
            width: 180px;
            height: 180px;
          }
          
          .timer-controls {
            flex-wrap: wrap;
          }
          
          .presets {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default CosmicFocus;