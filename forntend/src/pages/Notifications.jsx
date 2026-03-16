import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Loader } from '../components/index';

const typeConfig = {
  donation_posted:  { bg:'#dcfce7', color:'#166534', icon:'🍱' },
  pickup_accepted:  { bg:'#dbeafe', color:'#1e40af', icon:'🚴' },
  pickup_completed: { bg:'#fefce8', color:'#854d0e', icon:'✅' },
  expiry_alert:     { bg:'#fee2e2', color:'#991b1b', icon:'⚠️' },
  system:           { bg:'#f1f5f9', color:'#475569', icon:'📢' },
  sms_sent:         { bg:'#f3e8ff', color:'#6b21a8', icon:'📱' },
  email_sent:       { bg:'#fce7f3', color:'#9d174d', icon:'📧' },
  default:          { bg:'var(--foam)', color:'var(--muted)', icon:'🔔' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [error, setError]       = useState(null);

  const fetchNotifications = () => {
    setLoading(true);
    setError(null);
    API.get('/notifications')
      .then(({data}) => { setNotifications(data.notifications || []); setUnread(data.unreadCount || 0); })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Could not load notifications: ${msg}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchNotifications, []);

  const markRead = async (id) => {
    try {
        await API.put(`/notifications/${id}/read`);
    } catch(err) { }
    setNotifications(prev=>prev.map(n=>n._id===id?{...n,isRead:true}:n));
    setUnread(u=>Math.max(0,u-1));
  };

  const markAllRead = async () => {
    try { await API.put('/notifications/read-all'); } catch(e) {}
    setNotifications(prev=>prev.map(n=>({...n,isRead:true})));
    setUnread(0);
  };

  const filtered = filter==='all' ? notifications : filter==='unread' ? notifications.filter(n=>!n.isRead) : notifications.filter(n=>n.type===filter);

  const timeAgo = (date) => {
    const diff = (Date.now()-new Date(date))/1000;
    if (diff<60) return 'just now';
    if (diff<3600) return `${Math.floor(diff/60)} mins ago`;
    if (diff<86400) return `${Math.floor(diff/3600)} hrs ago`;
    return `${Math.floor(diff/86400)} days ago`;
  };

  if (loading) return <Loader text="Loading notifications..."/>;

  if (error) return (
    <div className="page-container animate-fadeUp" style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2.5rem', color:'var(--color-primary-dark)', fontWeight: 800 }}>Notifications 🔔</h1>
      <div style={{ marginTop: '2rem', padding: '2rem', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '16px', color: '#991b1b', fontWeight: 700 }}>
        ⚠️ {error}
        <br /><button onClick={fetchNotifications} style={{ marginTop: '1rem', background: '#dc2626', color: 'white', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fadeUp" style={{ maxWidth: '900px' }}>
      <div style={{ display:'flex', flexWrap: 'wrap', gap: '1rem', justifyContent:'space-between', alignItems:'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color:'var(--color-primary-dark)', fontWeight: 800, letterSpacing: '-0.5px' }}>Notifications 🔔</h1>
          <p style={{ color:'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            {unread > 0 ? <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{unread} unread notification{unread>1?'s':''}</span> : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Mark All Read ✓
          </button>
        )}
      </div>



      {/* Filters */}
      <div style={{ display:'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap:'wrap', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
        {['all','unread','donation_posted','pickup_accepted','expiry_alert'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', border:'none', fontSize: '0.9rem', fontWeight: 700, cursor:'pointer',
            background: filter === f ? 'var(--deep)' : 'white',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            boxShadow: filter === f ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }}>{f === 'all' ? 'All' : f.replace(/_/g,' ').replace(/\b\w/g, l=>l.toUpperCase())}</button>
        ))}
      </div>

      {/* Notification List */}
      <div className="card" style={{ padding: '0.5rem', border: 'none', background: 'transparent' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding: '4rem', background:'white', borderRadius: 'var(--radius-lg)', color:'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No notifications to display.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap: '1rem' }}>
            {filtered.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.default;
              return (
                <div key={n._id} onClick={()=>!n.isRead && markRead(n._id)} className={n.isRead ? "" : "marker-hover"} style={{
                  background: n.isRead ? 'white' : '#f8fafc', borderRadius: 'var(--radius-md)', padding: '1.5rem',
                  borderLeft: `5px solid ${n.isRead ? '#cbd5e1' : cfg.color}`,
                  boxShadow: n.isRead ? 'none' : 'var(--shadow-md)',
                  border: n.isRead ? '1px solid #e2e8f0' : `1px solid ${cfg.color}40`, borderLeftWidth: '5px',
                  cursor: n.isRead ? 'default' : 'pointer', transition: 'all var(--transition-fast)',
                  display: 'flex', gap: '1.5rem', alignItems: 'flex-start', transform: !n.isRead ? 'scale(1.01)' : 'none'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '1.5rem', flexShrink:0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:'flex', flexWrap: 'wrap', gap: '1rem', justifyContent:'space-between', alignItems:'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: '1.15rem', color: n.isRead ? 'var(--text-main)' : 'var(--deep)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{timeAgo(n.createdAt)}</div>
                    </div>
                    <p style={{ fontSize: '1rem', color: n.isRead ? 'var(--text-muted)' : 'var(--forest)', margin: 0, lineHeight: 1.6 }}>{n.message}</p>
                    <div style={{ display:'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                      {n.smsSent && <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700, letterSpacing: '0.5px' }}>📱 SMS Alert</span>}
                      {n.emailSent && <span style={{ fontSize: '0.75rem', background: '#fce7f3', color: '#9d174d', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700, letterSpacing: '0.5px' }}>📧 Email Sent</span>}
                      {!n.isRead && <span className="pulse-animation" style={{ fontSize: '0.75rem', background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 800, letterSpacing: '0.5px' }}>● UNREAD</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default Notifications;
