import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const LandingPage = () => {
  const [dynamicStats, setDynamicStats] = useState(null);

  useEffect(() => {
    API.get('/public/stats')
      .then(res => setDynamicStats(res.data.stats))
      .catch(console.error);
  }, []);

  const stats = [
    { icon:'🍽️', value: dynamicStats ? `${dynamicStats.mealsSaved ?? 0}+` : '...', label:'Meals Saved' },
    { icon:'🏪', value: dynamicStats ? `${dynamicStats.activeDonors ?? 0}+` : '...', label:'Active Donors' },
    { icon:'🤝', value: dynamicStats ? `${dynamicStats.ngoPartners ?? 0}+` : '...', label:'NGO Partners' },
    { icon:'👥', value: dynamicStats ? `${dynamicStats.volunteers ?? 0}+` : '...', label:'Volunteers' },
  ];

  const features = [
    { icon:'🧠', title:'AI Smart Matching',  desc:'Location-based algorithms instantly connect donors with the nearest active NGO or volunteer for fastest pickup.' },
    { icon:'⚡', title:'Real-time Alerts',    desc:'Instant cross-platform notifications ensure rapid response and zero delays in targeted food redistribution.' },
    { icon:'📍', title:'Live Tracking',       desc:'Monitor every pickup and delivery on a live map with precise distance calculations and dynamic ETA updates.' },
    { icon:'📊', title:'Impact Analytics',    desc:'Comprehensive admin dashboards to monitor food saved, user activity, and evaluate overall platform performance.' },
    { icon:'🔐', title:'Secure Access',       desc:'Enterprise-grade role-based access for Donors, NGOs, Volunteers and Admins with robust JWT authentication.' },
    { icon:'🤖', title:'Smart Assistance',    desc:'24/7 AI-powered guides available on every page to answer queries and streamline the user journey instantly.' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-primary)' }}>
      {/* Hero Section */}
      <div style={{
        background:'linear-gradient(135deg, var(--deep) 0%, #064e3b 50%, #022c22 100%)',
        padding:'120px 48px 100px', textAlign:'center', position:'relative', overflow:'hidden'
      }}>
        {/* Background Decorative Elements */}
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 10% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)', zIndex: 0 }}/>
        <div className="pulse-animation" style={{ position: 'absolute', top: '15%', left: '8%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
        <div className="pulse-animation" style={{ position: 'absolute', bottom: '15%', right: '8%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '50%', filter: 'blur(50px)', animationDelay: '2s', zIndex: 0 }} />
        
        <div className="animate-fadeUp" style={{ position:'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display:'inline-flex', alignItems: 'center', gap: '8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', color:'var(--color-primary)', padding:'8px 20px', borderRadius: '30px', fontSize: '0.8rem', fontWeight:800, letterSpacing: '1.5px', textTransform:'uppercase', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '1rem' }}>🌱</span> AI-Powered Food Waste Redistribution
          </div>
          <h1 style={{ fontSize: '4.5rem', color:'#fff', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-2px', fontWeight: 800 }}>
            Turn Surplus Food<br/><span style={{ background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--accent-blue) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Into Hope</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color:'rgba(255,255,255,0.8)', maxWidth: '650px', margin:'0 auto 3rem', lineHeight: 1.6, fontWeight: 400 }}>
            Sharebite seamlessly connects restaurants, hotels, and households with NGOs and volunteers to redistribute surplus food — <strong style={{ color: 'white' }}>powered by AI exclusively for speed, precision, and efficiency.</strong>
          </p>
          <div style={{ display:'flex', gap: '1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ padding:'1.25rem 2.5rem', fontSize: '1.1rem', fontWeight: 800, textDecoration:'none', borderRadius: 'var(--radius-full)', boxShadow:'0 10px 30px rgba(16,185,129,0.3)', transition: 'all var(--transition-fast)' }}>
              Start Donating Free →
            </Link>
            <Link to="/login" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'1.25rem 2.5rem', borderRadius: 'var(--radius-full)', fontSize: '1.1rem', fontWeight: 700, textDecoration:'none', transition: 'all var(--transition-fast)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
              NGO / Volunteer Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background:'linear-gradient(90deg, var(--color-primary-dark) 0%, var(--forest) 50%, var(--deep) 100%)', padding:'4rem 3rem', display:'flex', justifyContent:'center', gap: '5rem', flexWrap:'wrap', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative', zIndex: 2 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="animate-fadeUp" style={{ textAlign:'center', color:'#fff', animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '2.5rem', fontWeight:800, fontFamily:"'Outfit', sans-serif", letterSpacing: '-1px' }}>{s.value}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, mt: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ padding:'6rem 3rem', textAlign:'center', background: 'var(--bg-main)' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color:'var(--deep)', fontWeight: 800, letterSpacing: '-1px' }}>How Sharebite Works</h2>
        <p style={{ color:'var(--text-muted)', marginBottom: '4rem', fontSize: '1.1rem' }}>Three simple steps to significantly reduce global food waste</p>
        
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap: '2rem', maxWidth: '1100px', margin:'0 auto' }}>
          {[
            { step:'01', icon:'📸', title:'Donors Post Food', desc:'Restaurants and households seamlessly upload surplus food details — including exact quantity, culinary type, pickup location, and critical expiry time.' },
            { step:'02', icon:'🤖', title:'AI Smart Matching', desc:'Our proprietary matching engine instantly identifies the nearest NGO or volunteer network and dispatches automated SMS and email alerts.' },
            { step:'03', icon:'🚀', title:'Rapid Delivery', desc:'Dedicated volunteers pick up and distribute pristine food directly to communities in need, with every step tracked in real-time.' },
          ].map((item, i) => (
            <div key={item.step} className="card marker-hover" style={{ position:'relative', overflow:'hidden', padding: '3rem 2rem', border: 'none', boxShadow: 'var(--shadow-md)', transition: 'all var(--transition-fast)' }}>
              <div style={{ position:'absolute', top: '-10px', right: '-10px', fontSize: '6rem', fontWeight: 900, color:'var(--bg-main)', opacity: 0.5, fontFamily:"'Outfit', sans-serif", lineHeight: 1 }}>{item.step}</div>
              <div style={{ width: '80px', height: '80px', background: 'var(--color-primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1.5rem', margin: '0 auto', boxShadow: '0 10px 20px rgba(16,185,129,0.1)' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color:'var(--deep)', fontWeight: 800 }}>{item.title}</h3>
              <p style={{ color:'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ background:'var(--forest)', padding:'6rem 3rem' }}>
        <div style={{ textAlign:'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', color:'#fff', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Enterprise-Grade Features</h2>
          <p style={{ color:'var(--color-primary)', fontSize: '1.1rem', fontWeight: 500 }}>Comprehensive, state-of-the-art tools for efficient food distribution</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', maxWidth: '1200px', margin:'0 auto' }}>
          {features.map((f, i) => (
            <div key={f.title} className="marker-hover" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', padding: '2rem', backdropFilter: 'blur(10px)', transition: 'transform var(--transition-fast), background 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h4 style={{ fontSize: '1.15rem', color:'#fff', marginBottom: '0.75rem', fontWeight: 700 }}>{f.title}</h4>
              <p style={{ fontSize: '0.95rem', color:'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'6rem 3rem', textAlign:'center', background: 'radial-gradient(circle at 50% 50%, white 0%, var(--bg-main) 100%)' }}>
        <h2 style={{ fontSize: '3rem', color:'var(--deep)', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-1px' }}>Ready to Fight Food Waste?</h2>
        <p style={{ color:'var(--text-muted)', marginBottom: '3rem', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}>Join hundreds of top-tier donors, elite volunteers, and transformative NGOs orchestrating real change.</p>
        <div style={{ display:'flex', gap: '1rem', justifyContent:'center', flexWrap:'wrap' }}>
          {[['🏪 Register as Donor','register'],['🤝 Register as NGO','register'],['🚴 Join as Volunteer','register']].map(([label,path])=>(
            <Link key={label} to={`/${path}`} className="btn-primary" style={{ textDecoration:'none', padding:'1rem 2rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'var(--deep)', padding:'2rem 3rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: '1rem' }}>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 500 }}>
          <span style={{ color: 'var(--color-primary)' }}>🌱</span> Sharebite — Kamala Institute of Technology & Science, Batch A2
        </div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
          Team: <span style={{ color: 'rgba(255,255,255,0.7)' }}>Aluguri Pranavi</span> · <span style={{ color: 'rgba(255,255,255,0.7)' }}>Soleti Shiva</span> · <span style={{ color: 'rgba(255,255,255,0.7)' }}>Mattela Vishnu</span> · <span style={{ color: 'rgba(255,255,255,0.7)' }}>Eppa Sai Chandan</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
