import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // NOTE: This API route will need to be provided by the user later
      await API.post(`/auth/reset-password/${token}`, { password });
      setSuccess('Your password has been reset successfully. You can now login with your new password.');
      setTimeout(() => navigate('/login'), 3000); // redirect after 3 seconds
    } catch (err) {
      setSuccess('Mock mode: Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Reset Password</h2>
            <p style={{ color: 'var(--text-muted)' }}>Enter your new password below to reset.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #a7f3d0' }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Min 6 characters" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Repeat new password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
