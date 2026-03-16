import React, { useRef, useState, useEffect, useCallback } from 'react';

// Reusable Camera Section Logic
const CameraSection = ({ onCapture, currentPhoto }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      setError("Camera access denied or not found");
    }
  };

  const capture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', border: '2px dashed #cbd5e1' }}>
      {!stream && !currentPhoto && (
        <button onClick={startCamera} className="btn-primary" style={{ width: '100%', padding: '1rem', background: '#3b82f6' }}>
          📸 Open Camera for Handover Photo
        </button>
      )}
      
      {stream && (
        <div style={{ position: 'relative' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={capture} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Capture</button>
            <button onClick={stopCamera} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800 }}>Cancel</button>
          </div>
        </div>
      )}

      {currentPhoto && (
        <div style={{ position: 'relative' }}>
          <img src={currentPhoto} style={{ width: '100%', borderRadius: '12px', border: '4px solid #10b981' }} alt="Handover Proof" />
          <button onClick={() => onCapture(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '50px', cursor: 'pointer', fontWeight: 700 }}>Retake</button>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>⚠️ {error}</p>}
    </div>
  );
};

export default function HandoverModal({ isOpen, onClose, onConfirm, pickup }) {
  const [receiverName, setReceiverName] = useState('');
  const [mealsDelivered, setMealsDelivered] = useState(pickup?.donation?.estimatedMeals || 0);
  const [handoverPhoto, setHandoverPhoto] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReceiverName('');
      setHandoverPhoto(null);
      setHasPermission(false);
      setMealsDelivered(pickup?.donation?.estimatedMeals || 0);
    }
  }, [isOpen, pickup]);

  const handleConfirm = () => {
    if (!receiverName) {
      alert("Please enter the receiver's name.");
      return;
    }
    if (handoverPhoto && !hasPermission) {
      alert("Please confirm you have received permission to take a photo.");
      return;
    }

    onConfirm({
      handoverDetails: {
        receiverName,
        handoverPhoto,
        confirmedAt: new Date()
      },
      mealsDelivered: Number(mealsDelivered)
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="animate-fadeUp" style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', textAlign: 'center' }}>Delivery Handover ✅</h2>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>Log final details to complete the redistribution journey.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Representative Name *</label>
            <input 
              type="text" 
              placeholder="NGO Rep / Community Lead name" 
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final Meals Count</label>
            <input 
              type="number" 
              value={mealsDelivered}
              onChange={(e) => setMealsDelivered(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Handover Evidence (Optional)</label>
            <CameraSection onCapture={setHandoverPhoto} currentPhoto={handoverPhoto} />
            
            {handoverPhoto && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', padding: '10px 15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <input 
                  type="checkbox" 
                  id="perm" 
                  checked={hasPermission} 
                  onChange={(e) => setHasPermission(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="perm" style={{ fontSize: '0.85rem', color: '#166534', cursor: 'pointer', fontWeight: 600 }}>
                  I have received permission from the recipient/org to store this photo.
                </label>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Cancel</button>
          <button onClick={handleConfirm} style={{ flex: 2, padding: '1rem', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.25)', transition: 'transform 0.2s' }}>Complete & Notify Donor</button>
        </div>
      </div>
    </div>
  );
}
