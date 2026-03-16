import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { StatCard, Loader } from "../components/index.jsx";
import toast from "react-hot-toast";

// ── Admin Dashboard ───────────────────────────────────────
export function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data.stats))
      .catch(() => {
        setStats({});
        toast.error('Failed to load admin stats');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading admin dashboard..." />;

  const byRole   = Object.fromEntries((stats?.byRole   || []).map(s => [s._id, s.count]));
  const byStatus = Object.fromEntries((stats?.byStatus || []).map(s => [s._id, s.count]));

  const barData = stats?.dailyDonations || [];
  const maxVal  = Math.max(...barData.map(b => b.count), 1);

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color:"var(--color-primary-dark)", fontWeight: 800, letterSpacing: '-0.5px' }}>Admin Dashboard ⚙️</h1>
        <p style={{ color:"var(--text-muted)", marginTop: '0.5rem', fontSize: '1.1rem' }}>Monitor real-time system metrics, manage users, and track platform impact.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard icon="👥" label="Total Users"    value={stats?.totalUsers || 0} />
        <StatCard icon="🍱" label="Total Donations" value={stats?.totalDonations || 0} />
        <StatCard icon="🚴" label="Total Pickups"  value={stats?.totalPickups || 0} color="var(--accent-blue)" />
        <StatCard icon="🤝" label="Volunteers/NGOs" value={(byRole.volunteer||0)+(byRole.ngo||0)} color="var(--deep)" />
        <StatCard icon="🌍" label="Meals Served"   value={stats?.totalMealsServed || 0} color="var(--color-primary)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(400px, 1fr))", gap: '2rem', marginBottom: '3rem' }}>
        {/* Weekly bar chart */}
        <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1.25rem', color:"var(--forest)", marginBottom: '2rem', fontWeight: 800 }}>📊 Daily Donations (Last 7 Days)</h3>
          {barData.length === 0 ? (
            <p style={{ color:"var(--text-muted)", textAlign:"center", padding:40 }}>No donations in the last 7 days</p>
          ) : (
            <div style={{ display:"flex", gap: '1rem', alignItems:"flex-end", height: '200px', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              {barData.map(b => (
                <div key={b._id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color:"var(--deep)" }}>{b.count}</div>
                  <div style={{ width:"100%", height:`${(b.count/maxVal)*150}px`, background:"linear-gradient(180deg, var(--color-primary), var(--forest))", borderRadius:"6px 6px 0 0", transition:"height 0.4s", minHeight:4, boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }} />
                  <div style={{ fontSize: '0.75rem', color:"var(--text-muted)", fontWeight: 600 }}>{b._id?.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donation types */}
        <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1.25rem', color:"var(--forest)", marginBottom: '2rem', fontWeight: 800 }}>📦 By Food Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(stats?.byFoodType || []).slice(0,5).map(item => (
              <div key={item._id}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span style={{ color:"var(--forest)", fontWeight: 600 }}>{item._id || "Unknown"}</span>
                  <span style={{ color:"var(--deep)", fontWeight:800 }}>{item.count}</span>
                </div>
                <div style={{ background:"var(--bg-main)", borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width:`${(item.count/Math.max(...(stats?.byFoodType||[{count:1}]).map(x=>x.count)))*100}%`, height:"100%", borderRadius: '10px', background:"linear-gradient(90deg, var(--accent-blue), var(--color-primary))" }} />
                </div>
              </div>
            ))}
            {(stats?.byFoodType || []).length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No donations yet</p>}
          </div>
        </div>
      </div>

      {/* Status overview */}
      <div className="card" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-md)', background: 'linear-gradient(135deg, white, var(--bg-main))' }}>
        <h3 style={{ fontSize: '1.5rem', color:"var(--forest)", marginBottom: '2rem', fontWeight: 800 }}>🍱 System Donation Status Overview</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap: '1.5rem' }}>
          {["available","assigned","picked","delivered","expired","cancelled"].map(s => {
            const colors = { available:"#27AE60", assigned:"var(--accent-yellow)", picked:"var(--accent-blue)", delivered:"var(--forest)", expired:"var(--accent-red)", cancelled: '#94a3b8' };
            return (
              <div key={s} style={{ textAlign:"center", background: 'white', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', transition: 'transform var(--transition-fast)' }} className="marker-hover">
                <div style={{ fontFamily:"'Outfit',serif", fontSize: '2.5rem', fontWeight:800, color:colors[s], marginBottom: '0.5rem', lineHeight: 1 }}>{byStatus[s]||0}</div>
                <div style={{ fontSize: '0.85rem', color:"var(--text-muted)", textTransform:"uppercase", fontWeight: 700, letterSpacing: '0.5px' }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Pickup success rate */}
        {stats?.pickupSuccessRate !== undefined && (
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '0.95rem' }}>🚴 Pickup Success Rate</span>
            <span style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '1.4rem' }}>{stats.pickupSuccessRate}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Users Page ──────────────────────────────────────
export function AdminUsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [role, setRole]       = useState("");

  const load = () => {
    adminAPI.getAllUsers({ search, role })
      .then(r => setUsers(r.data.users))
      .catch(() => {
        setUsers([]);
        toast.error('Failed to load users');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [search, role]);

  const toggle = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error('Error toggling user: ' + (e.response?.data?.message || e.message));
    }
  };

  const updateRole = async (id, newRole) => {
    try {
      const { data } = await adminAPI.updateUserRole(id, newRole);
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error('Error updating role: ' + (e.response?.data?.message || e.message));
    }
  };

  const roleColors = { donor:"var(--deep)", volunteer:"var(--accent-blue)", ngo:"var(--color-primary-dark)", admin:"var(--accent-red)" };
  
  // Using localStorage directly here for quick self-check, or use useAuth if available in this component.
  // Assuming token payload has id or we just match by email. We will match by email since useAuth isn't imported.
  // Actually, safe bet is we let the backend handle the 403 prevention for self-demotion if they attempt it.

  if (loading) return <Loader text="Loading users..." />;

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color:"var(--color-primary-dark)", fontWeight: 800, letterSpacing: '-0.5px' }}>User Management 👥</h1>
      </div>

      <div style={{ display:"flex", flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <input className="form-control" style={{ maxWidth: '350px' }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ width: '200px' }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          {["donor","volunteer","ngo","admin"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontSize: '0.9rem', color:"var(--text-muted)", fontWeight: 600, background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>{users.length} users found</span>
      </div>

      <div className="card" style={{ padding:0, border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-main)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phone</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Activity</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display:"flex", alignItems:"center", gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius:"50%", background:"var(--color-primary-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: '1.2rem', fontWeight:800, color:"var(--color-primary-dark)", flexShrink:0 }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize: '1rem', color: 'var(--forest)' }}>{u.name}</div>
                        {u.organisationName && <div style={{ fontSize: '0.8rem', color:"var(--text-muted)", marginTop: '4px' }}>{u.organisationName}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight:800, color:roleColors[u.role], background:`${roleColors[u.role]}15`, padding:"6px 14px", borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{u.role}</span>
                      <select 
                        value={u.role} 
                        onChange={(e) => updateRole(u._id, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                      >
                        {["donor","volunteer","ngo","admin"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color:"var(--text-main)", fontSize: '0.9rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem 1.5rem', color:"var(--text-muted)", fontSize: '0.9rem' }}>{u.phone || "—"}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--deep)', fontWeight: 600 }}>
                      {u.totalDonations > 0 && <div>🍱 {u.totalDonations} donations</div>}
                      {u.totalPickups   > 0 && <div>🚴 {u.totalPickups} pickups</div>}
                      {!u.totalDonations && !u.totalPickups && "—"}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, background: u.isActive ? "#dcfce7" : "#fee2e2", color: u.isActive ? "#166534" : "#991b1b", padding:"6px 14px", borderRadius: 'var(--radius-full)' }}>
                      {u.isActive ? "● Active" : "● Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button onClick={() => toggle(u._id)} style={{ fontSize: '0.85rem', padding:"6px 16px", borderRadius: 'var(--radius-md)', border:`2px solid ${u.isActive ? "var(--accent-red)" : "var(--color-primary)"}`, background:"#fff", color: u.isActive ? "var(--accent-red)" : "var(--color-primary-dark)", fontWeight:700, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Admin Donations Page ──────────────────────────────────
export function AdminDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState("");

  useEffect(() => {
    setLoading(true);
    adminAPI.getAllDonations({ status })
      .then(r => setDonations(r.data.donations))
      .catch(() => {
        setDonations([]);
        toast.error('Failed to load donations');
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) return <Loader text="Loading donations..." />;

  return (
    <div className="page-container animate-fadeUp">
      <h1 style={{ fontSize: '2.5rem', color:"var(--color-primary-dark)", marginBottom: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>All Donations 🍱</h1>

      <div style={{ display:"flex", gap: '0.75rem', marginBottom: '2.5rem', flexWrap:"wrap" }}>
        {["","available","assigned","delivered","expired","cancelled"].map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{
            padding:"0.75rem 1.5rem", borderRadius: 'var(--radius-md)', border:"none", fontSize: '0.95rem', fontWeight:700,
            background: status===s ? "var(--deep)" : "white",
            color: status===s ? "#fff" : "var(--text-muted)",
            boxShadow:"var(--shadow-sm)", cursor: 'pointer', transition: 'all var(--transition-fast)'
          }}>{(s || "All").toUpperCase()}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0, border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-main)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Food</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Donor</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Location</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Expires</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No donations found</td></tr>
              )}
              {donations.map(d => {
                const expiryDate = d.expiryTime ? new Date(d.expiryTime) : null;
                const hoursLeft = expiryDate ? Math.max(0, Math.round((expiryDate - Date.now()) / 3600000)) : null;
                const address = d.pickupLocation?.address || d.location?.address || '—';
                return (
                  <tr key={d._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 1.5rem' }}><div style={{ fontWeight:800, color: 'var(--forest)', fontSize: '1.05rem' }}>{d.foodName}</div><div style={{ fontSize: '0.8rem', color:"var(--text-muted)", marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.foodType}</div></td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--deep)' }}>{d.donor?.organisationName || d.donor?.name || 'Unknown'}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{d.quantity?.value} {d.quantity?.unit}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color:"var(--text-muted)" }}>{address.slice(0,35)}{address.length > 35 ? '...' : ''}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, color: d.status === 'expired' ? 'var(--accent-red)' : (hoursLeft !== null && hoursLeft < 3 ? 'var(--accent-red)' : 'var(--color-primary-dark)') }}>
                      {d.status === 'expired' ? 'Expired' : (hoursLeft !== null ? `${hoursLeft}h left` : '—')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', 
                        background: d.status === 'expired' ? '#fee2e2' : 'var(--bg-main)', 
                        color: d.status === 'expired' ? '#b91c1c' : 'var(--deep)', 
                        padding: '6px 12px', borderRadius: '4px',
                        border: d.status === 'expired' ? '1px solid #fecaca' : 'none'
                      }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color:"var(--text-muted)", fontWeight: 600 }}>{d.assignedTo?.name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Page ────────────────────────────────────────
export function AnalyticsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getReports()
      .then(r => setReports(r.data))
      .catch(() => { setReports({}); toast.error('Failed to load analytics'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Generating analytics..." />;

  const kpi = reports?.kpi || {};
  const monthly = reports?.monthlyStats || [];
  const weekly  = reports?.weeklyDonations || [];
  const foodTypes = reports?.donationsByType || [];
  const byStatus  = reports?.byStatus || [];
  const topDonors = reports?.topDonors || [];
  const topVolunteers = reports?.topVolunteers || [];
  const userGrowth = reports?.userGrowth || [];
  const byRole = reports?.byRole || [];

  const maxWeekly  = Math.max(...weekly.map(w => w.count), 1);
  const maxMonthly = Math.max(...monthly.map(m => m.meals || 0), 1);
  const maxFoodType = Math.max(...foodTypes.map(f => f.count), 1);
  const maxUserGrowth = Math.max(...userGrowth.map(u => u.count), 1);

  const kpiCards = [
    { label: 'Total Donations', value: kpi.totalDonations || 0, icon: '🍱', color: '#10b981', bg: '#f0fdf4' },
    { label: 'Total Pickups',   value: kpi.totalPickups || 0,   icon: '🚴', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Meals Served',    value: kpi.mealsServed || 0,    icon: '🍽️', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Active Vol/NGO',  value: kpi.activeVolunteers || 0,icon: '🤝', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Success Rate',    value: `${kpi.pickupSuccessRate || 0}%`, icon: '✅', color: '#059669', bg: '#d1fae5' },
    { label: 'Cancel Rate',     value: `${kpi.cancellationRate || 0}%`, icon: '❌', color: '#ef4444', bg: '#fee2e2' },
    { label: 'Expiry Rate',     value: `${kpi.expiryRate || 0}%`,       icon: '⏰', color: '#f97316', bg: '#fff7ed' },
    { label: 'Donor Retention', value: `${kpi.donorRetention || 0}%`,   icon: '🔁', color: '#06b6d4', bg: '#ecfeff' },
  ];

  const statusColors = { available:'#10b981', assigned:'#f59e0b', picked:'#3b82f6', delivered:'#059669', expired:'#ef4444', cancelled:'#94a3b8' };
  const roleColors   = { donor:'#3b82f6', volunteer:'#10b981', ngo:'#8b5cf6', admin:'#f59e0b' };

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color:'var(--color-primary-dark)', fontWeight: 900, letterSpacing: '-0.5px' }}>Analytics & Reports 📈</h1>
        <p style={{ color:'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>Live platform performance, impact metrics, and trends — all from real data.</p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'1rem', marginBottom:'2.5rem' }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background:'white', borderRadius:'16px', padding:'1.25rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:`1px solid ${k.bg}`, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'1.5rem' }}>{k.icon}</span>
              <span style={{ fontSize:'0.7rem', fontWeight:700, color:k.color, background:k.bg, padding:'3px 8px', borderRadius:'20px', textTransform:'uppercase' }}>LIVE</span>
            </div>
            <div style={{ fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:'0.78rem', color:'#64748b', fontWeight:600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(420px, 1fr))', gap:'2rem', marginBottom:'2rem' }}>

        {/* ── Weekly Donations Bar Chart (14 days) ──────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>📅 Daily Donations — Last 14 Days</h3>
          {weekly.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No donations in the last 14 days</div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'0.4rem', alignItems:'flex-end', height:'160px', borderBottom:'2px solid #f1f5f9', paddingBottom:'0.75rem', marginBottom:'0.75rem' }}>
                {weekly.map(w => (
                  <div key={w._id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#475569' }}>{w.count}</div>
                    <div title={`${w.count} donations\n${w.meals} meals`} style={{ width:'100%', height:`${(w.count/maxWeekly)*130}px`, background:'linear-gradient(180deg, #10b981, #059669)', borderRadius:'6px 6px 0 0', minHeight:4, transition:'height 0.4s', cursor:'pointer' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'0.4rem' }}>
                {weekly.map(w => (
                  <div key={w._id} style={{ flex:1, textAlign:'center', fontSize:'0.6rem', color:'#94a3b8', fontWeight:600 }}>{w._id?.slice(5)}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Monthly Chart (6 months) ──────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>📊 Monthly Donations & Meals — Last 6 Months</h3>
          {monthly.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No monthly data yet</div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-end', height:'160px', borderBottom:'2px solid #f1f5f9', paddingBottom:'0.75rem', marginBottom:'0.75rem' }}>
                {monthly.map(m => (
                  <div key={m._id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:800, color:'#475569' }}>{m.meals||0}</div>
                    <div style={{ width:'100%', height:`${((m.meals||0)/maxMonthly)*130}px`, background:'linear-gradient(180deg, #3b82f6, #1d4ed8)', borderRadius:'6px 6px 0 0', minHeight:4 }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                {monthly.map(m => (
                  <div key={m._id} style={{ flex:1, textAlign:'center', fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>{m._id?.slice(5)}/{m._id?.slice(2,4)}</div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'1rem', marginTop:'1rem', flexWrap:'wrap' }}>
                {monthly.map(m => (
                  <div key={m._id} style={{ fontSize:'0.75rem', color:'#475569' }}>
                    <span style={{ fontWeight:700 }}>{m._id?.slice(5)}/{m._id?.slice(2,4)}:</span> {m.count} donations, {m.meals||0} meals
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Food Type Breakdown ───────────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>🥗 Donations by Food Type</h3>
          {foodTypes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No donations yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {foodTypes.map(f => (
                <div key={f._id}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem', marginBottom:'5px' }}>
                    <span style={{ fontWeight:700, color:'#1e293b' }}>{f._id || 'Unknown'}</span>
                    <span style={{ color:'#64748b', fontSize:'0.8rem' }}>{f.count} donations · {f.totalQty?.toFixed(1)} units · {f.meals||0} meals</span>
                  </div>
                  <div style={{ background:'#f1f5f9', borderRadius:'8px', height:'10px', overflow:'hidden' }}>
                    <div style={{ width:`${(f.count/maxFoodType)*100}%`, height:'100%', borderRadius:'8px', background:'linear-gradient(90deg, #3b82f6, #10b981)', transition:'width 1s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Donation Status Distribution ──────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>📦 Donation Status Distribution</h3>
          {byStatus.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No donations yet</div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                {byStatus.map(s => (
                  <div key={s._id} style={{ textAlign:'center', padding:'1rem 0.5rem', background:`${statusColors[s._id] || '#94a3b8'}10`, borderRadius:'12px', border:`1px solid ${statusColors[s._id] || '#94a3b8'}30` }}>
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color:statusColors[s._id] || '#94a3b8' }}>{s.count}</div>
                    <div style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', marginTop:'4px' }}>{s._id}</div>
                  </div>
                ))}
              </div>
              {/* percentage bars */}
              {byStatus.map(s => {
                const total = byStatus.reduce((acc, x) => acc + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s._id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'6px' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#475569', width:'70px', textTransform:'capitalize' }}>{s._id}</span>
                    <div style={{ flex:1, background:'#f1f5f9', borderRadius:'6px', height:'8px', overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:statusColors[s._id] || '#94a3b8', borderRadius:'6px' }} />
                    </div>
                    <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#475569', width:'35px', textAlign:'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Top Donors Leaderboard ────────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>🏆 Top Donors</h3>
          {topDonors.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No donation data yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {topDonors.map((d, i) => (
                <div key={d._id || i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1rem', background: i === 0 ? '#fffbeb' : '#f8fafc', borderRadius:'12px', border: i === 0 ? '1px solid #fde68a' : '1px solid #f1f5f9' }}>
                  <span style={{ fontSize:'1.5rem', flexShrink:0 }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.organisationName || d.name || 'Anonymous'}</div>
                    <div style={{ fontSize:'0.775rem', color:'#64748b', marginTop:'2px' }}>{d.email || ''} · <span style={{ color:'#10b981', fontWeight:700 }}>{d.totalDonations} donations</span></div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:900, fontSize:'1rem', color:'#059669' }}>{d.totalMeals || 0}</div>
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>MEALS</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top Volunteers Leaderboard ────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>🚴 Top Volunteers</h3>
          {topVolunteers.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No completed pickups yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {topVolunteers.map((v, i) => (
                <div key={v._id || i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1rem', background: i === 0 ? '#eff6ff' : '#f8fafc', borderRadius:'12px', border: i === 0 ? '1px solid #bfdbfe' : '1px solid #f1f5f9' }}>
                  <span style={{ fontSize:'1.5rem', flexShrink:0 }}>{['🏅','🎖️','⭐','🌟','💫'][i]}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.organisationName || v.name || 'Anonymous'}</div>
                    <div style={{ fontSize:'0.775rem', color:'#64748b', marginTop:'2px' }}><span style={{ color:'#3b82f6', fontWeight:700 }}>{v.deliveredPickups} pickups delivered</span></div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:900, fontSize:'1rem', color:'#1d4ed8' }}>{v.mealsDelivered || 0}</div>
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>MEALS</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── User Growth (6 months) ────────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>👥 User Growth — Last 6 Months</h3>
          {userGrowth.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No new users in last 6 months</div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-end', height:'140px', borderBottom:'2px solid #f1f5f9', paddingBottom:'0.75rem', marginBottom:'0.75rem' }}>
                {userGrowth.map(u => (
                  <div key={u._id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                    <div style={{ fontSize:'0.8rem', fontWeight:800, color:'#475569' }}>{u.count}</div>
                    <div style={{ width:'100%', height:`${(u.count/maxUserGrowth)*110}px`, background:'linear-gradient(180deg, #8b5cf6, #6d28d9)', borderRadius:'6px 6px 0 0', minHeight:4 }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                {userGrowth.map(u => (
                  <div key={u._id} style={{ flex:1, textAlign:'center', fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>{u._id?.slice(5)}/{u._id?.slice(2,4)}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── User Role Distribution ────────────────────── */}
        <div style={{ background:'white', borderRadius:'20px', padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f1f5f9' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem' }}>👤 User Role Distribution</h3>
          {byRole.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>No users yet</div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
                {byRole.map(r => (
                  <div key={r._id} style={{ textAlign:'center', padding:'1.25rem', background:`${roleColors[r._id] || '#94a3b8'}10`, borderRadius:'14px', border:`1px solid ${roleColors[r._id] || '#94a3b8'}30` }}>
                    <div style={{ fontSize:'2rem', fontWeight:900, color:roleColors[r._id] || '#94a3b8' }}>{r.count}</div>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', marginTop:'4px' }}>{r._id}s</div>
                  </div>
                ))}
              </div>
              {byRole.map(r => {
                const total = byRole.reduce((acc, x) => acc + x.count, 0);
                const pct = total > 0 ? Math.round((r.count/total)*100) : 0;
                return (
                  <div key={r._id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'6px' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#475569', width:'65px', textTransform:'capitalize' }}>{r._id}</span>
                    <div style={{ flex:1, background:'#f1f5f9', borderRadius:'6px', height:'8px', overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background: roleColors[r._id] || '#94a3b8', borderRadius:'6px' }} />
                    </div>
                    <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#475569', width:'35px', textAlign:'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

const AdminPages = () => {
    return (
        <div>
            <AdminDashboard />
        </div>
    );
};
export default AdminPages;

