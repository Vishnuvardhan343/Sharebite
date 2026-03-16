import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AboutPage = () => {
  const { user } = useAuth();

  const platformFeatures = [
    { icon: '🧠', title: 'AI-Powered Smart Matching', desc: 'Instantly connects surplus food to the nearest active volunteers to minimize transit time and maximize freshness.' },
    { icon: '📍', title: 'Real-time GPS Tracking', desc: 'Track pickup and delivery routes live. Both donors and NGOs know exactly when the food will arrive.' },
    { icon: '⚡', title: 'Automated Instant Alerts', desc: 'Zero delays. The system automatically dispatches SMS and Email alerts the moment surplus food is posted.' },
    { icon: '🛡️', title: 'Verified Network', desc: 'A secure ecosystem where donors, volunteers, and NGOs undergo verification to ensure safe and reliable food handling.' },
    { icon: '📊', title: 'Impact Analytics', desc: 'Monitor your contribution. Track meals saved, active participants, and overall impact through detailed admin dashboards.' },
    { icon: '🤖', title: '24/7 AI Assistance', desc: 'ShareBot, our integrated chatbot, is available around the clock to guide users and answer platform-related queries instantly.' }
  ];

  return (
    <div style={{ fontFamily: 'var(--font-primary)', background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)', padding: '6rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }} className="animate-fadeUp">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '6px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            🌍 Platform Overview
          </div>
          <h1 style={{ fontSize: '3.5rem', color: 'white', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            The Engine Behind <br/>
            <span style={{ color: '#10b981' }}>Zero Food Waste</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Explore the core features and the intelligent redistribution process that makes Sharebite fast, secure, and highly efficient.
          </p>
        </div>
      </div>

      {/* Core Features Section */}
      <div style={{ padding: '5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>Total Features</h2>
          <div style={{ width: '60px', height: '4px', background: '#10b981', margin: '1rem auto', borderRadius: '2px' }}></div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {platformFeatures.map((f, i) => (
             <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
               <div style={{ fontSize: '2.5rem', background: '#f0fdf4', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', flexShrink: 0 }}>
                 {f.icon}
               </div>
               <div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>{f.title}</h3>
                 <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Process Representation Section */}
      <div style={{ padding: '5rem 3rem', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>How The Redistribution Works</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>Visualizing the journey from surplus to served.</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '3rem', maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
          
          {/* Connector Line (hidden on small screens, visual only) */}
          <div className="process-line" style={{ position: 'absolute', top: '50px', left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)', zIndex: 0 }}></div>

          {[
            { step: '1', title: 'Data Entry', icon: '📝', desc: 'Donor logs the food quantity and type.' },
            { step: '2', title: 'AI Processing', icon: '⚙️', desc: 'Algorithm calculates optimal routes & matches.' },
            { step: '3', title: 'Dispatch', icon: '🚀', desc: 'Volunteers receive actionable push alerts.' },
            { step: '4', title: 'Confirmation', icon: '✅', desc: 'Handover is logged via photos & donor notifications.' }
          ].map((s, idx) => (
            <div key={s.step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px', textAlign: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#064e3b', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}>
                {s.icon}
              </div>
              <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                STEP {s.step}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditional CTA */}
      {!user && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
           <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1.2rem 3.5rem', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
             Sign Up to Get Started
           </Link>
        </div>
      )}

    </div>
  );
};

export default AboutPage;
