import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const FORMULAS = {
  Physics: [
    {
      topic: 'Kinematics',
      color: '#3b82f6',
      formulas: [
        { name: 'Velocity (uniform acc.)', formula: 'v = u + at' },
        { name: 'Displacement', formula: 's = ut + ½at²' },
        { name: 'Velocity² relation', formula: 'v² = u² + 2as' },
        { name: 'Avg velocity', formula: 'v_avg = (u + v) / 2' },
        { name: 'Projectile Range', formula: 'R = u²sin(2θ) / g' },
        { name: 'Max Height', formula: 'H = u²sin²θ / 2g' },
      ]
    },
    {
      topic: 'Newton\'s Laws & Forces',
      color: '#8b5cf6',
      formulas: [
        { name: 'Newton\'s 2nd Law', formula: 'F = ma' },
        { name: 'Friction (kinetic)', formula: 'f = μₖN' },
        { name: 'Tension (Atwood)', formula: 'T = 2m₁m₂g / (m₁+m₂)' },
        { name: 'Centripetal Force', formula: 'F = mv² / r = mω²r' },
      ]
    },
    {
      topic: 'Work, Energy & Power',
      color: '#f59e0b',
      formulas: [
        { name: 'Work done', formula: 'W = F·d·cosθ' },
        { name: 'Kinetic Energy', formula: 'KE = ½mv²' },
        { name: 'Potential Energy', formula: 'PE = mgh' },
        { name: 'Power', formula: 'P = W/t = F·v' },
        { name: 'Elastic PE (spring)', formula: 'PE = ½kx²' },
      ]
    },
    {
      topic: 'Gravitation',
      color: '#10b981',
      formulas: [
        { name: 'Gravitational Force', formula: 'F = Gm₁m₂ / r²' },
        { name: 'Escape Velocity', formula: 'vₑ = √(2GM/R)' },
        { name: 'Orbital Velocity', formula: 'vₒ = √(GM/r)' },
        { name: 'Time Period (satellite)', formula: 'T = 2π√(r³/GM)' },
        { name: 'Gravitational PE', formula: 'U = -GMm/r' },
      ]
    },
    {
      topic: 'Electrostatics',
      color: '#ec4899',
      formulas: [
        { name: 'Coulomb\'s Law', formula: 'F = kq₁q₂/r² (k=9×10⁹)' },
        { name: 'Electric Field', formula: 'E = F/q = kQ/r²' },
        { name: 'Electric Potential', formula: 'V = kQ/r' },
        { name: 'Capacitance', formula: 'C = Q/V = ε₀A/d' },
        { name: 'Energy in Capacitor', formula: 'U = ½CV² = Q²/2C' },
      ]
    },
    {
      topic: 'Current Electricity',
      color: '#f97316',
      formulas: [
        { name: 'Ohm\'s Law', formula: 'V = IR' },
        { name: 'Power', formula: 'P = VI = I²R = V²/R' },
        { name: 'Resistivity', formula: 'R = ρL/A' },
        { name: 'Kirchhoff\'s KCL', formula: 'ΣI_in = ΣI_out' },
        { name: 'Wheatstone Bridge', formula: 'P/Q = R/S' },
      ]
    },
    {
      topic: 'Optics',
      color: '#06b6d4',
      formulas: [
        { name: 'Snell\'s Law', formula: 'n₁sinθ₁ = n₂sinθ₂' },
        { name: 'Mirror Formula', formula: '1/f = 1/v + 1/u' },
        { name: 'Lens Formula', formula: '1/f = 1/v - 1/u' },
        { name: 'Magnification', formula: 'm = -v/u (mirror), v/u (lens)' },
        { name: 'Critical Angle', formula: 'sinC = 1/n' },
      ]
    },
    {
      topic: 'Modern Physics',
      color: '#84cc16',
      formulas: [
        { name: 'Photon Energy', formula: 'E = hf = hc/λ' },
        { name: 'De Broglie Wavelength', formula: 'λ = h/mv = h/p' },
        { name: 'Photoelectric', formula: 'KE_max = hf - φ' },
        { name: 'Bohr Radius (n)', formula: 'rₙ = 0.529n²/Z Å' },
        { name: 'Energy Level', formula: 'Eₙ = -13.6Z²/n² eV' },
        { name: 'Radioactive Decay', formula: 'N = N₀e^(-λt)' },
        { name: 'Half Life', formula: 'T½ = 0.693/λ' },
      ]
    },
  ],
  Chemistry: [
    {
      topic: 'Mole Concept',
      color: '#22c55e',
      formulas: [
        { name: 'Moles', formula: 'n = mass(g) / Molar Mass' },
        { name: 'Avogadro', formula: 'N = n × 6.022×10²³' },
        { name: 'Molarity', formula: 'M = moles of solute / L of solution' },
        { name: 'Molality', formula: 'm = moles of solute / kg of solvent' },
        { name: 'Mole Fraction', formula: 'χ_A = n_A / (n_A + n_B)' },
      ]
    },
    {
      topic: 'Gas Laws',
      color: '#3b82f6',
      formulas: [
        { name: 'Ideal Gas Law', formula: 'PV = nRT  (R = 8.314 J/mol·K)' },
        { name: 'Boyle\'s Law', formula: 'P₁V₁ = P₂V₂  (const T)' },
        { name: 'Charles\' Law', formula: 'V₁/T₁ = V₂/T₂  (const P)' },
        { name: 'Combined Gas', formula: 'P₁V₁/T₁ = P₂V₂/T₂' },
        { name: 'Graham\'s Law', formula: 'r₁/r₂ = √(M₂/M₁)' },
        { name: 'Van der Waals', formula: '(P + an²/V²)(V-nb) = nRT' },
      ]
    },
    {
      topic: 'Thermodynamics',
      color: '#f59e0b',
      formulas: [
        { name: '1st Law', formula: 'ΔU = q + w' },
        { name: 'Enthalpy', formula: 'ΔH = ΔU + ΔnRT' },
        { name: 'Entropy (isothermal)', formula: 'ΔS = q_rev / T' },
        { name: 'Gibbs Energy', formula: 'ΔG = ΔH - TΔS' },
        { name: 'Spontaneity', formula: 'ΔG < 0 → spontaneous' },
        { name: 'Hess\'s Law', formula: 'ΔH_rxn = ΣΔHf(products) - ΣΔHf(reactants)' },
      ]
    },
    {
      topic: 'Chemical Equilibrium',
      color: '#ec4899',
      formulas: [
        { name: 'Equilibrium Constant', formula: 'Kc = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ' },
        { name: 'Kp and Kc', formula: 'Kp = Kc(RT)^Δn' },
        { name: 'Reaction Quotient', formula: 'Q < Kc → forward; Q > Kc → reverse' },
        { name: 'Solubility Product', formula: 'Ksp = [M^m+]ᵐ[X^n-]ⁿ' },
      ]
    },
    {
      topic: 'Electrochemistry',
      color: '#8b5cf6',
      formulas: [
        { name: 'Nernst Equation', formula: 'E = E° - (RT/nF)lnQ' },
        { name: 'Nernst (25°C)', formula: 'E = E° - (0.0592/n)logQ' },
        { name: 'ΔG and EMF', formula: 'ΔG = -nFE' },
        { name: 'Faraday\'s 1st Law', formula: 'w = ZIt = (M/nF) × It' },
        { name: 'Kohlrausch\'s Law', formula: 'Λm = Λ°m - K√C' },
      ]
    },
    {
      topic: 'Organic Chemistry',
      color: '#f97316',
      formulas: [
        { name: 'Degree of Unsat.', formula: 'DBE = (2C + 2 + N - H - X) / 2' },
        { name: 'Markovnikov\'s Rule', formula: 'H adds to C with more H (HX addition)' },
        { name: 'Nucleophilicity', formula: 'F⁻ < Cl⁻ < Br⁻ < I⁻ (polar protic solvent)' },
        { name: 'Tollen\'s Test', formula: 'Aldehyde → Silver mirror (Ag)' },
        { name: 'Fehling\'s Test', formula: 'Reducing sugar → Red ppt (Cu₂O)' },
      ]
    },
  ],
  Maths: [
    {
      topic: 'Quadratic Equations',
      color: '#f97316',
      formulas: [
        { name: 'Quadratic Formula', formula: 'x = (-b ± √(b²-4ac)) / 2a' },
        { name: 'Sum of Roots', formula: 'α + β = -b/a' },
        { name: 'Product of Roots', formula: 'αβ = c/a' },
        { name: 'Nature (Discriminant)', formula: 'D = b²-4ac; D>0 real, D=0 equal, D<0 complex' },
      ]
    },
    {
      topic: 'Sequences & Series',
      color: '#3b82f6',
      formulas: [
        { name: 'AP nth term', formula: 'aₙ = a + (n-1)d' },
        { name: 'AP Sum', formula: 'Sₙ = n/2 [2a + (n-1)d]' },
        { name: 'GP nth term', formula: 'aₙ = arⁿ⁻¹' },
        { name: 'GP Sum (finite)', formula: 'Sₙ = a(rⁿ-1)/(r-1)' },
        { name: 'GP Sum (infinite)', formula: 'S∞ = a/(1-r)  |r|<1' },
        { name: 'Sum of Squares', formula: 'Σn² = n(n+1)(2n+1)/6' },
        { name: 'Sum of Cubes', formula: 'Σn³ = [n(n+1)/2]²' },
      ]
    },
    {
      topic: 'Trigonometry',
      color: '#10b981',
      formulas: [
        { name: 'sin²θ + cos²θ', formula: '= 1' },
        { name: '1 + tan²θ', formula: '= sec²θ' },
        { name: '1 + cot²θ', formula: '= cosec²θ' },
        { name: 'sin(A±B)', formula: 'sinAcosB ± cosAsinB' },
        { name: 'cos(A±B)', formula: 'cosAcosB ∓ sinAsinB' },
        { name: 'tan(A+B)', formula: '(tanA+tanB)/(1-tanAtanB)' },
        { name: 'sin2A', formula: '2sinAcosA' },
        { name: 'cos2A', formula: 'cos²A - sin²A = 1-2sin²A' },
      ]
    },
    {
      topic: 'Calculus — Differentiation',
      color: '#8b5cf6',
      formulas: [
        { name: 'd/dx(xⁿ)', formula: 'nxⁿ⁻¹' },
        { name: 'd/dx(eˣ)', formula: 'eˣ' },
        { name: 'd/dx(ln x)', formula: '1/x' },
        { name: 'd/dx(sinx)', formula: 'cosx' },
        { name: 'd/dx(cosx)', formula: '-sinx' },
        { name: 'd/dx(tanx)', formula: 'sec²x' },
        { name: 'Product Rule', formula: 'd(uv)/dx = u·v\' + v·u\'' },
        { name: 'Chain Rule', formula: 'dy/dx = (dy/du)·(du/dx)' },
      ]
    },
    {
      topic: 'Calculus — Integration',
      color: '#ec4899',
      formulas: [
        { name: '∫xⁿ dx', formula: 'xⁿ⁺¹/(n+1) + C' },
        { name: '∫eˣ dx', formula: 'eˣ + C' },
        { name: '∫(1/x) dx', formula: 'ln|x| + C' },
        { name: '∫sinx dx', formula: '-cosx + C' },
        { name: '∫cosx dx', formula: 'sinx + C' },
        { name: '∫sec²x dx', formula: 'tanx + C' },
        { name: 'Integration by Parts', formula: '∫u·dv = uv - ∫v·du' },
      ]
    },
    {
      topic: 'Vectors & 3D Geometry',
      color: '#f59e0b',
      formulas: [
        { name: 'Dot Product', formula: 'a·b = |a||b|cosθ' },
        { name: 'Cross Product Magnitude', formula: '|a×b| = |a||b|sinθ' },
        { name: 'Unit Vector', formula: 'â = a / |a|' },
        { name: 'Distance formula (3D)', formula: '√[(x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²]' },
        { name: 'Equation of line', formula: '(x-x₁)/l = (y-y₁)/m = (z-z₁)/n' },
        { name: 'Plane equation', formula: 'ax + by + cz = d' },
      ]
    },
    {
      topic: 'Probability',
      color: '#06b6d4',
      formulas: [
        { name: 'Probability', formula: 'P(A) = favourable / total outcomes' },
        { name: 'Complement', formula: 'P(A\') = 1 - P(A)' },
        { name: 'Addition Rule', formula: 'P(A∪B) = P(A)+P(B)-P(A∩B)' },
        { name: 'Conditional', formula: 'P(A|B) = P(A∩B)/P(B)' },
        { name: 'Bayes\' Theorem', formula: 'P(A|B) = P(B|A)P(A) / P(B)' },
        { name: 'Binomial Distribution', formula: 'P(X=r) = ⁿCᵣ·pʳ·(1-p)ⁿ⁻ʳ' },
      ]
    },
    {
      topic: 'Matrices & Determinants',
      color: '#84cc16',
      formulas: [
        { name: 'Det (2×2)', formula: '|A| = ad - bc' },
        { name: 'Inverse (2×2)', formula: 'A⁻¹ = (1/|A|)·adj(A)' },
        { name: 'Properties', formula: '|AB| = |A|·|B|' },
        { name: 'Rank condition', formula: 'Unique sol: |A| ≠ 0' },
        { name: 'Cramer\'s Rule', formula: 'x = Dₓ/D, y = Dᵧ/D' },
      ]
    },
  ]
};

