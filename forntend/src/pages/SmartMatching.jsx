import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { pickupAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Haversine distance calculation (client-side fallback for display)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RADIUS_KM = 2.5;

const SmartMatching = () => {
  const { user } = useAuth();
  const [geoState, setGeoState] = useState('loading'); // loading | granted | denied
  const [userPos, setUserPos] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const userMarkerRef = useRef(null);

  // ── Step 1: Get user's GPS position (runs automatically on mount) ──
  const requestLocation = () => {
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        setGeoState('granted');
        fetchNearby(lat, lng);
      },
      () => {
        setGeoState('denied');
        toast.error('Location access denied. Please allow it in your browser settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-request and timer on mount
  useEffect(() => { 
    requestLocation(); 
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  // ── Step 2: Fetch donations within 2.5km radius ──────────
  const fetchNearby = async (lat, lng) => {
    try {
      const { data } = await API.get('/matching/nearby', { params: { lat, lng, radius: RADIUS_KM } });
      setDonations(data.donations || []);
    } catch (err) {
      toast.error('Could not fetch nearby donations.');
      setDonations([]);
    }
  };

  // ── Step 3: Accept a pickup ────────────────────────────────
  const acceptPickup = async (donation) => {
    setAccepting(true);
    try {
      await pickupAPI.accept(donation._id, { estimatedETA: Math.ceil((donation.distanceKm / 15) * 60) || 20 });
      toast.success(`🎉 Pickup accepted for "${donation.foodName}"!`);
      setDonations(prev => prev.filter(d => d._id !== donation._id));
      setSelected(null);
      // Remove marker from map
      if (donation._leafletMarker) {
        donation._leafletMarker.remove();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept pickup. Try again.');
    }
    setAccepting(false);
  };

  // ── Step 3b: Call Gemini for AI insights ──────────────────
  const fetchAiInsight = async (donation) => {
    setAiInsight(null);
    setAiLoading(true);
    try {
      const { data } = await API.post('/matching/ai-insight', {
        foodName: donation.foodName,
        quantity: donation.quantity?.value,
        unit: donation.quantity?.unit,
        expiryHours: donation.hoursUntilExpiry,
        address: donation.pickupLocation?.address,
        category: donation.category,
        description: donation.description,
      });
      setAiInsight(data.insight || null);
    } catch {
      setAiInsight(null); // silently fail — we still show accept button
    }
    setAiLoading(false);
  };

  // ── Step 4: Init Leaflet map after location is available ──
  useEffect(() => {
    if (geoState !== 'granted' || !userPos || !mapRef.current || leafletMap.current) return;

    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = window.L;
      if (!L || !mapRef.current || leafletMap.current) return;

      leafletMap.current = L.map(mapRef.current, {
        center: [userPos.lat, userPos.lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMap.current);

      // User location marker (blue)
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
        iconAnchor: [9, 9]
      });
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon })
        .addTo(leafletMap.current)
        .bindPopup('<b>📍 You are here</b>');

      // 2.5km radius circle
      circleRef.current = L.circle([userPos.lat, userPos.lng], {
        radius: RADIUS_KM * 1000,
        color: '#10b981',
        fillColor: '#10b98115',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '6 4',
      }).addTo(leafletMap.current);
    };

    // Load Leaflet JS if not already loaded
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [geoState, userPos]);

  // ── Step 5: Add donation markers when donations change ────
  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    const L = window.L;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    donations.forEach(d => {
      const coords = d.pickupLocation?.coordinates?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;

      const isExpired = d.status === 'expired' || d.hoursUntilExpiry <= 0;
      const urgencyColor = isExpired ? '#ef4444' : (d.hoursUntilExpiry < 2 ? '#ef4444' : d.hoursUntilExpiry < 4 ? '#f59e0b' : '#10b981');
      const iconEmoji = isExpired ? '⚠️' : '🍱';
      
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${urgencyColor};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;opacity:${isExpired ? 0.6 : 1}">${iconEmoji}</div>`,
        iconAnchor: [17, 17]
      });

      const popupContent = isExpired ? 
        `<div style="min-width:190px;font-family:sans-serif;text-align:center">
          <div style="color:#ef4444;font-weight:900;margin-bottom:4px">EXPIRED</div>
          <b style="font-size:1rem;text-decoration:line-through">${d.foodName}</b><br/>
          <span style="color:#64748b">${d.distanceKm} km away</span>
        </div>`
        : `<div style="min-width:190px;font-family:sans-serif">
          <b style="font-size:1rem">${d.foodName}</b> ${user && (typeof d.donor === 'object' ? d.donor._id : d.donor) === user.id ? '<span style="color:#10b981;font-size:0.8rem;font-weight:bold">(Yours)</span>' : ''}<br/>
          <span style="color:#64748b">${d.quantity?.value} ${d.quantity?.unit}</span><br/>
          <span style="color:${urgencyColor};font-weight:700">⏱ ${d.hoursUntilExpiry?.toFixed(1)} hrs left</span><br/>
          <span>📍 ${d.distanceKm} km away</span>
        </div>`;

      const marker = L.marker([lat, lng], { icon })
        .addTo(leafletMap.current)
        .bindPopup(popupContent)
        .on('click', () => setSelected(d));

      d._leafletMarker = marker;
      markersRef.current.push(marker);
    });
  }, [donations]);

  // ── Urgency helpers ────────────────────────────────────────
  const getRemainingTime = (expiryDate) => {
    const diff = new Date(expiryDate) - currentTime;
    if (diff <= 0) return { h: 0, m: 0, totalHrs: 0, isExpired: true };
    const totalMinutes = Math.floor(diff / 60000);
    return {
      h: Math.floor(totalMinutes / 60),
      m: totalMinutes % 60,
      totalHrs: totalMinutes / 60,
      isExpired: false
    };
  };

  const urgencyBadge = (remaining) => {
    if (remaining.isExpired) return { label: 'EXPIRED', bg: '#ffe4e6', color: '#e11d48' };
    if (remaining.totalHrs < 1) return { label: 'URGENT', bg: '#fee2e2', color: '#ef4444' };
    if (remaining.totalHrs < 4) return { label: 'APPROACHING', bg: '#fef9c3', color: '#854d0e' };
    return { label: 'FRESH', bg: '#dcfce7', color: '#166534' };
  };

  const etaMins = (distKm) => Math.max(5, Math.ceil((distKm / 15) * 60));

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '12px', padding: '8px 12px', fontSize: '1.5rem' }}>🧠</span>
          Smart Matching <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>— 2.5 km Radius</span>
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1rem' }}>
          We detect your location and instantly find available donations within <b>2.5 km</b> of you, sorted by proximity.
        </p>
      </div>

      {/* Location Gate */}
      {geoState === 'loading' && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="pulse-animation">🛰️</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Detecting your location…</p>
        </div>
      )}

      {geoState === 'denied' && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fef2f2', borderRadius: '20px', border: '1.5px solid #fecaca' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h3 style={{ color: '#991b1b', fontWeight: 800 }}>Location Access Denied</h3>
          <p style={{ color: '#b91c1c', marginBottom: '1.5rem' }}>Please allow location in your browser settings and refresh the page.</p>
          <button onClick={requestLocation} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.7rem 1.8rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}

      {geoState === 'granted' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Map */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', position: 'relative' }}>
            <div ref={mapRef} style={{ height: '520px', width: '100%' }} />
            {/* Radius legend */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'white', borderRadius: '12px', padding: '0.6rem 1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', fontSize: '0.8rem', fontWeight: 700, color: '#059669', zIndex: 1000, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '14px', height: '14px', border: '2px dashed #10b981', borderRadius: '50%', background: '#10b98115' }}></div>
              2.5 km search area
            </div>
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'white', borderRadius: '12px', padding: '0.6rem 1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', zIndex: 1000, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></div>
              You
            </div>
          </div>

          {/* Sidebar: Donation List + Selected Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Stats bar */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{donations.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>donations nearby</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{RADIUS_KM} km</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>search radius</div>
              </div>
              <button onClick={() => fetchNearby(userPos.lat, userPos.lng)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                ↻ Refresh
              </button>
            </div>

            {/* Donation list */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '2px' }}>
              {donations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '16px', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
                  <p style={{ fontWeight: 700 }}>No donations found within 2.5 km</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Check back soon or expand your search area.</p>
                </div>
              ) : donations.map(d => {
                const remaining = getRemainingTime(d.expiryTime);
                const badge = urgencyBadge(remaining);
                const isSelected = selected?._id === d._id;
                const isOwnDonation = user && (typeof d.donor === 'object' ? d.donor._id : d.donor) === user.id;
                const isExpired = remaining.isExpired;

                return (
                  <button
                    key={d._id}
                    onClick={() => {
                      setSelected(d);
                      // Pan map to donation
                      const coords = d.pickupLocation?.coordinates?.coordinates;
                      if (coords && leafletMap.current) {
                        leafletMap.current.setView([coords[1], coords[0]], 15);
                        d._leafletMarker?.openPopup();
                      }
                    }}
                    style={{
                      background: isSelected ? '#f0fdf4' : 'white',
                      border: `2px solid ${isSelected ? '#10b981' : '#f1f5f9'}`,
                      borderRadius: '16px', padding: '1.25rem', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.15s', boxShadow: isSelected ? '0 8px 24px rgba(16,185,129,0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', textDecoration: isExpired ? 'line-through' : 'none' }}>
                        {d.foodName} {isOwnDonation && <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>(Yours)</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!isExpired && <div style={{ width: '8px', height: '8px', background: badge.color, borderRadius: '50%' }}></div>}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '50px', background: badge.bg, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{badge.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🍱 <b>{d.quantity?.value} {d.quantity?.unit}</b></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📍 <b>{d.distanceKm?.toFixed(1)} km</b></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? '#ef4444' : '#0f172a' }}>
                        ⏱ <b>{isExpired ? 'Expired' : `${remaining.h}h ${remaining.m}m left`}</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🕐 <b>~{etaMins(d.distanceKm)} min ETA</b></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Donation Action Card */}
            {selected && (() => {
              const isOwnDonation = user && (typeof selected.donor === 'object' ? selected.donor._id : selected.donor) === user.id;
              const isActionDisabled = accepting || selected.status === 'expired' || selected.hoursUntilExpiry <= 0 || isOwnDonation;

              return (
              <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: '20px', padding: '1.5rem', color: 'white', boxShadow: '0 10px 30px rgba(15,23,42,0.25)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', color: '#10b981', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  {isOwnDonation ? 'ℹ️ Your Donation' : '✅ Ready to Accept'}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem' }}>{selected.foodName}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  📍 {selected.pickupLocation?.address?.substring(0, 40)}<br/>
                  <b style={{ color: '#10b981' }}>{selected.distanceKm} km away</b> · ~{etaMins(selected.distanceKm)} mins ride · {selected.hoursUntilExpiry?.toFixed(1)} hrs until expiry
                </div>
                <button
                  onClick={() => acceptPickup(selected)}
                  disabled={isActionDisabled}
                  style={{ width: '100%', background: isActionDisabled ? (isOwnDonation ? 'rgba(255,255,255,0.2)' : '#e11d48') : 'linear-gradient(135deg,#10b981,#059669)', color: isOwnDonation ? '#94a3b8' : 'white', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: isActionDisabled ? 'not-allowed' : 'pointer', boxShadow: isActionDisabled ? 'none' : '0 4px 16px rgba(16,185,129,0.4)', transition: 'all 0.2s' }}
                >
                  {(selected.status === 'expired' || selected.hoursUntilExpiry <= 0) ? '🚫 EXPIRED' : (isOwnDonation ? 'Your Donation' : (accepting ? '⏳ Accepting…' : '🚴 Accept This Pickup'))}
                </button>
                <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
export default SmartMatching;
