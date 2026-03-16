import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab') || 'profile';
    // If user is not donor, they can't see become-volunteer
    if (tab === 'become-volunteer' && user?.role !== 'donor') return 'profile';
    return tab;
  });
  const [roleSwitched, setRoleSwitched] = useState(false);
  const [availability, setAvailability] = useState({ days: [], slots: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.location?.city || 'Hyderabad',
    organisationName: user?.organisationName || '',
  });

  // Keep formData in sync with user state changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.location?.city || 'Hyderabad',
        organisationName: user.organisationName || '',
      });
      // If user upgraded role and was on become-volunteer tab, switch back
      if (user.role !== 'donor' && activeTab === 'become-volunteer') {
        setActiveTab('profile');
      }
    }
  }, [user]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SLOTS = ['6am–10am', '10am–2pm', '2pm–6pm', '6pm–10pm'];

  const role = user?.role || 'donor';
  const roleColors = { donor: '#10b981', ngo: '#8b5cf6', volunteer: '#3b82f6', admin: '#dc2626' };
  const color = roleColors[role] || '#10b981';

  const handleBecomeVolunteer = async () => {
    try {
      const res = await authAPI.upgradeRole();
      if (res.data?.success) {
        // Upgrade the global React Context User directly with the new payload
        setUser(res.data.user);
        setRoleSwitched(true);
        toast.success("Welcome to the Volunteer Hub!");
        
        // Let the state digest, then smoothly navigate without a hard reload
        setTimeout(() => navigate('/volunteer'), 1200);
      }
    } catch (err) {
      toast.error('Failed to upgrade role: ' + (err.response?.data?.message || ''));
    }
  };

  const handleSave = async () => {
    try {
      const loadingToast = toast.loading('Updating profile...');
      const res = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        organisation: formData.organisationName,
        location: { ...user?.location, city: formData.city }
      });
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', boxSizing: 'border-box' }}>
      
      {/* Profile Header */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b, #0f172a)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: color, flexShrink: 0 }}>
          {user?.name?.[0]?.toUpperCase() || role[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '0.35rem' }}>{user?.name || 'Your Name'}</h1>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>{user?.email || 'user@sharebite.app'} · {user?.phone || 'No phone added'}</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 14px', borderRadius: '50px', color, background: `${color}30`, textTransform: 'uppercase', letterSpacing: '1px' }}>{role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#f1f5f9', borderRadius: '14px', padding: '0.25rem' }}>
        {[
          ['profile', '👤 Profile'],
          ...(role === 'donor' ? [['become-volunteer', '🚴 Become a Volunteer']] : []),
          ['settings', '⚙️ Settings']
        ].map(([t, l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', fontWeight: activeTab === t ? 800 : 600, background: activeTab === t ? 'white' : 'transparent', color: activeTab === t ? '#0f172a' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s', boxShadow: activeTab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>{l}</button>
        ))}
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Personal Information</h3>
            {isEditing && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setIsEditing(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>Save Changes</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            {[
              { id: 'name', label: 'Full Name', value: user?.name, type: 'text' },
              { id: 'email', label: 'Email', value: user?.email, type: 'email', disabled: true },
              { id: 'phone', label: 'Phone', value: user?.phone, type: 'tel' },
              { id: 'city', label: 'City', value: user?.location?.city || 'Hyderabad', type: 'text' },
              { id: 'organisationName', label: 'Organisation', value: user?.organisationName || 'N/A', type: 'text' },
              { id: 'role', label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1), disabled: true },
            ].map(f => (
              <div key={f.label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{f.label}</div>
                {isEditing && !f.disabled ? (
                  <input 
                    type={f.type}
                    value={formData[f.id]}
                    onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '1rem', fontWeight: 700, color: '#0f172a', outline: 'none', background: 'white' }}
                  />
                ) : (
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{f.value || 'Not set'}</div>
                )}
              </div>
            ))}
          </div>
          
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '0.875rem 1.75rem', borderRadius: '50px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.25)' }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      )}

      {/* Tab: Become a Volunteer */}
      {activeTab === 'become-volunteer' && (
        <div>
          {roleSwitched ? (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '20px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚴</div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginBottom: '0.75rem' }}>Welcome, Volunteer!</h3>
              <p style={{ color: '#166534', fontSize: '1.05rem' }}>Your account now has volunteer access. Redirecting to your Volunteer Hub...</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚴</div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem' }}>Expand Your Role</h3>
                <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                  Keep donating food AND start picking up donations from others. One account, two powerful roles.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                {[
                  ['🕐', 'Set your availability hours and days'],
                  ['📍', 'Accept pickups near your location'],
                  ['🏆', 'Earn volunteer badges and leaderboard rank'],
                  ['🔔', 'Get SMS alerts only in your available windows'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '10px', alignItems: 'flex-start', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
                    <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, lineHeight: 1.5 }}>{text}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={handleBecomeVolunteer} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(59,130,246,0.35)', transition: 'all 0.15s' }}>
                  🚴 Activate Volunteer Role
                </button>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>Your donor access will be retained. You can disable volunteer mode anytime from settings.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Notification Preferences</h3>
          {[
            { 
              key: 'emailNotifications', 
              label: 'Email Notifications', 
              desc: 'Receive pickup updates and confirmations via email', 
              enabled: user?.notificationSettings?.emailNotifications ?? true 
            },
            { 
              key: 'urgentPickupRequests', 
              label: 'Urgent Pickup Requests', 
              desc: 'Get immediate email alerts for donations expiring soon (under 3 hours)', 
              enabled: user?.notificationSettings?.urgentPickupRequests ?? true 
            },
          ].map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{s.desc}</div>
              </div>
              <div 
                onClick={async () => {
                  try {
                    const currentSettings = user.notificationSettings || {
                      emailNotifications: true,
                      urgentPickupRequests: true
                    };
                    const newSettings = {
                      ...currentSettings,
                      [s.key]: !s.enabled
                    };
                    await updateProfile({ notificationSettings: newSettings });
                    toast.success(`${s.label} ${!s.enabled ? 'enabled' : 'disabled'}`);
                  } catch (err) {
                    toast.error('Failed to update setting');
                  }
                }}
                style={{ width: '50px', height: '26px', background: s.enabled ? '#10b981' : '#cbd5e1', borderRadius: '50px', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: s.enabled ? '27px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
