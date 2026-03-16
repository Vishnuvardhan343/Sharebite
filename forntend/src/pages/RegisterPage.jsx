import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'donor', phone: '', address: '', organisation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, verifyEmailOTP } = useAuth();

  const handleResendOTP = async () => {
    try {
      setResendDisabled(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      await authAPI.resendEmailOTP({ email: form.email });
      // Toast or notification could be added here
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyEmailOTP(form.email, otp);
      const routes = { donor: 'donor', ngo: 'ngo', volunteer: 'ngo', admin: 'admin' };
      navigate(`/${routes[data.user.role]}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
    setLoading(false);
  };

  const roles = [
    { value: 'donor', label: '🏪 Food Donor', desc: 'Restaurant / Hotel / Home' },
    { value: 'volunteer', label: '🚴 Volunteer', desc: 'Pickup & Deliver' },
    { value: 'ngo', label: '🤝 NGO', desc: 'Distribute to Communities' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.phone) { setError('Please fill all required fields'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    
    // Stricter validations
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone, address: form.address, organisation: form.organisation });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Left side form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', background: 'var(--bg-surface)', overflowY: 'auto' }}>
        <div className="animate-fadeUp" style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}>
          
          {step === 'form' ? (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Join Sharebite</h2>
                <p style={{ color: 'var(--text-muted)' }}>Create your account to start making a difference.</p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Select Your Role *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {roles.map(r => (
                      <div 
                        key={r.value} 
                        onClick={() => setForm({ ...form, role: r.value })} 
                        style={{
                          padding: '12px', 
                          borderRadius: 'var(--radius-md)', 
                          border: `2px solid ${form.role === r.value ? 'var(--color-primary)' : '#e2e8f0'}`,
                          background: form.role === r.value ? 'var(--color-primary-light)' : '#fff', 
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: form.role === r.value ? 'var(--color-primary-dark)' : 'var(--text-main)' }}>{r.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Full Name *</label>
                    <input className="form-control" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Phone *</label>
                    <input className="form-control" placeholder="10-digit number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address *</label>
                  <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                {(form.role === 'ngo' || form.role === 'volunteer') && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Organisation Name</label>
                    <input className="form-control" placeholder="NGO / Organisation name" value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Address</label>
                  <input className="form-control" placeholder="Your area / city" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Password *</label>
                    <input type="password" name="password" className="form-control" placeholder="6+ characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Confirm Password *</label>
                    <input type="password" className="form-control" placeholder="Repeat password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                </p>
              </div>
            </>
          ) : (
            <div className="animate-fadeUp">
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Verify Your Email</h2>
                <p style={{ color: 'var(--text-muted)' }}>We've sent a 6-digit code to <strong>{form.email}</strong></p>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter 6-digit code" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem' }}>
                  {loading ? 'Verifying...' : 'Verify & Complete'}
                </button>
              </form>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Didn't receive the code?{' '}
                  <button 
                    onClick={handleResendOTP} 
                    disabled={resendDisabled} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: resendDisabled ? 'var(--text-muted)' : 'var(--color-primary-dark)', 
                      fontWeight: 600, 
                      cursor: resendDisabled ? 'not-allowed' : 'pointer',
                      padding: 0,
                      fontSize: 'inherit'
                    }}
                  >
                    {resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </p>
                <button 
                  onClick={() => setStep('form')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ← Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side graphical banner */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--deep) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>Join the Movement</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            Whether you want to donate excess food, or help distribute it to people in need, you've come to the right place.
          </p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
