import { useState, useEffect } from "react";
import { donationAPI } from "../services/api";
import { DonationCard, Loader, EmptyState } from "../components/index.jsx";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");

  useEffect(() => {
    donationAPI.getMy()
      .then(r => setDonations(r.data.donations))
      .catch((err) => {
        toast.error('Failed to load donation history: ' + (err.response?.data?.error || ''));
        setDonations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? donations : donations.filter(d => d.status === filter);

  if (loading) return <Loader text="Loading donation history..." />;

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ display:"flex", flexWrap: 'wrap', gap: '1rem', justifyContent:"space-between", alignItems:"center", marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color:"var(--color-primary-dark)", fontWeight: 800, letterSpacing: '-0.5px' }}>Donation History 📜</h1>
          <p style={{ color:"var(--text-muted)", marginTop: '0.5rem', fontSize: '1.1rem' }}>Track all your food donations and their real-time statuses</p>
        </div>
        <Link to="/donor/new-donation" className="btn-primary" style={{ textDecoration:"none", display:"inline-flex", padding: '0.75rem 1.5rem' }}>
          + New Donation
        </Link>
      </div>

      {/* Summary Filters */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { val: "all", label: "All Donations", count: donations.length, color: "var(--deep)" },
          { val: "available", label: "Available", count: donations.filter(d=>d.status==="available").length, color: "var(--color-primary-dark)" },
          { val: "assigned", label: "Assigned", count: donations.filter(d=>d.status==="assigned").length, color: "var(--accent-blue)" },
          { val: "delivered", label: "Delivered", count: donations.filter(d=>d.status==="delivered").length, color: "var(--color-primary)" },
          { val: "expired", label: "Expired", count: donations.filter(d=>d.status==="expired").length, color: "var(--accent-red)" }
        ].map(({val, label, count, color}) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: "1.25rem 1rem", 
            borderRadius: "var(--radius-md)", 
            border: `2px solid ${filter === val ? color : "transparent"}`,
            background: filter === val ? `${color}10` : "var(--bg-surface)",
            boxShadow: filter === val ? `0 4px 12px ${color}20` : "var(--shadow-sm)",
            textAlign: "center", 
            cursor: "pointer", 
            transition: "all var(--transition-normal)",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ fontFamily:"'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: filter === val ? color : 'var(--text-main)', lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: '0.85rem', color: filter === val ? color : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Donation list */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon="📭" 
          title="No donations found" 
          message={filter === "all" ? "You haven't posted any donations yet." : `You don't have any donations marked as ${filter}.`} 
          action={filter === 'all' && <Link to="/donor/new-donation" className="btn-primary" style={{ display:"inline-block", marginTop: '1rem' }}>Post Your First Donation</Link>}
        />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
          {filtered.map(d => <DonationCard key={d._id} donation={d} viewAs="history" />)}
        </div>
      )}
    </div>
  );
}
