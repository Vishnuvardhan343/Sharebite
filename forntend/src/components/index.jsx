import React from 'react';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from './CountdownTimer';
import HandoverModal from './HandoverModal';

// ── Loader ──────────────────────────────────────────────────
export const Loader = ({ text = "Loading..." }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--foam)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <p style={{ marginTop: '16px', color: 'var(--muted)', fontWeight: 500 }}>{text}</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Empty State ─────────────────────────────────────────────
export const EmptyState = ({ icon, title, message, action }) => (
  <div className="card" style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
    <h3 style={{ fontSize: '20px', color: 'var(--forest)', marginBottom: '8px' }}>{title}</h3>
    <p style={{ color: 'var(--muted)', marginBottom: action ? '24px' : '0', maxWidth: '400px' }}>{message}</p>
    {action && <div>{action}</div>}
  </div>
);

// ── Stat Card ───────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color = 'var(--primary)' }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--forest)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

// ── Donation Card ───────────────────────────────────────────
export const DonationCard = ({ donation: initialDonation, viewAs = 'donor', onAccept }) => {
  const { user } = useAuth();
  const [donation, setDonation] = React.useState(initialDonation);
  const isDonor = viewAs === 'donor';
  const isHistory = viewAs === 'history';
  const isAvailable = viewAs === 'ngo';
  
  // A donor might just be a string ID if not populated, or an object if populated
  const donorId = typeof donation.donor === 'object' ? donation.donor?._id : donation.donor;
  const isOwnDonation = user && donorId === user.id;

  const statusColors = {
    available: '#27AE60',
    assigned: 'var(--accent)',
    delivered: 'var(--mid)',
    expired: 'var(--coral)',
    matched: '#007bff'
  };

  const handleExpire = () => {
    setDonation(prev => ({ ...prev, status: 'expired' }));
  };

  return (
    <div className={`card ${donation.status === 'expired' ? 'expired-card' : ''}`} style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: donation.status === 'expired' ? 0.6 : 1, filter: donation.status === 'expired' ? 'grayscale(80%)' : 'none' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--foam)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
          {donation.images?.[0]
            ? <img src={donation.images[0]} alt={donation.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🍱'
          }
        </div>
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '18px', color: 'var(--forest)', margin: 0 }}>{donation.foodName || 'Surplus Food'}</h4>
            <span style={{ fontSize: '11px', fontWeight: 700, color: statusColors[donation.status], background: `${statusColors[donation.status]}15`, padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {donation.status}
            </span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: donation.status === 'expired' ? 'var(--coral)' : 'var(--muted)' }}>
            {donation.quantity?.value} {donation.quantity?.unit} • {donation.status === 'expired' ? 'Expired' : <CountdownTimer expiryTime={donation.expiryTime} onExpire={handleExpire} />}
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text-main)', display: 'flex', gap: '16px' }}>
            <span>📍 {donation.pickupLocation?.address || donation.location?.address}</span>
            {isAvailable && <span>🏢 Donor: {donation.donor?.organisationName || donation.donor?.name || 'Anonymous'}</span>}
            {!isAvailable && donation.assignedTo && <span>🚴 Assigned: {donation.assignedTo.name}</span>}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
        {isAvailable && donation.status !== 'expired' && (
          <button 
            onClick={() => onAccept(donation._id)} 
            className="btn-primary" 
            disabled={isOwnDonation}
            style={{ 
              padding: '8px 20px', 
              fontSize: '13px', 
              opacity: isOwnDonation ? 0.5 : 1, 
              cursor: isOwnDonation ? 'not-allowed' : 'pointer',
              background: isOwnDonation ? 'var(--text-muted)' : 'var(--color-primary)' 
            }}
          >
            {isOwnDonation ? "Your Donation" : "Accept Pickup"}
          </button>
        )}
        {isAvailable && donation.status !== 'expired' && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--foam)', padding: '4px 10px', borderRadius: '12px' }}>
            ~2.5 km away
          </div>
        )}
        {donation.status === 'expired' && (
          <div style={{ padding: '8px 20px', fontSize: '13px', background: '#ffe4e6', color: '#e11d48', borderRadius: '12px', fontWeight: 'bold' }}>
            Expired
          </div>
        )}
      </div>
    </div>
  );
};

export { CountdownTimer, HandoverModal };
