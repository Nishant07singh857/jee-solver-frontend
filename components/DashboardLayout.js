import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import VoiceMentor from './VoiceMentor';

// Generate last 91 days (13 weeks) of dates
const getLast91Days = () => {
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

const HeatmapWidget = ({ quizDates }) => {
  const days = getLast91Days();
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count quizzes per day
  const counts = {};
  (quizDates || []).forEach(d => {
    const key = d.split('T')[0];
    counts[key] = (counts[key] || 0) + 1;
  });

  const getColor = (count) => {
    if (!count) return 'rgba(255,255,255,0.05)';
    if (count >= 5) return '#22c55e';
    if (count >= 3) return '#4ade80';
    if (count >= 2) return '#86efac';
    return '#bbf7d0';
  };

  // Pad start of grid to correct weekday
  const firstDay = new Date(days[0]).getDay();
  const paddedDays = [...Array(firstDay).fill(null), ...days];

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
        {['Mon', 'Wed', 'Fri'].map(d => (
          <div key={d} style={{ width: '11px', fontSize: '8px', color: '#64748b', marginRight: '10px' }}>{d}</div>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(13, 1fr)',
        gap: '3px'
      }}>
        {Array.from({ length: 13 }).map((_, week) => (
          <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {Array.from({ length: 7 }).map((_, dow) => {
              const idx = week * 7 + dow;
              const date = paddedDays[idx];
              const count = date ? (counts[date] || 0) : 0;
              return (
                <div
                  key={dow}
                  title={date ? `${date}: ${count} quiz${count !== 1 ? 'zes' : ''}` : ''}
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '2px',
                    background: date ? getColor(count) : 'transparent',
                    transition: 'transform 0.1s',
                    cursor: date ? 'pointer' : 'default',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
        <span>Less</span>
        {['rgba(255,255,255,0.05)', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'].map(c => (
          <div key={c} style={{ width: '11px', height: '11px', borderRadius: '2px', background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

const DashboardLayout = ({ 
    canvasRef, 
    error, 
    setError, 
    stats, 
    handleCardClick, 
    handleLogout,
    quizDates
}) => {
    const safeStyles = styles || {};

    return (
        <>
            <canvas 
                id="animation-canvas" 
                ref={canvasRef} 
                className={safeStyles.canvas || ''}
            ></canvas>
            
            <div className={safeStyles.container || ''}>
                {error && (
                    <div className={safeStyles.errorBanner || ''}>
                        <p>Error: {error}</p>
                        <button onClick={() => setError(null)} className={safeStyles.dismissButton || ''}>
                            Dismiss
                        </button>
                    </div>
                )}
                
                <nav className={safeStyles.nav || ''}>
                    <div className={safeStyles.logo || ''}>
                        <i className={`fas fa-brain ${safeStyles.logoIcon || ''}`}></i>
                        <span>AI Analytics</span>
                    </div>
                    <div className={safeStyles.navButtons || ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', padding: '8px 16px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(245,158,11,0.3)', fontWeight: '900', color: '#78350f', marginRight: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🪙</span>
                            <span>{stats?.jeeCoins || 0} Coins</span>
                        </div>
                        <div className={safeStyles.navBtn || ''}>
                            <i className="fas fa-user"></i>
                        </div>
                        <div className={`${safeStyles.navBtn || ''} ${safeStyles.navBtnLogout || ''}`} onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                    </div>
                </nav>
                
                <header className={safeStyles.header || ''}>
                    <h1 className={safeStyles.headerTitle || ''}>Your Dashboard</h1>
                    <p className={safeStyles.subtitle || ''}>Welcome back. Let's conquer your goals for today.</p>
                </header>
                
                <section className={safeStyles.statsSection || ''}>
                    <h2 className={safeStyles.statsTitle || ''}>
                        <i className="fas fa-chart-line"></i>
                        Today's Stats
                    </h2>
                    <div className={safeStyles.statsGrid || ''}>
                        <div className={safeStyles.statCard || ''}>
                            <div className={safeStyles.statIconGreen || ''}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <h3 className={safeStyles.statCardTitle || ''}>Problems Solved</h3>
                                <p className={safeStyles.statCardValue || ''}>{stats.problemsSolved}</p>
                            </div>
                        </div>
                        
                        <div className={safeStyles.statCard || ''}>
                            <div className={safeStyles.statIconYellow || ''}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div>
                                <h3 className={safeStyles.statCardTitle || ''}>Time Focused</h3>
                                <p className={safeStyles.statCardValue || ''}>{stats.timeFocused}</p>
                            </div>
                        </div>
                        
                        <div className={safeStyles.statCard || ''}>
                            <div className={safeStyles.statIconCyan || ''}>
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <div>
                                <h3 className={safeStyles.statCardTitle || ''}>Accuracy</h3>
                                <p className={safeStyles.statCardValue || ''}>{stats.accuracy}</p>
                            </div>
                        </div>
                    </div>
                </section>


                <div className={safeStyles.dashboardGrid || ''}>
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardBlue || ''}`} onClick={() => handleCardClick('solve')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-camera"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>Photo Doubt Solver</h2>
                        <p className={safeStyles.cardDescription || ''}>Snap a picture of any problem and get an instant, step-by-step AI solution.</p>
                        <div className={safeStyles.cardCta || ''}>Try it now →</div>
                    </div>

                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardPurple || ''}`} onClick={() => handleCardClick('examiner')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-search-plus"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>AI Step-by-Step Examiner</h2>
                        <p className={safeStyles.cardDescription || ''}>Upload your attempted handwritten solution and find your exact mistake.</p>
                        <div className={safeStyles.cardCta || ''}>Check attempt →</div>
                    </div>
                    
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardGreen || ''}`} onClick={() => handleCardClick('practice')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-book-open"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>Start Practice</h2>
                        <p className={safeStyles.cardDescription || ''}>Access PYQs, Model Papers, and an infinite bank of AI-generated questions.</p>
                        <div className={safeStyles.cardCta || ''}>Practice now →</div>
                    </div>
                    
                    {/* NTA MOCK TEST CARD */}
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardRed || ''}`} onClick={() => handleCardClick('mock-test')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-bullseye"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>
                            NTA Mock Test
                            <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', marginLeft: '8px', verticalAlign: 'middle', textTransform: 'none' }}>75 Qs</span>
                        </h2>
                        <p className={safeStyles.cardDescription || ''}>Experience the exact NTA UI for JEE Main. Get instant Expected Percentile & AIR prediction!</p>
                        <div className={safeStyles.cardCta || ''}>Start Mock Test →</div>
                    </div>
                    
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardYellow || ''}`} onClick={() => handleCardClick('progress')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-chart-bar"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>View Progress</h2>
                        <p className={safeStyles.cardDescription || ''}>Track your performance with heatmaps, analytics, and topper benchmarks.</p>
                        <div className={safeStyles.cardCta || ''}>View stats →</div>
                    </div>
                    
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardPurple || ''}`} onClick={() => handleCardClick('assessment')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-brain"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>AI Assessment</h2>
                        <p className={safeStyles.cardDescription || ''}>Get intelligent step-wise scoring and feedback on your mock tests.</p>
                        <div className={safeStyles.cardCta || ''}>Assess now →</div>
                    </div>
                    
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardRed || ''}`} onClick={() => handleCardClick('revision?tab=mistakes')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-magic"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>Mistake Bank 🧠</h2>
                        <p className={safeStyles.cardDescription || ''}>Revise your wrong answers using spaced repetition. Auto-scheduled 3, 7 & 14 days later.</p>
                        <div className={safeStyles.cardCta || ''}>Revise now →</div>
                    </div>

                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardPurple || ''}`} onClick={() => handleCardClick('battle')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-swords">⚔️</i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>1v1 Ranked Battle</h2>
                        <p className={safeStyles.cardDescription || ''}>Compete in real-time quiz battles with other students. Win points and climb the leaderboard!</p>
                        <div className={safeStyles.cardCta || ''}>Find Match →</div>
                    </div>
                    
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardCyan || ''}`} onClick={() => handleCardClick('wellness')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-wind"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>Wellness Mode</h2>
                        <p className={safeStyles.cardDescription || ''}>Use focus timers and breathing guides to manage stress and study effectively.</p>
                        <div className={safeStyles.cardCta || ''}>Relax now →</div>
                    </div>

                    {/* Formula Library card */}
                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardYellow || ''}`} onClick={() => handleCardClick('formulas')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-square-root-alt"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>Formula Library</h2>
                        <p className={safeStyles.cardDescription || ''}>Quick-reference cheat sheets for all Physics, Chemistry & Maths formulas. Search instantly.</p>
                        <div className={safeStyles.cardCta || ''}>View formulas →</div>
                    </div>

                    <div className={`${safeStyles.dashboardCard || ''} ${safeStyles.cardYellow || ''}`} onClick={() => handleCardClick('leaderboard')}>
                        <div className={safeStyles.cardIcon || ''}>
                            <i className="fas fa-trophy"></i>
                        </div>
                        <h2 className={safeStyles.cardTitle || ''}>🏆 Leaderboard</h2>
                        <p className={safeStyles.cardDescription || ''}>See top JEE warriors ranked by JEE Coins. Win battles and climb to the top!</p>
                        <div className={safeStyles.cardCta || ''}>View rankings →</div>
                    </div>
                </div>
                
                <footer className={safeStyles.footer || ''}>
                    <p>© 2025 NISHANT SINGH RAGHUVANSHI</p>
                </footer>
            </div>
            <VoiceMentor />
        </>
    );
};

export default DashboardLayout;