const FormulasPage = () => {
  const router = useRouter();
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [search, setSearch] = useState('');
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const filtered = FORMULAS[activeSubject].map(section => ({
    ...section,
    formulas: section.formulas.filter(f =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.formula.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(s => s.formulas.length > 0);

  return (
    <>
      <Head>
        <title>Formula Library | JEE Solver</title>
        <meta name="description" content="Quick-reference formula cheat sheets for JEE Mains - Physics, Chemistry and Maths." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="page">
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <i className="fas fa-arrow-left"></i> Dashboard
          </button>
          <div className="header-center">
            <i className="fas fa-book-open" style={{ color: '#f59e0b', marginRight: '0.5rem' }}></i>
            <span className="title">Formula Library</span>
          </div>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search formulas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="tabs">
          {Object.keys(FORMULAS).map(sub => (
            <button
              key={sub}
              className={`tab ${activeSubject === sub ? 'active' : ''}`}
              onClick={() => setActiveSubject(sub)}
            >
              {sub === 'Physics' && <i className="fas fa-atom" style={{ marginRight: '0.4rem' }}></i>}
              {sub === 'Chemistry' && <i className="fas fa-flask" style={{ marginRight: '0.4rem' }}></i>}
              {sub === 'Maths' && <i className="fas fa-square-root-alt" style={{ marginRight: '0.4rem' }}></i>}
              {sub}
            </button>
          ))}
        </div>

        {/* Formula Sections */}
        <div className="sections">
          {filtered.map(section => (
            <div className="section-card" key={section.topic} style={{ borderLeft: `4px solid ${section.color}` }}>
              <button
                className="section-header"
                onClick={() => toggleTopic(section.topic)}
                style={{ color: section.color }}
              >
                <span>{section.topic}</span>
                <i className={`fas fa-chevron-${expandedTopics[section.topic] === false ? 'down' : 'up'}`}></i>
              </button>

              {expandedTopics[section.topic] !== false && (
                <div className="formula-grid">
                  {section.formulas.map((f, i) => (
                    <div className="formula-item" key={i}>
                      <div className="formula-name">{f.name}</div>
                      <div className="formula-value" style={{ color: section.color }}>
                        {f.formula}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">
              <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.4 }}></i>
              <p>No formulas found for "{search}"</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          font-family: 'Inter', sans-serif;
          padding: 1.5rem;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .back-btn {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: #93c5fd;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .back-btn:hover { background: rgba(59,130,246,0.15); transform: translateX(-3px); }
        .header-center {
          display: flex;
          align-items: center;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          color: #94a3b8;
        }
        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 0.9rem;
          width: 200px;
        }
        .tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .tab {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 0.7rem 1.5rem;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        .tab.active {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(59,130,246,0.35);
        }
        .sections { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .section-card:hover { background: rgba(255,255,255,0.06); }
        .section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.1rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 700;
          text-align: left;
        }
        .formula-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.75rem;
          padding: 0 1.5rem 1.5rem;
        }
        .formula-item {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(255,255,255,0.06);
          transition: transform 0.2s;
        }
        .formula-item:hover { transform: translateY(-2px); }
        .formula-name {
          font-size: 0.78rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
          font-weight: 600;
        }
        .formula-value {
          font-size: 1rem;
          font-family: 'Courier New', monospace;
          font-weight: 700;
          word-break: break-all;
        }
        .empty {
          text-align: center;
          padding: 4rem;
          color: #475569;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @media (max-width: 600px) {
          .header { flex-direction: column; align-items: flex-start; }
          .search-box input { width: 130px; }
        }
      `}</style>
    </>
  );
};

export default FormulasPage;
