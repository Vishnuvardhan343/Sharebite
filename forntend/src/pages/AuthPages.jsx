import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ROLES = [
  { value:"donor",     emoji:"🏪", label:"Food Donor",    desc:"Restaurant / Hotel / Home" },
  { value:"volunteer", emoji:"🚴", label:"Volunteer",      desc:"Pickup & Deliver Food" },
  { value:"ngo",       emoji:"🤝", label:"NGO",            desc:"Distribute to Communities" },
  { value:"admin",     emoji:"⚙️", label:"Admin",          desc:"Manage Platform" },
];

// ── Login Page ────────────────────────────────────────────
export function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const redirectMap = { donor:"donor", volunteer:"ngo", ngo:"ngo", admin:"admin" };
      navigate(`/${redirectMap[user.role] || ""}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"calc(100vh - 64px)", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg, var(--forest), #162d22)", padding:24 }}>
      <div className="fade-up" style={{ background:"#fff", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🌱</div>
          <h2 style={{ fontSize:28, color:"var(--forest)" }}>Welcome Back</h2>
          <p style={{ color:"var(--muted)", fontSize:14, marginTop:6 }}>Sign in to your Sharebite account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width:"100%", padding:15, fontSize:15, marginTop:8 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color:"var(--deep)", fontWeight:700 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────
export function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState({
    name:"", email:"", password:"", confirmPassword:"",
    role:"donor", phone:"", organisationName:"", organisationType:"restaurant",
    location: { address:"", city:"Hyderabad", state:"Telangana" }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name}!`);
      const redirectMap = { donor:"donor", volunteer:"ngo", ngo:"ngo", admin:"admin" };
      navigate(`/${redirectMap[user.role] || ""}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"calc(100vh - 64px)", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg, var(--forest), #162d22)", padding:24 }}>
      <div className="fade-up" style={{ background:"#fff", borderRadius:24, padding:"44px", width:"100%", maxWidth:520, boxShadow:"0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🌱</div>
          <h2 style={{ fontSize:28, color:"var(--forest)" }}>Join Sharebite</h2>
          <p style={{ color:"var(--muted)", fontSize:14, marginTop:6 }}>Create your account to get started</p>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">Select Your Role</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {ROLES.map(r => (
                <button type="button" key={r.value} onClick={() => setForm({...form, role:r.value})} style={{
                  padding:"10px 12px", borderRadius:10, textAlign:"left",
                  border:`2px solid ${form.role === r.value ? "var(--deep)" : "var(--foam)"}`,
                  background: form.role === r.value ? "var(--foam)" : "#fff",
                  transition:"all 0.2s"
                }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--forest)" }}>{r.emoji} {r.label}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your Name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            </div>
          </div>

          {(form.role === "donor" || form.role === "ngo") && (
            <div className="form-group">
              <label className="form-label">Organisation Name</label>
              <input className="form-input" placeholder="e.g. Spice Garden Restaurant" value={form.organisationName} onChange={e => setForm({...form, organisationName:e.target.value})} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="Your address" value={form.location.address} onChange={e => setForm({...form, location:{...form.location, address:e.target.value}})} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width:"100%", padding:15, fontSize:15, marginTop:4 }}>
            {loading ? "Creating Account..." : "Create Account →"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:18, fontSize:13, color:"var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"var(--deep)", fontWeight:700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
