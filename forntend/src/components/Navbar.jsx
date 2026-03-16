import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const role = user?.role;

    const isPublicPage = ['/', '/login', '/register', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/reset-password');

    // Fetch unread notification count for authenticated users
    useEffect(() => {
        if (role) {
            API.get('/notifications')
                .then(({ data }) => setUnreadCount(data.unreadCount || 0))
                .catch(() => {}); // Silently fail — count stays at 0
        }
    }, [role, location.pathname]); // Re-fetch when route changes

    // ── PUBLIC NAV ────────────────────────────────────────────
    if (!role && isPublicPage) {
        return (
            <>
                <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 2.5rem', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 10px rgba(0,0,0,0.06)' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌱</div>
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Share<span style={{ color: '#10b981' }}>bite</span></span>
                    </Link>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <Link to="/about" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>How It Works</Link>
                        <Link to="/campaigns" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Campaigns</Link>
                        <Link to="/login" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>Login</Link>
                        <Link to="/register" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.55rem 1.3rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>Sign Up Free</Link>
                    </div>
                </nav>
                <div style={{ height: '65px' }} />
            </>
        );
    }

    // ── ROLE-BASED LINKS (no duplication) ────────────────────
    // Dashboard path depends on role
    const dashPath = role === 'admin' ? '/admin' : role === 'ngo' || role === 'volunteer' ? '/ngo' : '/donor';

    // Common links every logged-in user sees
    const navLinks = [
        { label: 'Dashboard', path: dashPath, icon: '🏠' },
        { label: '+ Donate', path: '/donor/new-donation', icon: '🍱', highlight: true },
        // Only Donors get the personal Donation History link
        ...(role === 'donor' ? [
            { label: 'History', path: '/donor/history', icon: '📋' },
        ] : []),
        // Only NGO/Volunteer get Available Donations
        ...((role === 'ngo' || role === 'volunteer') ? [
            { label: 'Available Donations', path: '/ngo', icon: '🟢' },
            { label: 'AI Match', path: '/matching', icon: '🧠' },
        ] : []),
        // Admin extras (no duplicate Dashboard — already included above)
        ...(role === 'admin' ? [
            { label: 'All Users', path: '/admin/users', icon: '👥' },
            { label: 'Donations', path: '/admin/donations', icon: '🍱' },
            { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
        ] : []),
        { label: 'Notifications', path: '/notifications', icon: '🔔', badge: unreadCount > 0 ? unreadCount : null },
        { label: 'Campaigns', path: '/campaigns', icon: '🎯' },
        { label: 'About', path: '/about', icon: '📖' },
    ];

    const isActive = (path) => location.pathname === path || (path.length > 4 && location.pathname.startsWith(path) && (path === dashPath ? !location.pathname.startsWith('/donor/') : true));

    const handleLogout = () => { 
        if (logout) logout(); 
        navigate('/'); 
    };

    const roleStyle = {
        donor:     { label: 'Donor',     color: '#059669', bg: '#dcfce7' },
        ngo:       { label: 'NGO',       color: '#7c3aed', bg: '#ede9fe' },
        volunteer: { label: 'Volunteer', color: '#0369a1', bg: '#dbeafe' },
        admin:     { label: 'Admin',     color: '#dc2626', bg: '#fee2e2' },
    };
    const badge = roleStyle[role] || { label: 'User', color: '#64748b', bg: '#f1f5f9' };

    return (
        <>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', height: '65px', background: 'white', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '2px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

                {/* Brand */}
                <Link to={dashPath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌱</div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Share<span style={{ color: '#10b981' }}>bite</span></span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center', flex: 1, justifyContent: 'center', padding: '0 0.75rem', overflowX: 'auto' }}>
                    {navLinks.map(link => {
                        const active = isActive(link.path);
                        return (
                            <Link key={`${link.label}-${link.path}`} to={link.path} style={{
                                textDecoration: 'none',
                                fontSize: '0.83rem',
                                fontWeight: active ? 800 : 600,
                                color: link.highlight ? 'white' : active ? '#059669' : '#475569',
                                padding: link.highlight ? '0.45rem 1rem' : '0.45rem 0.75rem',
                                borderRadius: link.highlight ? '50px' : '8px',
                                background: link.highlight ? 'linear-gradient(135deg, #10b981, #059669)' : active ? '#f0fdf4' : 'transparent',
                                border: link.highlight ? 'none' : active ? '1px solid #bbf7d0' : '1px solid transparent',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                                boxShadow: link.highlight ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                                display: 'flex', alignItems: 'center', gap: '4px', position: 'relative'
                            }}>
                                <span style={{ fontSize: '0.8rem' }}>{link.icon}</span>
                                {link.label}
                                {link.badge && (
                                    <span style={{
                                        position: 'absolute', top: '-5px', right: '-5px',
                                        background: '#ef4444', color: 'white',
                                        borderRadius: '50%', width: '16px', height: '16px',
                                        fontSize: '0.6rem', fontWeight: 900,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        lineHeight: 1
                                    }}>{link.badge > 9 ? '9+' : link.badge}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Badge + User Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: '50px', color: badge.color, background: badge.bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{badge.label}</span>

                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '5px 10px 5px 5px', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                                {user?.name?.[0]?.toUpperCase() || role?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || `${role || ''} User`}</span>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>▼</span>
                        </button>

                        {menuOpen && (
                            <>
                                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', width: '210px', borderRadius: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 999 }} onClick={() => setMenuOpen(false)}>
                                    <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signed in as</div>
                                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>{user?.name || `${role || ''} User`}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email || 'user@sharebite.app'}</div>
                                    </div>
                                    <div style={{ padding: '0.4rem' }}>
                                        {[
                                            { to: '/profile', icon: '👤', label: 'My Profile', color: '#0f172a', hov: '#f8fafc' },
                                            { to: '/volunteer', icon: '🚴', label: 'Volunteer Hub', color: '#0369a1', hov: '#f0f9ff', show: role === 'donor' || role === 'volunteer' },
                                            { to: '/profile?tab=become-volunteer', icon: '🔄', label: 'Become a Volunteer', color: '#0369a1', hov: '#f0f9ff', show: role === 'donor' },
                                        ].filter(i => i.show !== false).map(item => (
                                            <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '0.7rem 0.9rem', borderRadius: '8px', textDecoration: 'none', color: item.color, fontWeight: 700, fontSize: '0.875rem', transition: 'background 0.1s' }} onMouseOver={e => e.currentTarget.style.background = item.hov} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                <span>{item.icon}</span>{item.label}
                                            </Link>
                                        ))}
                                        <button onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '9px', padding: '0.7rem 0.9rem', borderRadius: '8px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '0.875rem' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <span>🚪</span> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>
            <div style={{ height: '65px' }} />
        </>
    );
};

export default Navbar;
