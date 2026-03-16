import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { donationAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/* ── Live Camera Hook (Edge + Chrome + all browsers) ── */
/* ── Live Camera Hook (Robust for Edge + Chrome) ── */
/* ── Live Camera Hook (Permissive & Robust) ── */
function useLiveCamera() {
  const canvasRef = useRef(null);
  const videoElRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoElRef.current) videoElRef.current.srcObject = null;
    setCameraOpen(false);
    setIsBuffering(false);
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      return videoInputs;
    } catch (err) {
      console.error('Error listing devices:', err);
      return [];
    }
  }, []);

  const openCamera = useCallback(async (preferredDeviceId = null) => {
    try {
      if (streamRef.current) stopCamera();

      // Constraints: Use deviceId if provided, otherwise generic facingMode
      const constraints = {
        video: preferredDeviceId 
          ? { deviceId: { ideal: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      setStream(s);
      setCameraOpen(true);

      // Successfully opened! Now refresh devices to see labels and active ID
      const inputs = await refreshDevices();
      
      // Try to identify the active track's deviceId
      const activeTrack = s.getVideoTracks()[0];
      const settings = activeTrack.getSettings() || {};
      const currentId = settings.deviceId || preferredDeviceId;
      if (currentId) setActiveDeviceId(currentId);

      // ANTI-VIRTUAL CAMERA LOGIC:
      // If we didn't specify a device and it chose a virtual one, try to find a real one
      if (!preferredDeviceId && activeTrack.label) {
        const label = activeTrack.label.toLowerCase();
        const isVirtual = label.includes('virtual') || label.includes('obs') || label.includes('snap') || label.includes('split');
        
        if (isVirtual) {
          const hardware = inputs.find(d => {
            const l = d.label.toLowerCase();
            return l && !l.includes('virtual') && !l.includes('obs') && !l.includes('snap') && !l.includes('split');
          });
          if (hardware) {
            console.log('Switching from virtual camera to:', hardware.label);
            openCamera(hardware.deviceId); // Auto-switch once
          }
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      // Absolute fallback
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        setStream(s);
        setCameraOpen(true);
        refreshDevices();
      } catch (err2) {
        toast.error('Camera access denied. Please allow camera in browser settings.');
      }
    }
  }, [refreshDevices, stopCamera]);

  const switchCamera = useCallback(() => {
    if (devices.length < 2) {
      toast('Only one camera detected.');
      return;
    }
    const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    openCamera(nextDevice.deviceId);
  }, [devices, activeDeviceId, openCamera]);

  useEffect(() => {
    if (!cameraOpen || !stream) return;
    let lastTime = 0;
    const check = setInterval(() => {
      const v = videoElRef.current;
      if (!v || v.paused || v.ended) return;
      if (v.currentTime === lastTime && v.readyState < 3) setIsBuffering(true);
      else setIsBuffering(false);
      lastTime = v.currentTime;
    }, 1000);
    return () => clearInterval(check);
  }, [cameraOpen, stream]);

  const setVideoRef = useCallback((node) => {
    videoElRef.current = node;
    if (node && stream) node.srcObject = stream;
  }, [stream]);

  const handleVideoReady = useCallback(() => {
    if (videoElRef.current) videoElRef.current.play().catch(() => {});
  }, []);

  const capture = useCallback(() => {
    const v = videoElRef.current;
    if (!v || !v.videoWidth) { toast.error('Camera not ready'); return; }
    const canvas = canvasRef.current;
    const maxW = 800;
    const scale = v.videoWidth > maxW ? maxW / v.videoWidth : 1;
    canvas.width = v.videoWidth * scale;
    canvas.height = v.videoHeight * scale;
    canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.6));
    stopCamera();
  }, [stopCamera]);

  return { 
    setVideoRef, handleVideoReady, canvasRef, cameraOpen, capturedImage, 
    openCamera, capture, stopCamera, retake: () => { setCapturedImage(null); openCamera(); }, 
    switchCamera, isBuffering, hasMultipleCameras: devices.length > 1 
  };
}

const FOOD_TYPES = ["Cooked Meal", "Raw Vegetables", "Bakery Items", "Fruits", "Dairy Products", "Packaged Food", "Beverages", "Other"];

export default function NewDonationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    setVideoRef, handleVideoReady, canvasRef, cameraOpen, capturedImage, 
    openCamera, capture, stopCamera, retake, switchCamera, isBuffering, hasMultipleCameras 
  } = useLiveCamera();
  const [form, setForm] = useState({
    foodName: "", foodType: "Cooked Meal",
    quantity: { value: "", unit: "portions" },
    expiryHours: "3",
    pickupStart: "10:00", pickupEnd: "14:00",
    donateToNGO: false,
    location: { address: "", city: "Hyderabad", state: "Telangana", coordinates: { lat: "", lng: "" } },
    notes: "", allergenInfo: "", servingTemp: "room_temp",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported by your browser'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' }
          });
          const data = await resp.json();
          const addr = data.address || {};
          const fullAddress = data.display_name || `${latitude}, ${longitude}`;
          setForm(f => ({
            ...f,
            location: {
              address: fullAddress,
              city: addr.city || addr.town || addr.village || addr.county || f.location.city,
              state: addr.state || f.location.state,
              coordinates: { lat: latitude.toString(), lng: longitude.toString() }
            }
          }));
          toast.success('📍 Location detected!');
        } catch {
          setForm(f => ({
            ...f,
            location: { ...f.location, coordinates: { lat: latitude.toString(), lng: longitude.toString() } }
          }));
          toast.success('📍 Coordinates captured! Please type the address manually.');
        }
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) toast.error('Location permission denied. Please enter address manually.');
        else toast.error('Could not detect location. Please enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedImage) {
      toast.error('📷 Please take a photo of the food before donating');
      return;
    }
    if (!form.foodName || !form.quantity.value || !form.location.address) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      await donationAPI.create({ ...form, image: capturedImage });
      toast.success('🎉 Donated successfully! Your donation has been saved.');
      setSubmitted(true);
    } catch (err) {
      console.error('Donation Submission Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to post donation');
    }
    setLoading(false);
  };

  if (submitted) return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", boxSizing: "border-box", minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="animate-fadeUp" style={{ background: "white", borderRadius: "24px", padding: "4rem 3rem", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", textAlign: "center", border: "1px solid #dcfce7" }}>
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ fontSize: "2.5rem", color: "#059669", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-0.5px" }}>Donation Saved! 🎉</h2>
        <p style={{ color: "#475569", lineHeight: 1.75, marginBottom: "2rem", fontSize: "1.1rem" }}>
          Thank you for making a difference! Your generous contribution has been securely logged. <br/>
          <strong>Our AI is now actively matching and notifying</strong> the nearest {form.donateToNGO ? "NGO partner" : "volunteer or NGO"} for pickup.
        </p>
        <div style={{ background: "#f0fdf4", borderRadius: "14px", padding: "1.5rem", marginBottom: "2.5rem", textAlign: "left", border: "1px solid #bbf7d0", maxWidth: "500px", margin: "0 auto 2.5rem auto" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#059669", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "1px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 1.5s infinite" }} /> AI Dispatch Active
          </div>
          <p style={{ fontSize: "1rem", color: "#0f172a", lineHeight: 1.6, margin: 0 }}>
             SMS and Email alerts have been sent to top matches in your area. They will be on their way soon!
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/donor/history")} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "1rem 2.5rem", borderRadius: "50px", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", boxShadow: "0 6px 20px rgba(16,185,129,0.3)" }}>View My Donations</button>
          <button onClick={() => { window.location.reload(); }} style={{ background: "white", color: "#10b981", border: "2px solid #10b981", padding: "1rem 2.5rem", borderRadius: "50px", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer" }}>+ Donate Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>Post a Food Donation 🍱</h1>
        <p style={{ color: "#64748b", fontSize: "1.05rem", marginTop: "0.5rem" }}>Fill in the details. Our AI will instantly match you with the nearest NGO or volunteer.</p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Section 1: Live Camera + AI Verification */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: "#10b981", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>1</span>
            Food Photo (Required) *
          </h3>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Camera panel */}
          <div style={{ borderRadius: "16px", overflow: "hidden", background: "#0f172a", border: "2px solid #e2e8f0", minHeight: "200px" }}>
            {!cameraOpen && !capturedImage && (
              <div style={{ padding: "3rem 2rem", textAlign: "center", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "14px", cursor: "pointer" }} onClick={openCamera}>
                <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📷</div>
                <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem", marginBottom: "4px" }}>Open Live Camera</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>Take a live photo of the food (required to donate)</div>
                <button type="button" onClick={openCamera} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", padding: "0.75rem 1.75rem", borderRadius: "50px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  📷 Open Camera
                </button>
              </div>
            )}
            {cameraOpen && (
              <div style={{ position: "relative" }}>
                <video ref={setVideoRef} onLoadedMetadata={handleVideoReady} autoPlay playsInline muted style={{ width: "100%", display: "block", maxHeight: "260px", objectFit: "cover", opacity: isBuffering ? 0.6 : 1 }} />
                
                {/* Buffering Overlay */}
                {isBuffering && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)", zIndex: 10 }}>
                    <div className="camera-spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "1rem" }} />
                    <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Camera Buffering...</div>
                    <button type="button" onClick={() => openCamera()} style={{ marginTop: "12px", background: "white", color: "#0f172a", border: "none", padding: "6px 16px", borderRadius: "50px", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}>🔄 Refresh Feed</button>
                  </div>
                )}

                <div style={{ position: "absolute", bottom: "14px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "12px", zIndex: 20 }}>
                  <button type="button" onClick={capture} style={{ background: "white", border: "5px solid #10b981", width: "64px", height: "64px", borderRadius: "50%", cursor: "pointer", fontSize: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>📸</button>
                  <button type="button" onClick={stopCamera} style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "none", padding: "0 1.1rem", borderRadius: "50px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", backdropFilter: "blur(4px)" }}>✕ Cancel</button>
                </div>

                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "8px", zIndex: 20 }}>
                  {hasMultipleCameras && (
                    <button type="button" onClick={switchCamera} style={{ background: "rgba(16,185,129,0.9)", color: "white", border: "none", padding: "5px 12px", borderRadius: "50px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                      🔄 Switch Camera
                    </button>
                  )}
                </div>

                <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(16,185,129,0.9)", color: "white", padding: "3px 12px", borderRadius: "50px", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1px", display: "flex", alignItems: "center", gap: "5px", zIndex: 20 }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", display: "inline-block" }} /> LIVE
                </div>
              </div>
            )}
            {capturedImage && !cameraOpen && (
              <div style={{ position: "relative" }}>
                <img src={capturedImage} alt="Captured food" style={{ width: "100%", display: "block", maxHeight: "260px", objectFit: "cover" }} />
                <button type="button" onClick={retake} style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.65)", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "50px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                  🔄 Retake
                </button>
                <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(16,185,129,0.9)", color: "white", padding: "3px 12px", borderRadius: "50px", fontSize: "0.72rem", fontWeight: 800 }}>✓ Captured</div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Food Details */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ background: "#10b981", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>2</span> Food Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Food Name *</label>
              <input className="form-control" placeholder="e.g. Biryani, Bread..." value={form.foodName} onChange={e => setForm({ ...form, foodName: e.target.value })} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Food Type</label>
              <select className="form-control" value={form.foodType} onChange={e => setForm({ ...form, foodType: e.target.value })}>
                {FOOD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Quantity *</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="form-control" type="number" min="1" placeholder="25" value={form.quantity.value} onChange={e => setForm({ ...form, quantity: { ...form.quantity, value: e.target.value } })} required style={{ flex: 2 }} />
                <select className="form-control" value={form.quantity.unit} onChange={e => setForm({ ...form, quantity: { ...form.quantity, unit: e.target.value } })} style={{ flex: 1 }}>
                  {["portions", "kg", "litres", "items"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Expires In</label>
              <select className="form-control" value={form.expiryHours} onChange={e => setForm({ ...form, expiryHours: e.target.value })}>
                {["1", "2", "3", "4", "6", "8", "12", "24"].map(h => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Pickup Window + Location */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ background: "#10b981", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>3</span> Location & Pickup Window</h3>

          {/* Auto-detect location button */}
          <button type="button" onClick={detectLocation} disabled={locLoading} style={{
            width: "100%", marginBottom: "1.25rem", padding: "0.9rem", borderRadius: "14px",
            border: "2px dashed #10b981", background: locLoading ? "#f0fdf4" : "white",
            color: "#059669", fontWeight: 800, fontSize: "0.95rem", cursor: locLoading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s"
          }}>
            {locLoading ? (
              <><span style={{ display: "inline-block", width: "18px", height: "18px", border: "3px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Detecting location...</>
            ) : (
              <>📍 Use My Current Location</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Show detected coordinates badge */}
          {form.location.coordinates.lat && form.location.coordinates.lng && (
            <div style={{ marginBottom: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "8px 14px", fontSize: "0.8rem", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
              ✅ Coordinates: {parseFloat(form.location.coordinates.lat).toFixed(4)}, {parseFloat(form.location.coordinates.lng).toFixed(4)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div className="form-group" style={{ margin: 0, gridColumn: "1 / -1" }}>
              <label>Pickup Address *</label>
              <input className="form-control" placeholder="Full address for food pickup" value={form.location.address} onChange={e => setForm({ ...form, location: { ...form.location, address: e.target.value } })} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>City</label>
              <input className="form-control" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Pickup Available From</label>
              <input className="form-control" type="time" value={form.pickupStart} onChange={e => setForm({ ...form, pickupStart: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Pickup Available Until</label>
              <input className="form-control" type="time" value={form.pickupEnd} onChange={e => setForm({ ...form, pickupEnd: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 4: Recipient + Safety */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ background: "#10b981", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>4</span> Recipient & Safety</h3>
          
          {/* Donate to NGO toggle */}
          <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>🏢 Donate Directly to an NGO</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "3px" }}>Enable this to send your donation exclusively to NGO partners (not individual volunteers).</div>
            </div>
            <button type="button" onClick={() => setForm({ ...form, donateToNGO: !form.donateToNGO })} style={{ width: "54px", height: "28px", borderRadius: "50px", border: "none", background: form.donateToNGO ? "#10b981" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: form.donateToNGO ? "29px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Serving Temperature</label>
              <select className="form-control" value={form.servingTemp} onChange={e => setForm({ ...form, servingTemp: e.target.value })}>
                <option value="hot">🔥 Hot</option>
                <option value="cold">❄️ Cold / Refrigerated</option>
                <option value="room_temp">🌡️ Room Temperature</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Allergen Info (Optional)</label>
              <input className="form-control" placeholder="e.g. Contains nuts, gluten-free..." value={form.allergenInfo} onChange={e => setForm({ ...form, allergenInfo: e.target.value })} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
            <label>Pickup Notes (Optional)</label>
            <textarea className="form-control" rows={3} placeholder="Special instructions for pickup..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical" }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "1.2rem", fontSize: "1.1rem", fontWeight: 900, borderRadius: "50px", border: "none", background: loading ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)", color: "white", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 25px rgba(16,185,129,0.35)", transition: "all 0.15s", letterSpacing: "0.5px" }}>
          {loading ? 'Posting...' : '🌱 Donate'}
        </button>
      </form>
    </div>
  );
}
