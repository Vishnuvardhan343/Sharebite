import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, EmptyState, HandoverModal } from '../components/index.jsx';
import { pickupAPI, donationAPI } from '../services/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['6am–10am', '10am–2pm', '2pm–6pm', '6pm–10pm'];

export default function VolunteerPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [schedule, setSchedule] = useState({ days: [], slots: [] });
  const [saved, setSaved] = useState(false);
  const [pickups, setPickups] = useState([]);
  const [donorStats, setDonorStats] = useState({ totalDonations: 0, mealsProvided: 0 });
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(null); // Track selected pickup for details modal
  const [showHandover, setShowHandover] = useState(false);
  const [updating, setUpdating] = useState(false);
  const statusFlow = { accepted: 'en_route', en_route: 'picked', picked: 'delivered' };
  const statusLabel = { accepted: 'Start Journey', en_route: 'Confirm Pickup', picked: 'Mark Delivered' };

  const loadPickups = async () => {
    try {
      // First fetch pickups
      const res = await pickupAPI.getMy();
      setPickups(res.data?.pickups || []);
      
      // Concurrently try to fetch donor stats to merge into the dashboard
      try {
        const donorRes = await donationAPI.getMy();
        const pastDonations = donorRes.data?.donations || [];
        setDonorStats({
          totalDonations: pastDonations.length,
          mealsProvided: pastDonations.reduce((acc, d) => acc + (d.estimatedMeals || 0), 0)
        });
      } catch (e) { console.error("Could not fetch donor stats", e); }

    } finally {
      setLoading(false);
    }
  };

  const advance = async (pickupId, currentStatus, extraData = {}) => {
    const next = statusFlow[currentStatus];
    if (!next) return;
    
    // If moving to delivered, show modal
    if (next === 'delivered' && Object.keys(extraData).length === 0) {
      const p = pickups.find(x => x._id === pickupId);
      setShowHandover(p);
      return;
    }

    setUpdating(true);
    try {
      await pickupAPI.updateStatus(pickupId, { status: next, ...extraData });
      toast.success(`Status updated to: ${next.replace('_', ' ')}`);
      setShowHandover(false);
      loadPickups();
    } catch (err) {
      toast.error('Update failed: ' + (err.response?.data?.error || ''));
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => { loadPickups(); }, []);

  const activePickups = pickups.filter(p => ['accepted', 'en_route', 'picked'].includes(p.status));
  const completedPickups = pickups.filter(p => p.status === 'delivered');

  const toggleDay = (day) => setSchedule(s => ({ ...s, days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day] }));
  const toggleSlot = (slot) => setSchedule(s => ({ ...s, slots: s.slots.includes(slot) ? s.slots.filter(t => t !== slot) : [...s.slots, slot] }));

  const statusColors = { accepted: { bg: '#fef9c3', color: '#854d0e', label: 'Accepted' }, en_route: { bg: '#dbeafe', color: '#1d4ed8', label: 'En Route' }, picked: { bg: '#f3e8ff', color: '#6d28d9', label: 'Picked Up' }, delivered: { bg: '#dcfce7', color: '#166534', label: 'Delivered' } };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', marginBottom: '0.5rem' }}>
          Volunteer Hub 🚴
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem' }}>
          Welcome, {user?.name || 'Volunteer'}! Manage your pickups, set your availability, and track your impact.
        </p>
      </div>


      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { icon: '🚴', label: 'Active Pickups', value: activePickups.length, color: '#3b82f6' },
          { icon: '✅', label: 'Completed Deliveries', value: completedPickups.length, color: '#10b981' },
          { icon: '🍱', label: 'Past Donations', value: donorStats.totalDonations, color: '#f59e0b' },
          { icon: '🍽️', label: 'Total Meals Impact', value: donorStats.mealsProvided + (user?.mealsDelivered || 0), color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', background: `${s.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        {[['dashboard', '🏠 My Pickups'], ['available', '🟢 Available Donations'], ['availability', '⏰ My Availability'], ['history', '📋 History']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', fontSize: '0.9rem', fontWeight: tab === t ? 800 : 600, background: tab === t ? '#10b981' : 'transparent', color: tab === t ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>{l}</button>
        ))}
      </div>

      {/* Tab: Active Pickups */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Active Pickups</h3>
            <Link to="/ngo" style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>Browse Available →</Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading pickups...</div>
          ) : activePickups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', color: '#64748b', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem' }}>🚴</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No active pickups. Browse available donations!</p>
            </div>
          ) : activePickups.map(p => {
            const s = statusColors[p.status] || statusColors.accepted;
            return (
              <div key={p._id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍱</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{p.donation?.foodName || 'Food Donation'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                          <b>{p.donation?.quantity?.value} {p.donation?.quantity?.unit}</b> · {p.donation?.foodType}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Donor Info</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.donor?.organisationName || p.donor?.name || 'Local Donor'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📞 {p.donor?.phone || 'No phone provided'}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700, marginBottom: '2px', color: '#1e293b' }}>📍 Pickup Address:</div>
                      {p.donation?.pickupLocation?.address || 'Location unknown'}
                    </div>

                    {p.donation?.description && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                        " {p.donation.description} "
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button onClick={() => setShowDetails(p)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>🔍 View Details</button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '5px 12px', borderRadius: '50px', color: s.color, background: s.bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Available Donations */}
      {tab === 'available' && (
        <div>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>View and accept food pickups near you.</p>
          <Link to="/ngo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
            🟢 View All Available Donations →
          </Link>
        </div>
      )}

      {/* Tab: Availability Scheduler */}
      {tab === 'availability' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>⏰ Set Your Availability</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Tell us when you're free, and we'll only notify you for pickups during those windows.</p>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontSize: '1rem' }}>Available Days</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {DAYS.map(day => (
                <button key={day} onClick={() => toggleDay(day)} style={{ padding: '0.6rem 1.2rem', borderRadius: '50px', border: `2px solid ${schedule.days.includes(day) ? '#10b981' : '#e2e8f0'}`, background: schedule.days.includes(day) ? '#dcfce7' : 'white', color: schedule.days.includes(day) ? '#059669' : '#64748b', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontSize: '1rem' }}>Available Time Slots</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {TIME_SLOTS.map(slot => (
                <button key={slot} onClick={() => toggleSlot(slot)} style={{ padding: '1rem', borderRadius: '12px', border: `2px solid ${schedule.slots.includes(slot) ? '#10b981' : '#e2e8f0'}`, background: schedule.slots.includes(slot) ? '#f0fdf4' : 'white', color: schedule.slots.includes(slot) ? '#059669' : '#64748b', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                  ⏰ {slot}
                </button>
              ))}
            </div>
          </div>

          {saved && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#166534', fontWeight: 700 }}>
              ✅ Availability saved! You'll receive notifications during your selected windows.
            </div>
          )}

          <button onClick={() => setSaved(true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
            💾 Save Availability
          </button>
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {completedPickups.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No completed pickups yet.</div>
          ) : completedPickups.map(c => (
            <div key={c._id} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', background: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>✅</div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.donation?.foodName || 'Food Pickup'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', background: '#dcfce7', padding: '5px 14px', borderRadius: '50px' }}>+{c.donation?.quantity?.value || 0} items</div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="animate-fadeUp" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setShowDetails(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>×</button>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🍱</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{showDetails.donation?.foodName}</h2>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', background: '#f0fdf4', padding: '4px 12px', borderRadius: '50px', textTransform: 'uppercase' }}>{showDetails.donation?.foodType}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>👤 Donor Information</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{showDetails.donor?.organisationName || showDetails.donor?.name || 'Local Donor'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem', color: '#475569', fontWeight: 600 }}>
                  <span>📞 Call Donor:</span>
                  <a href={`tel:${showDetails.donor?.phone}`} style={{ color: '#10b981', textDecoration: 'none' }}>{showDetails.donor?.phone || 'No phone provided'}</a>
                </div>
              </div>

              <div style={{ padding: '0 0.5rem' }}>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📍 Pickup Address</div>
                <div style={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>{showDetails.donation?.pickupLocation?.address || 'Location details not provided'}</div>
              </div>

              <div style={{ padding: '0 0.5rem' }}>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>ℹ️ Food Details</div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>QUANTITY</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{showDetails.donation?.quantity?.value} {showDetails.donation?.quantity?.unit}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>EST. MEALS</div>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{showDetails.donation?.estimatedMeals || 0} Portions</div>
                  </div>
                </div>
                {showDetails.donation?.description && (
                  <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    "{showDetails.donation.description}"
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {showDetails.status !== 'accepted' && showDetails.status !== 'delivered' && statusFlow[showDetails.status] ? (
              <button 
                onClick={() => {
                  advance(showDetails._id, showDetails.status);
                  setShowDetails(null);
                }} 
                disabled={updating}
                style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16,185,129,0.2)', opacity: updating ? 0.7 : 1 }}>
                {updating ? 'Processing...' : statusLabel[showDetails.status]}
              </button>
            ) : (
              <button onClick={() => setShowDetails(null)} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>Got it, Close Details</button>
            )}
          </div>
        </div>
      )}

      {/* Handover Modal */}
      <HandoverModal 
        isOpen={!!showHandover} 
        onClose={() => setShowHandover(false)} 
        onConfirm={(data) => advance(showHandover._id, showHandover.status, data)}
        pickup={showHandover}
      />
    </div>
  );
}
