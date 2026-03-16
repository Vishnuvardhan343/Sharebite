import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { donationAPI, pickupAPI } from "../services/api";
import { StatCard, DonationCard, Loader, EmptyState, HandoverModal } from "../components/index.jsx";
import toast from "react-hot-toast";

// ── NGO / Volunteer Dashboard ─────────────────────────────
export function NGODashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("available");

  const load = () => {
    Promise.all([
      donationAPI.getAvailable({ status: "available" }).catch(() => ({ data: { donations: [] } })),
      pickupAPI.getMy().catch(() => ({ data: { pickups: [] } }))
    ])
      .then(([aRes, pRes]) => {
        setAvailable(aRes.data?.donations || []);
        setMyPickups(pRes.data?.pickups || []);
        setCampaigns([]); 
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAccept = async (donationId) => {
    try {
      await pickupAPI.accept(donationId, { distanceFromVolunteer: 2.5, estimatedTime: 20 });
      toast.success("Pickup accepted! Check 'My Pickups' tab.");
      load();
    } catch (err) {
      toast.error("Error accepting pickup: " + (err.response?.data?.error || ""));
    }
  };

  if (loading) return <Loader text="Loading dashboard..." />;

  const active = myPickups.filter(p => ["accepted","en_route","picked"].includes(p.status));
  const done   = myPickups.filter(p => p.status === "delivered");

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color:"var(--color-primary-dark)", fontWeight: 800, letterSpacing: '-0.5px' }}>
          {user?.role === "ngo" ? "NGO Hub 🤝" : "Volunteer Hub 🚴"}
        </h1>
        <p style={{ color:"var(--text-muted)", marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Welcome, {user?.name || 'Partner'}. Coordinate food pickups, manage campaigns, and make a difference.
        </p>
      </div>


      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard icon="🍱" label="Available Now" value={available.length} color="var(--color-primary)" />
        <StatCard icon="🚴" label="Active Pickups" value={active.length} color="var(--accent-blue)" />
        <StatCard icon="✅" label="Completed" value={done.length} color="var(--deep)" />
        <StatCard icon="🏆" label="Total Impact" value={user?.totalPickups || 24} color="var(--accent-yellow)" />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
        {[
          ["available", "🟢 Available Donations"],
          ["pickups", "🚴 My Pickups"],
          ["map", "📍 Nearby Map"],
          ["campaigns", "📢 Campaigns & Drives"] // New Module 3 Feature
        ].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", fontSize: '0.95rem', fontWeight: 600,
            background: tab === t ? "var(--deep)" : "transparent",
            color: tab === t ? "#fff" : "var(--text-muted)",
            transition: "all var(--transition-fast)", cursor: "pointer",
            boxShadow: tab === t ? "var(--shadow-md)" : "none"
          }}>{l}</button>
        ))}
      </div>

      {tab === "available" && (
        available.length === 0 ? (
          <EmptyState icon="🎉" title="All caught up!" message="No available donations right now. Check back soon!" />
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap: '1.5rem' }}>
            {available.map(d => <DonationCard key={d._id} donation={d} viewAs="ngo" onAccept={handleAccept} />)}
          </div>
        )
      )}

      {tab === "pickups" && (
        myPickups.length === 0 ? (
          <EmptyState icon="🍱" title="No pickups yet" message="Browse available donations and accept your first pickup." action={<button onClick={() => setTab("available")} className="btn-primary" style={{ marginTop: '1rem' }}>Browse Available</button>} />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap: '1.25rem' }}>
            {myPickups.map(p => <PickupRow key={p._id} pickup={p} onRefresh={load} />)}
          </div>
        )
      )}

      {tab === "map" && <NearbyMapView donations={available} />}

      {tab === "campaigns" && <CampaignsView campaigns={campaigns} />}
    </div>
  );
}

