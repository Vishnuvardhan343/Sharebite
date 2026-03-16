import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setEmailError('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPasswordSendOtp({ email });
      toast.success(res.data.message || 'OTP sent to your email!');
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to send OTP';
      if (status === 404) {
        setEmailError('not_registered'); // special flag to show register prompt
      } else {
        toast.error(msg);
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setOtpError('Please enter the full 6-digit OTP'); return; }
    setOtpError('');
    setLoading(true);
    try {
      await authAPI.verifyOtp({ email, otp });
      toast.success('OTP verified! Set your new password.');
      setOtpError('');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setOtpError(msg);
      setOtp(''); // clear the wrong entry so user re-types
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await authAPI.resetPasswordWithOtp({ email, otp, newPassword });
      toast.success(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
      // If OTP expired or invalid, server will tell us. We can potentially send them back to step 2 or 1.
      if (err.response?.data?.message?.includes('expired') || err.response?.data?.message?.includes('Invalid')) {
        setStep(2);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{step === 1 ? '🔐' : step === 2 ? '✉️' : '✨'}</div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 800 }}>
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'New Password'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {step === 1 ? "Enter your email address and we'll send a 6-digit OTP." : 
               step === 2 ? `Enter the 6-digit OTP sent to ${email}` : 
               "Create a strong, new password for your account."}
            </p>
          </div>

          {/* Form Content Based on Step */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  style={{
                    borderColor: emailError ? '#ef4444' : undefined,
                    boxShadow: emailError ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined
                  }}
                  required
                />
                {emailError === 'not_registered' && (
                  <div style={{
                    marginTop: '10px',
                    background: '#fef2f2',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{ color: '#b91c1c', fontWeight: 700, marginBottom: '4px' }}>❌ Email not registered</div>
                    <div style={{ color: '#7f1d1d' }}>
                      This email doesn't have an account.{' '}
                      <Link to="/register" style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'underline' }}>
                        Register here →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', fontSize: '1.05rem' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>6-Digit OTP</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={e => { setOtp(e.target.value); setOtpError(''); }} 
                  maxLength={6}
                  style={{ 
                    textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700,
                    borderColor: otpError ? '#ef4444' : undefined,
                    boxShadow: otpError ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined
                  }}
                  required
                />
                {otpError && (
                  <div style={{ 
                    marginTop: '10px',
                    background: '#fef2f2', 
                    color: '#b91c1c', 
                    padding: '10px 14px', 
                    borderRadius: '10px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ❌ {otpError}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', fontSize: '1.05rem' }}>
                {loading ? 'Verifying...' : 'Continue'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => { setStep(1); setOtpError(''); setOtp(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  Didn't receive it? Change email
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="At least 6 characters" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', fontSize: '1.05rem' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 600 }}>
              ← Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
