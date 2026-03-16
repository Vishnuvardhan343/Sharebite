import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { donationAPI } from "../services/api";
import { StatCard, DonationCard, Loader, EmptyState } from "../components/index.jsx";

// Mock data removed in favor of real API data

const statusColors = {
  available: { bg: '#dcfce7', color: '#166534', label: 'Available' },
  matched: { bg: '#dbeafe', color: '#1d4ed8', label: 'Matched' },
  delivered: { bg: '#f3f4f6', color: '#374151', label: 'Delivered' },
  expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
};

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVerify, setShowVerify] = useState(false);
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, meals: 0 });

  useEffect(() => {
    donationAPI.getMy()
      .then(res => {
        const data = res.data.donations;
        setDonations(data);
        setStats({
          total: data.length,
          delivered: data.filter(d => d.status === 'delivered').length,
          pending: data.filter(d => ['available', 'matched'].includes(d.status)).length,
          meals: data.reduce((s, d) => s + (d.estimatedMeals || 0), 0),
        });
      })
      .catch(() => {
        setDonations([]);
        setStats({ total: 0, delivered: 0, pending: 0, meals: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;

  const recentDonation = donations[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '0.35rem' }}>
            Welcome back, {user?.organisationName || user?.name || 'Donor'}! 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Every donation brings someone closer to a full meal. Thank you for making a difference.</p>
        </div>
        <Link to="/donor/new-donation" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.9rem 1.75rem', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 6px 20px rgba(16,185,129,0.3)', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          + Post a Donation
        </Link>
      </div>


      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { icon: '🍱', label: 'Total Donations', value: stats.total, color: '#059669' },
          { icon: '✅', label: 'Delivered', value: stats.delivered, color: '#10b981' },
          { icon: '⏳', label: 'Pending / Active', value: stats.pending, color: '#f59e0b' },
          { icon: '🌎', label: 'Meals Saved', value: Math.max(stats.meals, 0), color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', background: `${s.color}15`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 340px)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Recent Donations */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Recent Donations</h3>
            <Link to="/donor/history" style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
          </div>

          {donations.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍱</div>
              <h3 style={{ color: '#0f172a', fontWeight: 800 }}>No donations yet</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Post your first food donation and help fight waste!</p>
              <Link to="/donor/new-donation" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color:'white', padding:'0.75rem 1.5rem', borderRadius:'50px', fontWeight:800, textDecoration:'none', fontSize:'0.9rem' }}>Post First Donation</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {donations.map(d => {
                const s = statusColors[d.status] || statusColors.available;
                return (
                  <div key={d._id} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem' }}>🍱</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{d.foodName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          {d.quantity?.value} {d.quantity?.unit} · {d.location?.address} · {new Date(d.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {d.estimatedMeals > 0 && <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>+{d.estimatedMeals} meals</span>}
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '50px', color: s.color, background: s.bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Donate Banner */}
          <div style={{ background: 'linear-gradient(135deg, #064e3b, #0f172a)', borderRadius: '20px', padding: '2rem', color: 'white' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚀</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>Have Food to Share?</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.25rem' }}>Post a donation now. AI matching takes under 60 seconds.</p>
            <Link to="/donor/new-donation" style={{ display: 'block', background: 'white', color: '#059669', padding: '0.75rem', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', fontSize: '0.9rem', textAlign: 'center' }}>+ Post Donation</Link>
          </div>


          {/* Become a Volunteer */}
          {user?.role === 'donor' && (
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '20px', padding: '1.75rem', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🚴</div>
              <h4 style={{ fontWeight: 800, color: '#1e40af', marginBottom: '0.5rem', fontSize: '1rem' }}>Want to Do More?</h4>
              <p style={{ fontSize: '0.875rem', color: '#3b82f6', lineHeight: 1.5, marginBottom: '1rem' }}>Expand your role to a Volunteer and start picking up donations from nearby donors too!</p>
              <Link to="/profile?tab=become-volunteer" style={{ display: 'block', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '0.7rem', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.875rem', textAlign: 'center' }}>Become a Volunteer →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