// ── Pickup Row ─────────────────────────────────────────────
function PickupRow({ pickup, onRefresh }) {
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const statusFlow = { accepted:"en_route", en_route:"picked", picked:"delivered" };
  const statusLabel = { accepted:"Start Journey", en_route:"Confirm Pickup", picked:"Mark Delivered" };

  const advance = async (extraData = {}) => {
    const next = statusFlow[pickup.status];
    if (!next) return;
    
    // If we're moving to delivered, we need the modal unless extraData is already provided
    if (next === 'delivered' && Object.keys(extraData).length === 0) {
      setShowHandover(true);
      return;
    }

    setUpdating(true);
    try {
      await pickupAPI.updateStatus(pickup._id, { status: next, ...extraData });
      toast.success(`Status updated to: ${next.replace('_', ' ')}`);
      setShowHandover(false);
      onRefresh();
    } catch (err) {
      toast.error(`Update failed: ${err.response?.data?.error || "Unknown Error"}`);
    }
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this pickup? The donation will be returned to the available list.")) return;
    setCancelling(true);
    try {
      await pickupAPI.cancel(pickup._id, "Cancelled by volunteer");
      toast.success("Pickup cancelled. Donation is now available again.");
      onRefresh();
    } catch (err) {
      toast.error("Cancel failed: " + (err.response?.data?.message || "Unknown Error"));
    }
    setCancelling(false);
  };

  const d = pickup.donation;
  const statusColors = { accepted:"var(--accent-yellow)", en_route:"#3b82f6", picked:"#8b5cf6", delivered:"var(--color-primary)", cancelled:"var(--text-muted)" };

  return (
    <>
      <div className="card" style={{ display:"flex", flexWrap: 'wrap', gap: '1rem', justifyContent:"space-between", alignItems:"center", padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display:"flex", gap: '1rem', alignItems:"center", flex: '1 1 300px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background:"var(--color-primary-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: '1.75rem' }}>🍱</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color:"var(--color-primary-dark)", marginBottom: '0.25rem' }}>{d?.foodName || "Food Donation"}</div>
            <div style={{ fontSize: '0.95rem', color:"var(--text-main)", marginBottom: '0.25rem' }}>{d?.quantity?.value} {d?.quantity?.unit} · {d?.foodType}</div>
            <div style={{ fontSize: '0.85rem', color:"var(--text-muted)" }}>
              Donor: <span style={{ fontWeight: 600 }}>{pickup.donor?.organisationName || pickup.donor?.name || 'Local Donor'}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding:"6px 14px", borderRadius: 'var(--radius-full)', color: statusColors[pickup.status], background:`${statusColors[pickup.status]}20`, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {pickup.status?.replace('_', ' ')}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Details Button */}
            <button
              onClick={() => setShowDetails(true)}
              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding:"0.45rem 0.9rem", borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔍 Details
            </button>
            {/* Cancel Pickup Button — only visible if not yet delivered */}
            {['accepted', 'en_route'].includes(pickup.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ background: '#fff0f0', color: '#e11d48', border: '1px solid #fecdd3', padding:"0.45rem 0.9rem", borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: cancelling ? 0.6 : 1 }}>
                {cancelling ? "Cancelling..." : "❌ Cancel"}
              </button>
            )}
            {/* Advance Status Button moved to Details */}
          </div>
        </div>
      </div>

      {/* ── Details Modal ─────────────────────────────────── */}
      {showDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'fadeUp 0.2s ease' }}>
            {/* Close */}
            <button onClick={() => setShowDetails(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>×</button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍱</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>{d?.foodName || 'Food Donation'}</h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '4px 12px', borderRadius: '50px', textTransform: 'uppercase' }}>{d?.foodType}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Donor Info */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>👤 Donor Information</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{pickup.donor?.organisationName || pickup.donor?.name || 'Local Donor'}</div>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
                  📞 <a href={`tel:${pickup.donor?.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{pickup.donor?.phone || 'No phone provided'}</a>
                </div>
              </div>

              {/* Pickup Address */}
              <div style={{ padding: '0 0.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>📍 Pickup Address</div>
                <div style={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>{d?.pickupLocation?.address || 'Location not provided'}</div>
              </div>

              {/* Food Details */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1, background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Quantity</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{d?.quantity?.value} {d?.quantity?.unit}</div>
                </div>
                <div style={{ flex: 1, background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Est. Meals</div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>{d?.estimatedMeals || 0} Portions</div>
                </div>
              </div>

              {d?.description && (
                <div style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '0.875rem', borderRadius: '12px', borderLeft: '4px solid var(--color-primary)' }}>
                  "{d.description}"
                </div>
              )}

              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Current Status</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: statusColors[pickup.status], background: `${statusColors[pickup.status]}20`, padding: '4px 12px', borderRadius: '50px', textTransform: 'uppercase' }}>
                  {pickup.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {['accepted', 'en_route'].includes(pickup.status) && (
                <button
                  onClick={() => { setShowDetails(false); handleCancel(); }}
                  style={{ flex: 1, padding: '0.8rem', border: '1px solid #fecdd3', borderRadius: '14px', background: '#fff0f0', color: '#e11d48', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  ❌ Cancel Pickup
                </button>
              )}
              {statusFlow[pickup.status] && (
                <button
                  onClick={() => { setShowDetails(false); advance(); }}
                  style={{ flex: 1, padding: '0.8rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, var(--color-primary), #059669)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {statusLabel[pickup.status]}
                </button>
              )}
              <button onClick={() => setShowDetails(false)} style={{ padding: '0.8rem 1.25rem', border: 'none', borderRadius: '14px', background: '#f1f5f9', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Handover Modal ─────────────────────────────────── */}
      <HandoverModal 
        isOpen={showHandover} 
        onClose={() => setShowHandover(false)} 
        onConfirm={(data) => advance(data)}
        pickup={pickup}
      />
    </>
  );
}


// ── Campaigns View (Module 3 extension) ────────────────────
function CampaignsView({ campaigns }) {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--forest)', fontWeight: 700 }}>Active Food Drives</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>View active food drives and donation campaigns happening in the community.</p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon="📢" title="No active campaigns" message="Start a food drive to rally the community." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {campaigns.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--deep)', margin: 0, fontWeight: 700 }}>{c.title}</h4>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-main)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.status}</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>{c.description}</p>
              
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Goal</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--deep)', fontWeight: 800 }}>{c.goal}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Collected</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}>{c.collected}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Nearby Map View (SVG) ─────────────────────────────────
function NearbyMapView({ donations }) {
  const positions = [
    {left:"22%",top:"28%"},{left:"68%",top:"22%"},{left:"18%",top:"62%"},
    {left:"72%",top:"58%"},{left:"58%",top:"38%"},{left:"40%",top:"70%"}
  ];
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display:"flex", flexWrap: 'wrap', gap: '1rem', justifyContent:"space-between", alignItems:"center", marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', color:"var(--forest)", margin: 0 }}>📍 Nearby Donations</h3>
        <div style={{ display:"flex", gap: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {[["var(--color-primary)","Available"],["var(--accent-blue)","Assigned"],["var(--text-muted)","Picked"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius:"50%", background:c }} />
              <span style={{ color:"var(--text-main)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"relative", background:"var(--bg-main)", borderRadius: 'var(--radius-lg)', height: '400px', overflow:"hidden", border: '1px solid #e2e8f0' }}>
        <svg width="100%" height="100%" style={{ position:"absolute" }}>
          {[20,40,60,80].map(p => <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="var(--bg-surface)" strokeWidth="2" />)}
          {[25,50,75].map(p =>    <line key={`h${p}`} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="var(--bg-surface)" strokeWidth="2" />)}
        </svg>
        {/* You marker */}
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:3 }} className="pulse-animation">
          <div style={{ width: '56px', height: '56px', borderRadius:"50%", background:"var(--accent-blue)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: '1.5rem', boxShadow:"0 0 0 8px rgba(59, 130, 246, 0.2)", border: '3px solid white' }}>📍</div>
          <div style={{ position:"absolute", top: '-28px', left:"50%", transform:"translateX(-50%)", fontSize: '0.75rem', fontWeight:800, color:"var(--accent-blue)", whiteSpace:"nowrap", background:"#fff", padding:"4px 8px", borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>YOU</div>
        </div>
        {/* Donation markers */}
        {donations.slice(0,6).map((d,i) => (
          <div key={d._id || i} style={{ position:"absolute", ...(positions[i] || positions[0]), transform:"translate(-50%,-50%)", zIndex:2, transition: 'transform var(--transition-fast)' }} className="marker-hover">
            <div style={{ width: '48px', height: '48px', borderRadius:"50%", background:"var(--color-primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: '1.25rem', boxShadow:"0 5px 15px rgba(16, 185, 129, 0.4)", border: '2px solid white', cursor:"pointer" }} title={`${d.foodName} — ${d.quantity?.value}${d.quantity?.unit}`}>
              🍱
            </div>
            <div style={{ position:"absolute", bottom: '56px', left:"50%", transform:"translateX(-50%)", background:"#fff", borderRadius: 'var(--radius-sm)', padding:"4px 10px", fontSize: '0.7rem', whiteSpace:"nowrap", boxShadow:"var(--shadow-md)", fontWeight:700, color:"var(--deep)" }}>
              {d.quantity?.value}{d.quantity?.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Removed Mock Data ─────────────────────────────────

const NGOPages = () => {
    return (
        <div>
            <NGODashboard />
        </div>
    );
};
export default NGOPages;
